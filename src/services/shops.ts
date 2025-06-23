import axios from './index';
import type { ResType } from '@/types/api';

// 店铺数据类型
export interface Shop {
  id: string;
  nickname: string;
  avatarUrl?: string;
  responsiblePerson: string;
  remark?: string;
  operatorId: string;
  createdAt: string;
  updatedAt: string;
  operator: {
    id: string;
    name: string;
  };
}

// 店铺查询参数
export interface ShopsParams {
  page?: number;
  pageSize?: number;
  nickname?: string;
}

// 创建/更新店铺参数
export interface ShopFormData {
  nickname: string;
  avatarUrl?: string;
  responsiblePerson: string;
  remark?: string;
}

// 获取店铺列表
export const getShops = (params: ShopsParams) => {
  return axios<
    ResType<{
      list: Shop[];
      meta: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    }>
  >('/shops', {
    method: 'get',
    params,
  });
};

// 获取店铺详情
export const getShop = (id: string) => {
  return axios<ResType<Shop>>(`/shops/${id}`, {
    method: 'get',
  });
};

// 创建店铺
export const createShop = (data: ShopFormData) => {
  return axios<ResType<Shop>>('/shops', {
    method: 'post',
    data,
  });
};

// 更新店铺
export const updateShop = (id: string, data: Partial<ShopFormData>) => {
  return axios<ResType<Shop>>(`/shops/${id}`, {
    method: 'put',
    data,
  });
};

// 删除店铺
export const deleteShop = (id: string) => {
  return axios<ResType<null>>(`/shops/${id}`, {
    method: 'delete',
  });
};
