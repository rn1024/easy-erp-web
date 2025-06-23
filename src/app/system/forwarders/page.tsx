'use client';

import React, { useState, useCallback } from 'react';
import { useRequest } from 'ahooks';
import {
  App,
  Button,
  Card,
  Table,
  Space,
  Modal,
  Form,
  Input,
  Tag,
  Row,
  Col,
  Avatar,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

// 使用货代API（复用forwarders路由）
import axios from '@/services/index';
import type { ResType } from '@/types/api';

// 货代数据类型
export interface Forwarder {
  id: string;
  nickname: string;
  avatarUrl?: string;
  contactPerson: string;
  contactPhone: string;
  companyName: string;
  creditCode?: string;
  bankName?: string;
  bankAccount?: string;
  bankAddress?: string;
  remark?: string;
  operatorId: string;
  createdAt: string;
  updatedAt: string;
  operator: {
    id: string;
    name: string;
  };
}

// 货代查询参数
export interface ForwardersParams {
  page?: number;
  pageSize?: number;
  nickname?: string;
  companyName?: string;
}

// 创建/更新货代参数
export interface ForwarderFormData {
  nickname: string;
  avatarUrl?: string;
  contactPerson: string;
  contactPhone: string;
  companyName: string;
  creditCode?: string;
  bankName?: string;
  bankAccount?: string;
  bankAddress?: string;
  remark?: string;
}

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

// 创建货代
const createForwarder = (data: ForwarderFormData) => {
  return axios<ResType<Forwarder>>('/forwarding-agents', {
    method: 'post',
    data,
  });
};

// 更新货代
const updateForwarder = (id: string, data: Partial<ForwarderFormData>) => {
  return axios<ResType<Forwarder>>(`/forwarding-agents/${id}`, {
    method: 'put',
    data,
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
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  // 状态管理
  const [isModalVisible, setIsModalVisible] = useState(false);
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

  // 创建货代
  const { loading: creating, run: createForwarderRun } = useRequest(createForwarder, {
    manual: true,
    onSuccess: (response: any) => {
      if (response?.data?.code === 200) {
        message.success('创建货代成功');
        setIsModalVisible(false);
        form.resetFields();
        refresh();
      } else {
        message.error(response?.data?.msg || '创建货代失败');
      }
    },
    onError: (error) => {
      console.error('创建货代失败:', error);
      message.error('创建货代失败');
    },
  });

  // 更新货代
  const { loading: updating, run: updateForwarderRun } = useRequest(
    ({ id, data }: { id: string; data: Partial<ForwarderFormData> }) => updateForwarder(id, data),
    {
      manual: true,
      onSuccess: (response: any) => {
        if (response?.data?.code === 200) {
          message.success('更新货代成功');
          setIsModalVisible(false);
          form.resetFields();
          setEditingForwarder(null);
          refresh();
        } else {
          message.error(response?.data?.msg || '更新货代失败');
        }
      },
      onError: (error) => {
        console.error('更新货代失败:', error);
        message.error('更新货代失败');
      },
    }
  );

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
  const handleSearch = useCallback((values: SearchFormData) => {
    setSearchParams((prev: ForwardersParams) => ({
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

  // 分页处理
  const handleTableChange = useCallback((page: number, pageSize: number) => {
    setSearchParams((prev: ForwardersParams) => ({
      ...prev,
      page,
      pageSize,
    }));
  }, []);

  // 打开创建/编辑模态框
  const handleOpenModal = useCallback(
    (forwarder?: Forwarder) => {
      if (forwarder) {
        setEditingForwarder(forwarder);
        form.setFieldsValue({
          nickname: forwarder.nickname,
          contactPerson: forwarder.contactPerson,
          contactPhone: forwarder.contactPhone,
          companyName: forwarder.companyName,
          creditCode: forwarder.creditCode,
          bankName: forwarder.bankName,
          bankAccount: forwarder.bankAccount,
          bankAddress: forwarder.bankAddress,
          remark: forwarder.remark,
        });
      } else {
        setEditingForwarder(null);
        form.resetFields();
      }
      setIsModalVisible(true);
    },
    [form]
  );

  // 关闭模态框
  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setEditingForwarder(null);
    form.resetFields();
  }, [form]);

  // 提交表单
  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const data: ForwarderFormData = {
        nickname: values.nickname,
        contactPerson: values.contactPerson,
        contactPhone: values.contactPhone,
        companyName: values.companyName,
        creditCode: values.creditCode,
        bankName: values.bankName,
        bankAccount: values.bankAccount,
        bankAddress: values.bankAddress,
        remark: values.remark,
      };

      if (editingForwarder) {
        updateForwarderRun({ id: editingForwarder.id, data });
      } else {
        createForwarderRun(data);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  }, [form, editingForwarder, createForwarderRun, updateForwarderRun]);

  // 删除货代
  const handleDelete = useCallback(
    (id: string) => {
      deleteForwarderRun(id);
    },
    [deleteForwarderRun]
  );

  // 表格列定义
  const columns: ColumnsType<Forwarder> = [
    {
      title: '货代信息',
      key: 'info',
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
      key: 'contact',
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
      render: (code) => (
        <Tooltip title={code}>
          <Tag color="green">{code}</Tag>
        </Tooltip>
      ),
    },
    {
      title: '银行信息',
      key: 'bank',
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
      render: (operator) => operator?.name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
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

  return (
    <Card>
      {/* 搜索区域 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="nickname" label="货代昵称">
            <Input placeholder="请输入货代昵称" style={{ width: 200 }} allowClear />
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

      {/* 操作按钮 */}
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
              新建货代
            </Button>
          </Space>
        </Col>
        <Col>
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
            刷新
          </Button>
        </Col>
      </Row>

      {/* 货代列表 */}
      <Table
        columns={columns}
        dataSource={forwarders}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{
          current: meta.page,
          pageSize: meta.pageSize,
          total: meta.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          onChange: handleTableChange,
        }}
      />

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingForwarder ? '编辑货代' : '新建货代'}
        open={isModalVisible}
        onCancel={handleCloseModal}
        onOk={handleSubmit}
        confirmLoading={creating || updating}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nickname"
                label="货代昵称"
                rules={[
                  { required: true, message: '请输入货代昵称' },
                  { max: 50, message: '昵称长度不能超过50个字符' },
                ]}
              >
                <Input placeholder="请输入货代昵称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="companyName"
                label="公司名称"
                rules={[
                  { required: true, message: '请输入公司名称' },
                  { max: 100, message: '公司名称长度不能超过100个字符' },
                ]}
              >
                <Input placeholder="请输入公司名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contactPerson"
                label="联系人"
                rules={[
                  { required: true, message: '请输入联系人' },
                  { max: 50, message: '联系人长度不能超过50个字符' },
                ]}
              >
                <Input placeholder="请输入联系人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contactPhone"
                label="联系电话"
                rules={[
                  { required: true, message: '请输入联系电话' },
                  {
                    pattern: /^1[3-9]\d{9}$/,
                    message: '请输入正确的手机号码',
                  },
                ]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="creditCode"
                label="统一社会信用代码"
                rules={[{ len: 18, message: '统一社会信用代码必须为18位' }]}
              >
                <Input placeholder="请输入统一社会信用代码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bankName" label="开户银行">
                <Input placeholder="请输入开户银行" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bankAccount" label="银行账号">
                <Input placeholder="请输入银行账号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bankAddress" label="开户地址">
                <Input placeholder="请输入开户地址" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ForwardersPage;
