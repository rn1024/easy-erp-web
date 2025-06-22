'use client';

import { ProLayout } from '@ant-design/pro-components';
import { LockOutlined, LogoutOutlined } from '@ant-design/icons';
import { useBoolean, useLocalStorageState, useRequest } from 'ahooks';
import { App, Dropdown, Space } from 'antd';
import { get } from 'lodash';
import { useEffect } from 'react';
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
    loading: () => (
      <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <div style={{ padding: 24 }}>Loading...</div>
      </div>
    ),
  }
);

const routesWithoutLayout = ['/login', '/403'];

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
    pure: routesWithoutLayout.includes(pathname),
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
    // Check if user is authenticated
    if (!routesWithoutLayout.includes(pathname)) {
      const token = store2.get('token');
      if (!token) {
        router.push('/login');
      }
    }
  }, [pathname, router]);

  // If it's a route that should not have layout, render children directly
  if (routesWithoutLayout.includes(pathname)) {
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
