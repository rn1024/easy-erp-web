'use client';

import { useRequest, useSetState } from 'ahooks';
import { App, Button, Col, Form, Input, Select, Space, Tag, Tooltip, Popconfirm, Flex } from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';
import { Pagination } from '@/components/ui/pagination';

/**
 * Components
 */
import RoleFormDrawer from './components/role-form-drawer';
import PermissionManageDrawer from './components/permission-manage-drawer';

/**
 * APIs
 */
import {
  roleListApi,
  deleteRoleByIdApi,
  queryRoleByIdApi,
  getPermissionsApi,
  type RoleDataResult,
} from '@/services/roles';

interface RolesParams {
  page: number;
  limit: number;
  status?: string;
  name?: string;
}

const RolesPage: React.FC = () => {
  const { message } = App.useApp();
  const [searchForm] = Form.useForm();

  const [state, setState] = useSetState({
    drawerVisible: false,
    editingRecord: null as RoleDataResult | null,
    selectedRowKeys: [] as string[],
    permissionDrawerVisible: false,
    currentRoleId: '',
    currentRoleName: '',
  });

  const [searchParams, setSearchParams] = useState<RolesParams>({
    page: 1,
    limit: 20,
  });

  // 获取角色列表
  const {
    data: rolesData,
    loading,
    refresh,
  } = useRequest(() => roleListApi(searchParams), {
    refreshDeps: [searchParams],
  });

  // 获取权限列表
  const { data: permissionsData, loading: permissionsLoading } = useRequest(
    () => getPermissionsApi(),
    {
      onSuccess: (data) => {
        console.log('权限数据:', data);
      },
    }
  );

  // 删除角色
  const { run: handleDelete } = useRequest(deleteRoleByIdApi, {
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

  // 搜索处理
  const handleSearch = (values: any) => {
    setSearchParams({
      ...searchParams,
      page: 1,
      ...values,
    });
  };

  // 重置搜索
  const handleResetSearch = () => {
    searchForm.resetFields();
    setSearchParams({
      page: 1,
      limit: 20,
    });
  };

  const columns: ProColumns<RoleDataResult>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <span>{record.name}</span>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_, record) => (
        <Tag color={record.status === 1 ? 'green' : 'red'}>
          {record.status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '权限数量',
      dataIndex: 'permissions',
      width: 120,
      render: (_, record) => <Tag color="blue">{record.permissions?.length || 0} 个权限</Tag>,
    },
    {
      title: '权限详情',
      dataIndex: 'permissions',
      width: 300,
      render: (_, record) => (
        <div>
          {record.permissions?.slice(0, 3).map((permission) => (
            <Tag key={permission} style={{ marginBottom: 4, fontSize: '12px' }}>
              {permission}
            </Tag>
          ))}
          {(record.permissions?.length || 0) > 3 && (
            <Tag color="default" style={{ fontSize: '12px' }}>
              +{(record.permissions?.length || 0) - 3} 更多
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
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
          <Tooltip title="权限管理">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => handlePermissionManage(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此角色吗？"
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

  const handleCreate = () => {
    setState({ drawerVisible: true, editingRecord: null });
  };

  const handleEdit = async (record: RoleDataResult) => {
    try {
      const response = await queryRoleByIdApi(record.id);
      if (response?.data?.code === 0) {
        setState({
          drawerVisible: true,
          editingRecord: response.data.data,
        });
      }
    } catch (error) {
      message.error('获取角色信息失败');
    }
  };

  const handlePermissionManage = (record: RoleDataResult) => {
    setState({
      permissionDrawerVisible: true,
      currentRoleId: record.id,
      currentRoleName: record.name,
    });
  };

  const closeRoleDrawer = (reload?: boolean) => {
    setState({ drawerVisible: false, editingRecord: null });
    if (reload) {
      refresh();
    }
  };

  const closePermissionDrawer = () => {
    setState({ permissionDrawerVisible: false });
  };

  // 批量操作
  const handleBatchEnable = () => {
    if (state.selectedRowKeys.length === 0) {
      message.warning('请选择要操作的角色');
      return;
    }
    message.info('批量启用功能开发中...');
  };

  const handleBatchDisable = () => {
    if (state.selectedRowKeys.length === 0) {
      message.warning('请选择要操作的角色');
      return;
    }
    message.info('批量禁用功能开发中...');
  };

  // ProTable 配置
  const proTableProps: ProTableProps<RoleDataResult, any> = {
    columns,
    dataSource: rolesData?.data?.data?.list || [],
    loading,
    rowKey: 'id',
    search: false,
    pagination: false,
    options: {
      reload: refresh,
    },
    toolBarRender: () => [
      <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
        新建角色
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
              <Input allowClear placeholder="请输入角色名称" style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="status" style={{ marginRight: 0 }}>
              <Select placeholder="请选择状态" allowClear style={{ width: 120 }}>
                <Select.Option value="1">启用</Select.Option>
                <Select.Option value="0">禁用</Select.Option>
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
        current={searchParams.page}
        size={searchParams.limit}
        total={rolesData?.data?.data?.meta?.total || 0}
        hasMore={false}
        searchAfter=""
        onChange={({ page, size }) => {
          setSearchParams({ ...searchParams, page, limit: size || 20 });
        }}
        isLoading={loading}
      />

      {/* 角色表单抽屉 */}
      <RoleFormDrawer
        open={state.drawerVisible}
        entity={state.editingRecord}
        closeDrawer={closeRoleDrawer}
        permissionsData={permissionsData}
        permissionsLoading={permissionsLoading}
      />

      {/* 权限管理抽屉 */}
      <PermissionManageDrawer
        open={state.permissionDrawerVisible}
        currentRoleId={state.currentRoleId}
        currentRoleName={state.currentRoleName}
        closeDrawer={closePermissionDrawer}
        permissionsData={permissionsData}
        permissionsLoading={permissionsLoading}
      />
    </>
  );
};

export default RolesPage;
