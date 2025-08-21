/**
 * 审批系统业务枚举定义
 */

// 业务类型枚举
export enum EntityType {
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  SALES_ORDER = 'SALES_ORDER',
  INVENTORY_TRANSFER = 'INVENTORY_TRANSFER',
  EXPENSE_REPORT = 'EXPENSE_REPORT',
}

// 采购订单状态枚举 - 与 Prisma schema 保持一致
export enum PurchaseOrderStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED', // 已审批已通过
  CONFIRMED = 'CONFIRMED',
  PRODUCTION = 'PRODUCTION',
  SHIPPED = 'SHIPPED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

// 销售订单状态枚举（示例，用于扩展）
export enum SalesOrderStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// 库存调拨状态枚举（示例，用于扩展）
export enum InventoryTransferStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// 费用报销状态枚举（示例，用于扩展）
export enum ExpenseReportStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

// 状态标签映射
export const StatusLabels = {
  [EntityType.PURCHASE_ORDER]: {
    [PurchaseOrderStatus.CREATED]: '已创建',
    [PurchaseOrderStatus.PENDING]: '待审批',
    [PurchaseOrderStatus.APPROVED]: '已审批已通过',
    [PurchaseOrderStatus.CONFIRMED]: '已确认',
    [PurchaseOrderStatus.PRODUCTION]: '生产中',
    [PurchaseOrderStatus.SHIPPED]: '已发货',
    [PurchaseOrderStatus.RECEIVED]: '已收货',
    [PurchaseOrderStatus.CANCELLED]: '已取消',
  },
  [EntityType.SALES_ORDER]: {
    [SalesOrderStatus.CREATED]: '已创建',
    [SalesOrderStatus.PENDING]: '待审批',
    [SalesOrderStatus.APPROVED]: '已审批',
    [SalesOrderStatus.REJECTED]: '已拒绝',
    [SalesOrderStatus.CONFIRMED]: '已确认',
    [SalesOrderStatus.SHIPPED]: '已发货',
    [SalesOrderStatus.DELIVERED]: '已送达',
    [SalesOrderStatus.COMPLETED]: '已完成',
    [SalesOrderStatus.CANCELLED]: '已取消',
  },
  [EntityType.INVENTORY_TRANSFER]: {
    [InventoryTransferStatus.CREATED]: '已创建',
    [InventoryTransferStatus.PENDING]: '待审批',
    [InventoryTransferStatus.APPROVED]: '已审批',
    [InventoryTransferStatus.REJECTED]: '已拒绝',
    [InventoryTransferStatus.IN_TRANSIT]: '调拨中',
    [InventoryTransferStatus.COMPLETED]: '已完成',
    [InventoryTransferStatus.CANCELLED]: '已取消',
  },
  [EntityType.EXPENSE_REPORT]: {
    [ExpenseReportStatus.DRAFT]: '草稿',
    [ExpenseReportStatus.SUBMITTED]: '已提交',
    [ExpenseReportStatus.PENDING]: '待审批',
    [ExpenseReportStatus.APPROVED]: '已审批',
    [ExpenseReportStatus.REJECTED]: '已拒绝',
    [ExpenseReportStatus.PAID]: '已支付',
    [ExpenseReportStatus.CANCELLED]: '已取消',
  },
};

// 状态颜色映射
export const StatusColors = {
  [EntityType.PURCHASE_ORDER]: {
    [PurchaseOrderStatus.CREATED]: 'default',
    [PurchaseOrderStatus.PENDING]: 'processing',
    [PurchaseOrderStatus.APPROVED]: 'success',
    [PurchaseOrderStatus.CONFIRMED]: 'success',
    [PurchaseOrderStatus.PRODUCTION]: 'blue',
    [PurchaseOrderStatus.SHIPPED]: 'cyan',
    [PurchaseOrderStatus.RECEIVED]: 'green',
    [PurchaseOrderStatus.CANCELLED]: 'default',
  },
  [EntityType.SALES_ORDER]: {
    [SalesOrderStatus.CREATED]: 'default',
    [SalesOrderStatus.PENDING]: 'processing',
    [SalesOrderStatus.APPROVED]: 'success',
    [SalesOrderStatus.REJECTED]: 'error',
    [SalesOrderStatus.CONFIRMED]: 'cyan',
    [SalesOrderStatus.SHIPPED]: 'blue',
    [SalesOrderStatus.DELIVERED]: 'green',
    [SalesOrderStatus.COMPLETED]: 'success',
    [SalesOrderStatus.CANCELLED]: 'default',
  },
  [EntityType.INVENTORY_TRANSFER]: {
    [InventoryTransferStatus.CREATED]: 'default',
    [InventoryTransferStatus.PENDING]: 'processing',
    [InventoryTransferStatus.APPROVED]: 'success',
    [InventoryTransferStatus.REJECTED]: 'error',
    [InventoryTransferStatus.IN_TRANSIT]: 'blue',
    [InventoryTransferStatus.COMPLETED]: 'success',
    [InventoryTransferStatus.CANCELLED]: 'default',
  },
  [EntityType.EXPENSE_REPORT]: {
    [ExpenseReportStatus.DRAFT]: 'default',
    [ExpenseReportStatus.SUBMITTED]: 'processing',
    [ExpenseReportStatus.PENDING]: 'warning',
    [ExpenseReportStatus.APPROVED]: 'success',
    [ExpenseReportStatus.REJECTED]: 'error',
    [ExpenseReportStatus.PAID]: 'success',
    [ExpenseReportStatus.CANCELLED]: 'default',
  },
};

