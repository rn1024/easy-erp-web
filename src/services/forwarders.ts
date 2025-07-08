import axios from './index';
import type { ResType } from '@/types/api';

// 货代数据类型
export interface Forwarder {
  id: string;
  nickname: string;
  avatarUrl?: string;
  contactPerson: string;
  contactPhone: string;
  companyName: string;
  creditCode?: string;
  bankName?: string;
  bankAccount?: string;
  bankAddress?: string;
  remark?: string;
  operatorId: string;
  createdAt: string;
  updatedAt: string;
  operator: {
    id: string;
    name: string;
  };
}

// 货代列表响应类型
export interface ForwarderListResponse {
  list: Forwarder[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 货代查询参数
export interface ForwardersParams {
  page?: number;
  pageSize?: number;
  nickname?: string;
  companyName?: string;
}

// 创建/更新货代参数
export interface ForwarderFormData {
  nickname: string;
  avatarUrl?: string;
  contactPerson: string;
  contactPhone: string;
  companyName: string;
  creditCode?: string;
  bankName?: string;
  bankAccount?: string;
  bankAddress?: string;
  remark?: string;
}

// 获取货代列表
export const getForwarders = (params?: ForwardersParams) => {
  return axios<ResType<ForwarderListResponse>>('/forwarding-agents', {
    method: 'get',
    params,
  });
};

// 获取货代详情
export const getForwarder = (id: string) => {
  return axios<ResType<Forwarder>>(`/forwarding-agents/${id}`, {
    method: 'get',
  });
};

// 创建货代
export const createForwarder = (data: ForwarderFormData) => {
  return axios<ResType<Forwarder>>('/forwarding-agents', {
    method: 'post',
    data,
  });
};

// 更新货代
export const updateForwarder = (id: string, data: Partial<ForwarderFormData>) => {
  return axios<ResType<Forwarder>>(`/forwarding-agents/${id}`, {
    method: 'put',
    data,
  });
};

// 删除货代
export const deleteForwarder = (id: string) => {
  return axios<ResType<null>>(`/forwarding-agents/${id}`, {
    method: 'delete',
  });
};
