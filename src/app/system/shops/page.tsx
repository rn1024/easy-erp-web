'use client';

// 第三方库
import React, { useState } from 'react';
import { useRequest } from 'ahooks';
import { Button, Form, Input, message, Space, Avatar, Popconfirm, Flex } from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';

// Utils工具类
import ShopFormDrawer from './components/shop-form-drawer';

// APIs接口
import { getShops, deleteShop, type Shop, type ShopsParams } from '@/services/shops';

const ShopsPage: React.FC = () => {
  // Hooks
  const [searchForm] = Form.useForm();

  // State
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [searchParams, setSearchParams] = useState<ShopsParams>({
    page: 1,
    pageSize: 10,
  });

  // Requests
  const {
    data: shopsData,
    loading,
    refresh,
  } = useRequest(() => getShops(searchParams), {
    refreshDeps: [searchParams],
  });

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

  // Event Handlers
  const handleSearch = (values: any) => {
    setSearchParams({
      ...searchParams,
      page: 1,
      nickname: values.nickname,
    });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({
      page: 1,
      pageSize: 10,
    });
  };

  const handleCreateClick = () => {
    setEditingShop(null);
    setDrawerVisible(true);
  };

  const handleEditClick = (record: Shop) => {
    setEditingShop(record);
    setDrawerVisible(true);
  };

  const closeDrawer = (reload?: boolean) => {
    setDrawerVisible(false);
    setEditingShop(null);
    if (reload) {
      refresh();
    }
  };

  // Table Columns
  const columns: ProColumns<Shop>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '店铺Logo',
      dataIndex: 'avatarUrl',
      width: 80,
      render: (_, record) => (
        <Avatar
          src={record.avatarUrl}
          icon={<ShopOutlined />}
          size="large"
          shape="square"
          style={{ backgroundColor: '#f0f0f0' }}
        />
      ),
    },
    {
      title: '店铺昵称',
      dataIndex: 'nickname',
    },
    {
      title: '店铺名称',
      dataIndex: 'name',
    },
    {
      title: '店铺代码',
      dataIndex: 'code',
      width: 120,
    },
    {
      title: '国家/地区',
      dataIndex: 'country',
      width: 120,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEditClick(record)} />
          <Popconfirm
            title="确定删除此店铺吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ProTable Props
  const proTableProps: ProTableProps<Shop, ShopsParams> = {
    columns,
    dataSource: shopsData?.data?.data?.list || [],
    loading,
    rowKey: 'id',
    search: false,
    pagination: {
      current: Number(searchParams.page) || 1,
      pageSize: Number(searchParams.pageSize) || 10,
      total: shopsData?.data?.data?.meta?.total || 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
      onChange: (page, pageSize) => {
        setSearchParams({
          ...searchParams,
          page: page,
          pageSize: pageSize || 10,
        });
      },
    },
    options: {
      reload: refresh,
    },
    toolBarRender: () => [
      <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreateClick}>
        新增店铺
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
              <Input placeholder="请输入店铺昵称" style={{ width: 200 }} allowClear />
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

      {/* 店铺表单抽屉 */}
      <ShopFormDrawer open={drawerVisible} entity={editingShop} closeDrawer={closeDrawer} />
    </>
  );
};

export default ShopsPage;
