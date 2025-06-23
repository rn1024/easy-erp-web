'use client';

import React, { useState } from 'react';
import {
  Button,
  Table,
  Form,
  Input,
  Modal,
  message,
  Space,
  Avatar,
  Popconfirm,
  Card,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import type { ColumnsType } from 'antd/es/table';
import {
  getShops,
  createShop,
  updateShop,
  deleteShop,
  type Shop,
  type ShopsParams,
  type ShopFormData,
} from '@/services/shops';

const { Search } = Input;

const ShopsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [searchParams, setSearchParams] = useState<ShopsParams>({
    page: 1,
    pageSize: 10,
  });

  // 获取店铺列表
  const {
    data: shopsData,
    loading,
    refresh,
  } = useRequest(() => getShops(searchParams), {
    refreshDeps: [searchParams],
  });

  // 创建店铺
  const { run: handleCreate, loading: createLoading } = useRequest(createShop, {
    manual: true,
    onSuccess: () => {
      message.success('店铺创建成功');
      setModalVisible(false);
      form.resetFields();
      refresh();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.msg || '创建失败');
    },
  });

  // 更新店铺
  const { run: handleUpdate, loading: updateLoading } = useRequest(
    (id: string, data: Partial<ShopFormData>) => updateShop(id, data),
    {
      manual: true,
      onSuccess: () => {
        message.success('店铺更新成功');
        setModalVisible(false);
        form.resetFields();
        setEditingShop(null);
        refresh();
      },
      onError: (error: any) => {
        message.error(error.response?.data?.msg || '更新失败');
      },
    }
  );

  // 删除店铺
  const { run: handleDelete } = useRequest(deleteShop, {
    manual: true,
    onSuccess: () => {
      message.success('店铺删除成功');
      refresh();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.msg || '删除失败');
    },
  });

  // 搜索功能
  const handleSearch = (values: any) => {
    setSearchParams({
      ...searchParams,
      page: 1,
      nickname: values.nickname,
    });
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({
      page: 1,
      pageSize: 10,
    });
  };

  // 分页变化
  const handleTableChange = (pagination: any) => {
    setSearchParams({
      ...searchParams,
      page: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  // 表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingShop) {
        handleUpdate(editingShop.id, values);
      } else {
        handleCreate(values);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 打开创建模态框
  const handleCreateClick = () => {
    setEditingShop(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 打开编辑模态框
  const handleEditClick = (record: Shop) => {
    setEditingShop(record);
    form.setFieldsValue({
      nickname: record.nickname,
      avatarUrl: record.avatarUrl,
      responsiblePerson: record.responsiblePerson,
      remark: record.remark,
    });
    setModalVisible(true);
  };

  // 表格列定义
  const columns: ColumnsType<Shop> = [
    {
      title: '店铺头像',
      dataIndex: 'avatarUrl',
      key: 'avatarUrl',
      width: 80,
      render: (avatarUrl: string, record: Shop) => (
        <Avatar src={avatarUrl} icon={<ShopOutlined />} size={40}>
          {!avatarUrl && record.nickname.charAt(0)}
        </Avatar>
      ),
    },
    {
      title: '店铺昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: '负责人',
      dataIndex: 'responsiblePerson',
      key: 'responsiblePerson',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '操作员',
      dataIndex: 'operator',
      key: 'operator',
      render: (operator: { name: string }) => operator.name,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record: Shop) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditClick(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个店铺吗？"
            description="删除后将无法恢复，请谨慎操作。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        {/* 页面标题和搜索 */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col span={12}>
            <h2 className="text-xl font-semibold flex items-center">
              <ShopOutlined className="mr-2" />
              店铺管理
            </h2>
          </Col>
          <Col span={12} className="text-right">
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateClick}>
                新建店铺
              </Button>
              <Button icon={<ReloadOutlined />} onClick={refresh}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 搜索表单 */}
        <Form form={searchForm} layout="inline" onFinish={handleSearch} className="mb-4">
          <Form.Item name="nickname" label="店铺昵称">
            <Input placeholder="请输入店铺昵称" allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        {/* 店铺列表表格 */}
        <Table
          columns={columns}
          dataSource={shopsData?.data?.data?.list || []}
          loading={loading}
          rowKey="id"
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total: shopsData?.data?.data?.meta?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `共 ${total} 条记录，显示 ${range[0]}-${range[1]} 条`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingShop ? '编辑店铺' : '新建店铺'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingShop(null);
        }}
        confirmLoading={createLoading || updateLoading}
        width={600}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="nickname"
            label="店铺昵称"
            rules={[
              { required: true, message: '请输入店铺昵称' },
              { max: 50, message: '店铺昵称不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入店铺昵称" />
          </Form.Item>

          <Form.Item
            name="avatarUrl"
            label="店铺头像"
            rules={[{ type: 'url', message: '请输入有效的URL地址' }]}
          >
            <Input placeholder="请输入店铺头像URL（可选）" />
          </Form.Item>

          <Form.Item
            name="responsiblePerson"
            label="负责人"
            rules={[
              { required: true, message: '请输入负责人姓名' },
              { max: 20, message: '负责人姓名不能超过20个字符' },
            ]}
          >
            <Input placeholder="请输入负责人姓名" />
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注"
            rules={[{ max: 500, message: '备注不能超过500个字符' }]}
          >
            <Input.TextArea placeholder="请输入备注信息（可选）" rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ShopsPage;
