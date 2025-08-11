'use client';

import React, { useState } from 'react';
import { useRequest } from 'ahooks';
import { Button, Form, Select, Space, Tag, Progress, Popconfirm, message, Flex } from 'antd';
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
  getPackagingTasksApi,
  createPackagingTaskApi,
  updatePackagingTaskApi,
  deletePackagingTaskApi,
  PackagingTaskType,
  packagingTaskStatusOptions,
  getPackagingTaskStatusLabel,
} from '@/services/packaging';
import { getShops } from '@/services/shops';
// 移除不再需要的 saveProductItemsApi 和 ProductItemRelatedType 导入

/**
 * Types
 */
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';
import type {
  PackagingTaskInfo,
  CreatePackagingTaskData,
  UpdatePackagingTaskData,
  PackagingTaskQueryParams,
} from '@/services/packaging';
import type { UniversalProductItem } from '@/components/universal-product-items-table';

/**
 * Components
 */
import PackagingTaskFormModal from './components/packaging-task-form-modal';

const { Option } = Select;

const PackagingTasksPage: React.FC = () => {
  /**
   * Hooks
   */
  const [searchForm] = Form.useForm();

  /**
   * State
   */
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<PackagingTaskInfo | null>(null);
  const [searchParams, setSearchParams] = useState<PackagingTaskQueryParams>({
    page: 1,
    pageSize: 10,
    type: PackagingTaskType.PACKAGING, // 固定为包装任务
  });

  /**
   * Requests
   */
  const {
    data: tasksData,
    loading,
    refresh,
  } = useRequest(() => getPackagingTasksApi(searchParams), {
    refreshDeps: [searchParams],
    onSuccess: (data) => {
      console.log('包装任务数据:', data);
      console.log('列表数据:', data?.data?.list);
      console.log('数据长度:', data?.data?.list?.length);
    },
  });

  const { data: shopsData } = useRequest(() => getShops({}));

  /**
   * Event Handlers
   */
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    setSearchParams({
      ...values,
      type: PackagingTaskType.PACKAGING, // 确保始终是包装任务
      page: 1,
      pageSize: searchParams.pageSize,
    });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({
      page: 1,
      pageSize: 10,
      type: PackagingTaskType.PACKAGING,
    });
  };

  const showModal = (task?: PackagingTaskInfo) => {
    setEditingTask(task || null);
    setIsModalVisible(true);
  };

  const handleSubmit = async (
    data: CreatePackagingTaskData | UpdatePackagingTaskData,
    productItems: UniversalProductItem[]
  ) => {
    try {
      // 确保任务类型为包装
      const taskData = {
        ...data,
        type: PackagingTaskType.PACKAGING,
        // 将产品明细直接包含在任务数据中
        items: productItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          completedQuantity: item.completedQuantity,
          remark: item.remark,
        })),
      };

      if (editingTask) {
        // 更新包装任务（包含产品明细）
        await updatePackagingTaskApi(editingTask.id, taskData as UpdatePackagingTaskData);
      } else {
        // 创建包装任务（包含产品明细）
        await createPackagingTaskApi(taskData as CreatePackagingTaskData);
      }

      setIsModalVisible(false);
      setEditingTask(null);
      refresh();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePackagingTaskApi(id);
      message.success('删除包装任务成功');
      refresh();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  /**
   * Table Columns
   */
  const columns: ProColumns<PackagingTaskInfo>[] = [
    {
      title: '序号',
      dataIndex: 'index',
      valueType: 'index',
      width: 50,
      align: 'center',
    },
    {
      title: '店铺',
      dataIndex: ['shop'],
      render: (_, record) => record.shop?.nickname || '-',
    },
    {
      title: '包装进度',
      dataIndex: 'progress',
      width: 150,
      render: (_, record) => {
        if (record.progress !== null && record.progress !== undefined) {
          return (
            <Progress
              percent={record.progress}
              size="small"
              status={record.progress === 100 ? 'success' : 'active'}
              format={(percent) => `${percent}%`}
            />
          );
        }
        return '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (_, record) => {
        const config = getPackagingTaskStatusLabel(record.status);
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
            title="确定要删除这个包装任务吗？"
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
  const proTableProps: ProTableProps<PackagingTaskInfo, any> = {
    columns,
    dataSource: tasksData?.data?.list || [],
    loading,
    rowKey: 'id',
    search: false,
    pagination: {
      current: Number(searchParams.page) || 1,
      pageSize: Number(searchParams.pageSize) || 10,
      total: tasksData?.data?.meta?.total || 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
      onChange: (page, pageSize) => {
        setSearchParams({
          ...searchParams,
          page: page,
          pageSize: pageSize || 10,
          type: PackagingTaskType.PACKAGING,
        });
      },
    },
    options: {
      reload: refresh,
    },
    toolBarRender: () => [
      <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
        新增包装任务
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

  // 调试信息
  console.log('完整的tasksData:', tasksData);
  console.log('tasksData?.data:', tasksData?.data);
  console.log('ProTable dataSource:', tasksData?.data?.list);
  console.log('ProTable loading:', loading);
  console.log('ProTable total:', tasksData?.data?.meta?.total);

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
                {packagingTaskStatusOptions.map((option) => (
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
      <PackagingTaskFormModal
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

export default PackagingTasksPage;
