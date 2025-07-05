'use client';

import React, { useState } from 'react';
import { Button, Form, Input, Select, Space, Popconfirm, message, Tag, Flex } from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';

/**
 * Components
 */
import InventoryFormDrawer from './components/inventory-form-drawer';

const { Option } = Select;

interface FinishedInventoryItem {
  id: string;
  shopId: string;
  categoryId: string;
  productId: string;
  boxSize?: string;
  packQuantity: number;
  weight?: number;
  location?: string;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
  shop: {
    id: string;
    nickname: string;
  };
  category: {
    id: string;
    name: string;
  };
  product: {
    id: string;
    code: string;
    sku: string;
    specification?: string;
    color?: string;
  };
}

interface SearchFormData {
  shopId?: string;
  categoryId?: string;
  productId?: string;
  location?: string;
  page?: number;
  pageSize?: number;
}

// 内嵌API调用函数
const getInventoryList = async (params: any = {}) => {
  const response = await fetch('/api/v1/finished-inventory?' + new URLSearchParams(params), {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.json();
};

const deleteInventory = async (id: string) => {
  const response = await fetch(`/api/v1/finished-inventory/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.json();
};

const getShops = async () => {
  const response = await fetch('/api/v1/shops?pageSize=100', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  const result = await response.json();
  return result.data?.list || [];
};

const getCategories = async () => {
  const response = await fetch('/api/v1/product-categories?pageSize=100', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  const result = await response.json();
  return result.data?.list || [];
};

const FinishedInventoryPage: React.FC = () => {
  const [searchForm] = Form.useForm();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinishedInventoryItem | null>(null);
  const [searchParams, setSearchParams] = useState<SearchFormData>({
    page: 1,
    pageSize: 10,
  });

  // 获取成品库存列表
  const {
    data: inventoryData,
    loading,
    refresh,
  } = useRequest(() => getInventoryList(searchParams), {
    refreshDeps: [searchParams],
  });

  // 获取店铺列表
  const { data: shopData = [] } = useRequest(getShops);

  // 获取产品分类列表
  const { data: categoryData = [] } = useRequest(getCategories);

  // 删除成品库存
  const { run: handleDelete } = useRequest(deleteInventory, {
    manual: true,
    onSuccess: (result) => {
      if (result.code === 200) {
        message.success('删除成功');
        refresh();
      } else {
        message.error(result.msg || '删除失败');
      }
    },
    onError: () => {
      message.error('删除失败');
    },
  });

  // 搜索处理
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    setSearchParams({
      ...values,
      page: 1,
      pageSize: searchParams.pageSize,
    });
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({
      page: 1,
      pageSize: 10,
    });
  };

  // 打开新建弹窗
  const handleCreate = () => {
    setEditingRecord(null);
    setDrawerVisible(true);
  };

  // 打开编辑弹窗
  const handleEdit = (record: FinishedInventoryItem) => {
    setEditingRecord(record);
    setDrawerVisible(true);
  };

  const closeDrawer = (reload?: boolean) => {
    setDrawerVisible(false);
    setEditingRecord(null);
    if (reload) {
      refresh();
    }
  };

  // 表格列配置
  const columns: ProColumns<FinishedInventoryItem>[] = [
    {
      title: '店铺',
      dataIndex: ['shop', 'nickname'],
      width: 120,
    },
    {
      title: '产品分类',
      dataIndex: ['category', 'name'],
      width: 120,
    },
    {
      title: '产品信息',
      width: 200,
      render: (_, record) => (
        <div>
          <div>编码: {record.product.code}</div>
          <div>SKU: {record.product.sku}</div>
          {record.product.specification && <div>规格: {record.product.specification}</div>}
          {record.product.color && <Tag color="blue">{record.product.color}</Tag>}
        </div>
      ),
    },
    {
      title: '包装信息',
      width: 150,
      render: (_, record) => (
        <div>
          {record.boxSize && <div>箱型: {record.boxSize}</div>}
          <div>装箱数: {record.packQuantity}</div>
          {record.weight && <div>重量: {record.weight}kg</div>}
        </div>
      ),
    },
    {
      title: '存储位置',
      dataIndex: 'location',
      width: 120,
      render: (_, record) => record.location || '-',
    },
    {
      title: '库存数量',
      dataIndex: 'stockQuantity',
      width: 100,
      render: (_, record) => (
        <Tag color={record.stockQuantity > 0 ? 'green' : 'red'}>{record.stockQuantity}</Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 160,
      render: (_, record) => new Date(record.updatedAt).toLocaleString(),
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const list = inventoryData?.data?.list || [];
  const meta = inventoryData?.data?.meta || { page: 1, pageSize: 10, total: 0, totalPages: 0 };

  // ProTable 配置
  const proTableProps: ProTableProps<FinishedInventoryItem, any> = {
    columns,
    dataSource: list,
    loading,
    rowKey: 'id',
    search: false,
    pagination: false,
    options: {
      reload: refresh,
    },
    toolBarRender: () => [
      <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
        新建库存记录
      </Button>,
      <Button key="refresh" icon={<ReloadOutlined />} onClick={refresh}>
        刷新
      </Button>,
    ],
    scroll: { x: 1200 },
  };

  return (
    <>
      {/* 搜索区域 */}
      <ProCard className="mb-16">
        <Form form={searchForm} layout="inline">
          <Flex gap={16} wrap={true}>
            <Form.Item name="shopId" style={{ marginRight: 0 }}>
              <Select
                placeholder="选择店铺"
                allowClear
                style={{ width: 150 }}
                showSearch
                optionFilterProp="children"
              >
                {shopData.map((shop: any) => (
                  <Option key={shop.id} value={shop.id}>
                    {shop.nickname}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="categoryId" style={{ marginRight: 0 }}>
              <Select
                placeholder="选择分类"
                allowClear
                style={{ width: 150 }}
                showSearch
                optionFilterProp="children"
              >
                {categoryData.map((category: any) => (
                  <Option key={category.id} value={category.id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="location" style={{ marginRight: 0 }}>
              <Input placeholder="输入位置" style={{ width: 150 }} />
            </Form.Item>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={loading}
            >
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Flex>
        </Form>
      </ProCard>

      {/* 表格区域 */}
      <ProTable {...proTableProps} />

      {/* 分页区域 */}
      <Pagination
        current={Number(searchParams.page) || 1}
        size={Number(searchParams.pageSize) || 10}
        total={meta.total || 0}
        hasMore={false}
        searchAfter=""
        onChange={({ page, size }) => {
          setSearchParams({
            ...searchParams,
            page,
            pageSize: size || 10,
          });
        }}
        isLoading={loading}
      />

      {/* 成品库存表单抽屉 */}
      <InventoryFormDrawer
        open={drawerVisible}
        entity={editingRecord}
        closeDrawer={closeDrawer}
        shopData={shopData}
        categoryData={categoryData}
      />
    </>
  );
};

export default FinishedInventoryPage;
