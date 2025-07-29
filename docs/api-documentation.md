# Easy ERP 前端API接口文档

本文档整理了Easy ERP系统前端所需的所有API接口，包括接口路径、请求方法、参数说明和响应格式。

## 目录

- [认证相关接口](#认证相关接口)
- [用户管理接口](#用户管理接口)
- [基础数据管理](#基础数据管理)
  - [店铺管理](#店铺管理)
  - [供应商管理](#供应商管理)
  - [货代管理](#货代管理)
  - [产品分类管理](#产品分类管理)
- [产品管理](#产品管理)
- [库存管理](#库存管理)
- [采购管理](#采购管理)
- [包装任务管理](#包装任务管理)
- [发货记录管理](#发货记录管理)
- [财务报表管理](#财务报表管理)
- [供货管理](#供货管理)
- [系统管理](#系统管理)
- [文件上传](#文件上传)
- [日志管理](#日志管理)

---

## 认证相关接口

### 1. 获取验证码
- **接口路径**: `GET /api/v1/auth/verifycode`
- **请求参数**: 无
- **响应格式**: `ResType<{ code: string }>`

### 2. 用户登录
- **接口路径**: `POST /api/v1/auth/login`
- **请求参数**: 
  ```typescript
  {
    name: string;
    password: string;
    verifycode?: string;
  }
  ```
- **响应格式**: `ResType<LoginResponse>`

### 3. 用户登出
- **接口路径**: `POST /api/v1/auth/logout`
- **请求参数**: 无
- **响应格式**: `ResType<null>`

### 4. 刷新Token
- **接口路径**: `POST /api/v1/auth/refresh`
- **请求参数**: 
  ```typescript
  {
    refreshToken: string;
  }
  ```
- **响应格式**: `RefreshResponse`

### 5. 获取当前用户信息
- **接口路径**: `GET /api/v1/me`
- **请求参数**: 无
- **响应格式**: `ResType<UserInfo>`

---

## 用户管理接口

### 1. 获取账号列表
- **接口路径**: `GET /api/v1/accounts`
- **请求参数**: `AccountsParams`
  ```typescript
  {
    limit?: number | string;
    page?: number | string;
    status?: number | string;
    name?: string;
    withRole?: boolean;
  }
  ```
- **响应格式**: `PageResType<AccountsResponse>`

### 2. 创建账号
- **接口路径**: `POST /api/v1/accounts`
- **请求参数**: `CAccountData`
- **响应格式**: `ResType<AccountsResponse>`

### 3. 获取账号详情
- **接口路径**: `GET /api/v1/accounts/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<RAccountResponse>`

### 4. 更新账号信息
- **接口路径**: `PUT /api/v1/accounts/{id}`
- **请求参数**: `UAccountData`
- **响应格式**: `ResType<AccountsResponse>`

### 5. 删除账号
- **接口路径**: `DELETE /api/v1/accounts/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<null>`

### 6. 修改账号密码
- **接口路径**: `PUT /api/v1/accounts/{id}/password`
- **请求参数**: `UpdateAccountPasswordData`
- **响应格式**: `ResType<AccountsResponse>`

---

## 基础数据管理

### 店铺管理

#### 1. 获取店铺列表
- **接口路径**: `GET /api/v1/shops`
- **请求参数**: `ShopsParams`
- **响应格式**: `PageResType<ShopsResponse>`

#### 2. 创建店铺
- **接口路径**: `POST /api/v1/shops`
- **请求参数**: `CShopData`
- **响应格式**: `ResType<ShopsResponse>`

#### 3. 获取店铺详情
- **接口路径**: `GET /api/v1/shops/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<ShopsResponse>`

#### 4. 更新店铺信息
- **接口路径**: `PUT /api/v1/shops/{id}`
- **请求参数**: `UShopData`
- **响应格式**: `ResType<ShopsResponse>`

#### 5. 删除店铺
- **接口路径**: `DELETE /api/v1/shops/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<null>`

### 供应商管理

#### 1. 获取供应商列表
- **接口路径**: `GET /api/v1/suppliers`
- **请求参数**: `SuppliersParams`
- **响应格式**: `PageResType<SuppliersResponse>`

#### 2. 创建供应商
- **接口路径**: `POST /api/v1/suppliers`
- **请求参数**: `CSupplierData`
- **响应格式**: `ResType<SuppliersResponse>`

#### 3. 获取供应商详情
- **接口路径**: `GET /api/v1/suppliers/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<SuppliersResponse>`

#### 4. 更新供应商信息
- **接口路径**: `PUT /api/v1/suppliers/{id}`
- **请求参数**: `USupplierData`
- **响应格式**: `ResType<SuppliersResponse>`

#### 5. 删除供应商
- **接口路径**: `DELETE /api/v1/suppliers/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<null>`

### 货代管理

#### 1. 获取货代列表
- **接口路径**: `GET /api/v1/forwarding-agents`
- **请求参数**: `ForwardersParams`
- **响应格式**: `PageResType<ForwardersResponse>`

#### 2. 创建货代
- **接口路径**: `POST /api/v1/forwarding-agents`
- **请求参数**: `CForwarderData`
- **响应格式**: `ResType<ForwardersResponse>`

#### 3. 获取货代详情
- **接口路径**: `GET /api/v1/forwarding-agents/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<ForwardersResponse>`

#### 4. 更新货代信息
- **接口路径**: `PUT /api/v1/forwarding-agents/{id}`
- **请求参数**: `UForwarderData`
- **响应格式**: `ResType<ForwardersResponse>`

#### 5. 删除货代
- **接口路径**: `DELETE /api/v1/forwarding-agents/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<null>`

### 产品分类管理

#### 1. 获取产品分类列表
- **接口路径**: `GET /api/v1/product-categories`
- **请求参数**: `ProductCategoriesParams`
- **响应格式**: `PageResType<ProductCategoriesResponse>`

#### 2. 创建产品分类
- **接口路径**: `POST /api/v1/product-categories`
- **请求参数**: `CProductCategoryData`
- **响应格式**: `ResType<ProductCategoriesResponse>`

#### 3. 获取产品分类详情
- **接口路径**: `GET /api/v1/product-categories/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<ProductCategoriesResponse>`

#### 4. 更新产品分类
- **接口路径**: `PUT /api/v1/product-categories/{id}`
- **请求参数**: `UProductCategoryData`
- **响应格式**: `ResType<ProductCategoriesResponse>`

#### 5. 删除产品分类
- **接口路径**: `DELETE /api/v1/product-categories/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<null>`

---

## 产品管理

### 1. 获取产品列表
- **接口路径**: `GET /api/v1/products`
- **请求参数**: 
  ```typescript
  {
    page?: number;
    pageSize?: number;
    shopId?: string;
    categoryId?: string;
    code?: string;
    sku?: string;
    asin?: string;
  }
  ```
- **响应格式**: `PageResType<ProductInfo>`

### 2. 创建产品
- **接口路径**: `POST /api/v1/products`
- **请求参数**: `CProductData`
- **响应格式**: `ResType<ProductInfo>`

### 3. 获取产品详情
- **接口路径**: `GET /api/v1/products/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<ProductInfo>`

### 4. 更新产品信息
- **接口路径**: `PUT /api/v1/products/{id}`
- **请求参数**: `UProductData`
- **响应格式**: `ResType<ProductInfo>`

### 5. 删除产品
- **接口路径**: `DELETE /api/v1/products/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<null>`

### 6. 产品图片管理

#### 上传产品图片
- **接口路径**: `POST /api/v1/products/{id}/images`
- **请求参数**: `FormData` (包含图片文件)
- **响应格式**: `ResType<ProductImageInfo>`

#### 更新产品图片
- **接口路径**: `PUT /api/v1/products/{id}/images/{imageId}`
- **请求参数**: `UProductImageData`
- **响应格式**: `ResType<ProductImageInfo>`

#### 删除产品图片
- **接口路径**: `DELETE /api/v1/products/{id}/images/{imageId}`
- **请求参数**: 路径参数
- **响应格式**: `ResType<null>`

#### 设置产品封面图片
- **接口路径**: `PUT /api/v1/products/{id}/images/{imageId}/cover`
- **请求参数**: 路径参数
- **响应格式**: `ResType<ProductImageInfo>`

---

## 库存管理

### 成品库存管理

#### 1. 获取成品库存列表
- **接口路径**: `GET /api/v1/finished-inventory`
- **请求参数**: `FinishedInventoryQueryParams`
- **响应格式**: `ResType<FinishedInventoryListResponse>`

#### 2. 创建成品库存
- **接口路径**: `POST /api/v1/finished-inventory`
- **请求参数**: `FinishedInventoryParams`
- **响应格式**: `ResType<FinishedInventoryItem>`

#### 3. 获取成品库存详情
- **接口路径**: `GET /api/v1/finished-inventory/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<FinishedInventoryItem>`

#### 4. 更新成品库存
- **接口路径**: `PUT /api/v1/finished-inventory/{id}`
- **请求参数**: `Partial<FinishedInventoryParams>`
- **响应格式**: `ResType<FinishedInventoryItem>`

#### 5. 删除成品库存
- **接口路径**: `DELETE /api/v1/finished-inventory/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<null>`

### 散件库存管理

#### 1. 获取散件库存列表
- **接口路径**: `GET /api/v1/spare-inventory`
- **请求参数**: `SpareInventoryQueryParams`
- **响应格式**: `ResType<SpareInventoryListResponse>`

#### 2. 创建散件库存
- **接口路径**: `POST /api/v1/spare-inventory`
- **请求参数**: `SpareInventoryParams`
- **响应格式**: `ResType<SpareInventoryItem>`

#### 3. 获取散件库存详情
- **接口路径**: `GET /api/v1/spare-inventory/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<SpareInventoryItem>`

#### 4. 更新散件库存
- **接口路径**: `PUT /api/v1/spare-inventory/{id}`
- **请求参数**: `Partial<SpareInventoryParams>`
- **响应格式**: `ResType<SpareInventoryItem>`

#### 5. 删除散件库存
- **接口路径**: `DELETE /api/v1/spare-inventory/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<null>`

---

## 采购管理

### 1. 获取采购订单列表
- **接口路径**: `GET /api/v1/purchase-orders`
- **请求参数**: `PurchaseOrderQueryParams`
- **响应格式**: `ResType<{ list: PurchaseOrderInfo[]; meta: any }>`

### 2. 创建采购订单
- **接口路径**: `POST /api/v1/purchase-orders`
- **请求参数**: `CreatePurchaseOrderData`
- **响应格式**: `ResType<PurchaseOrderInfo>`

### 3. 获取采购订单详情
- **接口路径**: `GET /api/v1/purchase-orders/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<PurchaseOrderInfo>`

### 4. 更新采购订单
- **接口路径**: `PUT /api/v1/purchase-orders/{id}`
- **请求参数**: `UpdatePurchaseOrderData`
- **响应格式**: `ResType<PurchaseOrderInfo>`

### 5. 删除采购订单
- **接口路径**: `DELETE /api/v1/purchase-orders/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<null>`

### 6. 采购订单审批
- **接口路径**: `POST /api/v1/purchase-orders/{id}/approve`
- **请求参数**: 
  ```typescript
  {
    toStatus: string;
    reason: string;
    remark?: string;
  }
  ```
- **响应格式**: `ResType<any>`

### 7. 获取审批历史
- **接口路径**: `GET /api/v1/approvals/history`
- **请求参数**: 
  ```typescript
  {
    entityType: string;
    entityId: string;
  }
  ```
- **响应格式**: `ResType<any[]>`

---

## 包装任务管理

### 1. 获取包装任务列表
- **接口路径**: `GET /api/v1/packaging-tasks`
- **请求参数**: `PackagingTaskQueryParams`
- **响应格式**: 
  ```typescript
  {
    list: PackagingTaskInfo[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }
  ```

### 2. 创建包装任务
- **接口路径**: `POST /api/v1/packaging-tasks`
- **请求参数**: `CreatePackagingTaskData`
- **响应格式**: `PackagingTaskInfo`

### 3. 获取包装任务详情
- **接口路径**: `GET /api/v1/packaging-tasks/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `PackagingTaskInfo`

### 4. 更新包装任务
- **接口路径**: `PUT /api/v1/packaging-tasks/{id}`
- **请求参数**: `UpdatePackagingTaskData`
- **响应格式**: `PackagingTaskInfo`

### 5. 删除包装任务
- **接口路径**: `DELETE /api/v1/packaging-tasks/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `{ message: string }`

---

## 发货记录管理

### 发货记录主表

#### 1. 获取发货记录列表
- **接口路径**: `GET /api/v1/shipment-records`
- **请求参数**: `ShipmentRecordQueryParams`
- **响应格式**: 发货记录列表数据

#### 2. 创建发货记录
- **接口路径**: `POST /api/v1/shipment-records`
- **请求参数**: `CreateShipmentRecordData`
- **响应格式**: 创建的发货记录数据

#### 3. 获取发货记录详情
- **接口路径**: `GET /api/v1/shipment-records/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: 发货记录详情数据

#### 4. 更新发货记录
- **接口路径**: `PUT /api/v1/shipment-records/{id}`
- **请求参数**: `UpdateShipmentRecordData`
- **响应格式**: 更新后的发货记录数据

#### 5. 删除发货记录
- **接口路径**: `DELETE /api/v1/shipment-records/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: 删除结果

### 发货产品记录

#### 1. 获取发货产品记录列表
- **接口路径**: `GET /api/v1/shipment-product-records`
- **请求参数**: `ShipmentProductRecordQueryParams`
- **响应格式**: 发货产品记录列表

#### 2. 创建发货产品记录
- **接口路径**: `POST /api/v1/shipment-product-records`
- **请求参数**: 发货产品记录数据
- **响应格式**: 创建的发货产品记录

#### 3. 更新发货产品记录
- **接口路径**: `PUT /api/v1/shipment-product-records/{id}`
- **请求参数**: 更新的发货产品记录数据
- **响应格式**: 更新后的发货产品记录

#### 4. 删除发货产品记录
- **接口路径**: `DELETE /api/v1/shipment-product-records/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: 删除结果

---

## 财务报表管理

### 1. 获取财务报表列表
- **接口路径**: `GET /api/v1/financial-reports`
- **请求参数**: `FinancialReportQueryParams`
- **响应格式**: 
  ```typescript
  ResType<{
    list: FinancialReport[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>
  ```

### 2. 创建财务报表
- **接口路径**: `POST /api/v1/financial-reports`
- **请求参数**: `CreateFinancialReportData`
- **响应格式**: `ResType<FinancialReport>`

### 3. 获取财务报表详情
- **接口路径**: `GET /api/v1/financial-reports/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<FinancialReport>`

### 4. 更新财务报表
- **接口路径**: `PUT /api/v1/financial-reports/{id}`
- **请求参数**: `UpdateFinancialReportData`
- **响应格式**: `ResType<FinancialReport>`

### 5. 删除财务报表
- **接口路径**: `DELETE /api/v1/financial-reports/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<null>`

---

## 供货管理

### 分享链接管理

#### 1. 创建分享链接
- **接口路径**: `POST /api/v1/purchase-orders/{purchaseOrderId}/share`
- **请求参数**: `ShareConfig`
- **响应格式**: 分享链接信息

#### 2. 获取分享链接信息
- **接口路径**: `GET /api/v1/purchase-orders/{purchaseOrderId}/share`
- **请求参数**: 路径参数
- **响应格式**: 分享链接详情

#### 3. 更新分享链接
- **接口路径**: `PUT /api/v1/purchase-orders/{purchaseOrderId}/share`
- **请求参数**: `Partial<ShareConfig>`
- **响应格式**: 更新后的分享链接信息

#### 4. 禁用分享链接
- **接口路径**: `DELETE /api/v1/purchase-orders/{purchaseOrderId}/share`
- **请求参数**: 路径参数
- **响应格式**: 操作结果

### 供货记录管理

#### 1. 获取供货记录列表
- **接口路径**: `GET /api/v1/purchase-orders/{purchaseOrderId}/supply-records`
- **请求参数**: 路径参数
- **响应格式**: 供货记录列表和统计

#### 2. 失效供货记录
- **接口路径**: `PUT /api/v1/supply-records/{recordId}/disable`
- **请求参数**: 路径参数
- **响应格式**: 操作结果

### 分享历史和统计

#### 1. 获取分享历史
- **接口路径**: `GET /api/v1/share/history`
- **请求参数**: 
  ```typescript
  {
    purchaseOrderId?: string;
    page?: number;
    pageSize?: number;
  }
  ```
- **响应格式**: 分享历史列表

#### 2. 获取分享统计
- **接口路径**: `POST /api/v1/share/history`
- **请求参数**: `{ shareCode: string }`
- **响应格式**: 分享统计信息

### 外部供应商接口

#### 1. 验证分享链接
- **接口路径**: `POST /api/v1/share/verify`
- **请求参数**: 
  ```typescript
  {
    shareCode: string;
    extractCode?: string;
  }
  ```
- **响应格式**: 验证结果

#### 2. 获取分享的采购订单信息
- **接口路径**: `GET /api/v1/share/{shareCode}/info`
- **请求参数**: 查询参数 `extractCode?: string`
- **响应格式**: 采购订单信息

#### 3. 获取分享的可选产品列表
- **接口路径**: `GET /api/v1/share/{shareCode}/products`
- **请求参数**: 查询参数 `extractCode?: string`
- **响应格式**: 产品列表

#### 4. 提交供货清单
- **接口路径**: `POST /api/v1/share/{shareCode}/supply`
- **请求参数**: `SupplySubmitData`
- **响应格式**: 提交结果

#### 5. 获取供货统计
- **接口路径**: `POST /api/v1/purchase-orders/supply-stats`
- **请求参数**: `{ orderIds: string[] }`
- **响应格式**: 供货统计数据

---

## 产品明细管理

### 1. 获取产品明细列表
- **接口路径**: `GET /api/v1/product-items`
- **请求参数**: 
  ```typescript
  {
    relatedType: ProductItemRelatedType;
    relatedId: string;
  }
  ```
- **响应格式**: `ProductItemInfo[]`

### 2. 批量保存产品明细
- **接口路径**: `POST /api/v1/product-items`
- **请求参数**: `ProductItemsBatchParams`
- **响应格式**: `ProductItemInfo[]`

---

## 系统管理

### 角色管理

#### 1. 获取角色列表
- **接口路径**: `GET /api/v1/roles`
- **请求参数**: `RolesParams`
- **响应格式**: `PageResType<RolesResponse>`

#### 2. 创建角色
- **接口路径**: `POST /api/v1/roles`
- **请求参数**: `CRoleData`
- **响应格式**: `ResType<RolesResponse>`

#### 3. 获取角色详情
- **接口路径**: `GET /api/v1/roles/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<RolesResponse>`

#### 4. 更新角色
- **接口路径**: `PUT /api/v1/roles/{id}`
- **请求参数**: `URoleData`
- **响应格式**: `ResType<RolesResponse>`

#### 5. 删除角色
- **接口路径**: `DELETE /api/v1/roles/{id}`
- **请求参数**: 路径参数 `id: string`
- **响应格式**: `ResType<null>`

### 权限管理

#### 1. 获取权限列表
- **接口路径**: `GET /api/v1/permissions`
- **请求参数**: 无
- **响应格式**: 权限列表

---

## 文件上传

### 1. 单文件上传
- **接口路径**: `POST /api/v1/upload`
- **请求参数**: `FormData` (包含文件和可选的type参数)
- **响应格式**: `ResType<{ fileUrl: string }>`

### 2. 批量文件上传
- **接口路径**: `POST /api/v1/upload/batch`
- **请求参数**: `FormData` (包含多个文件和可选的type参数)
- **响应格式**: `ResType<Array<{ fileUrl: string; fileName: string }>>`

### 3. 图片上传
- **接口路径**: `POST /api/v1/oss/image`
- **请求参数**: `FormData` (包含图片文件)
- **响应格式**: `ResType<string[]>`

### 4. 视频上传
- **接口路径**: `POST /api/v1/oss/video`
- **请求参数**: `FormData` (包含视频文件)
- **响应格式**: `ResType<string[]>`

---

## 日志管理

### 1. 获取日志列表
- **接口路径**: `GET /api/v1/logs`
- **请求参数**: `LogsParams`
- **响应格式**: `PageResType<LogsResponse>`

### 2. 获取日志统计
- **接口路径**: `GET /api/v1/logs/stats`
- **请求参数**: 统计查询参数
- **响应格式**: 日志统计数据

---

## 通用工具接口

### 1. 检查组ID
- **接口路径**: `GET /api/v1/check/gid/{id}`
- **请求参数**: 路径参数 `id: number | string`
- **响应格式**: `ResType<{ exists: boolean }>`

### 2. 检查帖子ID
- **接口路径**: `GET /api/v1/check/pid/{id}`
- **请求参数**: 路径参数 `id: number | string`
- **响应格式**: `ResType<{ exists: boolean }>`

### 3. 检查用户ID
- **接口路径**: `GET /api/v1/check/uid/{id}`
- **请求参数**: 路径参数 `id: number | string`
- **响应格式**: `ResType<{ exists: boolean }>`

### 4. 获取操作员列表
- **接口路径**: `GET /api/v1/operators`
- **请求参数**: 
  ```typescript
  {
    model: string;
    page?: number;
    limit?: number;
  }
  ```
- **响应格式**: `ResType<string[]>`

---

## 导出管理

### 1. 获取导出记录列表
- **接口路径**: `GET /api/v1/export/records`
- **请求参数**: `ExportParams`
- **响应格式**: `PageResType<ExportResponse>`

---

## 数据类型说明

### 通用响应类型

```typescript
// 基础响应类型
interface ResType<T> {
  code: number;
  msg: string;
  data: T;
}

// 分页响应类型
interface PageResType<T> {
  code: number;
  msg: string;
  data: {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
```

### 状态枚举

```typescript
// 采购订单状态
enum PurchaseOrderStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PRODUCTION = 'PRODUCTION',
  SHIPPED = 'SHIPPED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

// 发货记录状态
enum ShipmentRecordStatus {
  PENDING = 'PENDING',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
  WAITING_RECEIVE = 'WAITING_RECEIVE',
  RECEIVING = 'RECEIVING',
  COMPLETED = 'COMPLETED',
}

// 包装任务状态
enum PackagingTaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// 包装任务类型
enum PackagingTaskType {
  PACKAGING = 'PACKAGING',
}

// 产品明细关联类型
enum ProductItemRelatedType {
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  PACKAGING_TASK = 'PACKAGING_TASK',
}
```

---

## 注意事项

1. **认证**: 除了登录、注册等公开接口外，所有接口都需要在请求头中携带 `Authorization: Bearer {token}`

2. **错误处理**: 所有接口都遵循统一的错误响应格式，包含 `code`、`msg` 和 `data` 字段

3. **分页**: 分页接口通常支持 `page` 和 `pageSize` 参数，默认值分别为 1 和 10

4. **文件上传**: 文件上传接口使用 `multipart/form-data` 格式，需要设置正确的 `Content-Type`

5. **日期格式**: 所有日期字段都使用 ISO 8601 格式 (YYYY-MM-DDTHH:mm:ss.sssZ)

6. **状态管理**: 各种状态字段都有对应的枚举值，前端应使用这些枚举值进行状态判断和显示

7. **权限控制**: 部分接口可能需要特定的权限才能访问，前端应根据用户权限控制界面显示

8. **Token刷新**: 系统支持自动token刷新机制，前端应实现相应的拦截器处理token过期情况

---

*本文档最后更新时间: 2024年12月*