import axios from './index';
import type { ResType } from '@/types/api';

// 采购订单相关接口

// 采购订单状态枚举
export enum PurchaseOrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PRODUCTION = 'PRODUCTION',
  SHIPPED = 'SHIPPED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

// 采购订单信息
export interface PurchaseOrderInfo {
  id: string;
  shopId: string;
  supplierId: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  status: PurchaseOrderStatus;
  urgent: boolean;
  remark?: string;
  operatorId: string;
  createdAt: string;
  updatedAt: string;
  shop: {
    id: string;
    nickname: string;
    avatarUrl?: string;
    responsiblePerson?: string;
  };
  supplier: {
    id: string;
    nickname: string;
    avatarUrl?: string;
    contactPerson: string;
    contactPhone: string;
    companyName?: string;
    productionDays?: number;
    deliveryDays?: number;
  };
  product: {
    id: string;
    code: string;
    specification?: string;
    sku: string;
    color?: string;
    setQuantity?: number;
    internalSize?: string;
    externalSize?: string;
    weight?: number;
    imageUrl?: string;
    category: {
      id: string;
      name: string;
    };
  };
  operator: {
    id: string;
    name: string;
  };
}

// 创建采购订单数据
export interface CreatePurchaseOrderData {
  shopId: string;
  supplierId: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  urgent?: boolean;
  remark?: string;
}

// 更新采购订单数据
export interface UpdatePurchaseOrderData {
  shopId?: string;
  supplierId?: string;
  productId?: string;
  quantity?: number;
  totalAmount?: number;
  status?: PurchaseOrderStatus;
  urgent?: boolean;
  remark?: string;
}

// 采购订单查询参数
export interface PurchaseOrderQueryParams {
  page?: number;
  pageSize?: number;
  shopId?: string;
  supplierId?: string;
  productId?: string;
  status?: PurchaseOrderStatus;
  urgent?: boolean;
}

// 获取采购订单列表
export const getPurchaseOrdersApi = (params: PurchaseOrderQueryParams = {}) => {
  return axios<ResType<{ list: PurchaseOrderInfo[]; meta: any }>>('/purchase-orders', {
    method: 'get',
    params,
  });
};

// 获取采购订单详情
export const getPurchaseOrderDetailApi = (id: string) => {
  return axios<ResType<PurchaseOrderInfo>>(`/purchase-orders/${id}`, {
    method: 'get',
  });
};

// 创建采购订单
export const createPurchaseOrderApi = (data: CreatePurchaseOrderData) => {
  return axios<ResType<PurchaseOrderInfo>>('/purchase-orders', {
    method: 'post',
    data,
  });
};

// 更新采购订单
export const updatePurchaseOrderApi = (id: string, data: UpdatePurchaseOrderData) => {
  return axios<ResType<PurchaseOrderInfo>>(`/purchase-orders/${id}`, {
    method: 'put',
    data,
  });
};

// 删除采购订单
export const deletePurchaseOrderApi = (id: string) => {
  return axios<ResType<null>>(`/purchase-orders/${id}`, {
    method: 'delete',
  });
};

// 采购订单状态选项
export const purchaseOrderStatusOptions = [
  { label: '待处理', value: PurchaseOrderStatus.PENDING, color: 'orange' },
  { label: '已确认', value: PurchaseOrderStatus.CONFIRMED, color: 'blue' },
  { label: '生产中', value: PurchaseOrderStatus.PRODUCTION, color: 'purple' },
  { label: '已发货', value: PurchaseOrderStatus.SHIPPED, color: 'cyan' },
  { label: '已收货', value: PurchaseOrderStatus.RECEIVED, color: 'green' },
  { label: '已取消', value: PurchaseOrderStatus.CANCELLED, color: 'red' },
];

// 获取状态标签
export const getPurchaseOrderStatusLabel = (status: PurchaseOrderStatus) => {
  const option = purchaseOrderStatusOptions.find((item) => item.value === status);
  return option ? option.label : status;
};

// 获取状态颜色
export const getPurchaseOrderStatusColor = (status: PurchaseOrderStatus) => {
  const option = purchaseOrderStatusOptions.find((item) => item.value === status);
  return option ? option.color : 'default';
};
