# ACTION - 供货记录API集成优化实施方案

## 实施概览

本文档记录了供货记录API集成优化的具体实施步骤和代码变更，遵循6A工作流的ACTION阶段要求。

## 核心实施内容

### 1. 创建异步供货记录组件

**文件**: `src/app/purchase/purchase-orders/components/supply-records-cell.tsx`

#### 1.1 核心组件架构

```typescript
// 主要组件和Hook
- SupplyRecordsCell: 供货记录单元格组件
- useSupplyRecords: 异步数据获取Hook
- SupplyRecordsCache: 缓存管理类
- RequestDeduplicator: 请求去重管理类
```

#### 1.2 关键特性实现

**异步数据加载**
```typescript
const useSupplyRecords = (purchaseOrderId: string): UseSupplyRecordsResult => {
  // 状态管理
  const [data, setData] = useState<SupplyRecordsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // 缓存优先策略
  // 请求去重机制
  // 错误处理
}
```

**缓存机制**
```typescript
class SupplyRecordsCache {
  private cache = new Map<string, CacheItem<SupplyRecordsResponse>>();
  private readonly TTL = 5 * 60 * 1000; // 5分钟缓存
  
  // 缓存设置、获取、过期检查
}
```

**请求去重**
```typescript
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();
  
  // 防止重复请求同一资源
}
```

### 2. 集成到采购订单页面

**文件**: `src/app/purchase/purchase-orders/page.tsx`

#### 2.1 导入新组件

```typescript
import SupplyRecordsCell, { preloadSupplyRecords } from './components/supply-records-cell';
import React, { useState, useEffect } from 'react';
```

#### 2.2 替换供货记录列渲染

**原实现**:
```typescript
{
  title: '供货记录',
  dataIndex: 'supplyRecords',
  key: 'supplyRecords',
  width: 120,
  render: (_, record) => (
    <Button
      type="link"
      size="small"
      onClick={() => handleSupplyRecords(record)}
    >
      {record.items?.length ?? 0} 条记录
    </Button>
  ),
}
```

**新实现**:
```typescript
{
  title: '供货记录',
  dataIndex: 'supplyRecords',
  key: 'supplyRecords',
  width: 120,
  render: (_, record) => (
    <SupplyRecordsCell
      purchaseOrderId={record.id}
      fallbackCount={record.items?.length ?? 0}
      onClick={(records, statistics) => {
        handleSupplyRecords(record);
      }}
    />
  ),
}
```

#### 2.3 添加数据预加载

```typescript
// 预加载供货记录数据
useEffect(() => {
  if (purchaseOrdersResponse?.data?.list) {
    // 为当前页面的采购订单预加载供货记录
    const orderIds = purchaseOrdersResponse.data.list.map((order: PurchaseOrderInfo) => order.id);
    preloadSupplyRecords(orderIds);
  }
}, [purchaseOrdersResponse?.data?.list]);
```

### 3. API集成优化

#### 3.1 API响应处理

```typescript
// 处理API响应结构
const response = await getSupplyRecordsApi(purchaseOrderId);
const apiResponse = response.data as ApiResponse<SupplyRecordsResponse>;

if (apiResponse.code === 0) {
  const supplyData = apiResponse.data;
  supplyRecordsCache.set(purchaseOrderId, supplyData);
  setData(supplyData);
} else {
  throw new Error(apiResponse.msg || '获取供货记录失败');
}
```

#### 3.2 类型安全保障

```typescript
interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

interface SupplyRecordsResponse {
  statistics: SupplyStatistics;
  records: SupplyRecord[];
  orderInfo: {
    id: string;
    orderNumber: string;
    totalAmount: string;
    status: string;
  };
}
```

## 性能优化策略

### 1. 缓存策略
- **TTL**: 5分钟缓存时间
- **内存缓存**: 使用Map存储，避免重复请求
- **缓存失效**: 自动过期清理

### 2. 请求优化
- **请求去重**: 防止同时发起多个相同请求
- **预加载**: 页面数据加载完成后预加载供货记录
- **懒加载**: 仅在需要时加载数据

### 3. 用户体验优化
- **加载状态**: 显示加载指示器
- **错误处理**: 友好的错误提示和重试机制
- **回退机制**: 使用fallbackCount作为备选显示

## 错误处理机制

### 1. 网络错误
```typescript
if (error) {
  return (
    <Tooltip title={`加载失败: ${error.message}`}>
      <Button type="link" size="small" danger onClick={() => window.location.reload()}>
        <span style={{ color: '#ff4d4f' }}>加载失败</span>
      </Button>
    </Tooltip>
  );
}
```

### 2. API错误
```typescript
if (apiResponse.code !== 0) {
  throw new Error(apiResponse.msg || '获取供货记录失败');
}
```

### 3. 类型错误处理
- 使用TypeScript严格类型检查
- API响应类型断言
- 运行时数据验证

## 代码质量保障

### 1. TypeScript集成
- 完整的类型定义
- 严格的类型检查
- 接口约束

### 2. React最佳实践
- Hook使用规范
- 组件职责分离
- 状态管理优化

### 3. 性能监控
- 缓存命中率跟踪
- 请求响应时间监控
- 错误率统计

## 部署和配置

### 1. 环境配置
- 开发环境: 启用详细日志
- 生产环境: 优化缓存策略

### 2. 特性开关
- 可通过配置启用/禁用异步加载
- 缓存策略可配置

## 测试策略

### 1. 单元测试
- Hook功能测试
- 缓存机制测试
- 错误处理测试

### 2. 集成测试
- API集成测试
- 组件交互测试
- 性能基准测试

### 3. 用户体验测试
- 加载性能测试
- 错误场景测试
- 缓存效果验证

## 监控和维护

### 1. 性能指标
- 首次加载时间
- 缓存命中率
- 错误率统计

### 2. 日志记录
- API调用日志
- 缓存操作日志
- 错误详情记录

### 3. 持续优化
- 定期性能评估
- 用户反馈收集
- 功能迭代计划

---

**实施完成时间**: 2025-01-27
**负责人**: AI Assistant
**状态**: 已完成核心功能实现，待测试验证