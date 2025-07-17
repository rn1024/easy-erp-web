import { prisma } from './db';

export interface SupplyItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  remark?: string;
}

export interface ProductSupplyStatus {
  productId: string;
  purchaseQuantity: number;
  suppliedQuantity: number;
  availableQuantity: number;
  supplyProgress: number; // 供货进度百分比
}

export interface SupplyStatistics {
  totalRecords: number;
  activeRecords: number;
  totalAmount: number;
  productStatuses: ProductSupplyStatus[];
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
  errors: {
    productId: string;
    message: string;
    purchaseQuantity: number;
    suppliedQuantity: number;
    requestQuantity: number;
  }[];
}

export class SupplyQuantityValidator {
  /**
   * 实时验证供货数量（支持并发控制）
   */
  static async validateSupplyQuantityRealtime(
    purchaseOrderId: string,
    items: SupplyItem[],
    excludeRecordId?: string
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
    };

    try {
      // 1. 获取采购订单的产品清单
      const purchaseOrder = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
      });

      if (!purchaseOrder) {
        return {
          valid: false,
          message: '采购订单不存在',
          errors: [],
        };
      }

      // 2. 获取采购订单的产品明细
      const purchaseItems = await prisma.productItem.findMany({
        where: {
          relatedType: 'PURCHASE_ORDER',
          relatedId: purchaseOrderId,
        },
        include: {
          product: true,
        },
      });

      // 3. 逐个验证产品的实时可用数量
      for (const item of items) {
        const purchaseItem = purchaseItems.find((p) => p.productId === item.productId);

        if (!purchaseItem) {
          result.errors.push({
            productId: item.productId,
            message: '该产品不在采购订单中',
            purchaseQuantity: 0,
            suppliedQuantity: 0,
            requestQuantity: item.quantity,
          });
          continue;
        }

        // 实时获取当前产品的已供货数量
        const currentSuppliedQty = await this.getRealTimeSuppliedQuantity(
          purchaseOrderId,
          item.productId,
          excludeRecordId
        );

        const purchaseQty = purchaseItem.quantity;
        const availableQty = Math.max(0, purchaseQty - currentSuppliedQty);

        if (item.quantity > availableQty) {
          result.errors.push({
            productId: item.productId,
            message: `产品 ${purchaseItem.product.code} 供货数量超出限制。采购数量: ${purchaseQty}，已供货: ${currentSuppliedQty}，可供货: ${availableQty}，申请数量: ${item.quantity}`,
            purchaseQuantity: purchaseQty,
            suppliedQuantity: currentSuppliedQty,
            requestQuantity: item.quantity,
          });
        }
      }

      result.valid = result.errors.length === 0;
      if (!result.valid) {
        result.message = '存在数量超限的产品，请刷新页面后重新填写';
      }
    } catch (error) {
      console.error('Real-time supply quantity validation error:', error);
      result.valid = false;
      result.message = '校验过程中发生错误，请重试';
    }

    return result;
  }

  /**
   * 实时获取单个产品的已供货数量
   */
  static async getRealTimeSuppliedQuantity(
    purchaseOrderId: string,
    productId: string,
    excludeRecordId?: string
  ): Promise<number> {
    try {
      const whereClause: any = {
        purchaseOrderId,
        status: 'active',
      };

      if (excludeRecordId) {
        whereClause.id = { not: excludeRecordId };
      }

      const result = await prisma.supplyRecordItem.aggregate({
        where: {
          productId,
          supplyRecord: whereClause,
        },
        _sum: {
          quantity: true,
        },
      });

      return Number(result._sum.quantity || 0);
    } catch (error) {
      console.error('Get real-time supplied quantity error:', error);
      return 0;
    }
  }

  /**
   * 获取产品的实时可选列表（过滤掉已完全供货的产品）
   */
  static async getAvailableProductsList(purchaseOrderId: string): Promise<
    Array<{
      productId: string;
      productCode: string;
      productSpec: string;
      purchaseQuantity: number;
      suppliedQuantity: number;
      availableQuantity: number;
    }>
  > {
    try {
      // 获取采购订单的产品明细
      const purchaseItems = await prisma.productItem.findMany({
        where: {
          relatedType: 'PURCHASE_ORDER',
          relatedId: purchaseOrderId,
        },
        include: {
          product: {
            select: {
              id: true,
              code: true,
              specification: true,
              color: true,
            },
          },
        },
      });

      // 计算每个产品的可用数量
      const availableProducts = await Promise.all(
        purchaseItems.map(async (item) => {
          const suppliedQty = await this.getRealTimeSuppliedQuantity(
            purchaseOrderId,
            item.productId
          );
          const availableQty = Math.max(0, item.quantity - suppliedQty);

          return {
            productId: item.productId,
            productCode: item.product.code || '',
            productSpec: `${item.product.specification || ''} ${item.product.color || ''}`.trim(),
            purchaseQuantity: item.quantity,
            suppliedQuantity: suppliedQty,
            availableQuantity: availableQty,
          };
        })
      );

      // 只返回还有可供货数量的产品
      return availableProducts.filter((product) => product.availableQuantity > 0);
    } catch (error) {
      console.error('Get available products list error:', error);
      return [];
    }
  }

  /**
   * 校验供货数量是否超限 - 原有方法保持兼容
   */
  static async validateSupplyQuantity(
    purchaseOrderId: string,
    items: SupplyItem[],
    excludeRecordId?: string
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
    };

    try {
      // 1. 获取采购订单的产品清单
      const purchaseOrder = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
      });

      if (!purchaseOrder) {
        return {
          valid: false,
          message: '采购订单不存在',
          errors: [],
        };
      }

      // 获取采购订单的产品明细
      const purchaseItems = await prisma.productItem.findMany({
        where: {
          relatedType: 'PURCHASE_ORDER',
          relatedId: purchaseOrderId,
        },
        include: {
          product: true,
        },
      });

      // 2. 计算当前各产品的已供货数量（排除当前编辑的记录）
      const suppliedQuantities = await this.getSuppliedQuantities(purchaseOrderId, excludeRecordId);

      // 3. 校验每个产品的新增数量
      for (const item of items) {
        const purchaseItem = purchaseItems.find((p) => p.productId === item.productId);

        if (!purchaseItem) {
          result.errors.push({
            productId: item.productId,
            message: '该产品不在采购订单中',
            purchaseQuantity: 0,
            suppliedQuantity: 0,
            requestQuantity: item.quantity,
          });
          continue;
        }

        const suppliedQty = suppliedQuantities[item.productId] || 0;
        const purchaseQty = purchaseItem.quantity;

        if (suppliedQty + item.quantity > purchaseQty) {
          result.errors.push({
            productId: item.productId,
            message: `供货数量超出限制，采购数量: ${purchaseQty}，已供货: ${suppliedQty}，本次申请: ${item.quantity}`,
            purchaseQuantity: purchaseQty,
            suppliedQuantity: suppliedQty,
            requestQuantity: item.quantity,
          });
        }
      }

      result.valid = result.errors.length === 0;
      if (!result.valid) {
        result.message = '存在数量超限的产品，请检查后重新提交';
      }
    } catch (error) {
      console.error('Supply quantity validation error:', error);
      result.valid = false;
      result.message = '校验过程中发生错误';
    }

    return result;
  }

  /**
   * 获取产品可供货余量
   */
  static async getAvailableQuantity(purchaseOrderId: string, productId: string): Promise<number> {
    try {
      // 获取采购数量
      const purchaseItem = await prisma.productItem.findFirst({
        where: {
          relatedType: 'PURCHASE_ORDER',
          relatedId: purchaseOrderId,
          productId,
        },
      });

      if (!purchaseItem) {
        return 0;
      }

      // 获取已供货数量
      const suppliedQuantities = await this.getSuppliedQuantities(purchaseOrderId);
      const suppliedQty = suppliedQuantities[productId] || 0;

      return Math.max(0, purchaseItem.quantity - suppliedQty);
    } catch (error) {
      console.error('Get available quantity error:', error);
      return 0;
    }
  }

  /**
   * 计算已供货统计
   */
  static async getSupplyStatistics(purchaseOrderId: string): Promise<SupplyStatistics> {
    try {
      // 获取供货记录统计
      const recordStats = await prisma.supplyRecord.aggregate({
        where: {
          purchaseOrderId,
          status: 'active',
        },
        _count: true,
        _sum: {
          totalAmount: true,
        },
      });

      const totalRecordsCount = await prisma.supplyRecord.count({
        where: { purchaseOrderId },
      });

      // 获取采购订单产品清单
      const purchaseItems = await prisma.productItem.findMany({
        where: {
          relatedType: 'PURCHASE_ORDER',
          relatedId: purchaseOrderId,
        },
        include: {
          product: true,
        },
      });

      // 获取已供货数量
      const suppliedQuantities = await this.getSuppliedQuantities(purchaseOrderId);

      // 计算每个产品的供货状态
      const productStatuses: ProductSupplyStatus[] = purchaseItems.map((item) => {
        const suppliedQty = suppliedQuantities[item.productId] || 0;
        const progress = item.quantity > 0 ? (suppliedQty / item.quantity) * 100 : 0;

        return {
          productId: item.productId,
          purchaseQuantity: item.quantity,
          suppliedQuantity: suppliedQty,
          availableQuantity: Math.max(0, item.quantity - suppliedQty),
          supplyProgress: Math.min(100, Math.round(progress * 100) / 100),
        };
      });

      return {
        totalRecords: totalRecordsCount,
        activeRecords: recordStats._count || 0,
        totalAmount: Number(recordStats._sum.totalAmount || 0),
        productStatuses,
      };
    } catch (error) {
      console.error('Get supply statistics error:', error);
      return {
        totalRecords: 0,
        activeRecords: 0,
        totalAmount: 0,
        productStatuses: [],
      };
    }
  }

  /**
   * 获取已供货数量（按产品ID分组）
   */
  private static async getSuppliedQuantities(
    purchaseOrderId: string,
    excludeRecordId?: string
  ): Promise<Record<string, number>> {
    try {
      const whereCondition: any = {
        supplyRecord: {
          purchaseOrderId,
          status: 'active',
        },
      };

      if (excludeRecordId) {
        whereCondition.supplyRecord.id = {
          not: excludeRecordId,
        };
      }

      const supplyItems = await prisma.supplyRecordItem.findMany({
        where: whereCondition,
        select: {
          productId: true,
          quantity: true,
        },
      });

      // 按产品ID聚合数量
      const quantities: Record<string, number> = {};
      for (const item of supplyItems) {
        quantities[item.productId] = (quantities[item.productId] || 0) + item.quantity;
      }

      return quantities;
    } catch (error) {
      console.error('Get supplied quantities error:', error);
      return {};
    }
  }

  /**
   * 检查供货记录是否可以失效
   */
  static async canDisableRecord(recordId: string): Promise<boolean> {
    try {
      const record = await prisma.supplyRecord.findUnique({
        where: { id: recordId },
      });

      return record?.status === 'active';
    } catch (error) {
      console.error('Check disable record error:', error);
      return false;
    }
  }

  /**
   * 失效供货记录（释放数量）
   */
  static async disableSupplyRecord(recordId: string): Promise<boolean> {
    try {
      await prisma.supplyRecord.update({
        where: { id: recordId },
        data: { status: 'disabled' },
      });

      return true;
    } catch (error) {
      console.error('Disable supply record error:', error);
      return false;
    }
  }
}
