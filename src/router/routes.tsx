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
  DollarOutlined,
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
        path: '/basic-data/shops',
        key: '/basic-data/shops',
      },
      {
        icon: <GlobalOutlined />,
        name: 'ERP-Data-Management_Suppliers',
        path: '/basic-data/suppliers',
        key: '/basic-data/suppliers',
      },
      {
        icon: <TruckOutlined />,
        name: 'ERP-Data-Management_Forwarders',
        path: '/basic-data/forwarders',
        key: '/basic-data/forwarders',
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
        path: '/inventory/finished-inventory',
        key: '/inventory/finished-inventory',
      },
      {
        icon: <DropboxOutlined />,
        name: 'Inventory-Management_Spare',
        path: '/inventory/spare-inventory',
        key: '/inventory/spare-inventory',
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
        path: '/purchase/purchase-orders',
        key: '/purchase/purchase-orders',
      },
    ],
  },

  /* 仓库管理 */
  {
    name: 'Warehouse-Management',
    icon: <InboxOutlined />,
    key: '/warehouse',
    children: [
      {
        icon: <InboxOutlined />,
        name: 'Warehouse-Management_Packaging-Tasks',
        path: '/warehouse/packaging-tasks',
        key: '/warehouse/packaging-tasks',
      },
    ],
  },

  /* FBA发货管理 */
  {
    name: 'Delivery-Management',
    icon: <TruckOutlined />,
    key: '/delivery',
    children: [
      {
        icon: <TruckOutlined />,
        name: 'Delivery-Management_Records',
        path: '/delivery/delivery-records',
        key: '/delivery/delivery-records',
      },
    ],
  },

  /* 财务管理 */
  {
    name: 'Financial-Management',
    icon: <DollarOutlined />,
    key: '/financial',
    children: [
      {
        icon: <DollarOutlined />,
        name: 'Financial-Management_Reports',
        path: '/finance/financial-reports',
        key: '/finance/financial-reports',
      },
    ],
  },

  /* 文件管理 */
  // {
  //   icon: <CloudUploadOutlined />,
  //   name: 'Files',
  //   path: '/files',
  //   key: '/files',
  // },

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
        path: '/products/product-categories',
        key: '/products/product-categories',
      },
      {
        icon: <InboxOutlined />,
        name: 'Products-Management_Products',
        path: '/products/products',
        key: '/products/products',
      },
    ],
  },
];

export default routes;
