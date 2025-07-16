# ERP系统 API 接口文档 v1

## 概述

本文档详细介绍了ERP系统v1版本的所有API接口，包括认证、账户管理、产品管理、采购管理、库存管理等核心业务模块。

### 基础信息

- **Base URL**: `/api/v1`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **字符编码**: UTF-8

### 通用响应格式

```typescript
interface ApiResponse<T> {
  code: number; // 0: 成功, 1: 失败
  msg: string; // 响应消息
  data: T | null; // 响应数据
}

interface PageResponse<T> {
  code: number;
  msg: string;
  data: {
    list: T[]; // 数据列表
    total: number; // 总记录数
    page: number; // 当前页码
    pageSize: number; // 每页大小
    totalPages: number; // 总页数
  };
}
```

### HTTP状态码

- `200`: 请求成功
- `400`: 请求参数错误
- `401`: 未授权访问
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

---

## 1. 认证模块

### 1.1 获取验证码

**接口地址**: `GET /api/v1/auth/verifycode`

**功能说明**: 获取登录验证码

**请求参数**: 无

**响应示例**:

```json
{
  "code": 0,
  "msg": "验证码生成成功",
  "data": {
    "key": "captcha_1234567890",
    "captcha": "data:image/svg+xml;base64,PHN2Zy..."
  }
}
```

**调用示例**:

```javascript
// JavaScript
const response = await fetch('/api/v1/auth/verifycode');
const result = await response.json();
console.log(result.data.captcha); // Base64验证码图片
```

---

### 1.2 用户登录

**接口地址**: `POST /api/v1/auth/login`

**功能说明**: 用户登录认证

**请求参数**:

```typescript
interface LoginRequest {
  username: string; // 用户名
  password: string; // 密码
  captcha: string; // 验证码
  key: string; // 验证码key
}
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user123",
      "name": "张三",
      "status": "ACTIVE"
    },
    "roles": [
      {
        "id": "role1",
        "name": "管理员",
        "code": "ADMIN"
      }
    ],
    "permissions": ["USER_READ", "USER_WRITE", "PRODUCT_READ"]
  }
}
```

**调用示例**:

```javascript
// JavaScript
const loginData = {
  username: 'admin',
  password: 'password123',
  captcha: 'ABCD',
  key: 'captcha_1234567890',
};

const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(loginData),
});

const result = await response.json();
if (result.code === 0) {
  localStorage.setItem('token', result.data.accessToken);
}
```

---

### 1.3 刷新Token

**接口地址**: `POST /api/v1/auth/refresh`

**功能说明**: 刷新访问令牌

**请求参数**:

```typescript
interface RefreshRequest {
  refreshToken: string; // 刷新令牌
}
```

**请求头**:

```
Authorization: Bearer <refresh_token>
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "Token刷新成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**调用示例**:

```javascript
// JavaScript
const refreshToken = localStorage.getItem('refreshToken');

const response = await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${refreshToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ refreshToken }),
});
```

---

## 2. 用户信息模块

### 2.1 获取当前用户信息

**接口地址**: `GET /api/v1/me`

**功能说明**: 获取当前登录用户的详细信息

**请求头**:

```
Authorization: Bearer <access_token>
```

**请求参数**: 无

**响应示例**:

```json
{
  "code": 0,
  "msg": "获取用户信息成功",
  "data": {
    "id": "user123",
    "name": "张三",
    "email": "zhangsan@company.com",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00Z",
    "roles": [
      {
        "id": "role1",
        "name": "管理员",
        "code": "ADMIN",
        "permissions": [
          {
            "id": "perm1",
            "name": "用户管理",
            "code": "USER_MANAGE"
          }
        ]
      }
    ]
  }
}
```

**调用示例**:

```javascript
// JavaScript
const token = localStorage.getItem('token');

