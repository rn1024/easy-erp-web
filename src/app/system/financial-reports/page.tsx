'use client';

import React, { useState } from 'react';
import {
  Button,
  Modal,
  Form,
  Select,
  Space,
  Row,
  Col,
  InputNumber,
  Popconfirm,
  message,
  Tag,
  Tabs,
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
  DollarOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';
import { Pagination } from '@/components/ui/pagination';
import dayjs from 'dayjs';
import {
  getFinancialReportsApi,
  createFinancialReportApi,
  updateFinancialReportApi,
  deleteFinancialReportApi,
  getDefaultFinancialReportDetails,
  calculateFinancialMetrics,
  formatCurrency,
  formatPercentage,
  getMonthOptions,
  type FinancialReport,
  type CreateFinancialReportData,
  type UpdateFinancialReportData,
  type FinancialReportQueryParams,
  type FinancialReportDetails,
} from '@/services/financial';
import { getShops } from '@/services/shops';

const { Option } = Select;
const { TabPane } = Tabs;

export default function FinancialReportsPage() {
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingReport, setEditingReport] = useState<FinancialReport | null>(null);
  const [searchParams, setSearchParams] = useState<FinancialReportQueryParams>({
    page: 1,
    pageSize: 10,
  });

  // 获取财务报表列表
  const {
    data: reportsResponse,
    loading,
    refresh,
  } = useRequest(() => getFinancialReportsApi(searchParams), {
    refreshDeps: [searchParams],
  });

  // 获取店铺列表
  const { data: shopsResponse } = useRequest(() => getShops({}));

  // 处理数据
  const shops = shopsResponse?.data?.data?.list || [];
  const reports = reportsResponse?.data?.data?.list || [];
  const total = reportsResponse?.data?.data?.total || 0;

  // 搜索处理
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    setSearchParams({
      ...values,
      page: 1,
      pageSize: searchParams.pageSize,
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

  // 显示新增/编辑弹窗
  const showModal = (report?: FinancialReport) => {
    setEditingReport(report || null);
    setIsModalVisible(true);

    if (report) {
      form.setFieldsValue({
        shopId: report.shopId,
        reportMonth: report.reportMonth,
        productSales: report.details.revenue?.productSales || 0,
        productCosts: report.details.costs?.productCosts || 0,
      });
    } else {
      form.resetFields();
    }
  };

  // 创建/更新财务报表
  const handleSubmit = async (values: any) => {
    try {
      const details = calculateFinancialMetrics({
        revenue: {
          totalRevenue: 0,
          productSales: values.productSales || 0,
          serviceFees: 0,
          otherIncome: 0,
        },
        costs: {
          totalCosts: 0,
          productCosts: values.productCosts || 0,
          shippingCosts: 0,
          marketingCosts: 0,
          operatingCosts: 0,
          otherCosts: 0,
        },
        profit: {
          grossProfit: 0,
          netProfit: 0,
          profitMargin: 0,
        },
        inventory: {
          startingInventory: 0,
          endingInventory: 0,
          inventoryTurnover: 0,
        },
        sales: {
          totalOrders: 0,
          averageOrderValue: 0,
          returnRate: 0,
          conversionRate: 0,
        },
        advertising: {
          adSpend: 0,
          adRevenue: 0,
          acos: 0,
          roas: 0,
        },
        cashFlow: {
          operatingCashFlow: 0,
          investmentCashFlow: 0,
          financingCashFlow: 0,
          netCashFlow: 0,
        },
      });

      if (editingReport) {
        const updateData: UpdateFinancialReportData = {
          reportMonth: values.reportMonth,
          details,
        };
        await updateFinancialReportApi(editingReport.id, updateData);
        message.success('更新财务报表成功');
      } else {
        const createData: CreateFinancialReportData = {
          shopId: values.shopId,
          reportMonth: values.reportMonth,
          details,
        };
        await createFinancialReportApi(createData);
        message.success('创建财务报表成功');
      }

      setIsModalVisible(false);
      form.resetFields();
      setEditingReport(null);
      refresh();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  // 删除财务报表
  const handleDelete = async (id: string) => {
    try {
      await deleteFinancialReportApi(id);
      message.success('删除财务报表成功');
      refresh();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const columns: ProColumns<FinancialReport>[] = [
    {
      title: '报表ID',
      dataIndex: 'id',
      width: 120,
      render: (_, record) => record.id.slice(-8),
    },
    {
      title: '店铺',
      dataIndex: ['shop'],
      render: (_, record) => (record.shop ? `${record.shop.nickname}` : '-'),
    },
    {
      title: '报表月份',
      dataIndex: 'reportMonth',
      render: (_, record) => {
        const [year, monthNum] = record.reportMonth.split('-');
        return `${year}年${parseInt(monthNum)}月`;
      },
    },
    {
      title: '总收入',
      dataIndex: ['details', 'revenue', 'totalRevenue'],
      render: (_, record) => formatCurrency(record.details?.revenue?.totalRevenue || 0),
    },
    {
      title: '净利润',
      dataIndex: ['details', 'profit', 'netProfit'],
      render: (_, record) => {
        const value = record.details?.profit?.netProfit || 0;
        return (
          <span style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>{formatCurrency(value)}</span>
        );
      },
    },
    {
      title: '利润率',
      dataIndex: ['details', 'profit', 'profitMargin'],
      render: (_, record) => {
        const value = record.details?.profit?.profitMargin || 0;
        return <Tag color={value >= 0 ? 'green' : 'red'}>{formatPercentage(value)}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => message.info('详情功能开发中')}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个财务报表吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ProTable 配置
  const proTableProps: ProTableProps<FinancialReport, any> = {
    columns,
    dataSource: reports,
    loading,
    rowKey: 'id',
    search: false,
    pagination: false,
    options: {
      reload: refresh,
    },
    toolBarRender: () => [
      <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
        新增财务报表
      </Button>,
      <Button key="refresh" icon={<ReloadOutlined />} onClick={refresh}>
        刷新
      </Button>,
    ],
    scroll: { x: 1200 },
  };

  return (
    <>
      {/* 搜索区域 */}
      <ProCard className="mb-16">
        <Form form={searchForm} layout="inline">
          <Flex gap={16} wrap={true}>
            <Form.Item name="shopId" style={{ marginRight: 0 }}>
              <Select placeholder="请选择店铺" allowClear style={{ width: 200 }}>
                {shops.map((shop: any) => (
                  <Option key={shop.id} value={shop.id}>
                    {shop.nickname}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="reportMonth" style={{ marginRight: 0 }}>
              <Select placeholder="请选择月份" allowClear style={{ width: 200 }}>
                {getMonthOptions().map((option) => (
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

      {/* 分页区域 */}
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

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingReport ? '编辑财务报表' : '新增财务报表'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingReport(null);
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shopId"
                label="店铺"
                rules={[{ required: true, message: '请选择店铺' }]}
              >
                <Select placeholder="请选择店铺" disabled={!!editingReport}>
                  {shops.map((shop: any) => (
                    <Option key={shop.id} value={shop.id}>
                      {shop.nickname}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reportMonth"
                label="报表月份"
                rules={[{ required: true, message: '请选择报表月份' }]}
              >
                <Select placeholder="请选择月份">
                  {getMonthOptions().map((option) => (
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
              <Form.Item name="productSales" label="产品销售收入">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入金额"
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="productCosts" label="产品成本">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入金额"
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingReport ? '更新' : '创建'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </>
  );
}
