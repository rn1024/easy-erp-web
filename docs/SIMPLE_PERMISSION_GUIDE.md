# 简洁权限系统使用指南

## 核心概念

### 🔑 权限逻辑非常简单

- **超级管理员** = 拥有 `admin.*` 权限或"超级管理员"角色的用户，跳过任何权限检查
- **普通用户** = 需要校验具体权限

### 📝 超级管理员判断规则

1. 拥有 `admin.*` 权限（如您的账号）
2. 拥有 `*` 权限（全局超级管理员）
3. 拥有"超级管理员"角色

## 使用方法

### 前端权限组件

```tsx
import Permission, { SuperAdminPermission, useAccess } from '@/components/permission';

// 1. 基础权限检查
<Permission permission="account.read">
  <Button>查看账户</Button>
</Permission>

// 2. 多权限检查（需要任一权限）
<Permission permissions={['account.read', 'account.write']}>
  <Button>账户操作</Button>
</Permission>

// 3. 多权限检查（需要所有权限）
<Permission permissions={['account.read', 'account.write']} requireAll>
  <Button>高级操作</Button>
</Permission>

// 4. 超级管理员专用组件
<SuperAdminPermission>
  <Button danger>危险操作</Button>
</SuperAdminPermission>

// 5. 使用 Hook 进行权限检查
function MyComponent() {
  const access = useAccess();

  if (access.isSuperAdmin()) {
    return <div>超级管理员界面</div>;
  }

  if (access.hasPermission('account.read')) {
    return <div>普通用户界面</div>;
  }

  return <div>无权限</div>;
}
```

### 后端 API 权限检查

```typescript
import { withAuth, withPermission, PermissionHelper } from '@/lib/middleware';

// 1. 基础认证（只需要登录）
export const GET = withAuth(async (request, user) => {
  return ApiResponseHelper.success(user);
});

// 2. 需要特定权限（超级管理员自动通过）
export const POST = withPermission(['account.write'])(async (request, user) => {
  // 只有拥有 account.write 权限的用户可以访问
  // 超级管理员（admin.* 权限或"超级管理员"角色）自动通过
  return ApiResponseHelper.success({ message: '创建成功' });
});

// 3. 手动权限检查
export const PUT = withAuth(async (request, user) => {
  const { action } = await request.json();

  if (action === 'dangerous') {
    // 危险操作需要超级管理员权限
    if (!PermissionHelper.isSuperAdmin(user.permissions, user.roles)) {
      return ApiResponseHelper.forbidden('需要超级管理员权限');
    }
  } else if (action === 'normal') {
    // 普通操作检查具体权限
    if (!PermissionHelper.hasPermission(user.permissions, 'account.write', user.roles)) {
      return ApiResponseHelper.forbidden('权限不足');
    }
  }

  return ApiResponseHelper.success({ message: '操作成功' });
});
```

## 实际场景示例

### 场景1：您的超级管理员账号

```json
{
  "permissions": ["admin.*"],
  "roles": ["超级管理员"]
}
```

**结果**：可以访问系统所有功能，无需逐一检查权限

### 场景2：普通员工账号

```json
{
  "permissions": ["account.read", "shop.read", "product.info.read"],
  "roles": ["普通员工"]
}
```

**结果**：只能查看账户、店铺和产品信息，无法执行编辑或删除操作

### 场景3：部门经理账号

```json
{
  "permissions": [
    "account.read",
    "shop.read",
    "shop.write",
    "product.info.read",
    "product.info.write"
  ],
  "roles": ["部门经理"]
}
```

**结果**：可以管理店铺和产品信息，但无法删除或进行财务操作

### 场景4：特殊情况 - 只有角色的超级管理员

```json
{
  "permissions": ["account.read", "shop.read"],
  "roles": ["超级管理员"]
}
```

**结果**：通过角色识别为超级管理员，可以访问所有功能

## 权限列表

系统定义的所有权限：

### 账户管理

- `account.read` - 查看账户
- `account.write` - 编辑账户
- `account.delete` - 删除账户

### 角色管理

- `role.read` - 查看角色
- `role.write` - 编辑角色
- `role.delete` - 删除角色

### 文件管理

- `file.read` - 查看文件
- `file.upload` - 上传文件
- `file.delete` - 删除文件

### 业务模块

- **店铺管理**: `shop.read`, `shop.create`, `shop.write`, `shop.delete`
- **供应商管理**: `supplier.read`, `supplier.create`, `supplier.write`, `supplier.delete`
- **产品管理**: `product.category.read`, `product.info.read`, `product.info.create`, 等...
- **库存管理**: `inventory.finished.read`, `inventory.spare.write`, `inventory.count`, 等...
- **采购管理**: `purchase.read`, `purchase.create`, `purchase.approve`, 等...
- **财务管理**: `financial.read`, `financial.input`, `financial.approve`, 等...

## 最佳实践

1. **超级管理员账号**

   - 推荐使用 `admin.*` 权限
   - 或者使用"超级管理员"角色
   - 两种方式都能确保拥有所有权限

2. **普通用户账号**

   - 按职能分配最小必要权限
   - 使用角色模板快速分配权限

3. **权限检查**

   - 前端：使用权限组件控制界面显示
   - 后端：使用 `withPermission` 中间件确保接口安全
   - 敏感操作：手动检查超级管理员权限

4. **开发调试**
   - 运行测试验证权限逻辑：`pnpm test __tests__/utils/permission-system.test.ts`
   - 检查类型安全：`pnpm type-check`

---

## 总结

这个权限系统的核心设计理念是：

- **简洁性**：超级管理员跳过检查，普通用户校验权限
- **扩展性**：新增权限无需修改代码，系统自动支持
- **灵活性**：支持多种超级管理员认定方式
- **兼容性**：完全兼容现有权限设计

**您的 `admin.*` 权限现在可以完美地访问系统所有功能！**
