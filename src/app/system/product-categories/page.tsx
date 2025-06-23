'use client';

import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import type { ColumnsType } from 'antd/es/table';

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
  const [searchParams, setSearchParams] = useState<SearchFormData>({});

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
    setSearchParams({ ...values, page: 1 });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({});
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

  const columns: ColumnsType<ProductCategory> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (text: string) => text.slice(-8),
    },
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '产品数量',
      dataIndex: '_count',
      key: 'productCount',
      width: 100,
      render: (count: any) => count?.products || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
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
            description={record._count?.products > 0 ? "该分类下还有产品，删除后相关产品将无法分类" : "删除后无法恢复"}
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              style={{ padding: 0 }}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const categories = categoryData?.data?.list || [];
  const meta = categoryData?.data?.meta || {};

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={18}>
              <Form
                form={searchForm}
                layout="inline"
                onFinish={handleSearch}
                style={{ marginBottom: 0 }}
              >
                <Form.Item name="name" label="分类名称">
                  <Input placeholder="请输入分类名称" allowClear />
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                      搜索
                    </Button>
                    <Button onClick={handleReset} icon={<ReloadOutlined />}>
                      重置
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                新增分类
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={categories}
          loading={loading}
          rowKey="id"
          pagination={{
            current: meta.page || 1,
            pageSize: meta.pageSize || 20,
            total: meta.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            onChange: (page, pageSize) => {
              setSearchParams({ ...searchParams, page, pageSize });
            },
          }}
        />
      </Card>

      <Modal
        title={modalType === 'create' ? '新增产品分类' : '编辑产品分类'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form
          form={modalForm}
          layout="vertical"
          onFinish={handleFormSubmit}
          preserve={false}
        >
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
    </div>
  );
}
