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
  GlobalOutlined,
} from '@ant-design/icons';
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';
import { Pagination } from '@/components/ui/pagination';

/**
 * Components
 */
import SupplierFormDrawer from './components/supplier-form-drawer';

// 服务
import {
  getSuppliers,
  deleteSupplier as deleteSupplierApi,
  type Supplier,
  type SuppliersParams,
} from '@/services/suppliers';

interface SearchFormData {
  nickname?: string;
}

const SuppliersPage: React.FC = () => {
  const { message } = App.useApp();
  const [searchForm] = Form.useForm();

  // 状态管理
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchParams, setSearchParams] = useState<SuppliersParams>({
    page: 1,
    pageSize: 10,
  });

  // 获取供应商列表
  const {
    data: suppliersData,
    loading,
    refresh,
  } = useRequest(() => getSuppliers(searchParams), {
    refreshDeps: [searchParams],
    onError: (error) => {
      console.error('获取供应商列表失败:', error);
      message.error('获取供应商列表失败');
    },
  });

  // 删除供应商
  const { loading: deleting, run: deleteSupplier } = useRequest(deleteSupplierApi, {
    manual: true,
    onSuccess: (response: any) => {
      if (response?.data?.code === 200) {
        message.success('删除供应商成功');
        refresh();
      } else {
        message.error(response?.data?.msg || '删除供应商失败');
      }
    },
    onError: (error) => {
      console.error('删除供应商失败:', error);
      message.error('删除供应商失败');
    },
  });

  // 搜索处理
  const handleSearch = useCallback((values: SearchFormData) => {
    setSearchParams((prev: SuppliersParams) => ({
      ...prev,
      page: 1,
      nickname: values.nickname || undefined,
    }));
  }, []);

  // 重置搜索
  const handleResetSearch = useCallback(() => {
    searchForm.resetFields();
    setSearchParams({
      page: 1,
      pageSize: 10,
    });
  }, [searchForm]);

  // 打开创建/编辑抽屉
  const handleOpenDrawer = useCallback((supplier?: Supplier) => {
    setEditingSupplier(supplier || null);
    setDrawerVisible(true);
  }, []);

  // 关闭抽屉
  const closeDrawer = useCallback(
    (reload?: boolean) => {
      setDrawerVisible(false);
      setEditingSupplier(null);
      if (reload) {
        refresh();
      }
    },
    [refresh]
  );

  // 删除供应商
  const handleDelete = useCallback(
    (id: string) => {
      deleteSupplier(id);
    },
    [deleteSupplier]
  );

  // 表格列定义
  const columns: ProColumns<Supplier>[] = [
    {
      title: '供应商信息',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatarUrl} icon={<GlobalOutlined />} size="small" />
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
          <Tag color="blue">{record.creditCode}</Tag>
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
      title: '生产周期',
      dataIndex: 'productionDays',
      width: 80,
      render: (_, record) => `${record.productionDays}天`,
    },
    {
      title: '交货周期',
      dataIndex: 'deliveryDays',
      width: 80,
      render: (_, record) => `${record.deliveryDays}天`,
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
              onClick={() => handleOpenDrawer(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个供应商吗？"
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

  const suppliers = suppliersData?.data?.data?.list || [];
  const meta = suppliersData?.data?.data?.meta || { total: 0, page: 1, pageSize: 10 };

  // ProTable 配置
  const proTableProps: ProTableProps<Supplier, any> = {
    columns,
    dataSource: suppliers,
    loading,
    rowKey: 'id',
    search: false,
    pagination: false,
    options: {
      reload: refresh,
    },
    toolBarRender: () => [
      <Button
        key="create"
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => handleOpenDrawer()}
      >
        新建供应商
      </Button>,
      <Button key="refresh" icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
        刷新
      </Button>,
    ],
    scroll: { x: 1200 },
  };

  return (
    <>
      {/* 搜索区域 */}
      <ProCard className="mb-16">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Flex gap={16} wrap={true}>
            <Form.Item name="nickname" style={{ marginRight: 0 }}>
              <Input placeholder="请输入供应商昵称" style={{ width: 200 }} allowClear />
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

      {/* 分页区域 */}
      <Pagination
        current={Number(searchParams.page) || 1}
        size={Number(searchParams.pageSize) || 10}
        total={meta.total || 0}
        hasMore={false}
        searchAfter=""
        onChange={({ page, size }) => {
          setSearchParams((prev: SuppliersParams) => ({
            ...prev,
            page,
            pageSize: size || 10,
          }));
        }}
        isLoading={loading}
      />

      {/* 供应商表单抽屉 */}
      <SupplierFormDrawer open={drawerVisible} entity={editingSupplier} closeDrawer={closeDrawer} />
    </>
  );
};

export default SuppliersPage;
