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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';

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

  const columns: ColumnsType<AccountsResponse> = [
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
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>{status === 1 ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      render: (roles: any[]) => (
        <Space size={[0, 8]} wrap>
          {roles?.map((role) => (
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

  const roleOptions =
    rolesData?.data?.data?.list?.map((role: RoleDataResult) => ({
      label: role.name,
      value: role.id,
    })) || [];

  return (
    <>
      <Card>
        {/* 搜索栏 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Input.Search
              placeholder="搜索账户名"
              allowClear
              onSearch={(value) => {
                setSearchParams({
                  ...searchParams,
                  page: 1,
                  name: value || undefined,
                });
              }}
              style={{ width: '100%' }}
            />
          </Col>
          <Col>
            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => {
                setSearchParams({
                  ...searchParams,
                  page: 1,
                  status: value,
                });
              }}
            >
              <Select.Option value={1}>启用</Select.Option>
              <Select.Option value={0}>禁用</Select.Option>
            </Select>
          </Col>
        </Row>

        {/* 操作按钮 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建账户
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
                <Popconfirm
                  title={`确定删除选中的 ${state.selectedRowKeys.length} 个账户吗？`}
                  onConfirm={() => {
                    // TODO: 实现批量删除功能
                    message.info('批量删除功能开发中');
                  }}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button danger>批量删除 ({state.selectedRowKeys.length})</Button>
                </Popconfirm>
              </Col>
              <Col>
                <Button
                  onClick={() => {
                    // TODO: 实现批量启用功能
                    message.info('批量操作功能开发中');
                  }}
                >
                  批量启用
                </Button>
              </Col>
              <Col>
                <Button
                  onClick={() => {
                    // TODO: 实现批量禁用功能
                    message.info('批量操作功能开发中');
                  }}
                >
                  批量禁用
                </Button>
              </Col>
            </>
          )}
        </Row>

        <Table
          columns={columns}
          dataSource={accountsData?.data?.data?.list || []}
          loading={loading}
          rowKey="id"
          rowSelection={{
            selectedRowKeys: state.selectedRowKeys,
            onChange: (keys) => setState({ selectedRowKeys: keys as string[] }),
          }}
          pagination={{
            current: Number(searchParams.page),
            pageSize: Number(searchParams.limit),
            total: accountsData?.data?.data?.meta?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setSearchParams({
                ...searchParams,
                page: page,
                limit: pageSize || 20,
              });
            },
          }}
        />
      </Card>

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
