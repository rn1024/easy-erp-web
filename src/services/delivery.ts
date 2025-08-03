import axios from './index';

// 发货记录状态枚举
export enum ShipmentRecordStatus {
  PENDING = 'PENDING', // 待发货
  SHIPPED = 'SHIPPED', // 已发货
  IN_TRANSIT = 'IN_TRANSIT', // 在途
  ARRIVED = 'ARRIVED', // 到港
  DELIVERED = 'DELIVERED', // 交付
  WAITING_RECEIVE = 'WAITING_RECEIVE', // 等待接收
  RECEIVING = 'RECEIVING', // 正在接收
  COMPLETED = 'COMPLETED', // 已完结
}

// 发货记录状态选项
export const shipmentRecordStatusOptions = [
  { label: '待发货', value: 'PENDING' },
  { label: '已发货', value: 'SHIPPED' },
  { label: '在途', value: 'IN_TRANSIT' },
  { label: '到港', value: 'ARRIVED' },
  { label: '交付', value: 'DELIVERED' },
  { label: '等待接收', value: 'WAITING_RECEIVE' },
  { label: '正在接收', value: 'RECEIVING' },
  { label: '已完结', value: 'COMPLETED' },
];

// 获取发货记录状态标签
export const getShipmentRecordStatusLabel = (status: ShipmentRecordStatus | string) => {
  const statusMap: Record<string, { label: string; color: string }> = {
    PENDING: { label: '待发货', color: 'blue' },
    SHIPPED: { label: '已发货', color: 'orange' },
    IN_TRANSIT: { label: '在途', color: 'purple' },
    ARRIVED: { label: '到港', color: 'cyan' },
    DELIVERED: { label: '交付', color: 'green' },
    WAITING_RECEIVE: { label: '等待接收', color: 'yellow' },
    RECEIVING: { label: '正在接收', color: 'processing' },
    COMPLETED: { label: '已完结', color: 'success' },
  };
  return statusMap[status] || { label: '未知', color: 'default' };
};

// 发货产品记录接口
export interface ShipmentProductRecordInfo {
  id: string;
  shipmentRecordId: string;
  productId: string;
  forwarderId?: string; // 货代改为可选
  totalBoxes: number;
  fbaShipmentCode?: string;
  fbaWarehouseCode?: string;
  createdAt: string;
  updatedAt: string;
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
}

// 发货记录信息接口 (主表)
export interface ShipmentRecordInfo {
  id: string;
  shopId: string;
  country?: string;
  channel?: string;
  shippingChannel?: string;
  warehouseReceiptDeadline?: string;
  shippingDetails?: string;
  date: string;
  status: ShipmentRecordStatus;
  operatorId: string;
  createdAt: string;
  updatedAt: string;
  shop?: {
    id: string;
    nickname: string;
    responsiblePerson: string;
  };
  operator?: {
    id: string;
    name: string;
    operator: string;
  };
  shipmentProducts?: ShipmentProductRecordInfo[];
}

// 创建发货记录数据接口
export interface CreateShipmentRecordData {
  shopId: string;
  country?: string;
  channel?: string;
  shippingChannel?: string;
  warehouseReceiptDeadline?: string;
  shippingDetails?: string;
  date: string;
  products: {
    productId: string;
    forwarderId: string;
    totalBoxes: number;
    fbaShipmentCode?: string;
    fbaWarehouseCode?: string;
  }[];
}

// 更新发货记录数据接口
export interface UpdateShipmentRecordData {
  shopId?: string;
  country?: string;
  channel?: string;
  shippingChannel?: string;
  warehouseReceiptDeadline?: string;
  shippingDetails?: string;
  date?: string;
  status?: ShipmentRecordStatus;
  products?: {
    id?: string; // 产品记录ID，如果存在则更新，否则创建
    productId: string;
    forwarderId: string;
    totalBoxes: number;
    fbaShipmentCode?: string;
    fbaWarehouseCode?: string;
  }[];
}

// 发货记录查询参数接口
export interface ShipmentRecordQueryParams {
  shopId?: string;
  status?: ShipmentRecordStatus;
  country?: string;
  channel?: string;
  shippingChannel?: string;
  page?: number;
  pageSize?: number;
}

// 发货产品记录查询参数接口
export interface ShipmentProductRecordQueryParams {
  shipmentRecordId?: string;
  productId?: string;
  forwarderId?: string;
  fbaShipmentCode?: string;
  page?: number;
  pageSize?: number;
}

// ==================== API 调用函数 ====================

// 获取发货记录列表
export const getShipmentRecordsApi = async (params: ShipmentRecordQueryParams) => {
  const response = await axios.get('/shipment-records', { params });
  return response.data;
};

// 获取发货记录详情
export const getShipmentRecordApi = async (id: string) => {
  const response = await axios.get(`/shipment-records/${id}`);
  return response.data;
};

// 创建发货记录
export const createShipmentRecordApi = async (data: CreateShipmentRecordData) => {
  const response = await axios.post('/shipment-records', data);
  return response.data;
};

// 更新发货记录
export const updateShipmentRecordApi = async (id: string, data: UpdateShipmentRecordData) => {
  const response = await axios.put(`/shipment-records/${id}`, data);
  return response.data;
};

// 删除发货记录
export const deleteShipmentRecordApi = async (id: string) => {
  const response = await axios.delete(`/shipment-records/${id}`);
  return response.data;
};

// 获取发货产品记录列表
export const getShipmentProductRecordsApi = async (params: ShipmentProductRecordQueryParams) => {
  const response = await axios.get('/shipment-product-records', { params });
  return response.data;
};

// 创建发货产品记录
export const createShipmentProductRecordApi = async (
  data: Omit<ShipmentProductRecordInfo, 'id' | 'createdAt' | 'updatedAt' | 'product' | 'forwarder'>
) => {
  const response = await axios.post('/shipment-product-records', data);
  return response.data;
};

// 更新发货产品记录
export const updateShipmentProductRecordApi = async (
  id: string,
  data: Partial<
    Omit<ShipmentProductRecordInfo, 'id' | 'createdAt' | 'updatedAt' | 'product' | 'forwarder'>
  >
) => {
  const response = await axios.put(`/shipment-product-records/${id}`, data);
  return response.data;
};

// 删除发货产品记录
export const deleteShipmentProductRecordApi = async (id: string) => {
  const response = await axios.delete(`/shipment-product-records/${id}`);
  return response.data;
};

// ==================== 兼容性接口 (临时保留) ====================

// 为了与现有代码兼容，临时保留旧的接口名称
export const DeliveryRecordStatus = ShipmentRecordStatus;
export const deliveryRecordStatusOptions = shipmentRecordStatusOptions;
export const getDeliveryRecordStatusLabel = getShipmentRecordStatusLabel;

export type DeliveryRecordInfo = ShipmentRecordInfo;
export type CreateDeliveryRecordData = CreateShipmentRecordData;
export type UpdateDeliveryRecordData = UpdateShipmentRecordData;
export type DeliveryRecordQueryParams = ShipmentRecordQueryParams;

export const getDeliveryRecordsApi = getShipmentRecordsApi;
export const getDeliveryRecordApi = getShipmentRecordApi;
export const createDeliveryRecordApi = createShipmentRecordApi;
export const updateDeliveryRecordApi = updateShipmentRecordApi;
export const deleteDeliveryRecordApi = deleteShipmentRecordApi;
