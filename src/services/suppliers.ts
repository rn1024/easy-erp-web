import axios from './index';
import type { ResType } from '@/types/api';

// 供应商数据类型
export interface Supplier {
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
  productionDays: number;
  deliveryDays: number;
  remark?: string;
  operatorId: string;
  createdAt: string;
  updatedAt: string;
  operator: {
    id: string;
    name: string;
  };
}

// 供应商查询参数
export interface SuppliersParams {
  page?: number;
  pageSize?: number;
  nickname?: string;
  companyName?: string;
}

// 创建/更新供应商参数
export interface SupplierFormData {
  nickname: string;
  avatarUrl?: string;
  contactPerson: string;
  contactPhone: string;
  companyName: string;
  creditCode?: string;
  bankName?: string;
  bankAccount?: string;
  bankAddress?: string;
  productionDays?: number;
  deliveryDays?: number;
  remark?: string;
}

// 获取供应商列表
export const getSuppliers = (params: SuppliersParams) => {
  return axios<
    ResType<{
      list: Supplier[];
      meta: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    }>
  >('/suppliers', {
    method: 'get',
    params,
  });
};

// 获取供应商详情
export const getSupplier = (id: string) => {
  return axios<ResType<Supplier>>(`/suppliers/${id}`, {
    method: 'get',
  });
};

// 创建供应商
export const createSupplier = (data: SupplierFormData) => {
  return axios<ResType<Supplier>>('/suppliers', {
    method: 'post',
    data,
  });
};

// 更新供应商
export const updateSupplier = (id: string, data: Partial<SupplierFormData>) => {
  return axios<ResType<Supplier>>(`/suppliers/${id}`, {
    method: 'put',
    data,
  });
};

// 删除供应商
export const deleteSupplier = (id: string) => {
  return axios<ResType<null>>(`/suppliers/${id}`, {
    method: 'delete',
  });
};
