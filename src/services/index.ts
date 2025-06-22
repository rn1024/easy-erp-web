import { message } from 'antd';
import axios from 'axios';
import store from 'store2';

// 设置API基础URL，默认为当前域名的/api
axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';

axios.interceptors.request.use((config) => {
  if (store.has('token')) {
    config.headers.Authorization = 'Bearer ' + store.get('token');
  }

  return config;
});

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      store.clear();

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 403) {
      message.error(error.response?.data?.msg || 'Permission denied');
    }

    if (error.response?.status >= 500) {
      message.error(error.response?.data?.msg || 'Internal Server Error');
    }

    return Promise.reject(error);
  }
);

export default axios;
