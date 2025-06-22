# Next.js CMS 管理系统 API 接口文档

## 项目概述

本文档整理了 `nextjs-cms-template` 项目中所有 API 接口，这是一个专注于后台管理的 CMS 系统，包含账户管理、角色权限、文件管理和系统日志等核心功能。

## 基础配置

### Axios 配置 (`src/services/index.ts`)

```typescript
// 基础URL配置
axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';

// 请求拦截器：自动添加 Authorization header
axios.interceptors.request.use((config) => {
  if (store.has('token')) {
    config.headers.Authorization = 'Bearer ' + store.get('token');
  }
  return config;
});

// 响应拦截器：统一错误处理
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401: 跳转登录页
    // 403: 权限错误提示
    // 500+: 系统错误提示
  }
);
```

## 1. 认证模块 (`src/services/auth.ts`)

### 1.1 获取验证码

```typescript
GET / v1 / auth / verifycode;

Response: ResType<{
  captcha: string; // Base64验证码图片
  key: string; // 验证码标识
}>;
```

### 1.2 管理员登录

```typescript
POST / v1 / auth / login;

Request: {
  username: string; // 管理员用户名
  password: string; // 密码
  captcha: string; // 验证码
  key: string; // 验证码标识
}

Response: ResType<{
  token: string; // JWT Token
  user: Account; // 账户信息
  roles: Role[]; // 账户角色
  permissions: string[]; // 账户权限
}>;
```

### 1.3 管理员登出

```typescript
POST / v1 / auth / logout;

Response: ResType<Account>;
```

### 1.4 获取当前账户信息

```typescript
GET / v1 / me;

Response: ResType<
  Account & {
    roles: Role[];
    permissions: string[];
  }
>;
```

## 2. 账户管理模块 (`src/services/account.ts`)

### 2.1 账户列表查询

```typescript
GET /v1/accounts

Params: {
  page?: number;     // 页码，默认1
  limit?: number;    // 每页数量，默认20
  status?: number;   // 状态筛选：0-禁用，1-启用
  withRole?: boolean; // 是否包含角色信息
}

Response: PageResType<Account[]>
```

### 2.2 创建账户

```typescript
POST /v1/accounts

Request: {
  name: string;       // 账户名称（唯一）
  password: string;   // 初始密码
  status?: number;    // 状态：0-禁用，1-启用，默认1
  roleIds?: string[]; // 分配的角色ID列表
  operator: string;   // 操作人
}

Response: ResType<Account>
```

### 2.3 获取账户详情

```typescript
GET / v1 / accounts / { id };

Response: ResType<Account & { roles: Role[] }>;
```

### 2.4 更新账户

```typescript
PUT /v1/accounts/{id}

Request: {
  name?: string;      // 账户名称
  status?: number;    // 状态
  roleIds?: string[]; // 角色ID列表
  operator: string;   // 操作人
}

Response: ResType<Account>
```

### 2.5 删除账户

```typescript
DELETE / v1 / accounts / { id };

Response: ResType<{ message: string }>;
```

### 2.6 修改密码

```typescript
PUT / v1 / accounts / { id } / password;

Request: {
  old_password: string; // 原密码
  new_password: string; // 新密码
}

Response: ResType<{ message: string }>;
```

## 3. 角色权限模块 (`src/services/roles.ts`)

### 3.1 角色列表查询

```typescript
GET /v1/roles

Params: {
  page?: number;  // 页码，默认1
  limit?: number; // 每页数量，默认20
}

Response: PageResType<Role[]>
```

### 3.2 创建角色

```typescript
POST /v1/roles

Request: {
  name: string;         // 角色名称（唯一）
  status?: number;      // 状态：0-禁用，1-启用，默认1
  permissions?: string[]; // 权限代码列表
  operator: string;     // 操作人
}

Response: ResType<Role>
```

### 3.3 获取角色详情

```typescript
GET / v1 / roles / { id };

Response: ResType<Role & { permissions: Permission[] }>;
```

### 3.4 更新角色

```typescript
PUT /v1/roles/{id}

Request: {
  name?: string;        // 角色名称
  status?: number;      // 状态
  permissions?: string[]; // 权限代码列表
  operator: string;     // 操作人
}

Response: ResType<Role>
```

### 3.5 删除角色

```typescript
DELETE / v1 / roles / { id };

Response: ResType<{ message: string }>;
```

### 3.6 根据名称查询角色

```typescript
GET / v1 / roles / name / { name };

Response: ResType<Role>;
```

## 4. 文件管理模块 (`src/app/api/v1/upload/route.ts`)

### 4.1 文件上传

