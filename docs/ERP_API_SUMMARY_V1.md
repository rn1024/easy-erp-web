# ERP系统 API 接口汇总表格 v1

## 认证模块

| 接口功能     | 方法 | 路径                  | 参数                                   | 响应                                                      |
| ------------ | ---- | --------------------- | -------------------------------------- | --------------------------------------------------------- |
| 获取验证码   | GET  | `/v1/auth/verifycode` | 无                                     | `{ key, captcha }`                                        |
| 用户登录     | POST | `/v1/auth/login`      | `{ username, password, captcha, key }` | `{ accessToken, refreshToken, user, roles, permissions }` |
| 刷新Token    | POST | `/v1/auth/refresh`    | `{ refreshToken }`                     | `{ accessToken, refreshToken }`                           |
| 获取当前用户 | GET  | `/v1/me`              | 无                                     | `User & { roles, permissions }`                           |

## 账户管理模块

| 接口功能     | 方法   | 路径                         | 关键参数                                   | 响应类型                        |
| ------------ | ------ | ---------------------------- | ------------------------------------------ | ------------------------------- |
| 账户列表     | GET    | `/v1/accounts`               | `page, limit, status, name, withRole`      | `PageResType<AccountsResponse>` |
| 创建账户     | POST   | `/v1/accounts`               | `name, email, password, operator, roleIds` | `ResType<AccountsResponse>`     |
| 获取账户详情 | GET    | `/v1/accounts/{id}`          | `id`                                       | `ResType<AccountResponse>`      |
| 更新账户     | PUT    | `/v1/accounts/{id}`          | `name, email, status, roleIds`             | `ResType<AccountsResponse>`     |
| 删除账户     | DELETE | `/v1/accounts/{id}`          | `id`                                       | `ResType`                       |
| 修改密码     | PUT    | `/v1/accounts/{id}/password` | `old_password, new_password`               | `ResType<AccountsResponse>`     |

## 角色权限模块

| 接口功能       | 方法   | 路径              | 关键参数                                      | 响应类型                      |
| -------------- | ------ | ----------------- | --------------------------------------------- | ----------------------------- |
| 角色列表       | GET    | `/v1/roles`       | `page, limit, status, name`                   | `PageResType<RoleDataResult>` |
| 创建角色       | POST   | `/v1/roles`       | `name, code, status, operator, permissionIds` | `ResType<RoleDataResult>`     |
| 更新角色       | PUT    | `/v1/roles/{id}`  | `name, code, status, permissions`             | `ResType<RoleDataResult>`     |
| 删除角色       | DELETE | `/v1/roles/{id}`  | `id`                                          | `ResType<RoleDataResult>`     |
| 根据ID查询角色 | GET    | `/v1/roles/{id}`  | `id`                                          | `ResType<RoleDataResult>`     |
| 权限列表       | GET    | `/v1/permissions` | 无                                            | `ResType<PermissionList>`     |

## 产品管理模块

| 接口功能     | 方法   | 路径                | 关键参数                                           | 响应类型                       |
| ------------ | ------ | ------------------- | -------------------------------------------------- | ------------------------------ |
| 产品列表     | GET    | `/v1/products`      | `page, pageSize, shopId, categoryId, code, sku`    | `PageResType<ProductResponse>` |
| 创建产品     | POST   | `/v1/products`      | `code, sku, name, price, cost, shopId, categoryId` | `ResType<ProductResponse>`     |
| 获取产品详情 | GET    | `/v1/products/{id}` | `id`                                               | `ResType<ProductResponse>`     |
| 更新产品     | PUT    | `/v1/products/{id}` | `name, price, cost, description`                   | `ResType<ProductResponse>`     |
| 删除产品     | DELETE | `/v1/products/{id}` | `id`                                               | `ResType`                      |

## 采购管理模块

| 接口功能         | 方法   | 路径                       | 关键参数                                             | 响应类型                             |
| ---------------- | ------ | -------------------------- | ---------------------------------------------------- | ------------------------------------ |
| 采购订单列表     | GET    | `/v1/purchase-orders`      | `page, pageSize, shopId, supplierId, status, urgent` | `PageResType<PurchaseOrderResponse>` |
| 创建采购订单     | POST   | `/v1/purchase-orders`      | `shopId, supplierId, urgent, items`                  | `ResType<PurchaseOrderResponse>`     |
| 获取采购订单详情 | GET    | `/v1/purchase-orders/{id}` | `id`                                                 | `ResType<PurchaseOrderResponse>`     |
| 更新采购订单     | PUT    | `/v1/purchase-orders/{id}` | `status, urgent, note, items`                        | `ResType<PurchaseOrderResponse>`     |
| 删除采购订单     | DELETE | `/v1/purchase-orders/{id}` | `id`                                                 | `ResType`                            |

## 库存管理模块