const response = await fetch('/api/v1/me', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const result = await response.json();
console.log('用户信息:', result.data);
```

---

## 3. 账户管理模块

### 3.1 获取账户列表

**接口地址**: `GET /api/v1/accounts`

**功能说明**: 分页获取账户列表

**请求头**:

```
Authorization: Bearer <access_token>
```

**请求参数**:

```typescript
interface AccountListQuery {
  page?: number; // 页码，默认1
  limit?: number; // 每页数量，默认20
  status?: string; // 状态筛选：'1'(激活) | '0'(禁用)
  name?: string; // 用户名搜索
  withRole?: boolean; // 是否包含角色信息
}
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "获取账户列表成功",
  "data": {
    "list": [
      {
        "id": "acc1",
        "name": "admin",
        "email": "admin@company.com",
        "status": "ACTIVE",
        "createdAt": "2024-01-01T00:00:00Z",
        "roles": [
          {
            "role": {
              "id": "role1",
              "name": "管理员",
              "code": "ADMIN"
            }
          }
        ]
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  }
}
```

**调用示例**:

```javascript
// JavaScript
const params = new URLSearchParams({
  page: '1',
  limit: '20',
  withRole: 'true',
});

const response = await fetch(`/api/v1/accounts?${params}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

### 3.2 创建账户

**接口地址**: `POST /api/v1/accounts`

**功能说明**: 创建新账户

**请求头**:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**请求参数**:

```typescript
interface CreateAccountRequest {
  name: string; // 用户名
  email?: string; // 邮箱
  password: string; // 密码
  operator: string; // 操作员
  roleIds: string[]; // 角色ID数组
}
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "账户创建成功",
  "data": {
    "id": "new_account_id",
    "name": "newuser",
    "email": "newuser@company.com",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**调用示例**:

```javascript
// JavaScript
const accountData = {
  name: 'newuser',
  email: 'newuser@company.com',
  password: 'password123',
  operator: 'admin',
  roleIds: ['role1', 'role2'],
};

const response = await fetch('/api/v1/accounts', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(accountData),
});
```

---

### 3.3 更新账户

**接口地址**: `PUT /api/v1/accounts/{id}`

**功能说明**: 更新指定账户信息

**请求头**:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**路径参数**:

- `id`: 账户ID

**请求参数**:

```typescript
interface UpdateAccountRequest {
  name?: string; // 用户名
  email?: string; // 邮箱
  status?: string; // 状态：'ACTIVE' | 'INACTIVE'
  roleIds?: string[]; // 角色ID数组
}
```

**调用示例**:

```javascript
// JavaScript
const updateData = {
  name: 'updated_username',
  status: 'ACTIVE',
  roleIds: ['role1'],
};

const response = await fetch('/api/v1/accounts/acc123', {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updateData),
});
```

---

### 3.4 删除账户

**接口地址**: `DELETE /api/v1/accounts/{id}`

**功能说明**: 删除指定账户

**请求头**:

```
Authorization: Bearer <access_token>
```

**路径参数**:

- `id`: 账户ID

**调用示例**:

```javascript
// JavaScript
const response = await fetch('/api/v1/accounts/acc123', {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

### 3.5 修改密码

**接口地址**: `PUT /api/v1/accounts/{id}/password`

**功能说明**: 修改账户密码

**请求头**:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**路径参数**:

- `id`: 账户ID

**请求参数**:

```typescript
interface ChangePasswordRequest {
  old_password: string; // 旧密码
  new_password: string; // 新密码
}
```

**调用示例**:

```javascript
// JavaScript
const passwordData = {
  old_password: 'oldpass123',
  new_password: 'newpass123',
};

const response = await fetch('/api/v1/accounts/acc123/password', {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(passwordData),
});
```

---

## 4. 角色管理模块

### 4.1 获取角色列表

**接口地址**: `GET /api/v1/roles`

**功能说明**: 分页获取角色列表

**请求头**:

```
Authorization: Bearer <access_token>
```

**请求参数**:

```typescript
interface RoleListQuery {
  page?: number; // 页码，默认1
  limit?: number; // 每页数量，默认20
  status?: string; // 状态筛选
  name?: string; // 角色名搜索
}
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "获取角色列表成功",
  "data": {
    "list": [
      {
        "id": "role1",
        "name": "管理员",
        "code": "ADMIN",
        "status": "ACTIVE",
        "description": "系统管理员角色",
        "permissions": [
          {
            "permission": {
              "id": "perm1",
              "name": "用户管理",
              "code": "USER_MANAGE"
            }
          }
        ],
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

**调用示例**:

```javascript
// JavaScript
const response = await fetch('/api/v1/roles?page=1&limit=20', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

### 4.2 创建角色

**接口地址**: `POST /api/v1/roles`

**功能说明**: 创建新角色

**请求参数**:

```typescript
interface CreateRoleRequest {
  name: string; // 角色名称
  code?: string; // 角色代码
  description?: string; // 角色描述
  status: string; // 状态：'ACTIVE' | 'INACTIVE'
  operator: string; // 操作员
  permissionIds?: string[]; // 权限ID数组
}
```

**调用示例**:

```javascript
// JavaScript
const roleData = {
  name: '销售经理',
  code: 'SALES_MANAGER',
  description: '销售部门经理角色',
  status: 'ACTIVE',
  operator: 'admin',
  permissionIds: ['perm1', 'perm2'],
};

const response = await fetch('/api/v1/roles', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(roleData),
});
```

---

## 5. 产品管理模块

### 5.1 获取产品列表

**接口地址**: `GET /api/v1/products`

**功能说明**: 分页获取产品列表

**请求头**:

```
Authorization: Bearer <access_token>
```

**请求参数**:

```typescript
interface ProductListQuery {
  page?: number; // 页码，默认1
  pageSize?: number; // 每页数量，默认10
  shopId?: string; // 店铺ID筛选
  categoryId?: string; // 分类ID筛选
  code?: string; // 产品代码搜索
  sku?: string; // SKU搜索
}
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "获取产品列表成功",
  "data": {
    "list": [
      {
        "id": "prod1",
        "code": "P001",
        "sku": "SKU001",
        "name": "产品名称",
        "description": "产品描述",
        "price": 99.99,
        "cost": 50.0,
        "status": "ACTIVE",
        "shop": {
          "id": "shop1",
          "nickname": "店铺名称"
        },
        "category": {
          "id": "cat1",
          "name": "分类名称"
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

**调用示例**:

```javascript
// JavaScript
const params = new URLSearchParams({
  page: '1',
  pageSize: '10',
  shopId: 'shop1',
});

const response = await fetch(`/api/v1/products?${params}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

### 5.2 创建产品

**接口地址**: `POST /api/v1/products`

**功能说明**: 创建新产品

**请求参数**:

```typescript
interface CreateProductRequest {
  code: string; // 产品代码
  sku: string; // SKU
  name: string; // 产品名称
  description?: string; // 产品描述
  price: number; // 销售价格
  cost: number; // 成本价格
  shopId: string; // 店铺ID
  categoryId: string; // 分类ID
  operator: string; // 操作员
}
```

**调用示例**:

```javascript
// JavaScript
const productData = {
  code: 'P002',
  sku: 'SKU002',
  name: '新产品',
  description: '产品描述信息',
  price: 199.99,
  cost: 120.0,
  shopId: 'shop1',
  categoryId: 'cat1',
  operator: 'admin',
};

const response = await fetch('/api/v1/products', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(productData),
});
```

---

## 6. 采购管理模块

### 6.1 获取采购订单列表

**接口地址**: `GET /api/v1/purchase-orders`

**功能说明**: 分页获取采购订单列表

**请求头**:

```
Authorization: Bearer <access_token>
```

**请求参数**:

```typescript
interface PurchaseOrderListQuery {
  page?: number; // 页码，默认1
  pageSize?: number; // 每页数量，默认10
  shopId?: string; // 店铺ID筛选
  supplierId?: string; // 供应商ID筛选
  productId?: string; // 产品ID筛选
  status?: string; // 状态筛选
  urgent?: string; // 紧急程度筛选
  operatorId?: string; // 操作员ID筛选
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
}
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "获取采购订单列表成功",
  "data": {
    "list": [
      {
        "id": "po1",
        "orderNumber": "CGDD20241225000001",
        "status": "PENDING",
        "urgent": "NORMAL",
        "totalAmount": 1000.0,
        "shop": {
          "id": "shop1",
          "nickname": "店铺名称"
        },
        "supplier": {
          "id": "supp1",
          "name": "供应商名称"
        },
        "operator": {
          "id": "user1",
          "name": "操作员"
        },
        "items": [
          {
            "id": "item1",
            "productId": "prod1",
            "quantity": 10,
            "unitPrice": 100.0,
            "totalPrice": 1000.0
          }
        ],
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

**调用示例**:

```javascript
// JavaScript
const params = new URLSearchParams({
  page: '1',
  pageSize: '10',
  status: 'PENDING',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
});

const response = await fetch(`/api/v1/purchase-orders?${params}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

### 6.2 创建采购订单

**接口地址**: `POST /api/v1/purchase-orders`

**功能说明**: 创建新采购订单

**请求参数**:

```typescript
interface CreatePurchaseOrderRequest {
  shopId: string; // 店铺ID
  supplierId: string; // 供应商ID
  urgent: string; // 紧急程度：'NORMAL' | 'URGENT' | 'EMERGENCY'
  note?: string; // 备注
  items: Array<{
    productId: string; // 产品ID
    quantity: number; // 数量
    unitPrice: number; // 单价
  }>;
}
```

**调用示例**:

```javascript
// JavaScript
const orderData = {
  shopId: 'shop1',
  supplierId: 'supp1',
  urgent: 'NORMAL',
  note: '采购备注信息',
  items: [
    {
      productId: 'prod1',
      quantity: 10,
      unitPrice: 100.0,
    },
    {
      productId: 'prod2',
      quantity: 5,
      unitPrice: 200.0,
    },
  ],
};

const response = await fetch('/api/v1/purchase-orders', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(orderData),
});
```

---

## 7. 库存管理模块

### 7.1 获取成品库存列表

**接口地址**: `GET /api/v1/finished-inventory`

**功能说明**: 分页获取成品库存列表

**请求头**:

```
Authorization: Bearer <access_token>
```

**请求参数**:

```typescript
interface FinishedInventoryQuery {
  page?: number; // 页码，默认1
  pageSize?: number; // 每页数量，默认10
  shopId?: string; // 店铺ID筛选
  productId?: string; // 产品ID筛选
  lowStock?: boolean; // 是否低库存
}
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "获取成品库存列表成功",
  "data": {
    "list": [
      {
        "id": "inv1",
        "productId": "prod1",
        "shopId": "shop1",
        "quantity": 100,
        "reservedQuantity": 10,
        "availableQuantity": 90,
        "minThreshold": 20,
        "maxThreshold": 500,
        "product": {
          "code": "P001",
          "name": "产品名称",
          "sku": "SKU001"
        },
        "shop": {
          "nickname": "店铺名称"
        },
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

**调用示例**:

```javascript
// JavaScript
const response = await fetch('/api/v1/finished-inventory?page=1&pageSize=10', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

### 7.2 获取备件库存列表

**接口地址**: `GET /api/v1/spare-inventory`

**功能说明**: 分页获取备件库存列表

**请求参数与响应格式与成品库存类似**

**调用示例**:

```javascript
// JavaScript
const response = await fetch('/api/v1/spare-inventory?page=1&pageSize=10', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## 8. 仓库管理模块

### 8.1 获取仓库任务列表

**接口地址**: `GET /api/v1/warehouse-tasks`

**功能说明**: 分页获取仓库任务列表

**请求头**:

```
Authorization: Bearer <access_token>
```

**请求参数**:

```typescript
interface WarehouseTaskQuery {
  page?: number; // 页码，默认1
  pageSize?: number; // 每页数量，默认10
  type?: string; // 任务类型
  status?: string; // 任务状态
  assigneeId?: string; // 执行人ID筛选
}
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "获取仓库任务列表成功",
  "data": {
    "list": [
      {
        "id": "task1",
        "taskNumber": "WH20241225000001",
        "type": "INBOUND",
        "status": "PENDING",
        "priority": "NORMAL",
        "description": "入库任务描述",
        "assignee": {
          "id": "user1",
          "name": "执行人姓名"
        },
        "createdAt": "2024-01-01T00:00:00Z",
        "dueDate": "2024-01-02T00:00:00Z"
      }
    ],
    "total": 30,
    "page": 1,
    "pageSize": 10,
    "totalPages": 3
  }
}
```

**调用示例**:

```javascript
// JavaScript
const params = new URLSearchParams({
  page: '1',
  pageSize: '10',
  status: 'PENDING',
});

const response = await fetch(`/api/v1/warehouse-tasks?${params}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## 9. 配送管理模块

### 9.1 获取配送记录列表

**接口地址**: `GET /api/v1/delivery-records`

**功能说明**: 分页获取配送记录列表

**请求头**:

```
Authorization: Bearer <access_token>
```

**请求参数**:

```typescript
interface DeliveryRecordQuery {
  page?: number; // 页码，默认1
  pageSize?: number; // 每页数量，默认10
  status?: string; // 配送状态
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
}
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "获取配送记录列表成功",
  "data": {
    "list": [
      {
        "id": "delivery1",
        "trackingNumber": "DL20241225000001",
        "status": "IN_TRANSIT",
        "origin": "发货地址",
        "destination": "收货地址",
        "estimatedDelivery": "2024-01-03T00:00:00Z",
        "actualDelivery": null,
        "carrier": "配送公司",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "pageSize": 10,
    "totalPages": 3
  }
}
```

**调用示例**:

```javascript
// JavaScript
const response = await fetch('/api/v1/delivery-records?page=1&status=IN_TRANSIT', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## 10. 财务管理模块

### 10.1 获取财务报表列表

**接口地址**: `GET /api/v1/financial-reports`

**功能说明**: 分页获取财务报表列表

**请求头**:

```
Authorization: Bearer <access_token>
```

**请求参数**:

```typescript
interface FinancialReportQuery {
  page?: number; // 页码，默认1
  pageSize?: number; // 每页数量，默认10
  type?: string; // 报表类型
  period?: string; // 统计周期
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
}
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "获取财务报表列表成功",
  "data": {
    "list": [
      {
        "id": "report1",
        "type": "SALES_REPORT",
        "title": "销售报表",
        "period": "MONTHLY",
        "startDate": "2024-01-01",
        "endDate": "2024-01-31",
        "totalRevenue": 100000.0,
        "totalCost": 60000.0,
        "totalProfit": 40000.0,
        "createdAt": "2024-02-01T00:00:00Z"
      }
    ],
    "total": 12,
    "page": 1,
    "pageSize": 10,
    "totalPages": 2
  }
}
```

**调用示例**:

```javascript
// JavaScript
const params = new URLSearchParams({
  page: '1',
  type: 'SALES_REPORT',
  period: 'MONTHLY',
});

const response = await fetch(`/api/v1/financial-reports?${params}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## 11. 文件管理模块

### 11.1 文件上传

**接口地址**: `POST /api/v1/upload`

**功能说明**: 上传文件到云存储

**请求头**:

```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**请求参数**:

```typescript
// FormData格式
interface UploadRequest {
  file: File; // 文件对象
  type?: string; // 文件类型：'image' | 'video' | 'document'
  folder?: string; // 存储文件夹
}
```

**文件类型限制**:

- **图片**: jpeg, png, gif, webp，最大10MB
- **视频**: mp4, webm, mov，最大100MB
- **文档**: pdf, doc, docx, xls, xlsx，最大20MB

**响应示例**:

```json
{
  "code": 0,
  "msg": "文件上传成功",
  "data": {
    "urls": ["https://oss.example.com/uploads/images/20241225/file1.jpg"],
    "fileInfo": [
      {
        "originalName": "image.jpg",
        "fileName": "file1.jpg",
        "size": 1024000,
        "type": "image/jpeg",
        "url": "https://oss.example.com/uploads/images/20241225/file1.jpg"
      }
    ]
  }
}
```

**调用示例**:

```javascript
// JavaScript
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

const formData = new FormData();
formData.append('file', file);
formData.append('type', 'image');

const response = await fetch('/api/v1/upload', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

const result = await response.json();
console.log('上传结果:', result.data.urls[0]);
```

---

## 12. 系统管理模块

### 12.1 获取系统日志

**接口地址**: `GET /api/v1/logs`

**功能说明**: 分页获取系统操作日志

**请求头**:

```
Authorization: Bearer <access_token>
```

**请求参数**:

```typescript
interface LogQuery {
  page?: number; // 页码，默认1
  pageSize?: number; // 每页数量，默认10
  category?: string; // 日志分类
  module?: string; // 模块名称
  operations?: string; // 操作类型
  operator_account_id?: string; // 操作员ID
  status?: string; // 操作状态
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
}
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "获取系统日志成功",
  "data": {
    "list": [
      {
        "id": "log1",
        "category": "USER_OPERATION",
        "module": "ACCOUNT_MANAGEMENT",
        "operation": "CREATE_ACCOUNT",
        "status": "SUCCESS",
        "operator": {
          "id": "user1",
          "name": "管理员"
        },
        "details": "创建账户：newuser",
        "ip": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1000,
    "page": 1,
    "pageSize": 10,
    "totalPages": 100
  }
}
```

**调用示例**:

```javascript
// JavaScript
const params = new URLSearchParams({
  page: '1',
  category: 'USER_OPERATION',
  module: 'ACCOUNT_MANAGEMENT',
});

const response = await fetch(`/api/v1/logs?${params}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## 13. 权限管理模块

### 13.1 获取权限列表

**接口地址**: `GET /api/v1/permissions`

**功能说明**: 获取系统权限列表

**请求头**:

```
Authorization: Bearer <access_token>
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "获取权限列表成功",
  "data": {
    "list": [
      {
        "id": "perm1",
        "name": "用户管理",
        "code": "USER_MANAGE",
        "module": "USER_MODULE",
        "description": "用户账户管理权限",
        "createdAt": "2024-01-01T00:00:00Z"
      },
      {
        "id": "perm2",
        "name": "产品查看",
        "code": "PRODUCT_READ",
        "module": "PRODUCT_MODULE",
        "description": "产品信息查看权限",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

**调用示例**:

```javascript
// JavaScript
const response = await fetch('/api/v1/permissions', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## 错误处理

### 常见错误码

| 错误码 | 说明             | 解决方案                   |
| ------ | ---------------- | -------------------------- |
| 1001   | 参数错误         | 检查请求参数格式和必填字段 |
| 1002   | 验证码错误       | 重新获取验证码             |
| 1003   | 用户名或密码错误 | 检查登录凭据               |
| 1004   | Token无效或过期  | 重新登录或刷新Token        |
| 1005   | 权限不足         | 联系管理员分配相应权限     |
| 1006   | 资源不存在       | 检查资源ID是否正确         |
| 1007   | 数据重复         | 检查唯一性字段             |
| 1008   | 文件格式不支持   | 使用支持的文件格式         |
| 1009   | 文件大小超限     | 压缩文件或分割上传         |

### 错误响应示例

```json
{
  "code": 1004,
  "msg": "Token无效或过期",
  "data": null
}
```

---

## 最佳实践

### 1. 认证处理

```javascript
// 统一的API请求封装
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  async request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${url}`, {
      ...options,
      headers,
    });

    const result = await response.json();

    // Token过期处理
    if (result.code === 1004) {
      this.handleTokenExpired();
      return;
    }

    return result;
  }

  handleTokenExpired() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}

const api = new ApiClient('/api/v1');
```

### 2. 分页处理

```javascript
// 分页组件示例
const usePagination = (fetchFunction) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });

  const loadData = async (params = {}) => {
    setLoading(true);
    try {
      const result = await fetchFunction({
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...params,
      });

      if (result.code === 0) {
        setData(result.data.list);
        setPagination((prev) => ({
          ...prev,
          total: result.data.total,
        }));
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, pagination, loadData };
};
```

### 3. 错误处理

```javascript
// 全局错误处理
const handleApiError = (error) => {
  const errorMessages = {
    1001: '请检查输入参数',
    1002: '验证码错误，请重新输入',
    1003: '用户名或密码错误',
    1004: '登录已过期，请重新登录',
    1005: '权限不足，请联系管理员',
  };

  const message = errorMessages[error.code] || error.msg || '操作失败';

  // 显示错误消息
  notification.error({
    message: '操作失败',
    description: message,
  });
};
```

---

## 更新日志

### v1.0.0 (2024-12-25)

- 初始版本发布
- 包含认证、账户、角色、产品、采购、库存等核心模块
- 支持文件上传和系统日志功能

---

本文档将持续更新，如有疑问请联系开发团队。
