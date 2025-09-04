/**
 * 采购订单统计计算器
 * 
 * 负责计算采购订单列表接口的 statistics 字段
 * 包含总记录数、有效记录数、总金额、产品供货状态等统计信息
 */

import { PrismaClient } from '@prisma/client';
import {
  PurchaseOrderStatistics,
  ProductSupplyStatus,
  StatisticsFilters,
  StatisticsCalculationResult,
  StatisticsCalculatorOptions,
  StatisticsCalculationError,
  StatisticsErrorCode,
  RawProductPurchaseData,
  RawProductSupplyData
} from '@/types/purchase-order-statistics';

/**
 * 采购订单统计计算器类
 */
export class PurchaseOrderStatisticsCalculator {
  private prisma: PrismaClient;
  private options: Required<StatisticsCalculatorOptions>;

  constructor(
    prisma: PrismaClient,
    options: StatisticsCalculatorOptions = {}
  ) {
    this.prisma = prisma;
    this.options = {
      maxProductStatuses: options.maxProductStatuses ?? 100,
      enableCache: options.enableCache ?? false,
      cacheExpiration: options.cacheExpiration ?? 300,
      enableParallelQueries: options.enableParallelQueries ?? true
    };
  }

  /**
   * 计算采购订单统计信息
   * 
   * @param filters 筛选条件
   * @returns 统计信息
   */
  async calculateStatistics(filters: StatisticsFilters): Promise<PurchaseOrderStatistics> {
    try {
      // 验证筛选条件
      this.validateFilters(filters);

      // 并行执行统计计算
      const calculationResult = this.options.enableParallelQueries
        ? await this.calculateStatisticsParallel(filters)
        : await this.calculateStatisticsSequential(filters);

      // 构建最终结果
      return this.buildStatisticsResult(calculationResult);
    } catch (error: unknown) {
      if (error instanceof StatisticsCalculationError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new StatisticsCalculationError(
        `统计计算失败: ${errorMessage}`,
        StatisticsErrorCode.DATA_PROCESSING_FAILED,
        { originalError: error, filters }
      );
    }
  }

  /**
   * 并行计算统计信息（推荐方式）
   */
  private async calculateStatisticsParallel(filters: StatisticsFilters): Promise<StatisticsCalculationResult> {
    try {
      // 并行执行三个主要查询
      const [basicStats, productPurchaseData, productSupplyData] = await Promise.all([
        this.calculateBasicStatistics(filters),
        this.getProductPurchaseData(filters),
        this.getProductSupplyData(filters)
      ]);

      // 处理产品采购数据
      const productPurchaseStats = this.processProductPurchaseData(productPurchaseData);
      
      // 处理产品供货数据
      const productSupplyStats = this.processProductSupplyData(productSupplyData);

      return {
        basicStats,
        productPurchaseStats,
        productSupplyStats
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new StatisticsCalculationError(
        `并行统计计算失败: ${errorMessage}`,
        StatisticsErrorCode.DATABASE_QUERY_FAILED,
        { error, filters }
      );
    }
  }

  /**
   * 顺序计算统计信息（备用方式）
   */
  private async calculateStatisticsSequential(filters: StatisticsFilters): Promise<StatisticsCalculationResult> {
    try {
      // 顺序执行查询
      const basicStats = await this.calculateBasicStatistics(filters);
      const productPurchaseData = await this.getProductPurchaseData(filters);
      const productSupplyData = await this.getProductSupplyData(filters);

      const productPurchaseStats = this.processProductPurchaseData(productPurchaseData);
      const productSupplyStats = this.processProductSupplyData(productSupplyData);

      return {
        basicStats,
        productPurchaseStats,
        productSupplyStats
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new StatisticsCalculationError(
        `顺序统计计算失败: ${errorMessage}`,
        StatisticsErrorCode.DATABASE_QUERY_FAILED,
        { error, filters }
      );
    }
  }

  /**
   * 计算基础统计信息
   * 包括总记录数、有效记录数、总金额
   */
  private async calculateBasicStatistics(filters: StatisticsFilters) {
    const whereClause = this.buildWhereClause(filters);

    try {
      // 并行执行三个基础统计查询
      const [totalRecords, activeRecords, totalAmountResult] = await Promise.all([
        // 总记录数
        this.prisma.purchaseOrder.count({
          where: whereClause
        }),
        
        // 有效记录数（非取消状态）
        this.prisma.purchaseOrder.count({
          where: {
            ...whereClause,
            status: {
              not: 'CANCELLED'
            }
          }
        }),
        
        // 总金额
        this.prisma.purchaseOrder.aggregate({
          where: whereClause,
          _sum: {
            finalAmount: true
          }
        })
      ]);

      return {
        totalRecords,
        activeRecords,
        totalAmount: totalAmountResult._sum.finalAmount || 0
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new StatisticsCalculationError(
        `基础统计计算失败: ${errorMessage}`,
        StatisticsErrorCode.DATABASE_QUERY_FAILED,
        { error, filters }
      );
    }
  }

  /**
   * 获取产品采购数据
   */
  private async getProductPurchaseData(filters: StatisticsFilters): Promise<RawProductPurchaseData[]> {
    const whereClause = this.buildWhereClause(filters);

    try {
      // 首先获取符合条件的采购订单 ID
      const purchaseOrderIds = await this.prisma.purchaseOrder.findMany({
        where: whereClause,
        select: { id: true }
      });

      const orderIds = purchaseOrderIds.map((order: { id: string }) => order.id);
      
      if (orderIds.length === 0) {
        return [];
      }

      // 获取这些订单的产品明细
      const productItems = await this.prisma.productItem.findMany({
        where: {
          relatedType: 'PurchaseOrder',
          relatedId: {
            in: orderIds
          }
        },
        select: {
          productId: true,
          quantity: true,
          product: {
            select: {
              name: true,
              sku: true
            }
          }
        },
        // 限制返回数量，防止内存溢出
        take: this.options.maxProductStatuses * 10
      });

      return productItems as RawProductPurchaseData[];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new StatisticsCalculationError(
        `产品采购数据查询失败: ${errorMessage}`,
        StatisticsErrorCode.DATABASE_QUERY_FAILED,
        { error, filters }
      );
    }
  }

  /**
   * 获取产品供货数据
   */
  private async getProductSupplyData(filters: StatisticsFilters): Promise<RawProductSupplyData[]> {
    const whereClause = this.buildWhereClause(filters);

    try {
      // 获取符合条件的采购订单 ID
      const purchaseOrderIds = await this.prisma.purchaseOrder.findMany({
        where: whereClause,
        select: { id: true }
      });

      const orderIds = purchaseOrderIds.map((order: { id: string }) => order.id);
      
      if (orderIds.length === 0) {
        return [];
      }

      // 获取这些订单的供货记录
      const supplyRecords = await this.prisma.supplyRecord.findMany({
        where: {
          purchaseOrderId: {
            in: orderIds
          },
          status: 'ACTIVE' // 只统计有效的供货记录
        },
        select: { id: true }
      });

      const supplyRecordIds = supplyRecords.map((record: { id: string }) => record.id);
      
      if (supplyRecordIds.length === 0) {
        return [];
      }

      // 获取供货记录明细
      const supplyRecordItems = await this.prisma.supplyRecordItem.findMany({
        where: {
          supplyRecordId: {
            in: supplyRecordIds
          }
        },
        select: {
          productId: true,
          quantity: true
        }
      });

      return supplyRecordItems as RawProductSupplyData[];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new StatisticsCalculationError(
        `产品供货数据查询失败: ${errorMessage}`,
        StatisticsErrorCode.DATABASE_QUERY_FAILED,
        { error, filters }
      );
    }
  }

  /**
   * 处理产品采购数据
   */
  private processProductPurchaseData(data: RawProductPurchaseData[]): Map<string, {
    productId: string;
    productName: string;
    productSku: string;
    totalQuantity: number;
  }> {
    const productMap = new Map();

    for (const item of data) {
      const existing = productMap.get(item.productId);
      if (existing) {
        existing.totalQuantity += item.quantity;
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          productName: item.product.name,
          productSku: item.product.sku,
          totalQuantity: item.quantity
        });
      }
    }

    return productMap;
  }

  /**
   * 处理产品供货数据
   */
  private processProductSupplyData(data: RawProductSupplyData[]): Map<string, number> {
    const supplyMap = new Map<string, number>();

    for (const item of data) {
      const existing = supplyMap.get(item.productId) || 0;
      supplyMap.set(item.productId, existing + item.quantity);
    }

    return supplyMap;
  }

  /**
   * 构建最终统计结果
   */
  private buildStatisticsResult(result: StatisticsCalculationResult): PurchaseOrderStatistics {
    const { basicStats, productPurchaseStats, productSupplyStats } = result;

    // 构建产品供货状态列表
    const productStatuses: ProductSupplyStatus[] = [];
    
    for (const [productId, purchaseInfo] of productPurchaseStats) {
      const suppliedQuantity = productSupplyStats.get(productId) || 0;
      const availableQuantity = Math.max(0, purchaseInfo.totalQuantity - suppliedQuantity);
      const supplyProgress = purchaseInfo.totalQuantity > 0 
        ? Math.round((suppliedQuantity / purchaseInfo.totalQuantity) * 100)
        : 0;

      productStatuses.push({
        productId,
        productName: purchaseInfo.productName,
        productSku: purchaseInfo.productSku,
        purchaseQuantity: purchaseInfo.totalQuantity,
        suppliedQuantity,
        availableQuantity,
        supplyProgress
      });
    }

    // 按采购数量降序排序，并限制返回数量
    productStatuses.sort((a, b) => b.purchaseQuantity - a.purchaseQuantity);
    const limitedProductStatuses = productStatuses.slice(0, this.options.maxProductStatuses);

    return {
      totalRecords: basicStats.totalRecords,
      activeRecords: basicStats.activeRecords,
      totalAmount: basicStats.totalAmount,
      productStatuses: limitedProductStatuses
    };
  }

  /**
   * 构建 Prisma where 查询条件
   */
  private buildWhereClause(filters: StatisticsFilters) {
    const where: any = {};

    if (filters.shopId) {
      where.shopId = filters.shopId;
    }

    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.operatorId) {
      where.operatorId = filters.operatorId;
    }

    if (filters.orderNumber) {
      where.orderNumber = {
        contains: filters.orderNumber,
        mode: 'insensitive'
      };
    }

    if (filters.createdAtStart || filters.createdAtEnd) {
      where.createdAt = {};
      if (filters.createdAtStart) {
        where.createdAt.gte = filters.createdAtStart;
      }
      if (filters.createdAtEnd) {
        where.createdAt.lte = filters.createdAtEnd;
      }
    }

    if (filters.updatedAtStart || filters.updatedAtEnd) {
      where.updatedAt = {};
      if (filters.updatedAtStart) {
        where.updatedAt.gte = filters.updatedAtStart;
      }
      if (filters.updatedAtEnd) {
        where.updatedAt.lte = filters.updatedAtEnd;
      }
    }

    return where;
  }

  /**
   * 验证筛选条件
   */
  private validateFilters(filters: StatisticsFilters): void {
    // 验证日期范围
    if (filters.createdAtStart && filters.createdAtEnd) {
      if (filters.createdAtStart > filters.createdAtEnd) {
        throw new StatisticsCalculationError(
          '创建时间开始日期不能大于结束日期',
          StatisticsErrorCode.INVALID_FILTERS,
          { filters }
        );
      }
    }

    if (filters.updatedAtStart && filters.updatedAtEnd) {
      if (filters.updatedAtStart > filters.updatedAtEnd) {
        throw new StatisticsCalculationError(
          '更新时间开始日期不能大于结束日期',
          StatisticsErrorCode.INVALID_FILTERS,
          { filters }
        );
      }
    }

    // 验证字符串长度
    if (filters.orderNumber && filters.orderNumber.length > 100) {
      throw new StatisticsCalculationError(
        '订单号搜索条件过长',
        StatisticsErrorCode.INVALID_FILTERS,
        { filters }
      );
    }
  }

  /**
   * 获取统计计算器配置
   */
  getOptions(): Required<StatisticsCalculatorOptions> {
    return { ...this.options };
  }

  /**
   * 更新统计计算器配置
   */
  updateOptions(newOptions: Partial<StatisticsCalculatorOptions>): void {
    this.options = {
      ...this.options,
      ...newOptions
    };
  }
}

/**
 * 创建统计计算器实例的工厂函数
 */
export function createPurchaseOrderStatisticsCalculator(
  prisma: PrismaClient,
  options?: StatisticsCalculatorOptions
): PurchaseOrderStatisticsCalculator {
  return new PurchaseOrderStatisticsCalculator(prisma, options);
}

/**
 * 默认统计计算器实例（单例模式）
 */
let defaultCalculator: PurchaseOrderStatisticsCalculator | null = null;

/**
 * 获取默认统计计算器实例
 */
export function getDefaultStatisticsCalculator(
  prisma: PrismaClient
): PurchaseOrderStatisticsCalculator {
  if (!defaultCalculator) {
    defaultCalculator = new PurchaseOrderStatisticsCalculator(prisma, {
      maxProductStatuses: 100,
      enableParallelQueries: true,
      enableCache: false
    });
  }
  return defaultCalculator;
}