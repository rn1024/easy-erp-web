# API 接口汇总表格

## 认证模块

| 接口功能     | 方法 | 路径                  | 参数                                   | 响应                                  |
| ------------ | ---- | --------------------- | -------------------------------------- | ------------------------------------- |
| 获取验证码   | GET  | `/v1/auth/verifycode` | 无                                     | `{ captcha, key }`                    |
| 用户登录     | POST | `/v1/auth/login`      | `{ username, password, captcha, key }` | `{ token, user, roles, permissions }` |
| 用户登出     | POST | `/v1/auth/logout`     | 无                                     | `User`                                |
| 获取当前用户 | GET  | `/v1/me`              | 无                                     | `User & { roles, permissions }`       |

## 文件上传模块

| 接口功能 | 方法 | 路径         | 参数             | 响应类型            |
| -------- | ---- | ------------ | ---------------- | ------------------- |
| 文件上传 | POST | `/v1/upload` | `FormData: file` | `ResType<string[]>` |

## 角色权限模块

| 接口功能         | 方法   | 路径                    | 关键参数                    | 响应类型                      |
| ---------------- | ------ | ----------------------- | --------------------------- | ----------------------------- |
| 角色列表         | GET    | `/v1/roles`             | `page, limit`               | `PageResType<RoleDataResult>` |
| 创建角色         | POST   | `/v1/roles`             | `name, status, operator`    | `ResType<RoleDataResult>`     |
| 更新角色         | PUT    | `/v1/roles/{id}`        | `name, status, permissions` | `ResType<RoleDataResult>`     |
| 删除角色         | DELETE | `/v1/roles/{id}`        | `id`                        | `ResType<RoleDataResult>`     |
| 根据ID查询角色   | GET    | `/v1/roles/{id}`        | `id`                        | `ResType<RoleDataResult>`     |
| 根据名称查询角色 | GET    | `/v1/roles/name/{name}` | `name`                      | `ResType<RoleDataResult>`     |

## 账户管理模块

| 接口功能     | 方法   | 路径                         | 关键参数                            | 响应类型                        |
| ------------ | ------ | ---------------------------- | ----------------------------------- | ------------------------------- |
| 账户列表     | GET    | `/v1/accounts`               | `page, limit, status, withRole`     | `PageResType<AccountsResponse>` |
| 创建账户     | POST   | `/v1/accounts`               | `name, operator, password, roleIds` | `ResType<AccountsResponse>`     |
| 获取账户详情 | GET    | `/v1/accounts/{id}`          | `id`                                | `ResType<RAccountResponse>`     |
| 更新账户     | PUT    | `/v1/accounts/{id}`          | `name, status, roleIds`             | `ResType<AccountsResponse>`     |
| 删除账户     | DELETE | `/v1/accounts/{id}`          | `id`                                | `ResType`                       |
| 修改密码     | PUT    | `/v1/accounts/{id}/password` | `old_password, new_password`        | `ResType<AccountsResponse>`     |

## 系统日志模块

| 接口功能     | 方法 | 路径       | 关键参数                                                    | 响应类型                    |
| ------------ | ---- | ---------- | ----------------------------------------------------------- | --------------------------- |
| 操作日志查询 | GET  | `/v1/logs` | `category, module, operations, operator_account_id, status` | `PageResType<LogsResponse>` |

## 通用接口模块

| 接口功能   | 方法 | 路径                 | 关键参数 | 响应类型  |
| ---------- | ---- | -------------------- | -------- | --------- |
| 验证群组ID | GET  | `/v1/check/gid/{id}` | `id`     | `ResType` |

| 验证用户ID | GET | `/v1/check/uid/{id}` | `id` | `ResType` |
| 图片上传 | POST | `/v1/oss/image` | `FormData: file` | `ResType<string[]>` |
| 视频上传 | POST | `/v1/oss/video` | `FormData: file` | `ResType<string[]>` |
| 获取操作人员 | GET | `/v1/operators` | `model` | `ResType<string[]>` |

## 导出记录模块

| 接口功能     | 方法 | 路径                 | 关键参数                                        | 响应类型                      |
| ------------ | ---- | -------------------- | ----------------------------------------------- | ----------------------------- |
| 导出记录查询 | GET  | `/v1/export/records` | `operator_account_id, create_start, create_end` | `PageResType<ExportResponse>` |

## 其他业务模块

| 模块 | 文件 | 主要功能 |
| ---- | ---- | -------- |

## 分页类型对比

| 版本    | 请求参数             | 响应格式                        | 使用场景         |
| ------- | -------------------- | ------------------------------- | ---------------- |
| v1 分页 | `page, limit`        | `PageResType<T>` (标准分页)     | 大部分列表查询   |
| v2 分页 | `search_after, size` | `PageResDataType<T>` (游标分页) | 大数据集列表查询 |

## 常用状态码

| 状态码 | 含义         | 处理方式               |
| ------ | ------------ | ---------------------- |
| 0      | 请求成功     | 正常处理数据           |
| 401    | 未授权       | 清除 token，跳转登录页 |
| 403    | 权限不足     | 显示权限错误提示       |
| 422    | 参数验证失败 | 显示具体验证错误       |
| 500+   | 服务器错误   | 显示系统错误提示       |

## 时间格式规范

| 用途         | 格式     | 示例                           |
| ------------ | -------- | ------------------------------ |
| 接口传参     | ISO 8601 | `2024-12-18T10:30:00.000Z`     |
| 时间范围查询 | 带后缀   | `created_start`, `created_end` |
| 显示格式     | 本地化   | `2024-12-18 10:30:00`          |

---

**文档生成时间**: 2024-12-18  
**维护者**: 开发团队
