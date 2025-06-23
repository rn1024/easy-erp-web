'use client';

import {
  HomeOutlined,
  TeamOutlined,
  SettingOutlined,
  UserOutlined,
  CloudUploadOutlined,
  ShopOutlined,
  GlobalOutlined,
  TruckOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  InboxOutlined,
  TagOutlined,
  AppstoreOutlined,
  DropboxOutlined,
  ShoppingCartOutlined,
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

  /* ERP基础数据管理 */
  {
    icon: <DatabaseOutlined />,
    name: 'ERP-Data-Management',
    key: '/erp',
    children: [
      {
        icon: <ShopOutlined />,
        name: 'ERP-Data-Management_Shops',
        path: '/system/shops',
        key: '/system/shops',
      },
      {
        icon: <GlobalOutlined />,
        name: 'ERP-Data-Management_Suppliers',
        path: '/system/suppliers',
        key: '/system/suppliers',
      },
      {
        icon: <TruckOutlined />,
        name: 'ERP-Data-Management_Forwarders',
        path: '/system/forwarders',
        key: '/system/forwarders',
      },
    ],
  },

  /* 库存管理 */
  {
    name: 'Inventory-Management',
    icon: <AppstoreOutlined />,
    key: '/inventory',
    children: [
      {
        icon: <InboxOutlined />,
        name: 'Inventory-Management_Finished',
        path: '/system/finished-inventory',
        key: '/system/finished-inventory',
      },
      {
        icon: <DropboxOutlined />,
        name: 'Inventory-Management_Spare',
        path: '/system/spare-inventory',
        key: '/system/spare-inventory',
      },
    ],
  },

  /* 采购管理 */
  {
    name: 'Purchase-Management',
    icon: <ShoppingCartOutlined />,
    key: '/purchase',
    children: [
      {
        icon: <ShoppingCartOutlined />,
        name: 'Purchase-Management_Orders',
        path: '/system/purchase-orders',
        key: '/system/purchase-orders',
      },
    ],
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
      {
        icon: <FileTextOutlined />,
        name: 'System-Management_Logs',
        path: '/system/logs',
        key: '/system/logs',
      },
    ],
  },
  {
    name: 'Products-Management',
    icon: <InboxOutlined />,
    path: '/products',
    key: '/products',
    children: [
      {
        icon: <TagOutlined />,
        name: 'Products-Management_Categories',
        path: '/system/product-categories',
        key: '/system/product-categories',
      },
      {
        icon: <InboxOutlined />,
        name: 'Products-Management_Products',
        path: '/system/products',
        key: '/system/products',
      },
    ],
  },
];

export default routes;
