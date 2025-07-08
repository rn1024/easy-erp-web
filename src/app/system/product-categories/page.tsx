'use client';

import React, { useState } from 'react';
import { Button, Form, Input, Space, Popconfirm, message, Flex } from 'antd';
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
import CategoryFormDrawer from './components/category-form-drawer';

/**
 * Services
 */
import {
  getProductCategoriesApi,
  deleteProductCategoryApi,
  type ProductCategory,
  type ProductCategoriesParams,
} from '@/services/products';

interface SearchFormData {
  name?: string;
  page?: number;
  pageSize?: number;
}

const ProductCategoriesPage: React.FC = () => {
  const [searchForm] = Form.useForm();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProductCategory | null>(null);
  const [searchParams, setSearchParams] = useState<ProductCategoriesParams>({
    page: 1,
    pageSize: 10,
  });

  // 获取产品分类列表
  const {
    data: categoriesData,
    loading,
    refresh,
  } = useRequest(
    async () => {
      const response = await getProductCategoriesApi(searchParams);
      return response.data;
    },
    {
      refreshDeps: [searchParams],
    }
  );

  // 删除产品分类
  const { run: handleDelete } = useRequest(
    async (id: string) => {
      const response = await deleteProductCategoryApi(id);
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
    setDrawerVisible(true);
  };

  // 打开编辑弹窗
  const handleEdit = (record: ProductCategory) => {
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
  const columns: ProColumns<ProductCategory>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '分类名称',
      dataIndex: 'name',
      width: 200,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (_, record) => new Date(record.createdAt).toLocaleString(),
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
            title="确定要删除这个分类吗？"
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

  const list = categoriesData?.data?.list || [];
  const meta = categoriesData?.data?.meta || { page: 1, pageSize: 10, total: 0, totalPages: 0 };

  // ProTable 配置
  const proTableProps: ProTableProps<ProductCategory, any> = {
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
        新建分类
      </Button>,
      <Button key="refresh" icon={<ReloadOutlined />} onClick={refresh}>
        刷新
      </Button>,
    ],
    scroll: { x: 800 },
  };

  return (
    <>
      {/* 搜索区域 */}
      <ProCard className="mb-16">
        <Form form={searchForm} layout="inline">
          <Flex gap={16} wrap={true}>
            <Form.Item name="name" style={{ marginRight: 0 }}>
              <Input placeholder="输入分类名称" style={{ width: 200 }} />
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

      {/* 分类表单抽屉 */}
      <CategoryFormDrawer open={drawerVisible} entity={editingRecord} closeDrawer={closeDrawer} />
    </>
  );
};

export default ProductCategoriesPage;
