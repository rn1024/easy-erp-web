import store from 'store2';

/**
 * Types
 */
import type { MenuDataItem } from '@ant-design/pro-components';

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
    route.unaccessible = !(permissions.includes('super_admin') || permissions.includes(access));
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
