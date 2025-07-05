import { message } from 'antd';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import store from 'store2';

// 设置API基础URL，默认为当前域名的/api
axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// 用于跟踪重试的请求
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

// 处理队列中的请求
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// 动态导入tokenManager以避免循环依赖
const getTokenManager = async () => {
  const { tokenManager } = await import('./token');
  return tokenManager;
};

// 请求拦截器
axios.interceptors.request.use(
  async (config) => {
    // 对于refresh接口，不添加Authorization header以避免循环
    if (config.url?.includes('/auth/refresh')) {
      return config;
    }

    try {
      const tokenManager = await getTokenManager();
      const token = await tokenManager.getValidToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get token in request interceptor:', error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
axios.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 如果是401错误且不是refresh接口
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      // 如果正在刷新token，将请求加入队列
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const tokenManager = await getTokenManager();
        const newToken = await tokenManager.refreshToken();

        if (newToken) {
          const token = store.get('token');
          processQueue(null, token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);

        // 刷新失败，清除token并重定向
        const tokenManager = await getTokenManager();
        tokenManager.clearTokens();

        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          const currentPath = window.location.pathname;
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 403 权限不足
    if (error.response?.status === 403) {
      message.error(error.response?.data?.msg || 'Permission denied');
    }

    // 500+ 服务器错误
    if (error.response?.status >= 500) {
      message.error(error.response?.data?.msg || 'Internal Server Error');
    }

    return Promise.reject(error);
  }
);

export default axios;
