import axios from './index';
import type { ResType } from '@/types/api';

// 产品图片相关接口
export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  fileName: string;
  fileSize: number;
  sortOrder: number;
  isCover: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImageFormData {
  imageUrl: string;
  fileName: string;
  fileSize: number;
  sortOrder: number;
  isCover: boolean;
}

export interface ProductImageUploadParams {
  productId: string;
  images: ProductImageFormData[];
}

// 产品分类相关接口
export interface ProductCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
  };
}

export interface ProductCategoriesParams {
  page?: number;
  pageSize?: number;
  name?: string;
}

export interface ProductCategoryFormData {
  name: string;
}

// 产品信息相关接口
export interface ProductInfo {
  id: string;
  shopId: string;
  categoryId: string;
  code?: string;
  name?: string;
  specification?: string;
  color?: string;
  setQuantity: number;
  internalSize?: string;
  externalSize?: string;
  weight?: number;
  sku?: string;
  asin?: string;
  label?: string;
  codeFileUrl?: string;
  styleInfo?: string;
  accessoryInfo?: string;
  remark?: string;
  operatorId: string;
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
  operator: {
    id: string;
    name: string;
  };
  images?: ProductImage[]; // 产品图片数组
  _count?: {
    finishedInventory: number;
    spareInventory: number;
    purchaseOrders?: number;
    warehouseTasks?: number;
    deliveryRecords?: number;
  };
}

export interface ProductsParams {
  page?: number;
  pageSize?: number;
  shopId?: string;
  categoryId?: string;
  code?: string;
  sku?: string;
  asin?: string;
}

export interface ProductFormData {
  shopId: string;
  categoryId: string;
  code?: string;
  name?: string;
  specification?: string;
  color?: string;
  setQuantity?: number;
  internalSize?: string;
  externalSize?: string;
  weight?: number;
  sku?: string;
  asin?: string;
  label?: string;
  codeFileUrl?: string;
  styleInfo?: string;
  accessoryInfo?: string;
  remark?: string;
}

// 产品分类 API
export const getProductCategoriesApi = (params: ProductCategoriesParams = {}) => {
  return axios<
    ResType<{
      list: ProductCategory[];
      meta: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    }>
  >('/product-categories', {
    method: 'get',
    params,
  });
};

export const createProductCategoryApi = (data: ProductCategoryFormData) => {
  return axios<ResType<ProductCategory>>('/product-categories', {
    method: 'post',
    data,
  });
};

export const getProductCategoryApi = (id: string) => {
  return axios<ResType<ProductCategory>>(`/product-categories/${id}`, {
    method: 'get',
  });
};

export const updateProductCategoryApi = (id: string, data: ProductCategoryFormData) => {
  return axios<ResType<ProductCategory>>(`/product-categories/${id}`, {
    method: 'put',
    data,
  });
};

export const deleteProductCategoryApi = (id: string) => {
  return axios<ResType<null>>(`/product-categories/${id}`, {
    method: 'delete',
  });
};

// 产品信息 API
export const getProductsApi = (params: ProductsParams = {}) => {
  return axios<
    ResType<{
      list: ProductInfo[];
      meta: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    }>
  >('/products', {
    method: 'get',
    params,
  });
};

export const createProductApi = (data: ProductFormData) => {
  return axios<ResType<ProductInfo>>('/products', {
    method: 'post',
    data,
  });
};

export const getProductApi = (id: string) => {
  return axios<ResType<ProductInfo>>(`/products/${id}`, {
    method: 'get',
  });
};

export const updateProductApi = (id: string, data: ProductFormData) => {
  return axios<ResType<ProductInfo>>(`/products/${id}`, {
    method: 'put',
    data,
  });
};

export const deleteProductApi = (id: string) => {
  return axios<ResType<null>>(`/products/${id}`, {
    method: 'delete',
  });
};

// 产品图片管理 API
export const getProductImagesApi = (productId: string) => {
  return axios<ResType<ProductImage[]>>(`/products/${productId}/images`, {
    method: 'get',
  });
};

export const uploadProductImagesApi = (productId: string, data: ProductImageFormData[]) => {
  return axios<ResType<ProductImage[]>>(`/products/${productId}/images`, {
    method: 'post',
    data: { images: data },
  });
};

export const updateProductImageApi = (
  productId: string,
  imageId: string,
  data: Partial<ProductImageFormData>
) => {
  return axios<ResType<ProductImage>>(`/products/${productId}/images/${imageId}`, {
    method: 'put',
    data,
  });
};

export const deleteProductImageApi = (productId: string, imageId: string) => {
  return axios<ResType<null>>(`/products/${productId}/images/${imageId}`, {
    method: 'delete',
  });
};

export const setCoverImageApi = (productId: string, imageId: string) => {
  return axios<ResType<ProductImage>>(`/products/${productId}/images/${imageId}/set-cover`, {
    method: 'patch',
  });
};
