'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Tooltip,
  Modal,
  message,
  Typography,
  Flex,
} from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import {
  SearchOutlined,
  ReloadOutlined,
  FileTextOutlined,
  BugOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BarChartOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';
import { Pagination } from '@/components/ui/pagination';
import dayjs from 'dayjs';
import {
  useDebounceSearch,
  useDataCache,
  usePerformanceMonitor,
} from '@/hooks/usePerformanceOptimization';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text, Paragraph } = Typography;

// 日志相关接口定义
interface LogItem {
  id: string;
  category: string;
  module: string;
  operation: string;
  status: string;
  details: any;
  createdAt: string;
  operator: {
    id: string;
    name: string;
  };
  operatorAccountId: string;
}

interface LogsParams {
  page?: number;
  pageSize?: number;
  category?: string;
  module?: string;
  operation?: string;
  status?: string;
  operatorAccountId?: string;
  startDate?: string;
  endDate?: string;
}

interface LogsResponse {
  list: LogItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface LogStats {
  summary: {
    total: number;
    success: number;
    failure: number;
    successRate: string;
  };
  categoryStats: Array<{ category: string; count: number }>;
  moduleStats: Array<{ module: string; count: number }>;
}

// API 函数
const getLogsList = async (
  params: LogsParams
): Promise<{ code: number; msg: string; data: LogsResponse }> => {
  const response = await fetch(`/api/v1/logs?${new URLSearchParams(params as any)}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.json();
};

const getLogsStats = async (
  days: number = 7
): Promise<{ code: number; msg: string; data: LogStats }> => {
  const response = await fetch(`/api/v1/logs/stats?days=${days}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.json();
};

const LogsManagement: React.FC = () => {
  // 性能监控
  const { renderTime } = usePerformanceMonitor('LogsManagement');

  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchParams, setSearchParams] = useState<LogsParams>({
    page: 1,
    pageSize: 20,
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);

  // 获取日志列表（带缓存优化）
  const {
    data: logsResponse,
    loading: logsLoading,
    refresh: refreshLogs,
  } = useRequest(() => getLogsList(searchParams), {
    refreshDeps: [searchParams],
    cacheKey: `logs-${JSON.stringify(searchParams)}`,
    staleTime: 30 * 1000, // 30秒内使用缓存
  });

  // 获取统计数据（带缓存优化）
  const {
    data: statsResponse,
    loading: statsLoading,
    refresh: refreshStats,
  } = useRequest(() => getLogsStats(7), {
    cacheKey: 'logs-stats-7days',
    staleTime: 60 * 1000, // 1分钟内使用缓存
  });

  // 数据处理
  const logsData = logsResponse?.data;
  const statsData = statsResponse?.data;

  // 表格列定义
  const columns: ProColumns<LogItem>[] = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (_, record) => <Text>{dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Text>,
      sorter: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
      render: (_, record) => {
        const colorMap: Record<string, string> = {
          SYSTEM: 'blue',
          SECURITY: 'red',
          BUSINESS: 'green',
          ERROR: 'volcano',
        };
        return <Tag color={colorMap[record.category] || 'default'}>{record.category}</Tag>;
      },
    },
    {
      title: '模块',
      dataIndex: 'module',
      width: 120,
      render: (_, record) => <Tag color="processing">{record.module}</Tag>,
    },
    {
      title: '操作',
      dataIndex: 'operation',
      width: 150,
      render: (_, record) => (
        <Text ellipsis={{ tooltip: record.operation }}>{record.operation}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_, record) => {
        const isSuccess = record.status === 'SUCCESS';
        return (
          <Tag
            icon={isSuccess ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            color={isSuccess ? 'success' : 'error'}
          >
            {isSuccess ? '成功' : '失败'}
          </Tag>
        );
      },
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      width: 120,
      render: (_, record) => <Text>{record.operator?.name || '系统'}</Text>,
    },
    {
      title: '操作',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 处理搜索
  const handleSearch = (values: any) => {
    const { dateRange, ...otherValues } = values;
    const params: LogsParams = {
      ...otherValues,
      page: 1,
      pageSize: searchParams.pageSize,
    };

    if (dateRange) {
      params.startDate = dateRange[0].format('YYYY-MM-DD');
      params.endDate = dateRange[1].format('YYYY-MM-DD');
    }

    setSearchParams(params);
  };

  // 重置搜索
  const handleReset = () => {
    form.resetFields();
    setSearchParams({
      page: 1,
      pageSize: 20,
    });
  };

  // 查看详情
  const handleViewDetail = (record: LogItem) => {
    setSelectedLog(record);
    setDetailModalVisible(true);
  };

  // 刷新数据
  const handleRefresh = () => {
    refreshLogs();
    refreshStats();
    message.success('数据已刷新');
  };

  // ProTable 配置
  const proTableProps: ProTableProps<LogItem, any> = {
    columns,
    dataSource: logsData?.list || [],
    loading: logsLoading,
    rowKey: 'id',
    search: false,
    pagination: false,
    options: {
      reload: refreshLogs,
    },
    toolBarRender: () => [
      <Button key="refresh" icon={<ReloadOutlined />} onClick={handleRefresh}>
        刷新
      </Button>,
    ],
    scroll: { x: 1200 },
  };

  return (
    <>
      {/* 统计面板 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总日志数"
              value={statsData?.summary.total || 0}
              prefix={<FileTextOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成功操作"
              value={statsData?.summary.success || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="失败操作"
              value={statsData?.summary.failure || 0}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成功率"
              value={statsData?.summary.successRate || 0}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
              loading={statsLoading}
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
                <Option value="SUCCESS">成功</Option>
                <Option value="FAILURE">失败</Option>
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
        current={Number(searchParams.page) || 1}
        size={Number(searchParams.pageSize) || 20}
        total={logsData?.meta.total || 0}
        hasMore={false}
        searchAfter=""
        onChange={({ page, size }) => {
          setSearchParams((prev) => ({
            ...prev,
            page: page,
            pageSize: size || 20,
          }));
        }}
        isLoading={logsLoading}
      />

      {/* 详情弹窗 */}
      <Modal
        title="日志详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedLog && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>时间:</Text>
                <Text style={{ marginLeft: 8 }}>
                  {dayjs(selectedLog.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </Text>
              </Col>
              <Col span={12}>
                <Text strong>分类:</Text>
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {selectedLog.category}
                </Tag>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Text strong>模块:</Text>
                <Tag color="processing" style={{ marginLeft: 8 }}>
                  {selectedLog.module}
                </Tag>
              </Col>
              <Col span={12}>
                <Text strong>操作:</Text>
                <Text style={{ marginLeft: 8 }}>{selectedLog.operation}</Text>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Text strong>状态:</Text>
                <Tag
                  color={selectedLog.status === 'SUCCESS' ? 'success' : 'error'}
                  style={{ marginLeft: 8 }}
                >
                  {selectedLog.status === 'SUCCESS' ? '成功' : '失败'}
                </Tag>
              </Col>
              <Col span={12}>
                <Text strong>操作人:</Text>
                <Text style={{ marginLeft: 8 }}>{selectedLog.operator?.name || '系统'}</Text>
              </Col>
            </Row>
            {selectedLog.details && (
              <div style={{ marginTop: 16 }}>
                <Text strong>详细信息:</Text>
                <Paragraph>
                  <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </Paragraph>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default LogsManagement;
