import React from 'react';
import { useLocalStorageState } from 'ahooks';

/**
 * Types
 */
type Props = {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean; // 是否需要所有权限，默认 false（需要任一权限）
  fallback?: React.ReactNode; // 无权限时显示的内容
};

/**
 * 检查用户是否为超级管理员
 * 支持多种判断方式：
 * 1. 权限中包含 admin.* 或 *
 * 2. 角色中包含"超级管理员"
 * 3. 兼容旧的 super_admin 权限
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
 * 检查用户是否拥有指定权限
 * 超级管理员直接跳过权限检查，返回 true
 */
const hasPermission = (
  userPermissions: string[],
  requiredPermission: string,
  userRoles?: string[]
): boolean => {
  // 超级管理员直接跳过权限检查
  if (isSuperAdmin(userPermissions, userRoles)) {
    return true;
  }

  // 普通用户检查具体权限
  return userPermissions.includes(requiredPermission);
};

const Permission: React.FC<Props> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
}) => {
  const [userPermissions] = useLocalStorageState<string[]>('permissions', {
    defaultValue: [],
    listenStorageChange: true,
  });

  const [userRoles] = useLocalStorageState<string[]>('roles', {
    defaultValue: [],
    listenStorageChange: true,
  });

  // 兼容旧的 permission 单个权限参数
  const requiredPermissions = permission ? [permission] : permissions;

  // 如果没有用户权限信息，返回fallback
  if (!userPermissions) {
    return fallback;
  }

  // 🔥 优先检查超级管理员身份，如果是超级管理员直接返回children
  if (isSuperAdmin(userPermissions, userRoles)) {
    return children;
  }

  // 如果没有指定权限要求，对于普通用户返回fallback
  if (requiredPermissions.length === 0) {
    return fallback;
  }

  // 检查权限
  let hasAccess: boolean;

  if (requireAll) {
    // 需要所有权限
    hasAccess = requiredPermissions.every((perm) =>
      hasPermission(userPermissions, perm, userRoles)
    );
  } else {
    // 需要任一权限
    hasAccess = requiredPermissions.some((perm) => hasPermission(userPermissions, perm, userRoles));
  }

  return hasAccess ? children : fallback;
};

/**
 * 超级管理员权限组件
 * 只有超级管理员才能看到的内容
 */
export const SuperAdminPermission: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => {
  const [userPermissions] = useLocalStorageState<string[]>('permissions', {
    defaultValue: [],
    listenStorageChange: true,
  });

  const [userRoles] = useLocalStorageState<string[]>('roles', {
    defaultValue: [],
    listenStorageChange: true,
  });

  if (!userPermissions || !isSuperAdmin(userPermissions, userRoles)) {
    return fallback;
  }

  return children;
};

/**
 * 权限检查 Hook
 */
export const useAccess = () => {
  const [userPermissions] = useLocalStorageState<string[]>('permissions', {
    defaultValue: [],
    listenStorageChange: true,
  });

  const [userRoles] = useLocalStorageState<string[]>('roles', {
    defaultValue: [],
    listenStorageChange: true,
  });

  return {
    /**
     * 检查是否拥有指定权限
     */
    hasPermission: (permission: string) => {
      if (!userPermissions) return false;
      return hasPermission(userPermissions, permission, userRoles);
    },

    /**
     * 检查是否拥有所有指定权限
     */
    hasAllPermissions: (permissions: string[]) => {
      if (!userPermissions) return false;
      // 🔥 超级管理员直接返回 true
      if (isSuperAdmin(userPermissions, userRoles)) return true;
      return permissions.every((perm) => hasPermission(userPermissions, perm, userRoles));
    },

    /**
     * 检查是否拥有任一指定权限
     */
    hasAnyPermission: (permissions: string[]) => {
      if (!userPermissions) return false;
      // 🔥 超级管理员直接返回 true
      if (isSuperAdmin(userPermissions, userRoles)) return true;
      return permissions.some((perm) => hasPermission(userPermissions, perm, userRoles));
    },

    /**
     * 检查是否为超级管理员
     */
    isSuperAdmin: () => {
      if (!userPermissions) return false;
      return isSuperAdmin(userPermissions, userRoles);
    },

    /**
     * 检查是否拥有任何权限（包括超级管理员）
     */
    hasAnyAccess: () => {
      if (!userPermissions) return false;
      // 🔥 超级管理员直接返回 true
      if (isSuperAdmin(userPermissions, userRoles)) return true;
      // 普通用户检查是否有任何权限
      return userPermissions.length > 0;
    },

    /**
     * 检查是否有管理员权限（超级管理员或拥有任何 admin.* 权限）
     */
    isAdmin: () => {
      if (!userPermissions) return false;
      // 🔥 超级管理员直接返回 true
      if (isSuperAdmin(userPermissions, userRoles)) return true;
      // 检查是否有任何 admin.* 权限
      return userPermissions.some((perm) => perm.startsWith('admin.'));
    },

    /**
     * 获取用户权限列表
     */
    getPermissions: () => userPermissions || [],

    /**
     * 获取用户角色列表
     */
    getRoles: () => userRoles || [],
  };
};

export default Permission;
