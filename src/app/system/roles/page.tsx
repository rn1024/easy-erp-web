'use client';

import { useRequest, useSetState } from 'ahooks';
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Popconfirm,
  Tree,
  Tabs,
  Checkbox,
  Divider,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';

/**
 * APIs
 */
import {
  roleListApi,
  createRoleApi,
  updateRoleApi,
  deleteRoleByIdApi,
  queryRoleByIdApi,
  getPermissionsApi,
  type RoleDataResult,
  type Permission,
} from '@/services/roles';

interface RolesParams {
  page: number;
  limit: number;
  status?: string;
  name?: string;
}

const RolesPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const [state, setState] = useSetState({
    modalVisible: false,
    editingRecord: null as RoleDataResult | null,
    selectedRowKeys: [] as string[],
    permissionModalVisible: false,
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

  // 创建/更新角色
  const { loading: submitting, run: submitRole } = useRequest(
    async (values: any) => {
      const params = {
        ...values,
        operator: 'admin', // 当前操作人
      };

      if (state.editingRecord) {
        return updateRoleApi(state.editingRecord.id, params);
      } else {
        return createRoleApi(params);
      }
    },
    {
      manual: true,
      onSuccess: (response: any) => {
        if (response?.data?.code === 0) {
          message.success(state.editingRecord ? '更新成功' : '创建成功');
          setState({ modalVisible: false, editingRecord: null });
          form.resetFields();
          refresh();
        } else {
          message.error(response?.data?.msg || '操作失败');
        }
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

  // 渲染权限树
  const renderPermissionTree = () => {
    const permissionsGrouped = (permissionsData?.data as any)?.grouped;
    if (!permissionsGrouped) return [];

    const treeData: DataNode[] = Object.entries(permissionsGrouped).map(
      ([module, permissions]) => ({
        title: getModuleName(module),
        key: module,
        children: (permissions as Permission[]).map((permission) => ({
          title: permission.name,
          key: permission.code,
        })),
      })
    );

    return treeData;
  };

  // 获取模块中文名
  const getModuleName = (module: string) => {
    const moduleNames: Record<string, string> = {
      admin: '系统管理',
      account: '账户管理',
      role: '角色管理',
      log: '日志管理',
      file: '文件管理',
      shop: '店铺管理',
      supplier: '供应商管理',
      forwarder: '货代管理',
      product: '产品管理',
      purchase: '采购管理',
      warehouse: '仓库管理',
      export: '出口管理',
      delivery: '配送管理',
      financial: '财务管理',
    };
    return moduleNames[module] || module;
  };

  const columns: ColumnsType<RoleDataResult> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      render: (name: string) => (
        <Space>
          <UserOutlined />
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>{status === 1 ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '权限数量',
      dataIndex: 'permissions',
      width: 120,
      render: (permissions: string[]) => <Tag color="blue">{permissions?.length || 0} 个权限</Tag>,
    },
    {
      title: '权限详情',
      dataIndex: 'permissions',
      width: 300,
      render: (permissions: string[]) => (
        <div>
          {permissions?.slice(0, 3).map((permission) => (
            <Tag key={permission} style={{ marginBottom: 4, fontSize: '12px' }}>
              {permission}
            </Tag>
          ))}
          {permissions?.length > 3 && (
            <Tag color="default" style={{ fontSize: '12px' }}>
              +{permissions.length - 3} 更多
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
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
    setState({ modalVisible: true, editingRecord: null });
    setTimeout(() => {
      form.resetFields();
    }, 0);
  };

  const handleEdit = async (record: RoleDataResult) => {
    try {
      const response = await queryRoleByIdApi(record.id);
      if (response?.data?.code === 0) {
        setState({
          modalVisible: true,
          editingRecord: record,
        });
        setTimeout(() => {
          form.setFieldsValue({
            name: response.data.data.name,
            status: response.data.data.status,
            permissions: response.data.data.permissions || [],
          });
        }, 0);
      }
    } catch (error) {
      message.error('获取角色信息失败');
    }
  };

  const handlePermissionManage = (record: RoleDataResult) => {
    setState({
      permissionModalVisible: true,
      currentRoleId: record.id,
      currentRoleName: record.name,
    });
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      submitRole(values);
    });
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

  return (
    <>
      <Card>
        {/* 搜索区域 */}
        <Card size="small" title="搜索筛选" style={{ marginBottom: 16 }}>
          <Form form={searchForm} layout="inline" onFinish={handleSearch}>
            <Form.Item name="name" label="角色名称">
              <Input placeholder="请输入角色名称" allowClear />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select placeholder="请选择状态" allowClear style={{ width: 120 }}>
                <Select.Option value="1">启用</Select.Option>
                <Select.Option value="0">禁用</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleResetSearch}>重置</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* 操作按钮区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建角色
            </Button>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={refresh}>
              刷新
            </Button>
          </Col>
          {state.selectedRowKeys.length > 0 && (
            <>
              <Col>
                <Button type="default" onClick={handleBatchEnable}>
                  批量启用
                </Button>
              </Col>
              <Col>
                <Button onClick={handleBatchDisable}>批量禁用</Button>
              </Col>
              <Col>
                <span style={{ color: '#666' }}>已选择 {state.selectedRowKeys.length} 项</span>
              </Col>
            </>
          )}
        </Row>

        <Table
          columns={columns}
          dataSource={rolesData?.data?.data?.list || []}
          loading={loading}
          rowKey="id"
          rowSelection={{
            selectedRowKeys: state.selectedRowKeys,
            onChange: (keys) => setState({ selectedRowKeys: keys as string[] }),
          }}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.limit,
            total: rolesData?.data?.data?.meta?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setSearchParams({ ...searchParams, page, limit: pageSize || 20 });
            },
          }}
        />
      </Card>

      {/* 创建/编辑角色模态框 */}
      <Modal
        title={state.editingRecord ? '编辑角色' : '新建角色'}
        open={state.modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setState({ modalVisible: false, editingRecord: null });
          form.resetFields();
        }}
        confirmLoading={submitting}
        destroyOnClose
        width={800}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="角色名称"
                rules={[{ required: true, message: '请输入角色名称' }]}
              >
                <Input placeholder="请输入角色名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                initialValue={1}
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  <Select.Option value={1}>启用</Select.Option>
                  <Select.Option value={0}>禁用</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>权限配置</Divider>

          {permissionsLoading ? (
            <div style={{ textAlign: 'center', padding: 20 }}>加载权限列表中...</div>
          ) : (
            <Form.Item name="permissions" label="选择权限">
              <Checkbox.Group style={{ width: '100%' }}>
                {Object.entries((permissionsData?.data as any)?.grouped || {}).map(
                  ([module, permissions]) => (
                    <div key={module} style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                        {getModuleName(module)}
                      </div>
                      <Row gutter={[8, 8]}>
                        {(permissions as Permission[]).map((permission) => (
                          <Col span={8} key={permission.code}>
                            <Checkbox value={permission.code}>{permission.name}</Checkbox>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )
                )}
              </Checkbox.Group>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 权限管理模态框 */}
      <Modal
        title={`权限管理 - ${state.currentRoleName}`}
        open={state.permissionModalVisible}
        onCancel={() => setState({ permissionModalVisible: false })}
        footer={null}
        width={600}
      >
        <Alert
          message="权限管理功能"
          description="此功能正在开发中，将支持更精细的权限配置。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {renderPermissionTree().length > 0 && (
          <Tree checkable treeData={renderPermissionTree()} height={400} />
        )}
      </Modal>
    </>
  );
};

export default RolesPage;
