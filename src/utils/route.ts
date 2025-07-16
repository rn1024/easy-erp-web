import store from 'store2';

/**
 * Types
 */
import type { MenuDataItem } from '@ant-design/pro-components';

/**
 * 检查用户是否为超级管理员
 * 支持多种判断方式：
 * 1. 权限中包含 admin.* 或 * 或 super_admin
 * 2. 角色中包含"超级管理员"
 */
const isSuperAdmin = (userPermissions: string[], userRoles?: string[]): boolean => {
  // 方式1：通过权限判断
  if (
    userPermissions.includes('admin.*') ||
    userPermissions.includes('*') ||
    userPermissions.includes('super_admin')
  ) {
    return true;
  }

  // 方式2：通过角色判断
  if (userRoles && userRoles.includes('超级管理员')) {
    return true;
  }

  return false;
};

/**
 * 标记路由的访问权限
 */
const markedRoutes = (route: MenuDataItem) => {
  const { access } = route;
  // 设置默认值
  route.unaccessible = false;

  // 检查访问权限
  if (typeof access === 'string') {
    const permissions = store.get('permissions') || [];
    const roles = store.get('roles') || [];

    // 🔥 优先检查超级管理员身份，如果是超级管理员则直接允许访问
    if (isSuperAdmin(permissions, roles)) {
      route.unaccessible = false;
    } else {
      // 普通用户检查具体权限
      route.unaccessible = !permissions.includes(access);
    }
  }

  // 递归标记子路由的访问权限
  if (route.children?.length) {
    const isNoAccessibleChild = !route.children.reduce((hasAccessibleChild, child) => {
      markedRoutes(child);
      return hasAccessibleChild || !child.unaccessible;
    }, false);

    // 如果没有可访问的子路由，则标记当前路由为不可访问
    if (isNoAccessibleChild) {
      route.unaccessible = true;
    }
  }

  return route;
};

export { markedRoutes };
