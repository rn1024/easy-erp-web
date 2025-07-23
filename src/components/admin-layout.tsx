'use client';

import { ProLayout } from '@ant-design/pro-components';
import { LockOutlined, LogoutOutlined } from '@ant-design/icons';
import { useBoolean, useLocalStorageState, useRequest } from 'ahooks';
import { App, Dropdown, Space } from 'antd';
import { get } from 'lodash';
import React, { useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import store2 from 'store2';
import routes from '@/router/routes';

/**
 * APIs
 */
import { logout, me } from '@/services/auth';

/**
 * Components
 */
import ComponentChangePasswordModal from '@/components/changePasswordModal';
import ComponentLanguage from '@/components/language';

/**
 * Types
 */
import type { ProLayoutProps } from '@ant-design/pro-components';
import type { DropdownProps } from 'antd';

// Dynamic import ProLayout to avoid SSR issues
const DynamicProLayout = dynamic(
  () => import('@ant-design/pro-components').then((mod) => ({ default: mod.ProLayout })),
  {
    ssr: false,
    loading: () => {
      // 使用新的Loading组件
      const LoadingComponent = () => {
        const [mounted, setMounted] = React.useState(false);

        React.useEffect(() => {
          setMounted(true);
        }, []);

        if (!mounted) {
          return (
            <div
              style={{
                minHeight: '100vh',
                background: '#f0f2f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      border: '3px solid #f3f3f3',
                      borderTop: '3px solid #1890ff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto',
                    }}
                  />
                </div>
                <div style={{ color: '#666', fontSize: 14 }}>加载中...</div>
              </div>
            </div>
          );
        }

        return null;
      };

      return <LoadingComponent />;
    },
  }
);

const routesWithoutLayout = ['/login', '/403'];

// 检查路径是否需要跳过身份验证
const shouldSkipAuth = (pathname: string): boolean => {
  // 完全匹配的路由
  if (routesWithoutLayout.includes(pathname)) {
    return true;
  }

  // 供应商端路由前缀匹配
  if (pathname.startsWith('/supply/')) {
    return true;
  }

  return false;
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  /**
   * Hooks
   */
  const pathname = usePathname();
  const router = useRouter();
  const { message } = App.useApp();
  const intl = useIntl();

  /**
   * States
   */
  const [permissions, setPermissions] = useLocalStorageState<string[]>('permissions');

  const [user, setUser] = useLocalStorageState<{ id: string; name: string }>('user', {
    defaultValue: {
      id: '',
      name: 'CMS',
    },
  });

  const [
    openChangePasswordModal,
    { setFalse: setOpenChangePasswordModalFalse, setTrue: setOpenChangePasswordModalTrue },
  ] = useBoolean(false);

  /**
   * Requests
   */
  useRequest(me, {
    ready: !!user!.id,
    onSuccess: ({ data: { code, data, msg } }) => {
      if (code !== 0) {
        return message.error(msg);
      }

      const { permissions, roles, ...userData } = data;

      setPermissions(permissions);
      setUser(userData);

      store2({ roles, user: userData });
    },
  });

  /**
   * ChildrenProps
   */
  const dropdownProps: DropdownProps = {
    menu: {
      items: [
        {
          key: 'changePassword',
          label: (
            <Space align="center">
              <LockOutlined />
              <FormattedMessage id="c.cpm.changePassword" />
            </Space>
          ),
        },
        {
          key: 'signOut',
          label: (
            <Space align="center">
              <LogoutOutlined />
              <FormattedMessage id="signOut" />
            </Space>
          ),
        },
      ],
      onClick: ({ key }) => {
        // signOut
        if (key === 'signOut') {
          logout()
            .then(({ data: { code, msg } }) => {
              if (code !== 0) {
                message.error(msg);
                return;
              }

              store2.clear();
              router.push('/login');
            })
            .catch((e) => {
              message.error(get(e, 'response.data.msg', 'Error'));
            });
        } else if (key === 'changePassword') {
          setOpenChangePasswordModalTrue();
        }
      },
    },
    placement: 'bottomRight',
  };

  const layoutProps: ProLayoutProps = {
    avatarProps: {
      children: user!.name?.charAt(0).toUpperCase(),
      size: 'small',
      title: user!.name,
      render: (_, dom) => <Dropdown {...dropdownProps}>{dom}</Dropdown>,
    },
    contentStyle: {
      padding: 24,
    },
    layout: 'mix',
    location: {
      pathname,
    },
    logo: '/favicon.svg',
    pure: shouldSkipAuth(pathname),
    route: {
      routes: routes,
    },
    siderWidth: 240,
    title: 'CMS Admin',
    actionsRender: () => [<ComponentLanguage key="language" />],
    menuFooterRender: (props) => `v${props?.collapsed ? '1.0' : '1.0.0'}`,
    menuDataRender: (menuData) => {
      return (
        menuData?.map((item) => {
          const translatedItem = {
            ...item,
            name: item.name ? intl.formatMessage({ id: `m.${item.name}` }) : item.name,
          };

          if (item.children) {
            translatedItem.children = item.children.map((child) => ({
              ...child,
              name: child.name ? intl.formatMessage({ id: `m.${child.name}` }) : child.name,
            }));
          }

          return translatedItem;
        }) || []
      );
    },
    menuItemRender: (item, dom) => {
      if (item.hideInMenu) return null;
      return (
        <div
          onClick={() => {
            if (item.path) {
              router.push(item.path);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          {dom}
        </div>
      );
    },
  };

  /**
   * Effects
   */
  useEffect(() => {
    // Initialize token manager
    const initTokenManager = async () => {
      try {
        const { tokenManager } = await import('@/services/token');
        tokenManager.initialize();
      } catch (error) {
        console.error('Failed to initialize token manager:', error);
      }
    };

    // Check if user is authenticated
    if (!shouldSkipAuth(pathname)) {
      const token = store2.get('token');
      if (!token) {
        const currentPath = encodeURIComponent(pathname);
        router.push(`/login?redirect=${currentPath}`);
        return;
      }

      // Initialize token manager for auto-refresh
      initTokenManager();

      // Verify token is not expired (basic check, detailed check is in tokenManager)
      try {
        const [, payload] = token.split('.');
        if (payload) {
          const { exp } = JSON.parse(atob(payload));
          if (exp && exp < Date.now() / 1000) {
            store2.clear();
            const currentPath = encodeURIComponent(pathname);
            router.push(`/login?redirect=${currentPath}`);
            return;
          }
        }
      } catch (error) {
        console.error('Token validation error:', error);
        store2.clear();
        const currentPath = encodeURIComponent(pathname);
        router.push(`/login?redirect=${currentPath}`);
      }
    }
  }, [pathname, router]);

  // If it's a route that should not have layout, render children directly
  if (shouldSkipAuth(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <DynamicProLayout {...layoutProps}>{children}</DynamicProLayout>

      <ComponentChangePasswordModal
        open={openChangePasswordModal}
        closeModelForm={setOpenChangePasswordModalFalse}
      />
    </>
  );
};

export default AdminLayout;
