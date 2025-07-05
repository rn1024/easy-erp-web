'use client';

import React, { useState } from 'react';
import { Button, Modal, Form, Input, Space, Popconfirm, message, Flex } from 'antd';
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
import { Pagination } from '@/components/ui/pagination';

interface ProductCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
  };
}

interface SearchFormData {
  name?: string;
  page?: number;
  pageSize?: number;
}

// 内嵌API调用函数
const getCategoryList = async (params: any = {}) => {
  const response = await fetch('/api/v1/product-categories?' + new URLSearchParams(params), {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.json();
};

const createCategory = async (data: any) => {
  const response = await fetch('/api/v1/product-categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

const updateCategory = async (id: string, data: any) => {
  const response = await fetch(`/api/v1/product-categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

const deleteCategory = async (id: string) => {
  const response = await fetch(`/api/v1/product-categories/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.json();
};

export default function ProductCategoriesPage() {
  const [searchForm] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [editingRecord, setEditingRecord] = useState<ProductCategory | null>(null);
  const [searchParams, setSearchParams] = useState<SearchFormData>({
    page: 1,
    pageSize: 20,
  });

  // 获取分类列表
  const {
    data: categoryData,
    loading,
    refresh,
  } = useRequest(() => getCategoryList(searchParams), {
    refreshDeps: [searchParams],
  });

  // 创建/更新分类
  const { run: submitCategory, loading: submitting } = useRequest(
    async (values: any) => {
      if (modalType === 'create') {
        return createCategory(values);
      } else {
        return updateCategory(editingRecord!.id, values);
      }
    },
    {
      manual: true,
      onSuccess: (result) => {
        if (result.code === 200) {
          message.success(modalType === 'create' ? '创建成功' : '更新成功');
          setIsModalVisible(false);
          modalForm.resetFields();
          setEditingRecord(null);
          refresh();
        } else {
          message.error(result.msg || '操作失败');
        }
      },
      onError: () => {
        message.error('操作失败');
      },
    }
  );

  // 删除分类
  const { run: handleDelete } = useRequest(deleteCategory, {
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

  const handleSearch = (values: SearchFormData) => {
    setSearchParams({ ...searchParams, ...values, page: 1 });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({ page: 1, pageSize: 20 });
  };

  const handleCreate = () => {
    setModalType('create');
    setEditingRecord(null);
    modalForm.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: ProductCategory) => {
    setModalType('edit');
    setEditingRecord(record);
    modalForm.setFieldsValue({
      name: record.name,
    });
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    modalForm.submit();
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    modalForm.resetFields();
    setEditingRecord(null);
  };

  const handleFormSubmit = (values: any) => {
    submitCategory(values);
  };

  const columns: ProColumns<ProductCategory>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      render: (_, record) => record.id.slice(-8),
    },
    {
      title: '分类名称',
      dataIndex: 'name',
    },
    {
      title: '产品数量',
      dataIndex: '_count',
      width: 100,
      render: (_, record) => record._count?.products || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (_, record) => new Date(record.createdAt).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      render: (_, record) => new Date(record.updatedAt).toLocaleString(),
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ padding: 0 }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个分类吗？"
            description={
              record._count?.products > 0
                ? '该分类下还有产品，删除后相关产品将无法分类'
                : '删除后无法恢复'
            }
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />} style={{ padding: 0 }}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const categories = categoryData?.data?.list || [];
  const meta = categoryData?.data?.meta || {};

  // ProTable 配置
  const proTableProps: ProTableProps<ProductCategory, any> = {
    columns,
    dataSource: categories,
    loading,
    rowKey: 'id',
    search: false,
    pagination: false,
    options: {
      reload: refresh,
    },
    toolBarRender: () => [
      <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
        新增分类
      </Button>,
      <Button key="refresh" icon={<ReloadOutlined />} onClick={refresh}>
        刷新
      </Button>,
    ],
  };

  return (
    <>
      {/* 搜索区域 */}
      <ProCard className="mb-16">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Flex gap={16} wrap={true}>
            <Form.Item name="name" style={{ marginRight: 0 }}>
              <Input placeholder="请输入分类名称" allowClear style={{ width: 200 }} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Flex>
        </Form>
      </ProCard>

      {/* 表格区域 */}
      <ProTable {...proTableProps} />

      {/* 分页区域 */}
      <Pagination
        current={Number(searchParams.page) || 1}
        size={Number(searchParams.pageSize) || 20}
        total={meta.total || 0}
        hasMore={false}
        searchAfter=""
        onChange={({ page, size }) => {
          setSearchParams({ ...searchParams, page, pageSize: size || 20 });
        }}
        isLoading={loading}
      />

      <Modal
        title={modalType === 'create' ? '新增产品分类' : '编辑产品分类'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={modalForm} layout="vertical" onFinish={handleFormSubmit} preserve={false}>
          <Form.Item
            name="name"
            label="分类名称"
            rules={[
              { required: true, message: '请输入分类名称' },
              { max: 50, message: '分类名称不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入分类名称" maxLength={50} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
