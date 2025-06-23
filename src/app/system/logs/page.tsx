'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
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
} from 'antd';
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
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

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
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchParams, setSearchParams] = useState<LogsParams>({
    page: 1,
    pageSize: 20,
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);

  // 获取日志列表
  const {
    data: logsData,
    loading: logsLoading,
    refresh: refreshLogs,
  } = useRequest(() => getLogsList(searchParams), {
    refreshDeps: [searchParams],
  });

  // 获取统计数据
  const {
    data: statsData,
    loading: statsLoading,
    refresh: refreshStats,
  } = useRequest(() => getLogsStats(7));

  // 表格列定义
  const columns: ColumnsType<LogItem> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (text: string) => <Text>{dayjs(text).format('YYYY-MM-DD HH:mm:ss')}</Text>,
      sorter: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => {
        const colorMap: Record<string, string> = {
          SYSTEM: 'blue',
          SECURITY: 'red',
          BUSINESS: 'green',
          ERROR: 'volcano',
        };
        return <Tag color={colorMap[category] || 'default'}>{category}</Tag>;
      },
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (module: string) => <Tag color="processing">{module}</Tag>,
    },
    {
      title: '操作',
      dataIndex: 'operation',
      key: 'operation',
      width: 150,
      render: (operation: string) => <Text ellipsis={{ tooltip: operation }}>{operation}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const isSuccess = status === 'SUCCESS';
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
      key: 'operator',
      width: 120,
      render: (operator: any) => <Text>{operator?.name || '系统'}</Text>,
    },
    {
      title: '操作',
      key: 'action',
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

  // 表格变化处理
  const handleTableChange = (pagination: any) => {
    setSearchParams((prev) => ({
      ...prev,
      page: pagination.current,
      pageSize: pagination.pageSize,
    }));
  };

  // 刷新数据
  const handleRefresh = () => {
    refreshLogs();
    refreshStats();
    message.success('数据已刷新');
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5' }}>
      {/* 统计面板 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总日志数"
              value={statsData?.data?.summary.total || 0}
              prefix={<FileTextOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成功操作"
              value={statsData?.data?.summary.success || 0}
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
              value={statsData?.data?.summary.failure || 0}
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
              value={statsData?.data?.summary.successRate || 0}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
              loading={statsLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索表单 */}
      <Card style={{ marginBottom: 24 }}>
        <Form form={form} layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
          <Form.Item name="category" label="分类">
            <Select placeholder="选择分类" style={{ width: 120 }} allowClear>
              <Option value="SYSTEM">系统</Option>
              <Option value="SECURITY">安全</Option>
              <Option value="BUSINESS">业务</Option>
              <Option value="ERROR">错误</Option>
            </Select>
          </Form.Item>

          <Form.Item name="module" label="模块">
            <Input placeholder="模块名称" style={{ width: 120 }} />
          </Form.Item>

          <Form.Item name="operation" label="操作">
            <Input placeholder="操作类型" style={{ width: 120 }} />
          </Form.Item>

          <Form.Item name="status" label="状态">
            <Select placeholder="选择状态" style={{ width: 100 }} allowClear>
              <Option value="SUCCESS">成功</Option>
              <Option value="FAILURE">失败</Option>
            </Select>
          </Form.Item>

          <Form.Item name="dateRange" label="时间范围">
            <RangePicker style={{ width: 240 }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 日志表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={logsData?.data?.list || []}
          rowKey="id"
          loading={logsLoading}
          pagination={{
            current: logsData?.data?.meta.page || 1,
            pageSize: logsData?.data?.meta.pageSize || 20,
            total: logsData?.data?.meta.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

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
    </div>
  );
};

export default LogsManagement;
