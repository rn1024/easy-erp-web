'use client';

import React, { useState } from 'react';
import { Button, Form, Select, Space, Tag, Progress, Popconfirm, message, Flex } from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';
import {
  getWarehouseTasksApi,
  createWarehouseTaskApi,
  updateWarehouseTaskApi,
  deleteWarehouseTaskApi,
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
import {
  saveProductItemsApi,
  getProductItemsApi,
  ProductItemRelatedType,
} from '@/services/product-items';
import type { UniversalProductItem } from '@/components/universal-product-items-table';
import WarehouseTaskFormModal from './components/warehouse-task-form-modal';

const { Option } = Select;

const WarehouseTasksPage: React.FC = () => {
  const [searchForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<WarehouseTaskInfo | null>(null);
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

  const shops = shopsData?.data?.data?.list || [];
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
  };

  const handleSubmit = async (
    data: CreateWarehouseTaskData | UpdateWarehouseTaskData,
    productItems: UniversalProductItem[]
  ) => {
    try {
      let taskId: string;

      if (editingTask) {
        // 更新仓库任务
        await updateWarehouseTaskApi(editingTask.id, data as UpdateWarehouseTaskData);
        taskId = editingTask.id;
      } else {
        // 创建仓库任务
        const response = await createWarehouseTaskApi(data as CreateWarehouseTaskData);
        taskId = response.data.id;
      }

      // 保存产品明细
      await saveProductItemsApi({
        relatedType: ProductItemRelatedType.WAREHOUSE_TASK,
        relatedId: taskId,
        items: productItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          completedQuantity: item.completedQuantity,
          remark: item.remark,
        })),
      });

      setIsModalVisible(false);
      setEditingTask(null);
      refresh();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '操作失败');
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
      render: (_, record) => record.shop?.nickname || '-',
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
      title: '进度',
      dataIndex: 'progress',
      width: 120,
      render: (_, record) => {
        if (
          record.type === 'PACKAGING' &&
          record.progress !== null &&
          record.progress !== undefined
        ) {
          return (
            <Progress
              percent={record.progress}
              size="small"
              status={record.progress === 100 ? 'success' : 'active'}
            />
          );
        }
        return record.type === 'SHIPPING' ? '无需进度' : '-';
      },
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
      render: (_, record) => record.operator?.name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (_, record) => new Date(record.createdAt).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space size="small">
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
    pagination: {
      current: Number(searchParams.page) || 1,
      pageSize: Number(searchParams.pageSize) || 20,
      total: total || 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
      onChange: (page, pageSize) => {
        setSearchParams({ ...searchParams, page: page, pageSize: pageSize || 20 });
      },
    },
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
                    {shop.nickname}
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

      <WarehouseTaskFormModal
        visible={isModalVisible}
        editingTask={editingTask}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingTask(null);
        }}
        onSuccess={() => {
          setIsModalVisible(false);
          setEditingTask(null);
          refresh();
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default WarehouseTasksPage;
