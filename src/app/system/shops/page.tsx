'use client';

import React, { useState } from 'react';
import { Button, Form, Input, Modal, message, Space, Avatar, Popconfirm, Flex } from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';
import { Pagination } from '@/components/ui/pagination';
import {
  getShops,
  createShop,
  updateShop,
  deleteShop,
  type Shop,
  type ShopsParams,
  type ShopFormData,
} from '@/services/shops';

const ShopsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [searchParams, setSearchParams] = useState<ShopsParams>({
    page: 1,
    pageSize: 10,
  });

  // 获取店铺列表
  const {
    data: shopsData,
    loading,
    refresh,
  } = useRequest(() => getShops(searchParams), {
    refreshDeps: [searchParams],
  });

  // 创建店铺
  const { run: handleCreate, loading: createLoading } = useRequest(createShop, {
    manual: true,
    onSuccess: () => {
      message.success('店铺创建成功');
      setModalVisible(false);
      form.resetFields();
      refresh();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.msg || '创建失败');
    },
  });

  // 更新店铺
  const { run: handleUpdate, loading: updateLoading } = useRequest(
    (id: string, data: Partial<ShopFormData>) => updateShop(id, data),
    {
      manual: true,
      onSuccess: () => {
        message.success('店铺更新成功');
        setModalVisible(false);
        form.resetFields();
        setEditingShop(null);
        refresh();
      },
      onError: (error: any) => {
        message.error(error.response?.data?.msg || '更新失败');
      },
    }
  );

  // 删除店铺
  const { run: handleDelete } = useRequest(deleteShop, {
    manual: true,
    onSuccess: () => {
      message.success('店铺删除成功');
      refresh();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.msg || '删除失败');
    },
  });

  // 搜索功能
  const handleSearch = (values: any) => {
    setSearchParams({
      ...searchParams,
      page: 1,
      nickname: values.nickname,
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

  // 表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingShop) {
        handleUpdate(editingShop.id, values);
      } else {
        handleCreate(values);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 打开创建模态框
  const handleCreateClick = () => {
    setEditingShop(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 打开编辑模态框
  const handleEditClick = (record: Shop) => {
    setEditingShop(record);
    form.setFieldsValue({
      nickname: record.nickname,
      avatarUrl: record.avatarUrl,
      responsiblePerson: record.responsiblePerson,
      remark: record.remark,
    });
    setModalVisible(true);
  };

  // 表格列定义
  const columns: ProColumns<Shop>[] = [
    {
      title: '店铺头像',
      dataIndex: 'avatarUrl',
      width: 80,
      render: (_, record) => (
        <Avatar src={record.avatarUrl} icon={<ShopOutlined />} size={40}>
          {!record.avatarUrl && record.nickname.charAt(0)}
        </Avatar>
      ),
    },
    {
      title: '店铺昵称',
      dataIndex: 'nickname',
      render: (_, record) => <strong>{record.nickname}</strong>,
    },
    {
      title: '负责人',
      dataIndex: 'responsiblePerson',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      render: (_, record) => record.remark || '-',
    },
    {
      title: '操作员',
      dataIndex: 'operator',
      render: (_, record) => record.operator?.name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (_, record) => new Date(record.createdAt).toLocaleString(),
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditClick(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个店铺吗？"
            description="删除后将无法恢复，请谨慎操作。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ProTable 配置
  const proTableProps: ProTableProps<Shop, any> = {
    columns,
    dataSource: shopsData?.data?.data?.list || [],
    loading,
    rowKey: 'id',
    search: false,
    pagination: false,
    options: {
      reload: refresh,
    },
    toolBarRender: () => [
      <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreateClick}>
        新建店铺
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
            <Form.Item name="nickname" style={{ marginRight: 0 }}>
              <Input allowClear placeholder="请输入店铺昵称" style={{ width: 200 }} />
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
        size={Number(searchParams.pageSize) || 10}
        total={shopsData?.data?.data?.meta?.total || 0}
        hasMore={false}
        searchAfter=""
        onChange={({ page, size }) => {
          setSearchParams({
            ...searchParams,
            page: page,
            pageSize: size || 10,
          });
        }}
        isLoading={loading}
      />

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingShop ? '编辑店铺' : '新建店铺'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingShop(null);
        }}
        confirmLoading={createLoading || updateLoading}
        width={600}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="nickname"
            label="店铺昵称"
            rules={[
              { required: true, message: '请输入店铺昵称' },
              { max: 50, message: '店铺昵称不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入店铺昵称" />
          </Form.Item>

          <Form.Item
            name="avatarUrl"
            label="店铺头像"
            rules={[{ type: 'url', message: '请输入有效的URL地址' }]}
          >
            <Input placeholder="请输入店铺头像URL（可选）" />
          </Form.Item>

          <Form.Item
            name="responsiblePerson"
            label="负责人"
            rules={[
              { required: true, message: '请输入负责人姓名' },
              { max: 20, message: '负责人姓名不能超过20个字符' },
            ]}
          >
            <Input placeholder="请输入负责人姓名" />
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注"
            rules={[{ max: 500, message: '备注不能超过500个字符' }]}
          >
            <Input.TextArea placeholder="请输入备注信息（可选）" rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ShopsPage;
