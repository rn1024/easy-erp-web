'use client';

import React, { useState, useCallback } from 'react';
import { useRequest } from 'ahooks';
import { App, Button, Space, Form, Input, Tag, Avatar, Tooltip, Popconfirm, Flex } from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  TruckOutlined,
} from '@ant-design/icons';

/**
 * Components
 */
import ForwarderFormDrawer from './components/forwarder-form-drawer';

/**
 * Services
 */
import {
  getForwarders,
  getForwarder,
  deleteForwarder,
  type Forwarder,
  type ForwardersParams,
} from '@/services/forwarders';

/**
 * Types
 */
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';
import type { ResType } from '@/types/api';

const ForwardersPage: React.FC = () => {
  /**
   * Hooks
   */
  const { message } = App.useApp();
  const [searchForm] = Form.useForm();

  /**
   * State
   */
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingForwarder, setEditingForwarder] = useState<Forwarder | null>(null);
  const [searchParams, setSearchParams] = useState<ForwardersParams>({
    page: 1,
    pageSize: 20,
  });

  /**
   * Requests
   */
  const {
    data: forwardersData,
    loading,
    refresh,
  } = useRequest(
    async () => {
      const response = await getForwarders(searchParams);
      return response.data;
    },
    {
      refreshDeps: [searchParams],
    }
  );

  const { run: handleDelete } = useRequest(
    async (id: string) => {
      const response = await deleteForwarder(id);
      return response.data;
    },
    {
      manual: true,
      onSuccess: () => {
        message.success('货代删除成功');
        refresh();
      },
      onError: (error: any) => {
        message.error(error.response?.data?.msg || '删除失败');
      },
    }
  );

  const { run: fetchForwarderDetail } = useRequest(
    async (id: string) => {
      const res = await getForwarder(id);
      setEditingForwarder(res.data.data);
      setDrawerVisible(true);
    },
    {
      manual: true,
      onError: (error: any) => {
        message.error(error.response?.data?.msg || '获取货代详情失败');
      },
    }
  );

  /**
   * Event Handlers
   */
  const handleCreateClick = useCallback(() => {
    setEditingForwarder(null);
    setDrawerVisible(true);
  }, []);

  const handleEditClick = useCallback(
    (forwarder: Forwarder) => {
      fetchForwarderDetail(forwarder.id);
    },
    [fetchForwarderDetail]
  );

  const handleDeleteClick = useCallback(
    (forwarder: Forwarder) => {
      handleDelete(forwarder.id);
    },
    [handleDelete]
  );

  const handleSearch = useCallback(
    (values: any) => {
      setSearchParams({
        ...searchParams,
        page: 1,
        nickname: values.nickname?.trim(),
        companyName: values.companyName?.trim(),
      });
    },
    [searchParams]
  );

  const handleResetSearch = useCallback(() => {
    searchForm.resetFields();
    setSearchParams({
      page: 1,
      pageSize: 20,
    });
  }, [searchForm]);

  const closeDrawer = useCallback(
    (reload?: boolean) => {
      setDrawerVisible(false);
      setEditingForwarder(null);
      if (reload) {
        refresh();
      }
    },
    [refresh]
  );

  /**
   * Table Columns
   */
  const columns: ProColumns<Forwarder>[] = [
    {
      title: '序号',
      dataIndex: 'index',
      valueType: 'index',
      width: 50,
      align: 'center',
    },
    {
      title: '货代信息',
      dataIndex: 'nickname',
      width: 200,
      render: (_, record: Forwarder) => (
        <Space>
          <Avatar
            size={40}
            src={record.avatarUrl}
            icon={<TruckOutlined />}
            style={{ backgroundColor: '#1890ff' }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{record.nickname}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.companyName || '个人货代'}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      width: 120,
      ellipsis: true,
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      width: 140,
      ellipsis: true,
    },
    {
      title: '公司名称',
      dataIndex: 'companyName',
      width: 180,
      ellipsis: true,
      render: (_, record: Forwarder) => (
        <Tooltip title={record.companyName}>
          <span>{record.companyName || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '统一社会信用代码',
      dataIndex: 'creditCode',
      width: 150,
      ellipsis: true,
      render: (_, record: Forwarder) => <span>{record.creditCode || '-'}</span>,
    },
    {
      title: '操作员',
      dataIndex: 'operator',
      width: 120,
      ellipsis: true,
      render: (_, record: Forwarder) => <span>{record.operator?.name || '-'}</span>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      fixed: 'right',
      render: (_, record: Forwarder) => [
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEditClick(record)}
        >
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除这个货代吗？"
          onConfirm={() => handleDeleteClick(record)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  /**
   * ProTableProps
   */
  const proTableProps: ProTableProps<Forwarder, ForwardersParams> = {
    columns,
    dataSource: forwardersData?.data?.list || [],
    loading,
    rowKey: 'id',
    pagination: {
      current: Number(searchParams.page) || 1,
      pageSize: Number(searchParams.pageSize) || 20,
      total: forwardersData?.data?.meta?.total || 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
      onChange: (page, pageSize) => {
        setSearchParams({ ...searchParams, page: page, pageSize: pageSize || 20 });
      },
    },
    search: false,
    options: {
      reload: refresh,
      density: false,
      fullScreen: false,
      setting: false,
    },
    toolBarRender: () => [
      <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreateClick}>
        新建货代
      </Button>,
      <Button key="refresh" icon={<ReloadOutlined />} onClick={refresh}>
        刷新
      </Button>,
    ],
    scroll: { x: 1200 },
    size: 'middle',
  };

  return (
    <>
      {/* 搜索区域 */}
      <ProCard className="mb-16">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Flex gap={16} wrap={true}>
            <Form.Item name="nickname" style={{ marginRight: 0 }}>
              <Input allowClear placeholder="货代名称" style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="companyName" style={{ marginRight: 0 }}>
              <Input allowClear placeholder="公司名称" style={{ width: 150 }} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
              搜索
            </Button>
            <Button onClick={handleResetSearch}>重置</Button>
          </Flex>
        </Form>
      </ProCard>

      {/* 表格区域 */}
      <ProTable {...proTableProps} />

      {/* 货代表单抽屉 */}
      <ForwarderFormDrawer
        open={drawerVisible}
        entity={editingForwarder}
        closeDrawer={closeDrawer}
      />
    </>
  );
};

export default ForwardersPage;
