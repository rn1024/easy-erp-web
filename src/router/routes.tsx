'use client';

import {
  HomeOutlined,
  TeamOutlined,
  SettingOutlined,
  UserOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import type { MenuDataItem } from '@ant-design/pro-components';

const routes: MenuDataItem[] = [
  /* 首页 Home */
  {
    icon: <HomeOutlined />,
    name: 'Home',
    path: '/dashboard',
    key: '/dashboard',
  },

  /* 文件管理 */
  {
    icon: <CloudUploadOutlined />,
    name: 'Files',
    path: '/files',
    key: '/files',
  },

  /* 系统管理 */
  {
    icon: <SettingOutlined />,
    name: 'System-Management',
    key: '/system',
    children: [
      {
        icon: <UserOutlined />,
        name: 'System-Management_Accounts',
        path: '/system/accounts',
        key: '/system/accounts',
      },
      {
        icon: <TeamOutlined />,
        name: 'System-Management_Roles',
        path: '/system/roles',
        key: '/system/roles',
      },
    ],
  },
];

export default routes;
