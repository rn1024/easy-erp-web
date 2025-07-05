'use client';

import React, { useState } from 'react';
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Row,
  Col,
  Progress,
  InputNumber,
  Popconfirm,
  message,
  DatePicker,
  Descriptions,
  Flex,
} from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';
import {
  getWarehouseTasksApi,
  createWarehouseTaskApi,
  updateWarehouseTaskApi,
  deleteWarehouseTaskApi,
  getWarehouseTaskApi,
  type WarehouseTaskInfo,
  type CreateWarehouseTaskData,
  type UpdateWarehouseTaskData,
  type WarehouseTaskQueryParams,
  WarehouseTaskStatus,
  WarehouseTaskType,
  warehouseTaskStatusOptions,
  warehouseTaskTypeOptions,
  getWarehouseTaskStatusLabel,
  getWarehouseTaskTypeLabel,
} from '@/services/warehouse';
import { getShops } from '@/services/shops';
import { getProductCategoriesApi } from '@/services/products';
import { getProductsApi } from '@/services/products';

const { Option } = Select;

const WarehouseTasksPage: React.FC = () => {
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<WarehouseTaskInfo | null>(null);
  const [selectedTask, setSelectedTask] = useState<WarehouseTaskInfo | null>(null);
  const [searchParams, setSearchParams] = useState<WarehouseTaskQueryParams>({
    page: 1,
    pageSize: 10,
  });

  const {
    data: tasksData,
    loading,
    refresh,
  } = useRequest(() => getWarehouseTasksApi(searchParams), {
    refreshDeps: [searchParams],
  });

  const { data: shopsData } = useRequest(() => getShops({}));

  const { data: categoriesData } = useRequest(() => getProductCategoriesApi());

  const { data: productsData } = useRequest(() => getProductsApi());

  const shops = shopsData?.data?.data?.list || [];
  const categories = categoriesData?.data?.data?.list || [];
  const products = productsData?.data?.data?.list || [];
  const tasks = tasksData?.data?.list || [];
  const total = tasksData?.data?.total || 0;

  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    setSearchParams({
      ...values,
      page: 1,
      pageSize: searchParams.pageSize,
    });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({
      page: 1,
      pageSize: 10,
    });
  };

  const showModal = (task?: WarehouseTaskInfo) => {
    setEditingTask(task || null);
    setIsModalVisible(true);

    if (task) {
      form.setFieldsValue({
        shopId: task.shopId,
        categoryId: task.categoryId,
        productId: task.productId,
        totalQuantity: task.totalQuantity,
        progress: task.progress,
        status: task.status,
        type: task.type,
      });
    } else {
      form.resetFields();
    }
  };

  const showDetailModal = async (taskId: string) => {
    try {
      const response = await getWarehouseTaskApi(taskId);
      if (response?.data) {
        setSelectedTask(response.data);
        setIsDetailModalVisible(true);
      }
    } catch (error) {
      message.error('获取任务详情失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingTask) {
        const updateData: UpdateWarehouseTaskData = {
          totalQuantity: values.totalQuantity,
          progress: values.progress,
          status: values.status,
          type: values.type,
        };
        await updateWarehouseTaskApi(editingTask.id, updateData);
        message.success('更新仓库任务成功');
      } else {
        const createData: CreateWarehouseTaskData = {
          shopId: values.shopId,
          categoryId: values.categoryId,
          productId: values.productId,
          totalQuantity: values.totalQuantity,
          type: values.type,
          progress: values.progress || 0,
        };
        await createWarehouseTaskApi(createData);
        message.success('创建仓库任务成功');
      }

      setIsModalVisible(false);
      form.resetFields();
      setEditingTask(null);
      refresh();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWarehouseTaskApi(id);
      message.success('删除仓库任务成功');
      refresh();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const columns: ProColumns<WarehouseTaskInfo>[] = [
    {
      title: '任务ID',
      dataIndex: 'id',
      width: 120,
      render: (_, record) => record.id.slice(-8),
    },
    {
      title: '店铺',
      dataIndex: ['shop'],
      render: (_, record) => (record.shop ? `${record.shop.name} (${record.shop.code})` : '-'),
    },
    {
      title: '产品分类',
      dataIndex: ['category'],
      render: (_, record) => record.category?.name || '-',
    },
    {
      title: '产品信息',
      dataIndex: ['product'],
      render: (_, record) =>
        record.product ? `${record.product.code} - ${record.product.specification}` : '-',
    },
    {
      title: '任务类型',
      dataIndex: 'type',
      render: (_, record) => {
        const config = getWarehouseTaskTypeLabel(record.type);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '总数量',
      dataIndex: 'totalQuantity',
      align: 'right',
    },
    {
      title: '进度',
      dataIndex: 'progress',
      width: 120,
      render: (_, record) => (
        <Progress
          percent={record.progress}
          size="small"
          status={record.progress === 100 ? 'success' : 'active'}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (_, record) => {
        const config = getWarehouseTaskStatusLabel(record.status);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '操作员',
      dataIndex: ['operator'],
      render: (_, record) => record.operator?.realName || record.operator?.username || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (_, record) => new Date(record.createdAt).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => showDetailModal(record.id)}
          >
            详情
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => showModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个仓库任务吗？"
            description="删除后不可恢复"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
              disabled={record.status === 'IN_PROGRESS' || record.status === 'COMPLETED'}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const proTableProps: ProTableProps<WarehouseTaskInfo, any> = {
    columns,
    dataSource: tasks,
    loading,
    rowKey: 'id',
    search: false,
    pagination: false,
    options: {
      reload: refresh,
    },
    toolBarRender: () => [
      <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
        新增任务
      </Button>,
      <Button key="refresh" icon={<ReloadOutlined />} onClick={refresh}>
        刷新
      </Button>,
    ],
  };

  return (
    <>
      <ProCard className="mb-16">
        <Form form={searchForm} layout="inline">
          <Flex gap={16} wrap={true}>
            <Form.Item name="shopId" style={{ marginRight: 0 }}>
              <Select placeholder="选择店铺" style={{ width: 200 }} allowClear>
                {shops.map((shop: any) => (
                  <Option key={shop.id} value={shop.id}>
                    {shop.name} ({shop.code})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="status" style={{ marginRight: 0 }}>
              <Select placeholder="选择状态" style={{ width: 120 }} allowClear>
                {warehouseTaskStatusOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="type" style={{ marginRight: 0 }}>
              <Select placeholder="选择类型" style={{ width: 120 }} allowClear>
                {warehouseTaskTypeOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={loading}
            >
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Flex>
        </Form>
      </ProCard>

      <ProTable {...proTableProps} />

      <Pagination
        current={Number(searchParams.page) || 1}
        size={Number(searchParams.pageSize) || 10}
        total={total}
        hasMore={false}
        searchAfter=""
        onChange={({ page, size }) => {
          setSearchParams({
            ...searchParams,
            page,
            pageSize: size || 10,
          });
        }}
        isLoading={loading}
      />

      <Modal
        title={editingTask ? '编辑仓库任务' : '新增仓库任务'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingTask(null);
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shopId"
                label="店铺"
                rules={[{ required: true, message: '请选择店铺' }]}
              >
                <Select placeholder="选择店铺" disabled={!!editingTask}>
                  {shops.map((shop: any) => (
                    <Option key={shop.id} value={shop.id}>
                      {shop.name} ({shop.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label="产品分类"
                rules={[{ required: true, message: '请选择产品分类' }]}
              >
                <Select placeholder="选择产品分类" disabled={!!editingTask}>
                  {categories.map((category: any) => (
                    <Option key={category.id} value={category.id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="productId"
                label="产品"
                rules={[{ required: true, message: '请选择产品' }]}
              >
                <Select placeholder="选择产品" disabled={!!editingTask}>
                  {products.map((product: any) => (
                    <Option key={product.id} value={product.id}>
                      {product.code} - {product.specification}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="任务类型"
                rules={[{ required: true, message: '请选择任务类型' }]}
              >
                <Select placeholder="选择任务类型">
                  {warehouseTaskTypeOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalQuantity"
                label="总数量"
                rules={[{ required: true, message: '请输入总数量' }]}
              >
                <InputNumber placeholder="请输入总数量" min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="progress"
                label="进度 (%)"
                rules={[{ required: true, message: '请输入进度' }]}
              >
                <InputNumber placeholder="请输入进度" min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          {editingTask && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="status"
                  label="状态"
                  rules={[{ required: true, message: '请选择状态' }]}
                >
                  <Select placeholder="选择状态">
                    {warehouseTaskStatusOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Modal>

      <Modal
        title="仓库任务详情"
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setSelectedTask(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedTask && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="任务ID">{selectedTask.id}</Descriptions.Item>
            <Descriptions.Item label="任务类型">
              <Tag color={getWarehouseTaskTypeLabel(selectedTask.type).color}>
                {getWarehouseTaskTypeLabel(selectedTask.type).label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="店铺">
              {selectedTask.shop ? `${selectedTask.shop.name} (${selectedTask.shop.code})` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="产品分类">
              {selectedTask.category?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="产品信息" span={2}>
              {selectedTask.product
                ? `${selectedTask.product.code} - ${selectedTask.product.specification} (SKU: ${selectedTask.product.sku})`
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="总数量">{selectedTask.totalQuantity}</Descriptions.Item>
            <Descriptions.Item label="进度">
              <Progress
                percent={selectedTask.progress}
                size="small"
                status={selectedTask.progress === 100 ? 'success' : 'active'}
              />
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getWarehouseTaskStatusLabel(selectedTask.status).color}>
                {getWarehouseTaskStatusLabel(selectedTask.status).label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="操作员">
              {selectedTask.operator?.realName || selectedTask.operator?.username || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(selectedTask.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {new Date(selectedTask.updatedAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

export default WarehouseTasksPage;
