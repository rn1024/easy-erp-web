import axios from './index';

/**
 * APIs
 */
// 获取账号列表
export function accounts(params: AccountsParams) {
  return axios<PageResType<AccountsResponse>>('/v1/accounts', {
    method: 'get',
    params,
  });
}

// 创建账号信息
export function cAccount(data: CAccountData) {
  return axios<ResType<AccountsResponse>>('/v1/accounts', {
    data,
    method: 'post',
  });
}

// 获取账号信息
export function rAccount(id: string) {
  return axios<ResType<RAccountResponse>>(`/v1/accounts/${id}`, {
    method: 'get',
  });
}

// 更新账号信息
export function uAccount(id: string, data: UAccountData) {
  return axios<ResType<AccountsResponse>>(`/v1/accounts/${id}`, {
    data,
    method: 'put',
  });
}

// 删除账号信息
export function dAccount(id: string) {
  return axios<ResType>(`/v1/accounts/${id}`, {
    method: 'delete',
  });
}

// 修改账号密码
export function cAccountPwd(id: string | number, data: UpdateAccountPasswordData) {
  return axios<ResType<AccountsResponse>>(`/v1/accounts/${id}/password`, {
    method: 'put',
    data,
  });
}

/**
 * Types
 */
import { PageResType, ResType } from '@/types/api';

// 获取账号列表
export type AccountsParams = {
  limit?: number | string;
  page?: number | string;
  status?: number | string;
  name?: string;
  withRole?: boolean;
};

export type AccountsResponse = {
  created_at: string;
  deleted_at: string;
  id: string;
  name: string;
  operator: string;
  status: number;
  updated_at: string;
  roles?: {
    id: string;
    name: string;
    permissions: string[];
    status: number;
  }[];
};

// 创建账号信息
export type CAccountData = {
  name: string;
  operator: string;
  password?: string;
  status?: number;
  roleIds?: string[];
};

// 获取账号信息
export type RAccountResponse = AccountsResponse & {
  permissions: string[];
  roles: {
    id: string;
    name: string;
    status: number;
  }[];
};

// 更新账号信息
export type UAccountData = Partial<CAccountData>;

// 修改账号密码
export type UpdateAccountPasswordData = {
  old_password: string;
  new_password: string;
};
