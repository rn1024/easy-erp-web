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
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';

/**
 * APIs
 */
import {
  roleListApi,
  createRoleApi,
  updateRoleApi,
  deleteRoleByIdApi,
  queryRoleByIdApi,
} from '@/services/roles';

const RolesPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const [state, setState] = useSetState({
    modalVisible: false,
    editingRecord: null as any,
    selectedRowKeys: [] as string[],
  });

  const [searchParams, setSearchParams] = useState({
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

  const columns: ColumnsType<any> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '角色名称',
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
      title: '权限数量',
      dataIndex: 'permissions',
      render: (permissions: string[]) => <Tag color="blue">{permissions?.length || 0} 个权限</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
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

  const handleEdit = async (record: any) => {
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
          });
        }, 0);
      }
    } catch (error) {
      message.error('获取角色信息失败');
    }
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      submitRole(values);
    });
  };

  return (
    <>
      <Card>
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
        </Row>

        <Table
          columns={columns}
          dataSource={rolesData?.data?.data || []}
          loading={loading}
          rowKey="id"
          rowSelection={{
            selectedRowKeys: state.selectedRowKeys,
            onChange: (keys) => setState({ selectedRowKeys: keys as string[] }),
          }}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.limit,
            total: rolesData?.data?.meta?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setSearchParams({ page, limit: pageSize || 20 });
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
        destroyOnHidden
        width={600}
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
        </Form>
      </Modal>
    </>
  );
};

export default RolesPage;
