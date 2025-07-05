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
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';
import { Pagination } from '@/components/ui/pagination';

/**
 * Components
 */
import ForwarderFormDrawer from './components/forwarder-form-drawer';
import type { Forwarder, ForwardersParams } from './components/forwarder-form-drawer';

// 使用货代API（复用forwarders路由）
import axios from '@/services/index';
import type { ResType } from '@/types/api';

// 获取货代列表
const getForwarders = (params: ForwardersParams) => {
  return axios<
    ResType<{
      list: Forwarder[];
      meta: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    }>
  >('/forwarding-agents', {
    method: 'get',
    params,
  });
};

// 删除货代
const deleteForwarder = (id: string) => {
  return axios<ResType<null>>(`/forwarding-agents/${id}`, {
    method: 'delete',
  });
};

interface SearchFormData {
  nickname?: string;
}

const ForwardersPage: React.FC = () => {
  const { message } = App.useApp();
  const [searchForm] = Form.useForm();

  // 状态管理
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingForwarder, setEditingForwarder] = useState<Forwarder | null>(null);
  const [searchParams, setSearchParams] = useState<ForwardersParams>({
    page: 1,
    pageSize: 10,
  });

  // 获取货代列表
  const {
    data: forwardersData,
    loading,
    refresh,
  } = useRequest(() => getForwarders(searchParams), {
    refreshDeps: [searchParams],
    onError: (error) => {
      console.error('获取货代列表失败:', error);
      message.error('获取货代列表失败');
    },
  });

  // 删除货代
  const { loading: deleting, run: deleteForwarderRun } = useRequest(deleteForwarder, {
    manual: true,
    onSuccess: (response: any) => {
      if (response?.data?.code === 200) {
        message.success('删除货代成功');
        refresh();
      } else {
        message.error(response?.data?.msg || '删除货代失败');
      }
    },
    onError: (error) => {
      console.error('删除货代失败:', error);
      message.error('删除货代失败');
    },
  });

  // 搜索处理
  const handleSearch = useCallback(() => {
    const values = searchForm.getFieldsValue();
    setSearchParams((prev: ForwardersParams) => ({
      ...prev,
      page: 1,
      nickname: values.nickname || undefined,
    }));
  }, [searchForm]);

  // 重置搜索
  const handleResetSearch = useCallback(() => {
    searchForm.resetFields();
    setSearchParams({
      page: 1,
      pageSize: 10,
    });
  }, [searchForm]);

  // 打开创建抽屉
  const handleCreate = useCallback(() => {
    setEditingForwarder(null);
    setDrawerVisible(true);
  }, []);

  // 打开编辑抽屉
  const handleEdit = useCallback((forwarder: Forwarder) => {
    setEditingForwarder(forwarder);
    setDrawerVisible(true);
  }, []);

  // 关闭抽屉
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

  // 删除货代
  const handleDelete = useCallback(
    (id: string) => {
      deleteForwarderRun(id);
    },
    [deleteForwarderRun]
  );

  // 表格列定义
  const columns: ProColumns<Forwarder>[] = [
    {
      title: '货代信息',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatarUrl} icon={<TruckOutlined />} size="small" />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.nickname}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.companyName}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '联系信息',
      width: 160,
      render: (_, record) => (
        <div>
          <div>{record.contactPerson}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.contactPhone}</div>
        </div>
      ),
    },
    {
      title: '统一社会信用代码',
      dataIndex: 'creditCode',
      width: 180,
      render: (_, record) => (
        <Tooltip title={record.creditCode}>
          <Tag color="green">{record.creditCode}</Tag>
        </Tooltip>
      ),
    },
    {
      title: '银行信息',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{record.bankName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.bankAccount}</div>
        </div>
      ),
    },
    {
      title: '操作员',
      dataIndex: 'operator',
      width: 100,
      render: (_, record) => record.operator?.name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 120,
      render: (_, record) => new Date(record.createdAt).toLocaleDateString(),
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个货代吗？"
              description="删除后将无法恢复"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
                loading={deleting}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const forwarders = forwardersData?.data?.data?.list || [];
  const meta = forwardersData?.data?.data?.meta || { total: 0, page: 1, pageSize: 10 };

  // ProTable 配置
  const proTableProps: ProTableProps<Forwarder, any> = {
    columns,
    dataSource: forwarders,
    loading,
    rowKey: 'id',
    search: false,
    pagination: false,
    options: {
      reload: refresh,
    },
    toolBarRender: () => [
      <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
        新建货代
      </Button>,
      <Button key="refresh" icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
        刷新
      </Button>,
    ],
    scroll: { x: 1000 },
  };

  return (
    <>
      {/* 搜索区域 */}
      <ProCard className="mb-16">
        <Form form={searchForm} layout="inline">
          <Flex gap={16} wrap={true}>
            <Form.Item name="nickname" style={{ marginRight: 0 }}>
              <Input placeholder="请输入货代昵称" style={{ width: 200 }} allowClear />
            </Form.Item>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={loading}
            >
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleResetSearch}>
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
        total={meta.total}
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