// 状态转换规则
export const StatusTransitions = {
  [EntityType.PURCHASE_ORDER]: {
    [PurchaseOrderStatus.CREATED]: [
      { value: PurchaseOrderStatus.PENDING, label: '提交审批', type: 'approve' as const },
      { value: PurchaseOrderStatus.CANCELLED, label: '取消订单', type: 'reject' as const },
    ],
    [PurchaseOrderStatus.PENDING]: [
      { value: PurchaseOrderStatus.APPROVED, label: '审批通过', type: 'approve' as const },
      { value: PurchaseOrderStatus.CANCELLED, label: '取消订单', type: 'reject' as const },
    ],
    [PurchaseOrderStatus.APPROVED]: [
      { value: PurchaseOrderStatus.CONFIRMED, label: '确认订单', type: 'approve' as const },
      { value: PurchaseOrderStatus.CANCELLED, label: '取消订单', type: 'reject' as const },
    ],
    [PurchaseOrderStatus.CONFIRMED]: [
      { value: PurchaseOrderStatus.PRODUCTION, label: '开始生产', type: 'approve' as const },
      { value: PurchaseOrderStatus.CANCELLED, label: '取消订单', type: 'reject' as const },
    ],
    [PurchaseOrderStatus.PRODUCTION]: [
      { value: PurchaseOrderStatus.SHIPPED, label: '发货', type: 'approve' as const },
      { value: PurchaseOrderStatus.CANCELLED, label: '取消订单', type: 'reject' as const },
    ],
    [PurchaseOrderStatus.SHIPPED]: [
      { value: PurchaseOrderStatus.RECEIVED, label: '确认收货', type: 'approve' as const },
    ],
    [PurchaseOrderStatus.RECEIVED]: [],
    [PurchaseOrderStatus.CANCELLED]: [],
  },
  [EntityType.SALES_ORDER]: {
    [SalesOrderStatus.CREATED]: [
      { value: SalesOrderStatus.PENDING, label: '提交审批', type: 'approve' as const },
      { value: SalesOrderStatus.CANCELLED, label: '取消订单', type: 'reject' as const },
    ],
    [SalesOrderStatus.PENDING]: [
      { value: SalesOrderStatus.APPROVED, label: '审批通过', type: 'approve' as const },
      { value: SalesOrderStatus.REJECTED, label: '审批拒绝', type: 'reject' as const },
    ],
    [SalesOrderStatus.APPROVED]: [
      { value: SalesOrderStatus.CONFIRMED, label: '确认订单', type: 'approve' as const },
      { value: SalesOrderStatus.CANCELLED, label: '取消订单', type: 'reject' as const },
    ],
    [SalesOrderStatus.REJECTED]: [
      { value: SalesOrderStatus.PENDING, label: '重新提交', type: 'approve' as const },
      { value: SalesOrderStatus.CANCELLED, label: '取消订单', type: 'reject' as const },
    ],
    [SalesOrderStatus.CONFIRMED]: [
      { value: SalesOrderStatus.SHIPPED, label: '发货', type: 'approve' as const },
      { value: SalesOrderStatus.CANCELLED, label: '取消订单', type: 'reject' as const },
    ],
    [SalesOrderStatus.SHIPPED]: [
      { value: SalesOrderStatus.DELIVERED, label: '确认送达', type: 'approve' as const },
    ],
    [SalesOrderStatus.DELIVERED]: [
      { value: SalesOrderStatus.COMPLETED, label: '完成订单', type: 'approve' as const },
    ],
    [SalesOrderStatus.COMPLETED]: [],
    [SalesOrderStatus.CANCELLED]: [],
  },
  [EntityType.INVENTORY_TRANSFER]: {
    [InventoryTransferStatus.CREATED]: [
      { value: InventoryTransferStatus.PENDING, label: '提交审批', type: 'approve' as const },
      { value: InventoryTransferStatus.CANCELLED, label: '取消调拨', type: 'reject' as const },
    ],
    [InventoryTransferStatus.PENDING]: [
      { value: InventoryTransferStatus.APPROVED, label: '审批通过', type: 'approve' as const },
      { value: InventoryTransferStatus.REJECTED, label: '审批拒绝', type: 'reject' as const },
    ],
    [InventoryTransferStatus.APPROVED]: [
      { value: InventoryTransferStatus.IN_TRANSIT, label: '开始调拨', type: 'approve' as const },
      { value: InventoryTransferStatus.CANCELLED, label: '取消调拨', type: 'reject' as const },
    ],
    [InventoryTransferStatus.REJECTED]: [
      { value: InventoryTransferStatus.PENDING, label: '重新提交', type: 'approve' as const },
      { value: InventoryTransferStatus.CANCELLED, label: '取消调拨', type: 'reject' as const },
    ],
    [InventoryTransferStatus.IN_TRANSIT]: [
      { value: InventoryTransferStatus.COMPLETED, label: '完成调拨', type: 'approve' as const },
    ],
    [InventoryTransferStatus.COMPLETED]: [],
    [InventoryTransferStatus.CANCELLED]: [],
  },
  [EntityType.EXPENSE_REPORT]: {
    [ExpenseReportStatus.DRAFT]: [
      { value: ExpenseReportStatus.SUBMITTED, label: '提交报销', type: 'approve' as const },
      { value: ExpenseReportStatus.CANCELLED, label: '取消报销', type: 'reject' as const },
    ],
    [ExpenseReportStatus.SUBMITTED]: [
      { value: ExpenseReportStatus.PENDING, label: '提交审批', type: 'approve' as const },
      { value: ExpenseReportStatus.CANCELLED, label: '取消报销', type: 'reject' as const },
    ],
    [ExpenseReportStatus.PENDING]: [
      { value: ExpenseReportStatus.APPROVED, label: '审批通过', type: 'approve' as const },
      { value: ExpenseReportStatus.REJECTED, label: '审批拒绝', type: 'reject' as const },
    ],
    [ExpenseReportStatus.APPROVED]: [
      { value: ExpenseReportStatus.PAID, label: '确认支付', type: 'approve' as const },
    ],
    [ExpenseReportStatus.REJECTED]: [
      { value: ExpenseReportStatus.PENDING, label: '重新提交', type: 'approve' as const },
      { value: ExpenseReportStatus.CANCELLED, label: '取消报销', type: 'reject' as const },
    ],
    [ExpenseReportStatus.PAID]: [],
    [ExpenseReportStatus.CANCELLED]: [],
  },
};

