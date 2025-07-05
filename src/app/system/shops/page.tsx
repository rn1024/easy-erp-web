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
import { Pagination } from '@/components/ui/pagination';
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

  // ProTable Props
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

      {/* 店铺表单抽屉 */}
      <ShopFormDrawer open={drawerVisible} entity={editingShop} closeDrawer={closeDrawer} />
    </>
  );
};

export default ShopsPage;
