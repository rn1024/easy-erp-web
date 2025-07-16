'use client';

import React, { useState } from 'react';
import { useRequest } from 'ahooks';
import { Button, Form, Select, Space, Tag, Popconfirm, message, Flex } from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

/**
 * APIs
 */
import {
  getWarehouseTasksApi,
  createWarehouseTaskApi,
  updateWarehouseTaskApi,
  deleteWarehouseTaskApi,
  WarehouseTaskType,
  warehouseTaskStatusOptions,
  getWarehouseTaskStatusLabel,
} from '@/services/warehouse';
import { getShops } from '@/services/shops';
import { saveProductItemsApi, ProductItemRelatedType } from '@/services/product-items';

/**
 * Types
 */
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';
import type {
  WarehouseTaskInfo,
  CreateWarehouseTaskData,
  UpdateWarehouseTaskData,
  WarehouseTaskQueryParams,
} from '@/services/warehouse';
import type { UniversalProductItem } from '@/components/universal-product-items-table';

/**
 * Components
 */
import ShippingTaskFormModal from './components/shipping-task-form-modal';

const { Option } = Select;

const ShippingTasksPage: React.FC = () => {
  /**
   * Hooks
   */
  const [searchForm] = Form.useForm();

  /**
   * State
   */
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<WarehouseTaskInfo | null>(null);
  const [searchParams, setSearchParams] = useState<WarehouseTaskQueryParams>({
    page: 1,
    pageSize: 10,
    type: WarehouseTaskType.SHIPPING, // 固定为发货任务
  });

  /**
   * Requests
   */
  const {
    data: tasksData,
    loading,
    refresh,
  } = useRequest(() => getWarehouseTasksApi(searchParams), {
    refreshDeps: [searchParams],
  });

  const { data: shopsData } = useRequest(() => getShops({}));

  /**
   * Event Handlers
   */
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    setSearchParams({
      ...values,
      type: WarehouseTaskType.SHIPPING, // 确保始终是发货任务
      page: 1,
      pageSize: searchParams.pageSize,
    });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({
      page: 1,
      pageSize: 10,
      type: WarehouseTaskType.SHIPPING,
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

      // 确保任务类型为发货
      const taskData = {
        ...data,
        type: WarehouseTaskType.SHIPPING,
      };

      if (editingTask) {
        // 更新发货任务
        await updateWarehouseTaskApi(editingTask.id, taskData as UpdateWarehouseTaskData);
        taskId = editingTask.id;
      } else {
        // 创建发货任务
        const response = await createWarehouseTaskApi(taskData as CreateWarehouseTaskData);
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
      message.success('删除发货任务成功');
      refresh();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  /**
   * Table Columns
   */
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
            title="确定要删除这个发货任务吗？"
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

  /**
   * ProTableProps
   */
  const proTableProps: ProTableProps<WarehouseTaskInfo, any> = {
    columns,
    dataSource: tasksData?.data?.list || [],
    loading,
    rowKey: 'id',
    search: false,
    pagination: {
      current: Number(searchParams.page) || 1,
      pageSize: Number(searchParams.pageSize) || 20,
      total: tasksData?.data?.total || 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
      onChange: (page, pageSize) => {
        setSearchParams({
          ...searchParams,
          page: page,
          pageSize: pageSize || 20,
          type: WarehouseTaskType.SHIPPING,
        });
      },
    },
    options: {
      reload: refresh,
    },
    toolBarRender: () => [
      <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
        新增发货任务
      </Button>,
      <Button key="refresh" icon={<ReloadOutlined />} onClick={refresh}>
        刷新
      </Button>,
    ],
  };

  /**
   * Data Processing
   */
  const shops = shopsData?.data?.data?.list || [];

  return (
    <>
      {/* 搜索区域 */}
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

      {/* 表格区域 */}
      <ProTable {...proTableProps} />

      {/* 弹窗组件 */}
      <ShippingTaskFormModal
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

export default ShippingTasksPage;