// 权限映射
export const EntityPermissions = {
  [EntityType.PURCHASE_ORDER]: {
    read: 'purchase.read',
    write: 'purchase.write',
    approve: 'purchase.approve',
    delete: 'purchase.delete',
  },
  [EntityType.SALES_ORDER]: {
    read: 'sales.read',
    write: 'sales.write',
    approve: 'sales.approve',
    delete: 'sales.delete',
  },
  [EntityType.INVENTORY_TRANSFER]: {
    read: 'inventory.read',
    write: 'inventory.write',
    approve: 'inventory.approve',
    delete: 'inventory.delete',
  },
  [EntityType.EXPENSE_REPORT]: {
    read: 'expense.read',
    write: 'expense.write',
    approve: 'expense.approve',
    delete: 'expense.delete',
  },
};

// 工具函数
export const getStatusLabel = (entityType: EntityType, status: string): string => {
  const labels = StatusLabels[entityType];
  return labels ? (labels as any)[status] || status : status;
};

export const getStatusColor = (entityType: EntityType, status: string): string => {
  const colors = StatusColors[entityType];
  return colors ? (colors as any)[status] || 'default' : 'default';
};

export const getAvailableTransitions = (entityType: EntityType, currentStatus: string) => {
  const transitions = StatusTransitions[entityType];
  return transitions ? (transitions as any)[currentStatus] || [] : [];
};

export const getEntityPermissions = (entityType: EntityType) => {
  return EntityPermissions[entityType];
};

// 业务类型标签
export const EntityTypeLabels = {
  [EntityType.PURCHASE_ORDER]: '采购订单',
  [EntityType.SALES_ORDER]: '销售订单',
  [EntityType.INVENTORY_TRANSFER]: '库存调拨',
  [EntityType.EXPENSE_REPORT]: '费用报销',
};

export const getEntityTypeLabel = (entityType: EntityType): string => {
  return EntityTypeLabels[entityType] || entityType;
};
