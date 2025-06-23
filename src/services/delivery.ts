import axios from './index';

// 发货记录状态枚举
export enum DeliveryRecordStatus {
  PREPARING = 'PREPARING',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

// 发货记录状态选项
export const deliveryRecordStatusOptions = [
  { label: '准备中', value: DeliveryRecordStatus.PREPARING, color: 'orange' },
  { label: '已发货', value: DeliveryRecordStatus.SHIPPED, color: 'blue' },
  { label: '运输中', value: DeliveryRecordStatus.IN_TRANSIT, color: 'cyan' },
  { label: '已送达', value: DeliveryRecordStatus.DELIVERED, color: 'green' },
  { label: '已取消', value: DeliveryRecordStatus.CANCELLED, color: 'red' },
];

// 获取状态标签配置
export const getDeliveryRecordStatusLabel = (status: DeliveryRecordStatus) => {
  const option = deliveryRecordStatusOptions.find((item) => item.value === status);
  return option || { label: '未知状态', value: status, color: 'default' };
};

// 发货记录信息接口
export interface DeliveryRecordInfo {
  id: string;
  shopId: string;
  productId: string;
  totalBoxes: number;
  fbaShipmentCode?: string;
  fbaWarehouseCode?: string;
  country?: string;
  channel?: string;
  forwarderId: string;
  shippingChannel?: string;
  warehouseShippingDeadline?: string;
  warehouseReceiptDeadline?: string;
  shippingDetails?: string;
  date: string;
  status: DeliveryRecordStatus;
  operatorId: string;
  createdAt: string;
  updatedAt: string;
  shop?: {
    id: string;
    nickname: string;
    responsiblePerson: string;
  };
  product?: {
    id: string;
    code: string;
    specification?: string;
    sku: string;
  };
  forwarder?: {
    id: string;
    nickname: string;
    contactPerson: string;
    contactPhone?: string;
  };
  operator?: {
    id: string;
    name: string;
    operator: string;
  };
}

// 创建发货记录数据接口
export interface CreateDeliveryRecordData {
  shopId: string;
  productId: string;
  totalBoxes: number;
  fbaShipmentCode?: string;
  fbaWarehouseCode?: string;
  country?: string;
  channel?: string;
  forwarderId: string;
  shippingChannel?: string;
  warehouseShippingDeadline?: string;
  warehouseReceiptDeadline?: string;
  shippingDetails?: string;
  date: string;
}

// 更新发货记录数据接口
export interface UpdateDeliveryRecordData {
  shopId?: string;
  productId?: string;
  totalBoxes?: number;
  fbaShipmentCode?: string;
  fbaWarehouseCode?: string;
  country?: string;
  channel?: string;
  forwarderId?: string;
  shippingChannel?: string;
  warehouseShippingDeadline?: string;
  warehouseReceiptDeadline?: string;
  shippingDetails?: string;
  date?: string;
  status?: DeliveryRecordStatus;
}

// 发货记录查询参数接口
export interface DeliveryRecordQueryParams {
  shopId?: string;
  productId?: string;
  forwarderId?: string;
  status?: DeliveryRecordStatus;
  country?: string;
  channel?: string;
  fbaShipmentCode?: string;
  page?: number;
  pageSize?: number;
}

// 发货记录列表响应接口
export interface DeliveryRecordListResponse {
  list: DeliveryRecordInfo[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 获取发货记录列表
export const getDeliveryRecordsApi = (params: DeliveryRecordQueryParams) => {
  return axios<DeliveryRecordListResponse>('/api/v1/delivery-records', {
    method: 'get',
    params,
  });
};

// 创建发货记录
export const createDeliveryRecordApi = (data: CreateDeliveryRecordData) => {
  return axios<DeliveryRecordInfo>('/api/v1/delivery-records', {
    method: 'post',
    data,
  });
};

// 获取发货记录详情
export const getDeliveryRecordApi = (id: string) => {
  return axios<DeliveryRecordInfo>(`/api/v1/delivery-records/${id}`, {
    method: 'get',
  });
};

// 更新发货记录
export const updateDeliveryRecordApi = (id: string, data: UpdateDeliveryRecordData) => {
  return axios<DeliveryRecordInfo>(`/api/v1/delivery-records/${id}`, {
    method: 'put',
    data,
  });
};

// 删除发货记录
export const deleteDeliveryRecordApi = (id: string) => {
  return axios<{ message: string }>(`/api/v1/delivery-records/${id}`, {
    method: 'delete',
  });
};
