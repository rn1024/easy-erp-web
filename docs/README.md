# Easy ERP 前端API文档

本目录包含Easy ERP系统前端开发所需的所有API接口文档。

## 文档结构

### 📋 [api-documentation.md](./api-documentation.md)
**完整API接口文档**
- 包含所有API接口的详细说明
- 接口路径、请求方法、参数说明和响应格式
- 数据类型定义和状态枚举
- 开发注意事项和最佳实践

**适用场景**: 详细了解接口规范、参数格式、响应结构

### 🗺️ [frontend-api-mapping.md](./frontend-api-mapping.md)
**前端页面API接口映射**
- 按前端页面结构组织的API接口
- 每个页面所需的具体接口列表
- 接口调用注意事项和开发建议
- 前端开发最佳实践

**适用场景**: 前端页面开发时快速定位所需接口

### ⚡ [api-quick-reference.md](./api-quick-reference.md)
**API快速参考手册**
- 所有接口的简洁列表
- 按模块分类的接口表格
- 常用查询参数说明
- HTTP状态码和响应格式

**适用场景**: 开发过程中快速查找接口路径和方法

## 使用指南

### 🚀 快速开始
1. **新手开发者**: 先阅读 `api-documentation.md` 了解整体架构
2. **页面开发**: 参考 `frontend-api-mapping.md` 找到页面所需接口
3. **日常开发**: 使用 `api-quick-reference.md` 快速查找接口

### 📖 阅读建议

#### 对于前端开发者
- **开始新页面开发**: `frontend-api-mapping.md` → 找到对应页面的接口列表
- **实现具体功能**: `api-documentation.md` → 查看接口详细参数和响应
- **调试接口问题**: `api-quick-reference.md` → 确认接口路径和状态码

#### 对于后端开发者
- **接口设计参考**: `api-documentation.md` → 了解前端需求和数据结构
- **接口测试**: `api-quick-reference.md` → 快速查看所有接口列表

#### 对于项目经理/产品经理
- **功能梳理**: `frontend-api-mapping.md` → 了解各页面功能和接口依赖
- **接口规划**: `api-documentation.md` → 了解系统整体接口架构

## 接口分类概览

### 🔐 认证与权限
- 用户登录/登出
- Token管理
- 用户信息获取
- 角色权限管理

### 📊 基础数据管理
- 店铺管理
- 供应商管理
- 货代管理
- 产品分类管理

### 📦 产品与库存
- 产品信息管理
- 产品图片管理
- 产品明细管理
- 成品库存管理
- 散件库存管理

### 🛒 采购与供货
- 采购订单管理
- 审批流程
- 供货分享管理
- 供货记录管理

### 📋 仓库与发货
- 包装任务管理
- 发货记录管理
- 发货产品记录

### 💰 财务管理
- 财务报表管理
- 数据统计

### 🔧 系统管理
- 用户账号管理
- 角色权限管理
- 系统日志
- 文件上传

## 开发规范

### 🏗️ 接口调用规范

#### 认证机制
```javascript
// 所有接口（除登录外）都需要携带Token
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

#### 错误处理
```javascript
// 统一错误处理
if (response.data.code !== 0) {
  // 处理业务错误
  console.error(response.data.msg);
  return;
}
// 处理成功响应
const data = response.data.data;
```

#### 分页请求
```javascript
// 标准分页参数
const params = {
  page: 1,        // 页码，从1开始
  pageSize: 10,   // 每页数量
  // 其他查询条件...
};
```

### 📝 TypeScript类型定义

建议为所有接口定义TypeScript类型：

```typescript
// 请求参数类型
interface CreateProductParams {
  name: string;
  code: string;
  categoryId: string;
  // ...
}

// 响应数据类型
interface ProductInfo {
  id: string;
  name: string;
  code: string;
  // ...
}

// API响应类型
interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}
```

### 🔄 状态管理

使用枚举定义状态值：

```typescript
enum PurchaseOrderStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  // ...
}
```

## 常见问题

### ❓ Q: Token过期怎么处理？
A: 系统会自动刷新Token，前端需要在Axios拦截器中处理401状态码，自动调用刷新接口或跳转登录页。

### ❓ Q: 如何处理文件上传？
A: 使用FormData格式，设置正确的Content-Type，参考文件上传接口文档。

### ❓ Q: 分页接口的参数格式？
A: 使用`page`（页码，从1开始）和`pageSize`（每页数量）参数。

### ❓ Q: 如何获取下拉选项数据？
A: 调用对应模块的列表接口，如店铺选项调用`GET /api/v1/shops`。

### ❓ Q: 接口返回的状态码含义？
A: 参考`api-quick-reference.md`中的HTTP状态码说明。

## 更新日志

### 2024年12月
- 初始版本发布
- 包含所有核心业务模块的API接口
- 提供完整的前端开发指南

## 贡献指南

如果发现文档中的错误或需要补充内容，请：

1. 检查接口实际行为是否与文档一致
2. 更新对应的文档文件
3. 确保所有相关文档保持同步
4. 更新本README的更新日志

## 联系方式

如有疑问，请联系：
- 前端团队负责人
- 后端团队负责人
- 项目经理

---

*文档维护: Easy ERP 开发团队*  
*最后更新: 2024年12月*