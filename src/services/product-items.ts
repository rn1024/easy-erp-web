import axios from './index';
import type { ResType } from '@/types/api';

// 通用产品明细类型枚举
export enum ProductItemRelatedType {
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  PACKAGING_TASK = 'PACKAGING_TASK',
}

// 通用产品明细接口
export interface ProductItemInfo {
  id: string;
  relatedType: ProductItemRelatedType;
  relatedId: string;
  productId: string;
  quantity: number;

  // 采购订单专用字段
  unitPrice?: number;
  amount?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount?: number;

  // 包装任务专用字段
  completedQuantity?: number;

  // 通用字段
  remark?: string;
  createdAt: string;
  updatedAt: string;

  // 关联数据
  product?: {
    id: string;
    code: string;
    sku: string;
    specification?: string;
    color?: string;
    shop?: {
      id: string;
      nickname: string;
    };
    category?: {
      id: string;
      name: string;
    };
  };
}

// 产品明细创建/更新数据接口
export interface ProductItemData {
  productId: string;
  quantity: number;
  unitPrice?: number;
  amount?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount?: number;
  completedQuantity?: number;
  remark?: string;
}

// 批量产品明细操作参数
export interface ProductItemsBatchParams {
  relatedType: ProductItemRelatedType;
  relatedId: string;
  items: ProductItemData[];
}

// 获取产品明细列表
export const getProductItemsApi = (relatedType: ProductItemRelatedType, relatedId: string) => {
  return axios<ProductItemInfo[]>('/product-items', {
    method: 'get',
    params: { relatedType, relatedId },
  });
};

// 批量保存产品明细
export const saveProductItemsApi = (params: ProductItemsBatchParams) => {
  return axios<ProductItemInfo[]>('/product-items', {
    method: 'post',
    data: params,
  });
};

// 工具方法：计算采购订单明细金额
export const calculatePurchaseOrderItemAmounts = (
  quantity: number,
  unitPrice: number,
  taxRate: number
) => {
  const amount = quantity * unitPrice;
  const taxAmount = amount * (taxRate / 100);
  const totalAmount = amount + taxAmount;

  return {
    amount: parseFloat(amount.toFixed(2)),
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
  };
};

// 工具方法：计算包装任务总进度
export const calculatePackagingTaskProgress = (items: ProductItemInfo[]) => {
  if (!items.length) return 0;

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const completedQuantity = items.reduce((sum, item) => sum + (item.completedQuantity || 0), 0);

  if (totalQuantity === 0) return 0;
  return Math.round((completedQuantity / totalQuantity) * 100 * 100) / 100; // 保留2位小数
};

// 工具方法：验证产品明细数据
export const validateProductItems = (
  items: ProductItemData[],
  relatedType: ProductItemRelatedType
): string[] => {
  const errors: string[] = [];

  if (!items.length) {
    errors.push('至少需要添加一个产品明细');
    return errors;
  }

  items.forEach((item, index) => {
    if (!item.productId) {
      errors.push(`第${index + 1}行：请选择产品`);
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`第${index + 1}行：数量必须大于0`);
    }

    // 采购订单特定验证
    if (relatedType === ProductItemRelatedType.PURCHASE_ORDER) {
      if (item.unitPrice === undefined || item.unitPrice < 0) {
        errors.push(`第${index + 1}行：单价不能为负数`);
      }
      if (item.taxRate === undefined || item.taxRate < 0 || item.taxRate > 100) {
        errors.push(`第${index + 1}行：税率必须在0-100之间`);
      }
    }

    // 包装任务特定验证
    if (relatedType === ProductItemRelatedType.PACKAGING_TASK) {
      if (item.completedQuantity !== undefined && item.completedQuantity > item.quantity) {
        errors.push(`第${index + 1}行：完成数量不能超过总数量`);
      }
    }
  });

  return errors;
};
