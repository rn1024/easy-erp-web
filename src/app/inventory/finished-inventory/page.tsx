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
import InventoryFormModal from './components/inventory-form-modal';

/**
 * Services
 */
import {
  getFinishedInventoryList,
  deleteFinishedInventory,
  type FinishedInventoryItem,
  type FinishedInventoryQueryParams,
} from '@/services/inventory';
import { getShops } from '@/services/shops';
import { getProductCategoriesApi } from '@/services/products';

const { Option } = Select;

interface SearchFormData {
  shopId?: string;
  categoryId?: string;
  productId?: string;
  location?: string;
  page?: number;
  pageSize?: number;
}

const FinishedInventoryPage: React.FC = () => {
  const [searchForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinishedInventoryItem | null>(null);
  const [searchParams, setSearchParams] = useState<FinishedInventoryQueryParams>({
    page: 1,
    pageSize: 10,
  });

  // 获取成品库存列表
  const {
    data: inventoryData,
    loading,
    refresh,
  } = useRequest(
    async () => {
      const response = await getFinishedInventoryList(searchParams);
      return response.data;
    },
    {
      refreshDeps: [searchParams],
    }
  );

  // 获取店铺列表
  const { data: shopData = [] } = useRequest(async () => {
    const response = await getShops({ pageSize: 100 });
    return response.data?.data?.list || [];
  });

  // 获取产品分类列表
  const { data: categoryData = [] } = useRequest(async () => {
    const response = await getProductCategoriesApi({ pageSize: 100 });
    return response.data?.data?.list || [];
  });

  // 删除成品库存
  const { run: handleDelete } = useRequest(
    async (id: string) => {
      const response = await deleteFinishedInventory(id);
      return response.data;
    },
    {
      manual: true,
      onSuccess: (result) => {
        if (result.code === 0) {
          message.success('删除成功');
          refresh();
        } else {
          message.error(result.msg || '删除失败');
        }
      },
      onError: () => {
        message.error('删除失败');
      },
    }
  );

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
    setModalVisible(true);
  };

  // 打开编辑弹窗
  const handleEdit = (record: FinishedInventoryItem) => {
    setEditingRecord(record);
    setModalVisible(true);
  };

  const closeModal = (reload?: boolean) => {
    setModalVisible(false);
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
          <div>产品名称: {record.product.name || '无名称'}</div>
          {record.product.specification && <div>规格: {record.product.specification}</div>}
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
    pagination: {
      current: Number(searchParams.page) || 1,
      pageSize: Number(searchParams.pageSize) || 20,
      total: meta.total || 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
      onChange: (page, pageSize) => {
        setSearchParams({ ...searchParams, page: page, pageSize: pageSize || 20 });
      },
    },
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

      {/* 成品库存表单弹窗 */}
      <InventoryFormModal
        open={modalVisible}
        entity={editingRecord}
        closeModal={closeModal}
        shopData={shopData}
        categoryData={categoryData}
      />
    </>
  );
};

export default FinishedInventoryPage;
