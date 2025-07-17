import { message } from 'antd';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import store from 'store2';

// 设置API基础URL，默认为当前域名的/api
axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// 用于跟踪重试的请求
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

// 处理队列中的请求
const processQueue = (error: unknown, token: string | null = null) => {
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
      // eslint-disable-next-line no-console
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
    // 如果是401错误，直接跳转到登录页面
    if (error.response?.status === 401) {
      // eslint-disable-next-line no-console
      console.log('401 Unauthorized - redirecting to login');

      // 清除所有token
      try {
        const tokenManager = await getTokenManager();
        tokenManager.clearTokens();
      } catch (e) {
        // 如果获取tokenManager失败，直接清除localStorage
        store.remove('token');
        store.remove('refreshToken');
        store.remove('user');
        store.remove('roles');
        store.remove('permissions');
      }

      // 立即跳转到登录页面
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        const currentPath = window.location.pathname;
        // eslint-disable-next-line no-console
        console.log(`Redirecting to login from ${currentPath}`);
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }

      return Promise.reject(error);
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
