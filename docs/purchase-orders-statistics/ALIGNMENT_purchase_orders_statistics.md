# 采购订单列表接口 Statistics 字段需求对齐文档

## 项目上下文分析

### 现有项目结构
- **技术栈**: Next.js 14 + React 18 + TypeScript + Prisma + Supabase
- **架构模式**: App Router + API Routes + RESTful API
- **数据库**: PostgreSQL (Supabase)
- **ORM**: Prisma

### 现有代码模式
- API 路由统一使用 `/api/v1/**` 格式
- 统一错误处理和响应格式
- 使用 Zod 进行参数验证
- 采用事务处理关键业务操作

## 原始需求

用户请求在 `http://localhost:3000/api/v1/purchase-orders` 接口的 GET 方法中增加 `statistics` 字段，包含以下统计信息：
- `activeRecords`: 有效记录数
- `productStatuses`: 产品状态统计
- `totalAmount`: 总金额
- `totalRecords`: 总记录数

## 参考接口分析

### 参考接口: `/api/v1/purchase-orders/[id]/supply-records`

**文件位置**: `/src/app/api/v1/purchase-orders/[id]/supply-records/route.ts`

**Statistics 字段结构**:
```typescript
interface SupplyStatistics {
  totalRecords: number;        // 总供货记录数
  activeRecords: number;       // 有效供货记录数
  totalAmount: number;         // 供货总金额
  productStatuses: Array<{     // 产品供货状态
    productId: string;
    purchaseQuantity: number;
    suppliedQuantity: number;
    availableQuantity: number;
    supplyProgress: number;    // 供货进度百分比
  }>;
}
```

**数据来源**:
- 通过 `SupplyQuantityValidator.getSupplyStatistics(purchaseOrderId)` 获取
- 统计来源于 `supplyRecord` 和 `supplyRecordItem` 表
- 产品信息来源于 `productItem` 表（关联采购订单）

## 需求理解确认

### 目标接口: `/api/v1/purchase-orders` (GET)

**当前返回结构**:
```typescript
{
  code: 0,
  msg: string,
  data: {
    orders: PurchaseOrder[],  // 采购订单列表
    total: number,            // 总数量（分页用）
    page: number,             // 当前页
    pageSize: number          // 页大小
  }
}
```

**期望增加的 Statistics 字段**:
```typescript
{
  code: 0,
  msg: string,
  data: {
    orders: PurchaseOrder[],
    total: number,
    page: number,
    pageSize: number,
    statistics: {              // 新增统计字段
      totalRecords: number,    // 总采购订单数（不受分页影响）
      activeRecords: number,   // 有效采购订单数
      totalAmount: number,     // 采购订单总金额
      productStatuses: Array<{ // 所有采购订单的产品统计
        productId: string,
        purchaseQuantity: number,
        suppliedQuantity: number,
        availableQuantity: number,
        supplyProgress: number
      }>
    }
  }
}
```

## 边界确认

### 统计范围
1. **totalRecords**: 当前筛选条件下的所有采购订单数量（不受分页限制）
2. **activeRecords**: 状态为有效的采购订单数量（排除已取消、已删除等）
3. **totalAmount**: 当前筛选条件下所有采购订单的总金额
4. **productStatuses**: 当前筛选条件下所有采购订单涉及的产品统计

### 筛选条件影响
统计数据需要受到以下筛选条件影响：
- 店铺筛选 (`shopId`)
- 供应商筛选 (`supplierId`)
- 状态筛选 (`status`)
- 紧急程度筛选 (`urgent`)
- 操作员筛选 (`operatorId`)
- 日期范围筛选 (`startDate`, `endDate`)
- 产品ID筛选 (`productId`)

### 性能考虑
- 统计查询可能涉及大量数据，需要优化查询性能
- 考虑是否需要缓存机制
- 避免N+1查询问题

## 数据来源分析

### 主要数据表
1. **purchaseOrder**: 采购订单主表
2. **productItem**: 产品明细表（关联采购订单）
3. **supplyRecord**: 供货记录表
4. **supplyRecordItem**: 供货记录明细表

### 统计计算逻辑
1. **totalRecords**: `COUNT(purchaseOrder)` 基于筛选条件
2. **activeRecords**: `COUNT(purchaseOrder WHERE status IN active_statuses)`
3. **totalAmount**: `SUM(purchaseOrder.finalAmount)` 基于筛选条件
4. **productStatuses**: 需要聚合计算每个产品的采购数量和供货数量

## 疑问澄清

### 已明确的问题
1. ✅ Statistics 字段结构参考 supply-records 接口
2. ✅ 统计范围受当前筛选条件影响
3. ✅ 数据来源和计算逻辑已分析清楚

### 需要确认的问题
1. **activeRecords 的定义**: 哪些状态算作"有效记录"？
   - 建议: 排除 'CANCELLED', 'DELETED' 状态
2. **productStatuses 的聚合范围**: 是否只统计当前页的订单，还是所有筛选结果？
   - 建议: 统计所有筛选结果，不受分页限制
3. **性能优化策略**: 是否需要实现缓存或分页统计？
   - 建议: 先实现基础功能，后续根据性能表现优化

## 验收标准

### 功能验收
1. ✅ GET `/api/v1/purchase-orders` 接口返回包含 statistics 字段
2. ✅ statistics 字段包含所有必需的子字段
3. ✅ 统计数据准确反映当前筛选条件的结果
4. ✅ 不影响现有的分页和筛选功能

### 性能验收
1. ✅ 接口响应时间不超过现有接口的 2 倍
2. ✅ 数据库查询优化，避免N+1问题
3. ✅ 大数据量下的稳定性测试

### 兼容性验收
1. ✅ 不破坏现有前端代码
2. ✅ 向后兼容，statistics 字段为可选
3. ✅ TypeScript 类型定义完整

## 技术约束

1. **数据库查询**: 使用 Prisma ORM，保持现有查询模式
2. **错误处理**: 统计查询失败不应影响主要数据返回
3. **类型安全**: 完整的 TypeScript 类型定义
4. **代码规范**: 遵循项目现有的代码风格和规范

## 集成方案

1. **复用现有逻辑**: 参考 `SupplyQuantityValidator.getSupplyStatistics` 方法
2. **统一响应格式**: 保持与现有 API 响应格式一致
3. **错误处理**: 使用项目统一的错误处理机制
4. **日志记录**: 添加适当的操作日志

## 风险评估

### 高风险
- 大数据量查询可能导致性能问题
- 复杂的聚合查询可能影响数据库性能

### 中风险
- 筛选条件复杂，统计逻辑容易出错
- 多表关联查询的数据一致性

### 低风险
- 现有接口结构变更
- TypeScript 类型定义

## 下一步行动

1. 进入 Architect 阶段，设计具体的数据结构和查询逻辑
2. 确定性能优化策略
3. 制定详细的实现计划