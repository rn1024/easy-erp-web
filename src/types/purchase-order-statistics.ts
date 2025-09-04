/**
 * 采购订单统计相关的 TypeScript 类型定义
 * 
 * 用于采购订单列表接口的 statistics 字段
 * 参考 supply-records 接口的 SupplyStatistics 结构
 */

/**
 * 产品供货状态信息
 * 描述单个产品在采购订单中的供货进度
 */
export interface ProductSupplyStatus {
  /** 产品 ID */
  productId: string;
  
  /** 产品名称 */
  productName: string;
  
  /** 产品 SKU */
  productSku: string;
  
  /** 采购数量 - 在采购订单中的总采购数量 */
  purchaseQuantity: number;
  
  /** 已供货数量 - 已经供货的数量 */
  suppliedQuantity: number;
  
  /** 可用数量 - 还可以供货的数量 (purchaseQuantity - suppliedQuantity) */
  availableQuantity: number;
  
  /** 供货进度 - 供货完成百分比 (suppliedQuantity / purchaseQuantity * 100) */
  supplyProgress: number;
}

/**
 * 采购订单统计信息
 * 包含采购订单列表的整体统计数据
 */
export interface PurchaseOrderStatistics {
  /** 总记录数 - 符合筛选条件的采购订单总数 */
  totalRecords: number;
  
  /** 有效记录数 - 状态不为 CANCELLED 的采购订单数量 */
  activeRecords: number;
  
  /** 总金额 - 所有符合筛选条件的采购订单的 finalAmount 总和 */
  totalAmount: number;
  
  /** 产品供货状态列表 - 各产品的供货进度统计 */
  productStatuses: ProductSupplyStatus[];
}

/**
 * 采购订单列表 API 响应数据结构
 * 扩展原有响应，增加 statistics 字段
 */
export interface PurchaseOrderListResponse {
  /** 是否成功 */
  success: boolean;
  
  /** 采购订单列表数据 */
  data: {
    /** 采购订单列表 */
    orders: any[]; // 保持原有类型，避免影响现有代码
    
    /** 分页信息 */
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    
    /** 统计信息 - 新增字段 */
    statistics: PurchaseOrderStatistics;
  };
  
  /** 响应消息 */
  message?: string;
}

/**
 * 统计计算的筛选条件
 * 与采购订单列表接口的筛选条件保持一致
 */
export interface StatisticsFilters {
  /** 店铺 ID */
  shopId?: string;
  
  /** 供应商 ID */
  supplierId?: string;
  
  /** 订单状态 */
  status?: string;
  
  /** 操作员 ID */
  operatorId?: string;
  
  /** 订单号（模糊搜索） */
  orderNumber?: string;
  
  /** 创建时间范围 - 开始时间 */
  createdAtStart?: Date;
  
  /** 创建时间范围 - 结束时间 */
  createdAtEnd?: Date;
  
  /** 更新时间范围 - 开始时间 */
  updatedAtStart?: Date;
  
  /** 更新时间范围 - 结束时间 */
  updatedAtEnd?: Date;
}

/**
 * 统计计算结果的内部数据结构
 * 用于统计计算器内部处理
 */
export interface StatisticsCalculationResult {
  /** 基础统计信息 */
  basicStats: {
    totalRecords: number;
    activeRecords: number;
    totalAmount: number;
  };
  
  /** 产品采购统计 */
  productPurchaseStats: Map<string, {
    productId: string;
    productName: string;
    productSku: string;
    totalQuantity: number;
  }>;
  
  /** 产品供货统计 */
  productSupplyStats: Map<string, number>;
}

/**
 * 数据库查询的原始结果类型
 */
export interface RawProductPurchaseData {
  productId: string;
  quantity: number;
  product: {
    name: string;
    sku: string;
  };
}

export interface RawProductSupplyData {
  productId: string;
  quantity: number;
}

/**
 * 统计计算器的配置选项
 */
export interface StatisticsCalculatorOptions {
  /** 最大返回的产品状态数量，防止响应过大 */
  maxProductStatuses?: number;
  
  /** 是否启用查询缓存 */
  enableCache?: boolean;
  
  /** 缓存过期时间（秒） */
  cacheExpiration?: number;
  
  /** 是否启用并行查询优化 */
  enableParallelQueries?: boolean;
}

/**
 * 错误类型定义
 */
export class StatisticsCalculationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'StatisticsCalculationError';
  }
}

/**
 * 统计计算错误码
 */
export enum StatisticsErrorCode {
  /** 数据库查询失败 */
  DATABASE_QUERY_FAILED = 'DATABASE_QUERY_FAILED',
  
  /** 数据处理失败 */
  DATA_PROCESSING_FAILED = 'DATA_PROCESSING_FAILED',
  
  /** 筛选条件无效 */
  INVALID_FILTERS = 'INVALID_FILTERS',
  
  /** 计算超时 */
  CALCULATION_TIMEOUT = 'CALCULATION_TIMEOUT',
  
  /** 内存不足 */
  INSUFFICIENT_MEMORY = 'INSUFFICIENT_MEMORY'
}