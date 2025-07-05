import axios from './index';

/**
 * APIs
 */
// captcha
export const captcha = () => {
  return axios<ResType<CaptchaResult>>('/auth/verifycode', {
    method: 'get',
  });
};

// login
export const login = (data: LoginData) => {
  return axios<ResType<LoginResult>>('/auth/login', {
    data,
    method: 'post',
  });
};

// logout
export const logout = () => {
  return axios<ResType<Omit<LoginResult, 'token' | 'user'> & User>>('/auth/logout', {
    method: 'post',
  });
};

// me
export const me = () => {
  return axios<ResType<Omit<LoginResult, 'token' | 'user'> & User>>('/me', {
    method: 'get',
  });
};

/**
 * Types
 */
import type { ResType, Role, User } from '@/types/api';

// captcha
export type CaptchaResult = {
  captcha: string;
  key: string;
};

// login
export type LoginData = {
  captcha: string;
  key: string;
  password: string;
  username: string;
};

export type LoginResult = {
  permissions: string[];
  roles: Role[];
  token: string;
  refreshToken: string;
  user: User;
};
