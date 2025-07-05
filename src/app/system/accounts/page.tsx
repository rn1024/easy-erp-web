'use client';

import { useRequest, useSetState } from 'ahooks';
import {
  App,
  Button,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
  Flex,
} from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';
import { Pagination } from '@/components/ui/pagination';

/**
 * APIs
 */
import { accounts, cAccount, uAccount, dAccount, rAccount, cAccountPwd } from '@/services/account';
import { roleListApi } from '@/services/roles';

/**
 * Types
 */
import type { AccountsParams, AccountsResponse, CAccountData } from '@/services/account';
import type { RoleDataResult } from '@/services/roles';

const AccountsPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [searchForm] = Form.useForm();

  const [state, setState] = useSetState({
    modalVisible: false,
    passwordModalVisible: false,
    editingRecord: null as AccountsResponse | null,
    selectedRowKeys: [] as string[],
  });

  const [searchParams, setSearchParams] = useState<AccountsParams>({
    page: 1,
    limit: 20,
    withRole: true,
  });

  // 获取账户列表
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

  // 获取角色列表
  const { data: rolesData } = useRequest(() => roleListApi({ page: 1, limit: 100 }), {
    onSuccess: (response: any) => {
      if (response?.data?.code !== 0) {
        message.error(response?.data?.msg || '获取角色列表失败');
      }
    },
  });

  // 创建/更新账户
  const { loading: submitting, run: submitAccount } = useRequest(
    async (values: CAccountData) => {
      if (state.editingRecord) {
        return uAccount(state.editingRecord.id, values);
      } else {
        return cAccount(values);
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

  // 删除账户
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

  // 修改密码
  const { loading: changingPassword, run: changePassword } = useRequest(
    async (values: { old_password: string; new_password: string }) => {
      if (!state.editingRecord) return;
      return cAccountPwd(state.editingRecord.id, values);
    },
    {
      manual: true,
      onSuccess: (response: any) => {
        if (response?.data?.code === 0) {
          message.success('密码修改成功');
          setState({ passwordModalVisible: false, editingRecord: null });
          passwordForm.resetFields();
        } else {
          message.error(response?.data?.msg || '密码修改失败');
        }
      },
      onError: () => {
        message.error('密码修改失败');
      },
    }
  );

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
      withRole: true,
    });
  };

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

  const handleCreate = () => {
    setState({ modalVisible: true, editingRecord: null });
    setTimeout(() => {
      form.resetFields();
    }, 0);
  };

  const handleEdit = async (record: AccountsResponse) => {
    try {
      const response = await rAccount(record.id);
      if (response?.data?.code === 0) {
        setState({ modalVisible: true, editingRecord: record });
        setTimeout(() => {
          form.setFieldsValue({
            name: response.data.data.name,
            status: response.data.data.status,
            roleIds: response.data.data.roles?.map((role: any) => role.id) || [],
          });
        }, 0);
      }
    } catch (error) {
      message.error('获取账户信息失败');
    }
  };

  const handleChangePassword = (record: AccountsResponse) => {
    setState({ passwordModalVisible: true, editingRecord: record });
    setTimeout(() => {
      passwordForm.resetFields();
    }, 0);
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      submitAccount(values);
    });
  };

  // 批量操作
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

  const roleOptions =
    rolesData?.data?.data?.list?.map((role: RoleDataResult) => ({
      label: role.name,
      value: role.id,
    })) || [];

  // ProTable 配置
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

      {/* 创建/编辑账户模态框 */}
      <Modal
        title={state.editingRecord ? '编辑账户' : '新建账户'}
        open={state.modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setState({ modalVisible: false, editingRecord: null });
          form.resetFields();
        }}
        confirmLoading={submitting}
        destroyOnHidden
        width={600}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="账户名称"
            rules={[{ required: true, message: '请输入账户名称' }]}
          >
            <Input placeholder="请输入账户名称" />
          </Form.Item>

          {!state.editingRecord && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

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

          <Form.Item
            name="roleIds"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select mode="multiple" placeholder="请选择角色" options={roleOptions} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 修改密码模态框 */}
      <Modal
        title="修改密码"
        open={state.passwordModalVisible}
        onOk={() => {
          passwordForm.validateFields().then((values) => {
            changePassword(values);
          });
        }}
        onCancel={() => {
          setState({ passwordModalVisible: false, editingRecord: null });
          passwordForm.resetFields();
        }}
        confirmLoading={changingPassword}
        destroyOnHidden
        width={500}
      >
        <Form form={passwordForm} layout="vertical" preserve={false}>
          <Form.Item
            name="old_password"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>

          <Form.Item
            name="new_password"
            label="新密码"
            rules={[{ required: true, message: '请输入新密码' }]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="确认新密码"
            dependencies={['new_password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请确认新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AccountsPage;
