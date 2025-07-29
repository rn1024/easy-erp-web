# API接口文档

## 基础信息
- **Base URL**: `/api/v1/`
- **认证方式**: JWT Token
- **内容类型**: `application/json`

## 认证相关接口

### 用户登录
```
POST /api/v1/auth/login
```
**请求参数**:
```json
{
  "username": "string",
  "password": "string",
  "captcha": "string"
}
```

### 刷新Token
```
POST /api/v1/auth/refresh
```

### 获取用户信息
```
GET /api/v1/me
```

### 获取验证码
```
GET /api/v1/auth/captcha
```

## 产品管理接口

### 产品管理
```
GET    /api/v1/products              # 获取产品列表
POST   /api/v1/products              # 创建新产品
GET    /api/v1/products/{id}         # 获取产品详情
PUT    /api/v1/products/{id}         # 更新产品信息
DELETE /api/v1/products/{id}         # 删除产品
```

### 产品图片管理
```
GET    /api/v1/products/{id}/images           # 获取产品图片
POST   /api/v1/products/{id}/images           # 上传产品图片
PUT    /api/v1/products/{id}/images/{imageId}/set-cover  # 设置主图
DELETE /api/v1/products/{id}/images/{imageId} # 删除图片
```

### 产品分类管理
```
GET    /api/v1/product-categories    # 获取分类列表
POST   /api/v1/product-categories    # 创建分类
GET    /api/v1/product-categories/{id} # 获取分类详情
PUT    /api/v1/product-categories/{id} # 更新分类
DELETE /api/v1/product-categories/{id} # 删除分类
```

## 库存管理接口

### 成品库存
```
GET    /api/v1/finished-inventory    # 获取成品库存列表
POST   /api/v1/finished-inventory    # 创建库存记录
GET    /api/v1/finished-inventory/{id} # 获取库存详情
PUT    /api/v1/finished-inventory/{id} # 更新库存信息
```

### 备件库存
```
GET    /api/v1/spare-inventory       # 获取备件库存列表
POST   /api/v1/spare-inventory       # 创建备件库存
GET    /api/v1/spare-inventory/{id}  # 获取备件详情
PUT    /api/v1/spare-inventory/{id}  # 更新备件信息
```

## 采购管理接口

### 采购订单
```
GET    /api/v1/purchase-orders       # 获取采购订单列表
POST   /api/v1/purchase-orders       # 创建采购订单
GET    /api/v1/purchase-orders/{id}  # 获取订单详情
PUT    /api/v1/purchase-orders/{id}  # 更新订单信息
POST   /api/v1/purchase-orders/{id}/approve  # 审批订单
POST   /api/v1/purchase-orders/{id}/share    # 共享订单
GET    /api/v1/purchase-orders/{id}/supply-records # 获取供应记录
```

### 供应记录
```
GET    /api/v1/supply-records/{id}   # 获取供应记录详情
POST   /api/v1/supply-records/{id}/disable # 禁用供应记录
```

## 供应商管理接口

### 供应商信息
```
GET    /api/v1/suppliers             # 获取供应商列表
POST   /api/v1/suppliers             # 创建供应商
GET    /api/v1/suppliers/{id}        # 获取供应商详情
PUT    /api/v1/suppliers/{id}        # 更新供应商信息
```

## 货代管理接口

### 货代信息
```
GET    /api/v1/forwarding-agents     # 获取货代列表
POST   /api/v1/forwarding-agents     # 创建货代
GET    /api/v1/forwarding-agents/{id} # 获取货代详情
PUT    /api/v1/forwarding-agents/{id} # 更新货代信息
```

## 店铺管理接口

### 店铺信息
```
GET    /api/v1/shops                 # 获取店铺列表
POST   /api/v1/shops                 # 创建店铺
GET    /api/v1/shops/{id}            # 获取店铺详情
PUT    /api/v1/shops/{id}            # 更新店铺信息
```

## 仓库管理接口

### 包装任务
```
GET    /api/v1/packaging-tasks       # 获取包装任务列表
POST   /api/v1/packaging-tasks       # 创建包装任务
GET    /api/v1/packaging-tasks/{id}  # 获取任务详情
PUT    /api/v1/packaging-tasks/{id}  # 更新任务信息
```

## 运输管理接口

### 运输记录
```
GET    /api/v1/shipment-records      # 获取运输记录列表
POST   /api/v1/shipment-records      # 创建运输记录
GET    /api/v1/shipment-records/{id} # 获取运输详情
PUT    /api/v1/shipment-records/{id} # 更新运输信息
```

### 运输产品记录
```
GET    /api/v1/shipment-product-records # 获取运输产品列表
```

### 配送记录
```
GET    /api/v1/delivery-records      # 获取配送记录列表
POST   /api/v1/delivery-records      # 创建配送记录
GET    /api/v1/delivery-records/{id} # 获取配送详情
```

## 财务管理接口

### 财务报告
```
GET    /api/v1/financial-reports     # 获取财务报告列表
POST   /api/v1/financial-reports     # 创建财务报告
GET    /api/v1/financial-reports/{id} # 获取报告详情
```

## 系统管理接口

### 用户管理
```
GET    /api/v1/accounts              # 获取用户列表
POST   /api/v1/accounts              # 创建用户
GET    /api/v1/accounts/{id}         # 获取用户详情
PUT    /api/v1/accounts/{id}         # 更新用户信息
POST   /api/v1/accounts/{id}/password # 修改密码
```

### 角色管理
```
GET    /api/v1/roles                 # 获取角色列表
POST   /api/v1/roles                 # 创建角色
GET    /api/v1/roles/{id}            # 获取角色详情
PUT    /api/v1/roles/{id}            # 更新角色信息
GET    /api/v1/roles/name/{name}     # 根据名称获取角色
```

### 权限管理
```
GET    /api/v1/permissions           # 获取权限列表
```

## 审批相关接口

### 审批历史
```
GET    /api/v1/approvals/history     # 获取审批历史
GET    /api/v1/approvals/latest      # 获取最新审批
```

## 日志管理接口

### 系统日志
```
GET    /api/v1/logs                  # 获取日志列表
GET    /api/v1/logs/stats            # 获取日志统计
```

## 文件管理接口

### 文件上传
```
POST   /api/v1/upload                # 文件上传
```

### 图片管理
```
POST   /api/v1/oss/image             # 图片上传
```

### 视频管理
```
POST   /api/v1/oss/video             # 视频上传
```

## 导出接口

### 数据导出
```
POST   /api/v1/export/records        # 导出记录数据
```

## 共享接口

### 订单共享
```
GET    /api/v1/share/{shareCode}/info     # 获取共享信息
GET    /api/v1/share/{shareCode}/products # 获取共享产品
GET    /api/v1/share/{shareCode}/supply   # 获取共享供应信息
GET    /api/v1/share/history               # 获取共享历史
POST   /api/v1/share/verify               # 验证共享码
```

## 产品项目管理接口

### 产品项目
```
GET    /api/v1/product-items          # 获取产品项目列表
```

## 通用响应格式

### 成功响应
```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 错误响应
```json
{
  "code": 400,
  "message": "error message",
  "data": null
}
```

## 分页参数
所有列表接口支持以下分页参数：
- `page`: 页码，默认为1
- `limit`: 每页数量，默认为10
- `search`: 搜索关键词
- `sort`: 排序字段
- `order`: 排序方式(asc/desc)

## 筛选参数
支持以下通用筛选：
- `status`: 状态筛选
- `date_from`: 开始日期
- `date_to`: 结束日期
- `shop_id`: 店铺ID
- `supplier_id`: 供应商ID