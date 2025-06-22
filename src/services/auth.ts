import axios from './index';

/**
 * APIs
 */
// captcha
export const captcha = () => {
  return axios<ResType<CaptchaResult>>('/v1/auth/verifycode', {
    method: 'get',
  });
};

// login
export const login = (data: LoginData) => {
  return axios<ResType<LoginResult>>('/v1/auth/login', {
    data,
    method: 'post',
  });
};

// logout
export const logout = () => {
  return axios<ResType<Omit<LoginResult, 'token' | 'user'> & User>>('/v1/auth/logout', {
    method: 'post',
  });
};

// me
export const me = () => {
  return axios<ResType<Omit<LoginResult, 'token' | 'user'> & User>>('/v1/me', {
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
  user: User;
};
