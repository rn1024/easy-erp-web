import { PermissionHelper } from '../../src/lib/middleware';

describe('Permission System', () => {
  describe('Super Admin Detection', () => {
    it('should detect super admin with admin.* permission', () => {
      const userPermissions = ['admin.*'];
      expect(PermissionHelper.isSuperAdmin(userPermissions)).toBe(true);
    });

    it('should detect super admin with * permission', () => {
      const userPermissions = ['*'];
      expect(PermissionHelper.isSuperAdmin(userPermissions)).toBe(true);
    });

    it('should detect super admin with role "超级管理员"', () => {
      const userPermissions = ['account.read'];
      const userRoles = ['超级管理员'];
      expect(PermissionHelper.isSuperAdmin(userPermissions, userRoles)).toBe(true);
    });

    it('should detect super admin with both admin permission and role', () => {
      const userPermissions = ['admin.*'];
      const userRoles = ['超级管理员'];
      expect(PermissionHelper.isSuperAdmin(userPermissions, userRoles)).toBe(true);
    });

    it('should not detect super admin with regular permissions', () => {
      const userPermissions = ['account.read', 'account.write'];
      expect(PermissionHelper.isSuperAdmin(userPermissions)).toBe(false);
    });

    it('should not detect super admin with regular role', () => {
      const userPermissions = ['account.read'];
      const userRoles = ['普通员工'];
      expect(PermissionHelper.isSuperAdmin(userPermissions, userRoles)).toBe(false);
    });

    it('should not detect super admin with empty permissions and roles', () => {
      const userPermissions: string[] = [];
      const userRoles: string[] = [];
      expect(PermissionHelper.isSuperAdmin(userPermissions, userRoles)).toBe(false);
    });
  });

  describe('Permission Check', () => {
    it('should grant access to super admin for any permission (via admin.*)', () => {
      const superAdminPermissions = ['admin.*'];

      expect(PermissionHelper.hasPermission(superAdminPermissions, 'account.read')).toBe(true);
      expect(PermissionHelper.hasPermission(superAdminPermissions, 'financial.write')).toBe(true);
      expect(PermissionHelper.hasPermission(superAdminPermissions, 'any.unknown.permission')).toBe(
        true
      );
    });

    it('should grant access to super admin for any permission (via role)', () => {
      const userPermissions = ['account.read'];
      const userRoles = ['超级管理员'];

      expect(PermissionHelper.hasPermission(userPermissions, 'account.read', userRoles)).toBe(true);
      expect(PermissionHelper.hasPermission(userPermissions, 'financial.write', userRoles)).toBe(
        true
      );
      expect(
        PermissionHelper.hasPermission(userPermissions, 'any.unknown.permission', userRoles)
      ).toBe(true);
    });

    it('should check exact permission for regular users', () => {
      const regularUserPermissions = ['account.read', 'shop.write'];
      const regularUserRoles = ['普通员工'];

      expect(
        PermissionHelper.hasPermission(regularUserPermissions, 'account.read', regularUserRoles)
      ).toBe(true);
      expect(
        PermissionHelper.hasPermission(regularUserPermissions, 'shop.write', regularUserRoles)
      ).toBe(true);
      expect(
        PermissionHelper.hasPermission(regularUserPermissions, 'account.delete', regularUserRoles)
      ).toBe(false);
    });

    it('should deny access when user has no permissions', () => {
      const emptyPermissions: string[] = [];
      const emptyRoles: string[] = [];

      expect(PermissionHelper.hasPermission(emptyPermissions, 'account.read', emptyRoles)).toBe(
        false
      );
    });
  });

  describe('Real World Scenarios', () => {
    it('should handle your super admin account scenario', () => {
      // 您的超级管理员账号 - 拥有 admin.* 权限
      const adminPermissions = ['admin.*'];
      const adminRoles = ['超级管理员'];

      expect(PermissionHelper.isSuperAdmin(adminPermissions, adminRoles)).toBe(true);
      expect(PermissionHelper.hasPermission(adminPermissions, 'account.delete', adminRoles)).toBe(
        true
      );
      expect(
        PermissionHelper.hasPermission(adminPermissions, 'financial.approve', adminRoles)
      ).toBe(true);
    });

    it('should handle employee scenario', () => {
      // 普通员工账号 - 只有部分权限
      const employeePermissions = [
        'account.read',
        'shop.read',
        'product.info.read',
        'inventory.finished.read',
      ];
      const employeeRoles = ['普通员工'];

      expect(PermissionHelper.isSuperAdmin(employeePermissions, employeeRoles)).toBe(false);
      expect(
        PermissionHelper.hasPermission(employeePermissions, 'account.read', employeeRoles)
      ).toBe(true);
      expect(
        PermissionHelper.hasPermission(employeePermissions, 'account.delete', employeeRoles)
      ).toBe(false);
      expect(
        PermissionHelper.hasPermission(employeePermissions, 'financial.approve', employeeRoles)
      ).toBe(false);
    });

    it('should handle manager scenario', () => {
      // 部门经理账号 - 拥有特定模块的完整权限
      const managerPermissions = [
        'account.read',
        'shop.read',
        'shop.create',
        'shop.write',
        'product.info.read',
        'product.info.create',
        'product.info.write',
        'inventory.finished.read',
        'inventory.finished.write',
      ];
      const managerRoles = ['部门经理'];

      expect(PermissionHelper.isSuperAdmin(managerPermissions, managerRoles)).toBe(false);
      expect(PermissionHelper.hasPermission(managerPermissions, 'shop.write', managerRoles)).toBe(
        true
      );
      expect(PermissionHelper.hasPermission(managerPermissions, 'shop.delete', managerRoles)).toBe(
        false
      );
      expect(
        PermissionHelper.hasPermission(managerPermissions, 'financial.approve', managerRoles)
      ).toBe(false);
    });

    it('should handle admin role without admin permission', () => {
      // 有超级管理员角色但没有 admin.* 权限的特殊情况
      const userPermissions = ['account.read', 'shop.read'];
      const userRoles = ['超级管理员'];

      expect(PermissionHelper.isSuperAdmin(userPermissions, userRoles)).toBe(true);
      expect(PermissionHelper.hasPermission(userPermissions, 'financial.approve', userRoles)).toBe(
        true
      );
    });
  });
});
