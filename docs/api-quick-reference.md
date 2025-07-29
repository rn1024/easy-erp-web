# Easy ERP API 快速参考

本文档提供所有API接口的快速参考，按模块分类，便于开发时快速查找。

## 认证模块 (Auth)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/auth/verifycode` | 获取验证码 |
| POST | `/api/v1/auth/login` | 用户登录 |
| POST | `/api/v1/auth/logout` | 用户登出 |
| POST | `/api/v1/auth/refresh` | 刷新Token |
| GET | `/api/v1/me` | 获取当前用户信息 |

## 用户管理 (Accounts)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/accounts` | 获取账号列表 |
| POST | `/api/v1/accounts` | 创建账号 |
| GET | `/api/v1/accounts/{id}` | 获取账号详情 |
| PUT | `/api/v1/accounts/{id}` | 更新账号信息 |
| DELETE | `/api/v1/accounts/{id}` | 删除账号 |
| PUT | `/api/v1/accounts/{id}/password` | 修改账号密码 |

## 角色管理 (Roles)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/roles` | 获取角色列表 |
| POST | `/api/v1/roles` | 创建角色 |
| GET | `/api/v1/roles/{id}` | 获取角色详情 |
| PUT | `/api/v1/roles/{id}` | 更新角色 |
| DELETE | `/api/v1/roles/{id}` | 删除角色 |

## 权限管理 (Permissions)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/permissions` | 获取权限列表 |

## 店铺管理 (Shops)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/shops` | 获取店铺列表 |
| POST | `/api/v1/shops` | 创建店铺 |
| GET | `/api/v1/shops/{id}` | 获取店铺详情 |
| PUT | `/api/v1/shops/{id}` | 更新店铺信息 |
| DELETE | `/api/v1/shops/{id}` | 删除店铺 |

## 供应商管理 (Suppliers)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/suppliers` | 获取供应商列表 |
| POST | `/api/v1/suppliers` | 创建供应商 |
| GET | `/api/v1/suppliers/{id}` | 获取供应商详情 |
| PUT | `/api/v1/suppliers/{id}` | 更新供应商信息 |
| DELETE | `/api/v1/suppliers/{id}` | 删除供应商 |

## 货代管理 (Forwarding Agents)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/forwarding-agents` | 获取货代列表 |
| POST | `/api/v1/forwarding-agents` | 创建货代 |
| GET | `/api/v1/forwarding-agents/{id}` | 获取货代详情 |
| PUT | `/api/v1/forwarding-agents/{id}` | 更新货代信息 |
| DELETE | `/api/v1/forwarding-agents/{id}` | 删除货代 |

## 产品分类管理 (Product Categories)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/product-categories` | 获取产品分类列表 |
| POST | `/api/v1/product-categories` | 创建产品分类 |
| GET | `/api/v1/product-categories/{id}` | 获取产品分类详情 |
| PUT | `/api/v1/product-categories/{id}` | 更新产品分类 |
| DELETE | `/api/v1/product-categories/{id}` | 删除产品分类 |

## 产品管理 (Products)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/products` | 获取产品列表 |
| POST | `/api/v1/products` | 创建产品 |
| GET | `/api/v1/products/{id}` | 获取产品详情 |
| PUT | `/api/v1/products/{id}` | 更新产品信息 |
| DELETE | `/api/v1/products/{id}` | 删除产品 |

## 产品图片管理 (Product Images)

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/products/{id}/images` | 上传产品图片 |
| PUT | `/api/v1/products/{id}/images/{imageId}` | 更新产品图片 |
| DELETE | `/api/v1/products/{id}/images/{imageId}` | 删除产品图片 |
| PUT | `/api/v1/products/{id}/images/{imageId}/cover` | 设置产品封面图片 |

## 产品明细管理 (Product Items)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/product-items` | 获取产品明细列表 |
| POST | `/api/v1/product-items` | 批量保存产品明细 |

## 成品库存管理 (Finished Inventory)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/finished-inventory` | 获取成品库存列表 |
| POST | `/api/v1/finished-inventory` | 创建成品库存 |
| GET | `/api/v1/finished-inventory/{id}` | 获取成品库存详情 |
| PUT | `/api/v1/finished-inventory/{id}` | 更新成品库存 |
| DELETE | `/api/v1/finished-inventory/{id}` | 删除成品库存 |

## 散件库存管理 (Spare Inventory)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/spare-inventory` | 获取散件库存列表 |
| POST | `/api/v1/spare-inventory` | 创建散件库存 |
| GET | `/api/v1/spare-inventory/{id}` | 获取散件库存详情 |
| PUT | `/api/v1/spare-inventory/{id}` | 更新散件库存 |
| DELETE | `/api/v1/spare-inventory/{id}` | 删除散件库存 |

## 采购订单管理 (Purchase Orders)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/purchase-orders` | 获取采购订单列表 |
| POST | `/api/v1/purchase-orders` | 创建采购订单 |
| GET | `/api/v1/purchase-orders/{id}` | 获取采购订单详情 |
| PUT | `/api/v1/purchase-orders/{id}` | 更新采购订单 |
| DELETE | `/api/v1/purchase-orders/{id}` | 删除采购订单 |
| POST | `/api/v1/purchase-orders/{id}/approve` | 采购订单审批 |

