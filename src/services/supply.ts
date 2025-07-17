import request from './index';

export interface ShareConfig {
  expiresIn: number; // 有效期（小时）
  extractCode?: string; // 提取码
  accessLimit?: number; // 访问限制
}

export interface ShareLinkInfo {
  shareCode: string;
  extractCode: string;
  shareUrl: string;
  expiresAt: string;
  accessLimit?: number;
}

export interface SupplyStatistics {
  totalRecords: number;
  activeRecords: number;
  totalAmount: number;
  productStatuses: Array<{
    productId: string;
    purchaseQuantity: number;
    suppliedQuantity: number;
    availableQuantity: number;
    supplyProgress: number;
  }>;
}

export interface SupplyRecord {
  id: string;
  status: string;
  supplierInfo: any;
  totalAmount: number;
  itemCount: number;
  items: Array<{
    id: string;
    product: {
      id: string;
      code: string;
      specification?: string;
      color?: string;
    };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    remark?: string;
  }>;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

// 创建分享链接
export const createShareLinkApi = async (purchaseOrderId: string, config: ShareConfig) => {
  try {
    const response = await request.post(`/purchase-orders/${purchaseOrderId}/share`, config);
    return response;
  } catch (error: any) {
    console.error('创建分享链接失败:', error);
    throw new Error(error?.response?.data?.msg || '创建分享链接失败，请重试');
  }
};

// 获取分享链接信息
export const getShareLinkApi = async (purchaseOrderId: string) => {
  try {
    const response = await request.get(`/purchase-orders/${purchaseOrderId}/share`);
    return response;
  } catch (error: any) {
    console.error('获取分享链接失败:', error);
    if (error?.response?.status === 404) {
      return { data: { code: 404, data: null, msg: '分享链接不存在' } };
    }
    throw new Error(error?.response?.data?.msg || '获取分享链接失败');
  }
};

// 更新分享链接
export const updateShareLinkApi = async (purchaseOrderId: string, config: Partial<ShareConfig>) => {
  try {
    const response = await request.put(`/purchase-orders/${purchaseOrderId}/share`, config);
    return response;
  } catch (error: any) {
    console.error('更新分享链接失败:', error);
    throw new Error(error?.response?.data?.msg || '更新分享链接失败，请重试');
  }
};

// 禁用分享链接
export const disableShareLinkApi = async (purchaseOrderId: string) => {
  try {
    const response = await request.delete(`/purchase-orders/${purchaseOrderId}/share`);
    return response;
  } catch (error: any) {
    console.error('禁用分享链接失败:', error);
    throw new Error(error?.response?.data?.msg || '禁用分享链接失败，请重试');
  }
};

// 获取供货记录列表和统计
export const getSupplyRecordsApi = async (purchaseOrderId: string) => {
  try {
    const response = await request.get(`/purchase-orders/${purchaseOrderId}/supply-records`);
    return response;
  } catch (error: any) {
    console.error('获取供货记录失败:', error);
    throw new Error(error?.response?.data?.msg || '获取供货记录失败');
  }
};

// 失效供货记录
export const disableSupplyRecordApi = async (recordId: string) => {
  try {
    const response = await request.put(`/supply-records/${recordId}/disable`);
    return response;
  } catch (error: any) {
    console.error('失效供货记录失败:', error);
    throw new Error(error?.response?.data?.msg || '失效供货记录失败，请重试');
  }
};

// 获取采购订单的供货统计（用于列表显示）
export const getSupplyStatsApi = async (purchaseOrderIds: string[]) => {
  try {
    const response = await request.post('/purchase-orders/supply-stats', {
      orderIds: purchaseOrderIds,
    });
    return response;
  } catch (error: any) {
    console.error('获取供货统计失败:', error);
    // 统计信息获取失败不应该阻塞主流程，返回空数据
    return { data: { code: 0, data: [], msg: '获取统计信息失败' } };
  }
};
