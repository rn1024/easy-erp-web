'use client';

import { useState } from 'react';
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

/**
 * Components
 */
import RoleFormModal from './components/role-form-modal';
import PermissionManageModal from './components/permission-manage-modal';

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

/**
 * Types
 */
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';

interface RolesParams {
  page: number;
  limit: number;
  status?: string;
  name?: string;
}

interface State {
  modalVisible: boolean;
  permissionModalVisible: boolean;
  editingRecord: RoleDataResult | null;
  currentRoleId: string;
  currentRoleName: string;
}

const RolesPage: React.FC = () => {
  /**
   * Hooks
   */
  const { message } = App.useApp();
  const [searchForm] = Form.useForm();

  /**
   * State
   */
  const [state, setState] = useSetState<State>({
    modalVisible: false,
    permissionModalVisible: false,
    editingRecord: null,
    currentRoleId: '',
    currentRoleName: '',
  });

  const [searchParams, setSearchParams] = useState<RolesParams>({
    page: 1,
    limit: 20,
  });

  /**
   * Requests
   */
  const {
    data: rolesData,
    loading,
    refresh,
  } = useRequest(() => roleListApi(searchParams), {
    refreshDeps: [searchParams],
  });

  const { data: permissionsData, loading: permissionsLoading } = useRequest(getPermissionsApi);

  const { run: handleDelete } = useRequest(
    async (id: string) => {
      await deleteRoleByIdApi(id);
      message.success('角色删除成功');
    },
    {
      manual: true,
      onSuccess: () => {
        refresh();
      },
      onError: (error: any) => {
        message.error(error.response?.data?.msg || '删除失败');
      },
    }
  );

  const { run: fetchRoleDetail } = useRequest(
    async (id: string) => {
      const res = await queryRoleByIdApi(id);
      setState({ editingRecord: res.data.data, modalVisible: true });
    },
    {
      manual: true,
      onError: (error: any) => {
        message.error(error.response?.data?.msg || '获取角色详情失败');
      },
    }
  );

  /**
   * Event Handlers
   */
  const handleCreateClick = () => {
    setState({ editingRecord: null, modalVisible: true });
  };

  const handleEditClick = (record: RoleDataResult) => {
    fetchRoleDetail(record.id.toString());
  };

  const handleDeleteClick = (record: RoleDataResult) => {
    handleDelete(record.id.toString());
  };

  const handleManagePermissions = (record: RoleDataResult) => {
    setState({
      currentRoleId: record.id.toString(),
      currentRoleName: record.name,
      permissionModalVisible: true,
    });
  };

  const handleSearch = (values: any) => {
    setSearchParams({
      ...searchParams,
      page: 1,
      name: values.name,
      status: values.status,
    });
  };

  const handleResetSearch = () => {
    searchForm.resetFields();
    setSearchParams({
      page: 1,
      limit: 20,
    });
  };

  const closeRoleModal = (reload?: boolean) => {
    setState({ modalVisible: false, editingRecord: null });
    if (reload) {
      refresh();
    }
  };

  const closePermissionModal = (reload?: boolean) => {
    setState({ permissionModalVisible: false, currentRoleId: '', currentRoleName: '' });
    if (reload) {
      refresh();
    }
  };

  /**
   * Table Columns
   */
  const columns: ProColumns<RoleDataResult>[] = [
    {
      title: '序号',
      dataIndex: 'index',
      valueType: 'index',
      width: 50,
      align: 'center',
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (_, record: RoleDataResult) => (
        <Space>
          <UserOutlined />
          <span>{record.name}</span>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      align: 'center',
      render: (_, record: RoleDataResult) => (
        <Tag color={record.status === 1 ? 'green' : 'red'}>
          {record.status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '权限数量',
      dataIndex: 'permissions',
      width: 100,
      align: 'center',
      render: (_, record: RoleDataResult) => (
        <Tag color="blue">{record.permissions ? record.permissions.length : 0}</Tag>
      ),
    },
    {
      title: '操作员',
      dataIndex: 'operator',
      width: 120,
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      valueType: 'dateTime',
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 180,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record: RoleDataResult) => [
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEditClick(record)}
        >
          编辑
        </Button>,
        <Button
          key="permission"
          type="link"
          size="small"
          icon={<SettingOutlined />}
          onClick={() => handleManagePermissions(record)}
        >
          权限
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除这个角色吗？"
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
  const proTableProps: ProTableProps<RoleDataResult, RolesParams> = {
    columns,
    dataSource: rolesData?.data?.data?.list || [],
    loading,
    rowKey: 'id',
    pagination: {
      current: searchParams.page,
      pageSize: searchParams.limit,
      total: rolesData?.data?.data?.meta?.total || 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
      onChange: (page, pageSize) => {
        setSearchParams({ ...searchParams, page, limit: pageSize || 20 });
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
        新建角色
      </Button>,
      <Button key="refresh" icon={<ReloadOutlined />} onClick={refresh}>
        刷新
      </Button>,
    ],
    scroll: { x: 1000 },
    size: 'middle',
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

      {/* 角色表单弹窗 */}
      <RoleFormModal
        open={state.modalVisible}
        entity={state.editingRecord}
        closeModal={closeRoleModal}
        permissionsData={permissionsData}
        permissionsLoading={permissionsLoading}
      />

      {/* 权限管理弹窗 */}
      <PermissionManageModal
        open={state.permissionModalVisible}
        currentRoleId={state.currentRoleId}
        currentRoleName={state.currentRoleName}
        closeModal={closePermissionModal}
        permissionsData={permissionsData}
        permissionsLoading={permissionsLoading}
      />
    </>
  );
};

export default RolesPage;