## 审批管理 (Approvals)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/approvals/history` | 获取审批历史 |

## 包装任务管理 (Packaging Tasks)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/packaging-tasks` | 获取包装任务列表 |
| POST | `/api/v1/packaging-tasks` | 创建包装任务 |
| GET | `/api/v1/packaging-tasks/{id}` | 获取包装任务详情 |
| PUT | `/api/v1/packaging-tasks/{id}` | 更新包装任务 |
| DELETE | `/api/v1/packaging-tasks/{id}` | 删除包装任务 |

## 发货记录管理 (Shipment Records)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/shipment-records` | 获取发货记录列表 |
| POST | `/api/v1/shipment-records` | 创建发货记录 |
| GET | `/api/v1/shipment-records/{id}` | 获取发货记录详情 |
| PUT | `/api/v1/shipment-records/{id}` | 更新发货记录 |
| DELETE | `/api/v1/shipment-records/{id}` | 删除发货记录 |

## 发货产品记录管理 (Shipment Product Records)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/shipment-product-records` | 获取发货产品记录列表 |
| POST | `/api/v1/shipment-product-records` | 创建发货产品记录 |
| PUT | `/api/v1/shipment-product-records/{id}` | 更新发货产品记录 |
| DELETE | `/api/v1/shipment-product-records/{id}` | 删除发货产品记录 |

## 财务报表管理 (Financial Reports)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/financial-reports` | 获取财务报表列表 |
| POST | `/api/v1/financial-reports` | 创建财务报表 |
| GET | `/api/v1/financial-reports/{id}` | 获取财务报表详情 |
| PUT | `/api/v1/financial-reports/{id}` | 更新财务报表 |
| DELETE | `/api/v1/financial-reports/{id}` | 删除财务报表 |

## 供货分享管理 (Supply Share)

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/purchase-orders/{purchaseOrderId}/share` | 创建分享链接 |
| GET | `/api/v1/purchase-orders/{purchaseOrderId}/share` | 获取分享链接信息 |
| PUT | `/api/v1/purchase-orders/{purchaseOrderId}/share` | 更新分享链接 |
| DELETE | `/api/v1/purchase-orders/{purchaseOrderId}/share` | 禁用分享链接 |

## 供货记录管理 (Supply Records)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/purchase-orders/{purchaseOrderId}/supply-records` | 获取供货记录列表 |
| PUT | `/api/v1/supply-records/{recordId}/disable` | 失效供货记录 |

## 分享历史和统计 (Share History & Stats)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/share/history` | 获取分享历史 |
| POST | `/api/v1/share/history` | 获取分享统计 |
| POST | `/api/v1/purchase-orders/supply-stats` | 获取供货统计 |

## 外部供应商接口 (External Supplier APIs)

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/share/verify` | 验证分享链接 |
| GET | `/api/v1/share/{shareCode}/info` | 获取分享的采购订单信息 |
| GET | `/api/v1/share/{shareCode}/products` | 获取分享的可选产品列表 |
| POST | `/api/v1/share/{shareCode}/supply` | 提交供货清单 |

## 文件上传 (Upload)

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/upload` | 单文件上传 |
| POST | `/api/v1/upload/batch` | 批量文件上传 |
| POST | `/api/v1/oss/image` | 图片上传 |
| POST | `/api/v1/oss/video` | 视频上传 |

## 导出管理 (Export)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/export/records` | 获取导出记录列表 |

## 日志管理 (Logs)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/logs` | 获取日志列表 |
| GET | `/api/v1/logs/stats` | 获取日志统计 |

## 通用工具接口 (Common Utils)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/check/gid/{id}` | 检查组ID |
| GET | `/api/v1/check/pid/{id}` | 检查帖子ID |
| GET | `/api/v1/check/uid/{id}` | 检查用户ID |
| GET | `/api/v1/operators` | 获取操作员列表 |

---

## 常用查询参数

### 分页参数
- `page`: 页码（从1开始）
- `pageSize` 或 `limit`: 每页数量

### 通用查询参数
- `status`: 状态筛选
- `name`: 名称搜索
- `code`: 编码搜索
- `startDate`: 开始日期
- `endDate`: 结束日期
- `shopId`: 店铺ID
- `supplierId`: 供应商ID
- `categoryId`: 分类ID

### 关联数据参数
- `withRole`: 包含角色信息
- `withDetails`: 包含详细信息
- `withStats`: 包含统计信息

---

## HTTP状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（Token无效或过期） |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 422 | 数据验证失败 |
| 500 | 服务器内部错误 |

---

## 响应格式

### 成功响应
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    // 响应数据
  }
}
```

### 分页响应
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

### 错误响应
```json
{
  "code": 1001,
  "msg": "错误信息",
  "data": null
}
```

---

*本文档最后更新时间: 2024年12月*