| 接口功能     | 方法 | 路径                          | 关键参数                                      | 响应类型                         |
| ------------ | ---- | ----------------------------- | --------------------------------------------- | -------------------------------- |
| 成品库存列表 | GET  | `/v1/finished-inventory`      | `page, pageSize, shopId, productId, lowStock` | `PageResType<InventoryResponse>` |
| 更新成品库存 | PUT  | `/v1/finished-inventory/{id}` | `quantity, minThreshold, maxThreshold`        | `ResType<InventoryResponse>`     |
| 备件库存列表 | GET  | `/v1/spare-inventory`         | `page, pageSize, shopId, productId`           | `PageResType<InventoryResponse>` |
| 更新备件库存 | PUT  | `/v1/spare-inventory/{id}`    | `quantity, minThreshold, maxThreshold`        | `ResType<InventoryResponse>`     |

## 仓库管理模块

| 接口功能     | 方法   | 路径                       | 关键参数                                   | 响应类型                             |
| ------------ | ------ | -------------------------- | ------------------------------------------ | ------------------------------------ |
| 仓库任务列表 | GET    | `/v1/warehouse-tasks`      | `page, pageSize, type, status, assigneeId` | `PageResType<WarehouseTaskResponse>` |
| 创建仓库任务 | POST   | `/v1/warehouse-tasks`      | `type, priority, description, assigneeId`  | `ResType<WarehouseTaskResponse>`     |
| 更新仓库任务 | PUT    | `/v1/warehouse-tasks/{id}` | `status, priority, assigneeId`             | `ResType<WarehouseTaskResponse>`     |
| 删除仓库任务 | DELETE | `/v1/warehouse-tasks/{id}` | `id`                                       | `ResType`                            |

## 配送管理模块

| 接口功能     | 方法 | 路径                        | 关键参数                                       | 响应类型                        |
| ------------ | ---- | --------------------------- | ---------------------------------------------- | ------------------------------- |
| 配送记录列表 | GET  | `/v1/delivery-records`      | `page, pageSize, status, startDate, endDate`   | `PageResType<DeliveryResponse>` |
| 创建配送记录 | POST | `/v1/delivery-records`      | `trackingNumber, origin, destination, carrier` | `ResType<DeliveryResponse>`     |
| 更新配送状态 | PUT  | `/v1/delivery-records/{id}` | `status, actualDelivery`                       | `ResType<DeliveryResponse>`     |
| 配送记录详情 | GET  | `/v1/delivery-records/{id}` | `id`                                           | `ResType<DeliveryResponse>`     |

## 财务管理模块

| 接口功能     | 方法 | 路径                         | 关键参数                                           | 响应类型                               |
| ------------ | ---- | ---------------------------- | -------------------------------------------------- | -------------------------------------- |
| 财务报表列表 | GET  | `/v1/financial-reports`      | `page, pageSize, type, period, startDate, endDate` | `PageResType<FinancialReportResponse>` |
| 生成财务报表 | POST | `/v1/financial-reports`      | `type, period, startDate, endDate`                 | `ResType<FinancialReportResponse>`     |
| 财务报表详情 | GET  | `/v1/financial-reports/{id}` | `id`                                               | `ResType<FinancialReportResponse>`     |

## 系统管理模块

| 接口功能     | 方法 | 路径       | 关键参数                                                                    | 响应类型                    |
| ------------ | ---- | ---------- | --------------------------------------------------------------------------- | --------------------------- |
| 系统日志查询 | GET  | `/v1/logs` | `page, pageSize, category, module, operations, operator_account_id, status` | `PageResType<LogsResponse>` |

## 文件管理模块

| 接口功能 | 方法 | 路径         | 参数                           | 响应类型                  |
| -------- | ---- | ------------ | ------------------------------ | ------------------------- |
| 文件上传 | POST | `/v1/upload` | `FormData: file, type, folder` | `ResType<UploadResponse>` |

## 其他模块

| 接口功能     | 方法 | 路径                     | 关键参数 | 响应类型                |
| ------------ | ---- | ------------------------ | -------- | ----------------------- |
| 店铺列表     | GET  | `/v1/shops`              | 无       | `ResType<ShopList>`     |
| 供应商列表   | GET  | `/v1/suppliers`          | 无       | `ResType<SupplierList>` |
| 产品分类列表 | GET  | `/v1/product-categories` | 无       | `ResType<CategoryList>` |
| 转运代理列表 | GET  | `/v1/forwarding-agents`  | 无       | `ResType<AgentList>`    |

---

## 接口调用规范

### 认证头部

```
Authorization: Bearer <access_token>
```

### 通用查询参数

- `page`: 页码 (默认: 1)
- `pageSize` / `limit`: 每页数量 (默认: 10/20)
- `startDate`: 开始日期 (格式: YYYY-MM-DD)
- `endDate`: 结束日期 (格式: YYYY-MM-DD)

### 响应状态码

- `200`: 请求成功
- `400`: 请求参数错误
- `401`: 未授权访问
- `403`: 权限不足
- `500`: 服务器错误

### 通用响应格式

```json
{
  "code": 0, // 0: 成功, 1+: 错误
  "msg": "操作成功", // 响应消息
  "data": {} // 响应数据
}
```

---

**文档版本**: v1.0.0  
**更新时间**: 2024年12月25日  
**适用系统**: ERP管理系统
