import axios from './index';
import type { ResType } from '@/types/api';

// ========== 成品库存相关接口 ==========

// 成品库存列表响应类型
export interface FinishedInventoryItem {
  id: string;
  shopId: string;
  categoryId: string;
  productId: string;
  boxSize?: string;
  packQuantity: number;
  weight?: number;
  location?: string;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
  shop: {
    id: string;
    nickname: string;
  };
  category: {
    id: string;
    name: string;
  };
  product: {
    id: string;
    code: string;
    sku: string;
    specification?: string;
    color?: string;
  };
}

export interface FinishedInventoryListResponse {
  list: FinishedInventoryItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 成品库存创建/更新参数类型
export interface FinishedInventoryParams {
  shopId: string;
  categoryId: string;
  productId: string;
  boxSize?: string;
  packQuantity?: number;
  weight?: number;
  location?: string;
  stockQuantity?: number;
}

// 成品库存查询参数类型
export interface FinishedInventoryQueryParams {
  page?: number;
  pageSize?: number;
  shopId?: string;
  categoryId?: string;
  productId?: string;
  location?: string;
}

// 获取成品库存列表
export const getFinishedInventoryList = (params?: FinishedInventoryQueryParams) => {
  return axios<ResType<FinishedInventoryListResponse>>('/finished-inventory', {
    method: 'get',
    params,
  });
};

// 获取成品库存详情
export const getFinishedInventoryDetail = (id: string) => {
  return axios<ResType<FinishedInventoryItem>>(`/finished-inventory/${id}`, {
    method: 'get',
  });
};

// 创建成品库存
export const createFinishedInventory = (data: FinishedInventoryParams) => {
  return axios<ResType<FinishedInventoryItem>>('/finished-inventory', {
    method: 'post',
    data,
  });
};

// 更新成品库存
export const updateFinishedInventory = (id: string, data: Partial<FinishedInventoryParams>) => {
  return axios<ResType<FinishedInventoryItem>>(`/finished-inventory/${id}`, {
    method: 'put',
    data,
  });
};

// 删除成品库存
export const deleteFinishedInventory = (id: string) => {
  return axios<ResType<null>>(`/finished-inventory/${id}`, {
    method: 'delete',
  });
};

// ========== 散件库存相关接口 ==========

// 散件库存列表响应类型
export interface SpareInventoryItem {
  id: string;
  shopId: string;
  categoryId: string;
  productId: string;
  spareType?: string;
  location?: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  shop: {
    id: string;
    nickname: string;
  };
  category: {
    id: string;
    name: string;
  };
  product: {
    id: string;
    code: string;
    sku: string;
    specification?: string;
    color?: string;
  };
}

export interface SpareInventoryListResponse {
  list: SpareInventoryItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 散件库存创建/更新参数类型
export interface SpareInventoryParams {
  shopId: string;
  categoryId: string;
  productId: string;
  spareType?: string;
  location?: string;
  quantity?: number;
}

// 散件库存查询参数类型
export interface SpareInventoryQueryParams {
  page?: number;
  pageSize?: number;
  shopId?: string;
  categoryId?: string;
  productId?: string;
  spareType?: string;
  location?: string;
}

// 获取散件库存列表
export const getSpareInventoryList = (params?: SpareInventoryQueryParams) => {
  return axios<ResType<SpareInventoryListResponse>>('/spare-inventory', {
    method: 'get',
    params,
  });
};

// 获取散件库存详情
export const getSpareInventoryDetail = (id: string) => {
  return axios<ResType<SpareInventoryItem>>(`/spare-inventory/${id}`, {
    method: 'get',
  });
};

// 创建散件库存
export const createSpareInventory = (data: SpareInventoryParams) => {
  return axios<ResType<SpareInventoryItem>>('/spare-inventory', {
    method: 'post',
    data,
  });
};

// 更新散件库存
export const updateSpareInventory = (id: string, data: Partial<SpareInventoryParams>) => {
  return axios<ResType<SpareInventoryItem>>(`/spare-inventory/${id}`, {
    method: 'put',
    data,
  });
};

// 删除散件库存
export const deleteSpareInventory = (id: string) => {
  return axios<ResType<null>>(`/spare-inventory/${id}`, {
    method: 'delete',
  });
};
