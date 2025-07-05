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
import { omitBy, isEmpty } from 'lodash';

/**
 * APIs
 */
import { logs } from '@/services/logs';

/**
 * Types
 */
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';
import type { LogsParams, LogsResponse } from '@/services/logs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

const LogsPage: React.FC = () => {
  /**
   * Hooks
   */
  const [searchForm] = Form.useForm();

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
    const searchLogsParams: LogsParams = omitBy(
      {
        page: 1,
        limit: 20,
        start_time: values.dateRange?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
        end_time: values.dateRange?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
        operations: values.operation?.trim(),
        operator: values.operator?.trim(),
      },
      isEmpty
    );

    setSearchParams(searchLogsParams);
  };

  const handleReset = () => {
    searchForm.resetFields();
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
      title: 'ID',
      dataIndex: 'id',
      width: 100,
      render: (text) => text?.toString().slice(-8) || '-',
    },
    {
      title: '操作类型',
      dataIndex: 'operation',
      width: 120,
      render: (text) => <Tag color="blue">{text || '-'}</Tag>,
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      width: 120,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      width: 140,
    },
    {
      title: '请求URL',
      dataIndex: 'url',
      ellipsis: true,
      width: 200,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const isSuccess = status === 200 || status === 'success';
        return (
          <Tag
            color={isSuccess ? 'green' : 'red'}
            icon={isSuccess ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          >
            {status || '-'}
          </Tag>
        );
      },
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      width: 180,
      render: (text) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'),
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
    search: false,
    pagination: {
      current: Number(searchParams.page) || 1,
      pageSize: Number(searchParams.limit) || 20,
      total: logsData?.data?.data?.meta?.total || 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
      onChange: (page, pageSize) => {
        setSearchParams({
          ...searchParams,
          page: page,
          limit: pageSize || 20,
        });
      },
    },
    options: {
      reload: refreshLogs,
    },
  };

  /**
   * Simple Statistics Calculation
   */
  const logsStats = {
    total: logsData?.data?.data?.list?.length || 0,
    success:
      logsData?.data?.data?.list?.filter(
        (log: any) => log.status === 200 || log.status === 'success'
      )?.length || 0,
    error:
      logsData?.data?.data?.list?.filter(
        (log: any) => log.status !== 200 && log.status !== 'success'
      )?.length || 0,
    today:
      logsData?.data?.data?.list?.filter((log: any) =>
        dayjs(log.created_at).isAfter(dayjs().startOf('day'))
      )?.length || 0,
  };

  return (
    <>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总日志数"
              value={logsStats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成功操作"
              value={logsStats.success}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="失败操作"
              value={logsStats.error}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日操作"
              value={logsStats.today}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索区域 */}
      <ProCard className="mb-16">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Flex gap={16} wrap={true}>
            <Form.Item name="operation" style={{ marginRight: 0 }}>
              <Input placeholder="操作类型" style={{ width: 150 }} allowClear />
            </Form.Item>
            <Form.Item name="operator" style={{ marginRight: 0 }}>
              <Input placeholder="操作人" style={{ width: 150 }} allowClear />
            </Form.Item>
            <Form.Item name="dateRange" style={{ marginRight: 0 }}>
              <RangePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                placeholder={['开始时间', '结束时间']}
                style={{ width: 400 }}
              />
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
    </>
  );
};

export default LogsPage;
