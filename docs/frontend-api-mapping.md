# Easy ERP 前端页面API接口映射

本文档按照前端页面结构整理了各个页面所需的API接口，便于前端开发人员快速定位所需接口。

## 页面结构与API映射

### 1. 登录页面 (`/login`)

**页面功能**: 用户登录、验证码获取

**所需接口**:
- `GET /api/v1/auth/verifycode` - 获取验证码
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/refresh` - 刷新Token

---

### 2. 仪表板页面 (`/dashboard`)

**页面功能**: 系统概览、统计数据展示

**所需接口**:
- `GET /api/v1/me` - 获取当前用户信息
- `GET /api/v1/purchase-orders` - 获取采购订单统计
- `GET /api/v1/packaging-tasks` - 获取包装任务统计
- `GET /api/v1/shipment-records` - 获取发货记录统计
- `GET /api/v1/financial-reports` - 获取财务数据
- `GET /api/v1/logs/stats` - 获取日志统计

---

### 3. 基础数据管理 (`/basic-data`)

#### 3.1 店铺管理 (`/basic-data/shops`)

**页面功能**: 店铺信息的增删改查

**所需接口**:
- `GET /api/v1/shops` - 获取店铺列表
- `POST /api/v1/shops` - 创建店铺
- `GET /api/v1/shops/{id}` - 获取店铺详情
- `PUT /api/v1/shops/{id}` - 更新店铺信息
- `DELETE /api/v1/shops/{id}` - 删除店铺

#### 3.2 供应商管理 (`/basic-data/suppliers`)

**页面功能**: 供应商信息的增删改查

**所需接口**:
- `GET /api/v1/suppliers` - 获取供应商列表
- `POST /api/v1/suppliers` - 创建供应商
- `GET /api/v1/suppliers/{id}` - 获取供应商详情
- `PUT /api/v1/suppliers/{id}` - 更新供应商信息
- `DELETE /api/v1/suppliers/{id}` - 删除供应商

#### 3.3 货代管理 (`/basic-data/forwarders`)

**页面功能**: 货代信息的增删改查

**所需接口**:
- `GET /api/v1/forwarding-agents` - 获取货代列表
- `POST /api/v1/forwarding-agents` - 创建货代
- `GET /api/v1/forwarding-agents/{id}` - 获取货代详情
- `PUT /api/v1/forwarding-agents/{id}` - 更新货代信息
- `DELETE /api/v1/forwarding-agents/{id}` - 删除货代

---

### 4. 产品管理 (`/products`)

**页面功能**: 产品信息管理、产品分类管理、产品图片管理

**所需接口**:

#### 产品信息管理
- `GET /api/v1/products` - 获取产品列表
- `POST /api/v1/products` - 创建产品
- `GET /api/v1/products/{id}` - 获取产品详情
- `PUT /api/v1/products/{id}` - 更新产品信息
- `DELETE /api/v1/products/{id}` - 删除产品

#### 产品分类管理
- `GET /api/v1/product-categories` - 获取产品分类列表
- `POST /api/v1/product-categories` - 创建产品分类
- `GET /api/v1/product-categories/{id}` - 获取产品分类详情
- `PUT /api/v1/product-categories/{id}` - 更新产品分类
- `DELETE /api/v1/product-categories/{id}` - 删除产品分类

#### 产品图片管理
- `POST /api/v1/products/{id}/images` - 上传产品图片
- `PUT /api/v1/products/{id}/images/{imageId}` - 更新产品图片
- `DELETE /api/v1/products/{id}/images/{imageId}` - 删除产品图片
- `PUT /api/v1/products/{id}/images/{imageId}/cover` - 设置产品封面图片

#### 产品明细管理
- `GET /api/v1/product-items` - 获取产品明细列表
- `POST /api/v1/product-items` - 批量保存产品明细

---

### 5. 库存管理 (`/inventory`)

**页面功能**: 成品库存和散件库存管理

**所需接口**:

#### 成品库存管理
- `GET /api/v1/finished-inventory` - 获取成品库存列表
- `POST /api/v1/finished-inventory` - 创建成品库存
- `GET /api/v1/finished-inventory/{id}` - 获取成品库存详情
- `PUT /api/v1/finished-inventory/{id}` - 更新成品库存
- `DELETE /api/v1/finished-inventory/{id}` - 删除成品库存

#### 散件库存管理
- `GET /api/v1/spare-inventory` - 获取散件库存列表
- `POST /api/v1/spare-inventory` - 创建散件库存
- `GET /api/v1/spare-inventory/{id}` - 获取散件库存详情
- `PUT /api/v1/spare-inventory/{id}` - 更新散件库存
- `DELETE /api/v1/spare-inventory/{id}` - 删除散件库存

---

### 6. 采购管理 (`/purchase`)

**页面功能**: 采购订单管理、审批流程

**所需接口**:

#### 采购订单管理
- `GET /api/v1/purchase-orders` - 获取采购订单列表
- `POST /api/v1/purchase-orders` - 创建采购订单
- `GET /api/v1/purchase-orders/{id}` - 获取采购订单详情
- `PUT /api/v1/purchase-orders/{id}` - 更新采购订单
- `DELETE /api/v1/purchase-orders/{id}` - 删除采购订单

#### 审批流程
- `POST /api/v1/purchase-orders/{id}/approve` - 采购订单审批
- `GET /api/v1/approvals/history` - 获取审批历史

#### 产品明细
- `GET /api/v1/product-items?relatedType=PURCHASE_ORDER&relatedId={id}` - 获取采购订单产品明细
- `POST /api/v1/product-items` - 批量保存采购订单产品明细

---

### 7. 仓库管理 (`/warehouse`)

**页面功能**: 包装任务管理

**所需接口**:

#### 包装任务管理
- `GET /api/v1/packaging-tasks` - 获取包装任务列表
- `POST /api/v1/packaging-tasks` - 创建包装任务
- `GET /api/v1/packaging-tasks/{id}` - 获取包装任务详情
- `PUT /api/v1/packaging-tasks/{id}` - 更新包装任务
- `DELETE /api/v1/packaging-tasks/{id}` - 删除包装任务

#### 包装任务产品明细
- `GET /api/v1/product-items?relatedType=PACKAGING_TASK&relatedId={id}` - 获取包装任务产品明细
- `POST /api/v1/product-items` - 批量保存包装任务产品明细

---

### 8. 发货管理 (`/delivery`)

**页面功能**: 发货记录管理、发货产品记录管理

**所需接口**:

#### 发货记录管理
- `GET /api/v1/shipment-records` - 获取发货记录列表
- `POST /api/v1/shipment-records` - 创建发货记录
- `GET /api/v1/shipment-records/{id}` - 获取发货记录详情
- `PUT /api/v1/shipment-records/{id}` - 更新发货记录
- `DELETE /api/v1/shipment-records/{id}` - 删除发货记录

#### 发货产品记录管理
- `GET /api/v1/shipment-product-records` - 获取发货产品记录列表
- `POST /api/v1/shipment-product-records` - 创建发货产品记录
- `PUT /api/v1/shipment-product-records/{id}` - 更新发货产品记录
- `DELETE /api/v1/shipment-product-records/{id}` - 删除发货产品记录

---

### 9. 财务管理 (`/finance`)

**页面功能**: 财务报表管理、数据统计

**所需接口**:
- `GET /api/v1/financial-reports` - 获取财务报表列表
- `POST /api/v1/financial-reports` - 创建财务报表
- `GET /api/v1/financial-reports/{id}` - 获取财务报表详情
- `PUT /api/v1/financial-reports/{id}` - 更新财务报表
- `DELETE /api/v1/financial-reports/{id}` - 删除财务报表

---

### 10. 供货管理 (`/supply`)

**页面功能**: 分享链接管理、供货记录管理、外部供应商接口

**所需接口**:

#### 分享链接管理
- `POST /api/v1/purchase-orders/{purchaseOrderId}/share` - 创建分享链接
- `GET /api/v1/purchase-orders/{purchaseOrderId}/share` - 获取分享链接信息
- `PUT /api/v1/purchase-orders/{purchaseOrderId}/share` - 更新分享链接
- `DELETE /api/v1/purchase-orders/{purchaseOrderId}/share` - 禁用分享链接

#### 供货记录管理
- `GET /api/v1/purchase-orders/{purchaseOrderId}/supply-records` - 获取供货记录列表
- `PUT /api/v1/supply-records/{recordId}/disable` - 失效供货记录

#### 分享历史和统计
- `GET /api/v1/share/history` - 获取分享历史
- `POST /api/v1/share/history` - 获取分享统计
- `POST /api/v1/purchase-orders/supply-stats` - 获取供货统计

#### 外部供应商接口（用于分享页面）
- `POST /api/v1/share/verify` - 验证分享链接
- `GET /api/v1/share/{shareCode}/info` - 获取分享的采购订单信息
- `GET /api/v1/share/{shareCode}/products` - 获取分享的可选产品列表
- `POST /api/v1/share/{shareCode}/supply` - 提交供货清单

---

### 11. 系统管理 (`/system`)

**页面功能**: 用户管理、角色管理、权限管理

**所需接口**:

#### 用户管理
- `GET /api/v1/accounts` - 获取账号列表
- `POST /api/v1/accounts` - 创建账号
- `GET /api/v1/accounts/{id}` - 获取账号详情
- `PUT /api/v1/accounts/{id}` - 更新账号信息
- `DELETE /api/v1/accounts/{id}` - 删除账号
- `PUT /api/v1/accounts/{id}/password` - 修改账号密码

#### 角色管理
- `GET /api/v1/roles` - 获取角色列表
- `POST /api/v1/roles` - 创建角色
- `GET /api/v1/roles/{id}` - 获取角色详情
- `PUT /api/v1/roles/{id}` - 更新角色
- `DELETE /api/v1/roles/{id}` - 删除角色

#### 权限管理
- `GET /api/v1/permissions` - 获取权限列表

#### 日志管理
- `GET /api/v1/logs` - 获取日志列表
- `GET /api/v1/logs/stats` - 获取日志统计

---

### 12. 文件管理 (`/files`)

**页面功能**: 文件上传、文件管理

**所需接口**:
- `POST /api/v1/upload` - 单文件上传
- `POST /api/v1/upload/batch` - 批量文件上传
- `POST /api/v1/oss/image` - 图片上传
- `POST /api/v1/oss/video` - 视频上传
- `GET /api/v1/export/records` - 获取导出记录列表

---

## 通用接口（所有页面可能用到）

### 认证相关
- `GET /api/v1/me` - 获取当前用户信息
- `POST /api/v1/auth/logout` - 用户登出
- `POST /api/v1/auth/refresh` - 刷新Token

### 数据验证
- `GET /api/v1/check/gid/{id}` - 检查组ID
- `GET /api/v1/check/pid/{id}` - 检查帖子ID
- `GET /api/v1/check/uid/{id}` - 检查用户ID
- `GET /api/v1/operators` - 获取操作员列表

### 下拉选项数据
- `GET /api/v1/shops` - 获取店铺选项
- `GET /api/v1/suppliers` - 获取供应商选项
- `GET /api/v1/forwarding-agents` - 获取货代选项
- `GET /api/v1/product-categories` - 获取产品分类选项
- `GET /api/v1/roles` - 获取角色选项

---

## 接口调用注意事项

### 1. 认证机制
- 除登录接口外，所有接口都需要携带 `Authorization: Bearer {token}` 请求头
- Token过期时会返回401状态码，前端需要自动刷新Token或跳转到登录页

### 2. 错误处理
- 所有接口都遵循统一的响应格式：`{ code: number, msg: string, data: any }`
- `code` 为 0 表示成功，非 0 表示失败
- 前端应统一处理错误响应，显示相应的错误信息

### 3. 分页参数
- 列表接口通常支持 `page`（页码，从1开始）和 `pageSize`（每页数量）参数
- 默认值通常为 `page=1, pageSize=10`

### 4. 查询参数
- 列表接口支持各种查询条件，如状态筛选、关键词搜索等
- 查询参数通常为可选，不传则返回所有数据

### 5. 文件上传
- 文件上传接口使用 `multipart/form-data` 格式
- 需要设置正确的 `Content-Type` 请求头
- 支持单文件和批量文件上传

### 6. 状态管理
- 各种业务对象都有状态字段，前端应使用对应的枚举值
- 状态变更可能有业务规则限制，需要根据后端返回的错误信息处理

### 7. 关联数据
- 某些接口支持 `with` 参数来包含关联数据，减少接口调用次数
- 例如：`GET /api/v1/accounts?withRole=true` 会在返回的账号数据中包含角色信息

### 8. 批量操作
- 部分接口支持批量操作，如批量删除、批量更新等
- 批量操作通常通过请求体传递ID数组

---

## 前端开发建议

### 1. 接口封装
建议在 `src/services` 目录下按业务模块封装接口，每个模块对应一个服务文件。

### 2. 类型定义
建议为所有接口的请求参数和响应数据定义TypeScript类型，提高代码质量。

### 3. 错误处理
建议在Axios拦截器中统一处理错误响应，包括Token过期、权限不足等情况。

### 4. 加载状态
建议为所有异步操作添加加载状态，提升用户体验。

### 5. 缓存策略
对于不经常变化的数据（如下拉选项），建议实现适当的缓存策略。

### 6. 权限控制
建议根据用户权限动态显示/隐藏功能按钮和菜单项。

---

*本文档最后更新时间: 2024年12月*