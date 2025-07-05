'use client';

// 第三方库
import React, { useState } from 'react';
import { useRequest, useSetState } from 'ahooks';
import { App, Button, Form, Input, Select, Space, Tag, Tooltip, Popconfirm, Flex } from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';

// Utils工具类
import { Pagination } from '@/components/ui/pagination';
import AccountFormDrawer from './components/account-form-drawer';
import AccountPasswordDrawer from './components/account-password-drawer';

// APIs接口
import { accounts, dAccount, rAccount } from '@/services/account';
import { roleListApi } from '@/services/roles';

// Types类型定义
import type { AccountsParams, AccountsResponse } from '@/services/account';
import type { RoleDataResult } from '@/services/roles';

interface State {
  drawerVisible: boolean;
  passwordDrawerVisible: boolean;
  editingRecord: AccountsResponse | null;
  selectedRowKeys: string[];
}

const AccountsPage: React.FC = () => {
  // Hooks
  const { message } = App.useApp();
  const [searchForm] = Form.useForm();

  // State
  const [state, setState] = useSetState<State>({
    drawerVisible: false,
    passwordDrawerVisible: false,
    editingRecord: null,
    selectedRowKeys: [],
  });

  const [searchParams, setSearchParams] = useState<AccountsParams>({
    page: 1,
    limit: 20,
    withRole: true,
  });

  // Requests
  const {
    data: accountsData,
    loading,
    refresh,
  } = useRequest(() => accounts(searchParams), {
    refreshDeps: [searchParams],
    onSuccess: (response: any) => {
      if (response?.data?.code !== 0) {
        message.error(response?.data?.msg || '获取账户列表失败');
      }
    },
  });

  const { data: rolesData } = useRequest(() => roleListApi({ page: 1, limit: 100 }), {
    onSuccess: (response: any) => {
      if (response?.data?.code !== 0) {
        message.error(response?.data?.msg || '获取角色列表失败');
      }
    },
  });

  const { run: handleDelete } = useRequest(dAccount, {
    manual: true,
    onSuccess: (response: any) => {
      if (response?.data?.code === 0) {
        message.success('删除成功');
        refresh();
      } else {
        message.error(response?.data?.msg || '删除失败');
      }
    },
  });

  // Event Handlers
  const handleSearch = (values: any) => {
    setSearchParams({
      ...searchParams,
      page: 1,
      ...values,
    });
  };

  const handleResetSearch = () => {
    searchForm.resetFields();
    setSearchParams({
      page: 1,
      limit: 20,
      withRole: true,
    });
  };

  const handleCreate = () => {
    setState({ drawerVisible: true, editingRecord: null });
  };

  const handleEdit = async (record: AccountsResponse) => {
    try {
      const response = await rAccount(record.id);
      if (response?.data?.code === 0) {
        setState({
          drawerVisible: true,
          editingRecord: response.data.data,
        });
      }
    } catch (error) {
      message.error('获取账户信息失败');
    }
  };

  const handleChangePassword = (record: AccountsResponse) => {
    setState({ passwordDrawerVisible: true, editingRecord: record });
  };

  const closeAccountDrawer = (reload?: boolean) => {
    setState({ drawerVisible: false, editingRecord: null });
    if (reload) {
      refresh();
    }
  };

  const closePasswordDrawer = (reload?: boolean) => {
    setState({ passwordDrawerVisible: false, editingRecord: null });
    if (reload) {
      refresh();
    }
  };

  const handleBatchDelete = () => {
    if (state.selectedRowKeys.length === 0) {
      message.warning('请选择要删除的账户');
      return;
    }
    message.info('批量删除功能开发中');
  };

  const handleBatchEnable = () => {
    if (state.selectedRowKeys.length === 0) {
      message.warning('请选择要操作的账户');
      return;
    }
    message.info('批量启用功能开发中');
  };

  const handleBatchDisable = () => {
    if (state.selectedRowKeys.length === 0) {
      message.warning('请选择要操作的账户');
      return;
    }
    message.info('批量禁用功能开发中');
  };

  // Table Columns
  const columns: ProColumns<AccountsResponse>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '账户名称',
      dataIndex: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (_, record) => (
        <Tag color={record.status === 1 ? 'green' : 'red'}>
          {record.status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      render: (_, record) => (
        <Space size={[0, 8]} wrap>
          {record.roles?.map((role: any) => (
            <Tag key={role.id} color="blue">
              {role.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      render: (_, record) => new Date(record.created_at).toLocaleString(),
    },
    {
      title: '操作',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="修改密码">
            <Button
              type="text"
              icon={<LockOutlined />}
              onClick={() => handleChangePassword(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此账户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ProTable Props
  const roleOptions =
    rolesData?.data?.data?.list?.map((role: RoleDataResult) => ({
      label: role.name,
      value: role.id,
    })) || [];

  const proTableProps: ProTableProps<AccountsResponse, any> = {
    columns,
    dataSource: accountsData?.data?.data?.list || [],
    loading,
    rowKey: 'id',
    search: false,
    pagination: false,
    options: {
      reload: refresh,
    },
    toolBarRender: () => [
      <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
        新建账户
      </Button>,
      <Button key="refresh" icon={<ReloadOutlined />} onClick={refresh}>
        刷新
      </Button>,
    ],
    rowSelection: {
      selectedRowKeys: state.selectedRowKeys,
      onChange: (keys) => setState({ selectedRowKeys: keys as string[] }),
    },
    tableAlertRender: ({ selectedRowKeys }) => (
      <Space>
        <span>已选择 {selectedRowKeys.length} 项</span>
        <Button type="link" size="small" danger onClick={handleBatchDelete}>
          批量删除
        </Button>
        <Button type="link" size="small" onClick={handleBatchEnable}>
          批量启用
        </Button>
        <Button type="link" size="small" onClick={handleBatchDisable}>
          批量禁用
        </Button>
      </Space>
    ),
  };

  return (
    <>
      {/* 搜索区域 */}
      <ProCard className="mb-16">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Flex gap={16} wrap={true}>
            <Form.Item name="name" style={{ marginRight: 0 }}>
              <Input allowClear placeholder="搜索账户名" style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="status" style={{ marginRight: 0 }}>
              <Select placeholder="选择状态" allowClear style={{ width: 120 }}>
                <Select.Option value={1}>启用</Select.Option>
                <Select.Option value={0}>禁用</Select.Option>
              </Select>
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
        size={Number(searchParams.limit) || 20}
        total={accountsData?.data?.data?.meta?.total || 0}
        hasMore={false}
        searchAfter=""
        onChange={({ page, size }) => {
          setSearchParams({
            ...searchParams,
            page: page,
            limit: size || 20,
          });
        }}
        isLoading={loading}
      />

      {/* 账户表单抽屉 */}
      <AccountFormDrawer
        open={state.drawerVisible}
        entity={state.editingRecord}
        closeDrawer={closeAccountDrawer}
        roleOptions={roleOptions}
      />

      {/* 密码修改抽屉 */}
      <AccountPasswordDrawer
        open={state.passwordDrawerVisible}
        entity={state.editingRecord}
        closeDrawer={closePasswordDrawer}
      />
    </>
  );
};

export default AccountsPage;
