'use client';

import React, { useState } from 'react';
import { useRequest } from 'ahooks';
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Tag,
  Space,
  message,
  Typography,
  Flex,
} from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import {
  SearchOutlined,
  ReloadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

/**
 * APIs
 */
import { logs } from '@/services/logs';

/**
 * Types
 */
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';
import type { LogsParams, LogsResponse } from '@/services/logs';
import { Pagination } from '@/components/ui/pagination';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

const LogsManagement: React.FC = () => {
  /**
   * Hooks
   */
  const [form] = Form.useForm();

  /**
   * State
   */
  const [searchParams, setSearchParams] = useState<LogsParams>({
    page: 1,
    limit: 20,
  });

  /**
   * Requests
   */
  const {
    data: logsData,
    loading: logsLoading,
    refresh: refreshLogs,
  } = useRequest(() => logs(searchParams), {
    refreshDeps: [searchParams],
  });

  /**
   * Event Handlers
   */
  const handleSearch = (values: any) => {
    const newParams: LogsParams = {
      ...searchParams,
      page: 1,
      category: values.category,
      module: values.module?.trim(),
      operation: values.operation?.trim(),
      status: values.status,
      operator_account_id: values.operator_account_id,
    };

    // 处理日期范围
    if (values.dateRange && values.dateRange.length === 2) {
      newParams.operation_start = values.dateRange[0].startOf('day').format('YYYY-MM-DD');
      newParams.operation_end = values.dateRange[1].endOf('day').format('YYYY-MM-DD');
    }

    setSearchParams(newParams);
  };

  const handleReset = () => {
    form.resetFields();
    setSearchParams({
      page: 1,
      limit: 20,
    });
  };

  /**
   * Table Columns
   */
  const columns: ProColumns<LogsResponse>[] = [
    {
      title: '序号',
      dataIndex: 'index',
      valueType: 'index',
      width: 50,
      align: 'center',
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 80,
      align: 'center',
      render: (_, record: LogsResponse) => <Tag color="blue">{record.category}</Tag>,
    },
    {
      title: '模块',
      dataIndex: 'module',
      width: 100,
      ellipsis: true,
    },
    {
      title: '操作',
      dataIndex: 'operation',
      width: 120,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      align: 'center',
      render: (_, record: LogsResponse) => (
        <Tag
          color={record.status === 'Success' ? 'green' : 'red'}
          icon={record.status === 'Success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {record.status === 'Success' ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '操作员',
      dataIndex: 'operator',
      width: 120,
      ellipsis: true,
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      width: 180,
      render: (_, record: LogsResponse) => dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  /**
   * ProTableProps
   */
  const proTableProps: ProTableProps<LogsResponse, LogsParams> = {
    columns,
    dataSource: logsData?.data?.data?.list || [],
    loading: logsLoading,
    rowKey: 'id',
    pagination: false,
    search: false,
    options: {
      reload: refreshLogs,
      density: false,
      fullScreen: false,
      setting: false,
    },
    scroll: { x: 1000 },
    size: 'middle',
  };

  return (
    <>
      {/* 统计面板 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总日志数"
              value={logsData?.data?.data?.meta?.total || 0}
              prefix={<FileTextOutlined />}
              loading={logsLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成功操作"
              value={
                (
                  logsData?.data?.data?.list?.filter(
                    (item: LogsResponse) => item.status === 'Success'
                  ) || []
                ).length
              }
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              loading={logsLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="失败操作"
              value={
                (
                  logsData?.data?.data?.list?.filter(
                    (item: LogsResponse) => item.status === 'Failure'
                  ) || []
                ).length
              }
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
              loading={logsLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成功率"
              value={
                logsData?.data?.data?.list?.length
                  ? Math.round(
                      (logsData.data.data.list.filter(
                        (item: LogsResponse) => item.status === 'Success'
                      ).length /
                        logsData.data.data.list.length) *
                        100
                    )
                  : 0
              }
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
              loading={logsLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索区域 */}
      <ProCard className="mb-16">
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Flex gap={16} wrap={true}>
            <Form.Item name="category" style={{ marginRight: 0 }}>
              <Select placeholder="选择分类" style={{ width: 120 }} allowClear>
                <Option value="SYSTEM">系统</Option>
                <Option value="SECURITY">安全</Option>
                <Option value="BUSINESS">业务</Option>
                <Option value="ERROR">错误</Option>
              </Select>
            </Form.Item>
            <Form.Item name="module" style={{ marginRight: 0 }}>
              <Input placeholder="模块名称" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="operation" style={{ marginRight: 0 }}>
              <Input placeholder="操作类型" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="status" style={{ marginRight: 0 }}>
              <Select placeholder="选择状态" style={{ width: 100 }} allowClear>
                <Option value="Success">成功</Option>
                <Option value="Failure">失败</Option>
              </Select>
            </Form.Item>
            <Form.Item name="dateRange" style={{ marginRight: 0 }}>
              <RangePicker style={{ width: 240 }} />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={logsLoading}
              icon={<SearchOutlined />}
            >
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Flex>
        </Form>
      </ProCard>

      {/* 表格区域 */}
      <ProTable {...proTableProps} />

      {/* 分页区域 */}
      <Pagination
        current={searchParams.page || 1}
        size={searchParams.limit || 20}
        total={logsData?.data?.data?.meta?.total || 0}
        hasMore={false}
        searchAfter=""
        onChange={({ page, size }) => {
          setSearchParams({ ...searchParams, page, limit: size || 20 });
        }}
        isLoading={logsLoading}
      />
    </>
  );
};

export default LogsManagement;