```typescript
POST /v1/upload

Request: FormData {
  file: File; // 上传的文件
}

Response: ResType<{
  url: string;      // 文件访问URL
  filename: string; // 文件名
  size: number;     // 文件大小
  type: string;     // 文件类型
}>

// 支持的文件类型
- 图片：jpg, jpeg, png, gif, webp
- 文档：pdf, doc, docx, xls, xlsx
- 视频：mp4, avi, mov
- 最大文件大小：10MB
```

## 5. 系统日志模块

### 5.1 操作日志查询

```typescript
GET /v1/logs

Params: {
  page?: number;        // 页码
  limit?: number;       // 每页数量
  category?: string;    // 日志分类
  module?: string;      // 模块名称
  operation?: string;   // 操作类型
  status?: string;      // 操作状态
  start_date?: string;  // 开始日期
  end_date?: string;    // 结束日期
}

Response: PageResType<Log[]>
```

## 6. 数据类型定义

### 6.1 基础响应类型

```typescript
interface ResType<T = any> {
  code: number; // 状态码：0-成功，其他-失败
  msg: string; // 响应消息
  data: T; // 响应数据
}

interface PageResType<T = any> {
  code: number;
  msg: string;
  data: T[];
  meta: {
    currentPage: number; // 当前页
    perPage: number; // 每页数量
    total: number; // 总记录数
    totalPages: number; // 总页数
  };
}
```

### 6.2 核心数据模型

```typescript
// 账户模型
interface Account {
  id: string;
  name: string; // 账户名称
  status: number; // 状态：0-禁用，1-启用
  operator: string; // 创建人
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
  roles?: Role[]; // 关联角色
}

// 角色模型
interface Role {
  id: string;
  name: string; // 角色名称
  status: number; // 状态：0-禁用，1-启用
  operator: string; // 创建人
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
  permissions?: string[]; // 权限代码列表
}

// 权限模型
interface Permission {
  id: string;
  name: string; // 权限名称
  code: string; // 权限代码（唯一）
  category: string; // 权限分类
  description?: string; // 权限描述
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
}

// 系统日志模型
interface Log {
  id: string;
  category: string; // 日志分类
  module: string; // 模块名称
  operation: string; // 操作类型
  operatorAccountId: string; // 操作人ID
  status: string; // 操作状态
  details?: any; // 操作详情
  created_at: string; // 创建时间
}
```

## 7. 权限系统

### 7.1 权限代码列表

```typescript
// 系统管理
'admin.*'; // 超级管理员权限

// 账户管理
'account.read'; // 查看账户
'account.write'; // 编辑账户
'account.delete'; // 删除账户

// 角色管理
'role.read'; // 查看角色
'role.write'; // 编辑角色
'role.delete'; // 删除角色

// 文件管理
'file.read'; // 查看文件
'file.upload'; // 上传文件
'file.delete'; // 删除文件

// 日志管理
'log.read'; // 查看日志
```

### 7.2 默认角色

```typescript
// 超级管理员 - 拥有所有权限
{
  name: '超级管理员',
  permissions: ['admin.*']
}

// 系统管理员 - 管理账户、角色、文件、日志
{
  name: '系统管理员',
  permissions: [
    'account.read', 'account.write', 'account.delete',
    'role.read', 'role.write', 'role.delete',
    'file.read', 'file.upload', 'file.delete',
    'log.read'
  ]
}

// 操作员 - 基础查看和文件操作权限
{
  name: '操作员',
  permissions: [
    'account.read', 'role.read', 'log.read',
    'file.read', 'file.upload'
  ]
}
```

## 8. 错误码说明

| 状态码 | 说明           | 处理方式         |
| ------ | -------------- | ---------------- |
| 0      | 成功           | 正常处理         |
| 400    | 请求参数错误   | 检查请求参数     |
| 401    | 未认证         | 跳转登录页       |
| 403    | 权限不足       | 显示权限错误提示 |
| 404    | 资源不存在     | 显示404页面      |
| 422    | 数据验证失败   | 显示验证错误信息 |
| 500    | 服务器内部错误 | 显示系统错误提示 |

## 9. 安全说明

### 9.1 认证机制

- 使用JWT令牌进行身份认证
- 令牌有效期为1小时，支持刷新
- 登录需要验证码防止暴力破解

### 9.2 权限控制

- 基于角色的访问控制（RBAC）
- API级别的权限验证
- 前端路由权限控制

### 9.3 数据安全

- 密码使用bcrypt加密存储
- SQL注入防护（Prisma ORM）
- XSS防护（输入验证和输出转义）
- 文件上传类型和大小限制

---

**更新时间：** 2024年12月24日  
**文档版本：** 2.0.0  
**适用系统：** Next.js CMS Template v2.0
