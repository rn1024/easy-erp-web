'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  Space,
  Card,
  Row,
  Col,
  InputNumber,
  Popconfirm,
  message,
  Tag,
  Tabs,
  Spin,
} from 'antd';
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
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  getFinancialReportsApi,
  createFinancialReportApi,
  updateFinancialReportApi,
  deleteFinancialReportApi,
  calculateFinancialMetrics,
  formatCurrency,
  formatPercentage,
  getMonthOptions,
  type FinancialReport,
  type CreateFinancialReportData,
  type UpdateFinancialReportData,
  type FinancialReportQueryParams,
} from '@/services/financial';
import { getShops } from '@/services/shops';
import { useDebounceSearch, usePerformanceMonitor } from '@/hooks/usePerformanceOptimization';

const { Option } = Select;
const { TabPane } = Tabs;

// 优化的财务报表组件
const FinancialReportCard = React.memo(
  ({
    report,
    onEdit,
    onDelete,
  }: {
    report: FinancialReport;
    onEdit: (report: FinancialReport) => void;
    onDelete: (id: string) => void;
  }) => {
    const handleEdit = useCallback(() => onEdit(report), [report, onEdit]);
    const handleDelete = useCallback(() => onDelete(report.id), [report.id, onDelete]);

    return (
      <Card
        size="small"
        title={`${report.shop?.nickname || '未知店铺'} - ${report.reportMonth}`}
        extra={
          <Space>
            <Button type="text" icon={<EditOutlined />} onClick={handleEdit} size="small" />
            <Popconfirm
              title="确定删除这个财务报表吗？"
              onConfirm={handleDelete}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <div>总收入</div>
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(report.details.revenue?.totalRevenue || 0)}
            </div>
          </Col>
          <Col span={6}>
            <div>总成本</div>
            <div className="text-lg font-semibold text-red-600">
              {formatCurrency(report.details.costs?.totalCosts || 0)}
            </div>
          </Col>
          <Col span={6}>
            <div>净利润</div>
            <div className="text-lg font-semibold text-blue-600">
              {formatCurrency(report.details.profit?.netProfit || 0)}
            </div>
          </Col>
          <Col span={6}>
            <div>利润率</div>
            <div className="text-lg font-semibold">
              {formatPercentage(report.details.profit?.profitMargin || 0)}
            </div>
          </Col>
        </Row>
      </Card>
    );
  }
);

FinancialReportCard.displayName = 'FinancialReportCard';

export default function FinancialReportsPageOptimized() {
  // 性能监控
  const { renderTime } = usePerformanceMonitor('FinancialReportsPage');

  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingReport, setEditingReport] = useState<FinancialReport | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });

  // 防抖搜索
  const { searchQuery: searchParams, setSearchQuery: setSearchParams } = useDebounceSearch(
    (query: string) => {
      setPagination((prev) => ({ ...prev, page: 1 }));
      // 这里将字符串转换为搜索参数对象
      const params = query ? { search: query } : {};
      return params;
    },
    300
  );

  // 获取财务报表列表（带缓存）
  const {
    data: reportsData,
    loading,
    refresh,
  } = useRequest(
    () =>
      getFinancialReportsApi({
        ...searchParams,
        page: pagination.page,
        pageSize: pagination.pageSize,
      }),
    {
      refreshDeps: [searchParams, pagination],
      cacheKey: `financial-reports-${JSON.stringify(searchParams)}-${pagination.page}-${pagination.pageSize}`,
      staleTime: 30 * 1000, // 30秒缓存
    }
  );

  // 获取店铺列表（带缓存）
  const { data: shopsData } = useRequest(() => getShops({}), {
    cacheKey: 'shops-list',
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });

  // 处理数据
  const shops = useMemo(() => shopsData?.data?.data?.list || [], [shopsData]);
  const reports = useMemo(() => reportsData?.data?.data?.list || [], [reportsData]);
  const total = useMemo(() => reportsData?.data?.data?.total || 0, [reportsData]);

  // 搜索处理（优化）
  const handleSearch = useCallback(
    (values: any) => {
      setSearchParams(JSON.stringify(values));
    },
    [setSearchParams]
  );

  // 重置搜索（优化）
  const handleReset = useCallback(() => {
    searchForm.resetFields();
    setSearchParams('');
  }, [searchForm, setSearchParams]);

  // 显示新增/编辑弹窗（优化）
  const showModal = useCallback(
    (report?: FinancialReport) => {
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
    },
    [form]
  );

  // 创建/更新财务报表（优化）
  const handleSubmit = useCallback(
    async (values: any) => {
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
          await updateFinancialReportApi(editingReport.id, {
            reportMonth: values.reportMonth,
            details,
          });
          message.success('更新财务报表成功');
        } else {
          await createFinancialReportApi({
            shopId: values.shopId,
            reportMonth: values.reportMonth,
            details,
          });
          message.success('创建财务报表成功');
        }

        setIsModalVisible(false);
        form.resetFields();
        setEditingReport(null);
        refresh();
      } catch (error: any) {
        message.error(error.response?.data?.message || '操作失败');
      }
    },
    [editingReport, form, refresh]
  );

  // 删除财务报表（优化）
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteFinancialReportApi(id);
        message.success('删除财务报表成功');
        refresh();
      } catch (error: any) {
        message.error(error.response?.data?.message || '删除失败');
      }
    },
    [refresh]
  );

  // 分页处理（优化）
  const handleTableChange = useCallback((paginationConfig: any) => {
    setPagination({
      page: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    });
  }, []);

  // 表格列定义（优化）
  const columns: ColumnsType<FinancialReport> = useMemo(
    () => [
      {
        title: '报表ID',
        dataIndex: 'id',
        key: 'id',
        width: 120,
        render: (text) => text.slice(-8),
      },
      {
        title: '店铺',
        dataIndex: ['shop', 'nickname'],
        key: 'shop',
        width: 150,
        render: (text) => text || '未知店铺',
      },
      {
        title: '报表月份',
        dataIndex: 'reportMonth',
        key: 'reportMonth',
        width: 120,
        render: (text) => dayjs(text).format('YYYY-MM'),
      },
      {
        title: '总收入',
        key: 'totalRevenue',
        width: 120,
        render: (_, record) => formatCurrency(record.details.revenue?.totalRevenue || 0),
      },
      {
        title: '总成本',
        key: 'totalCosts',
        width: 120,
        render: (_, record) => formatCurrency(record.details.costs?.totalCosts || 0),
      },
      {
        title: '净利润',
        key: 'netProfit',
        width: 120,
        render: (_, record) => {
          const profit = record.details.profit?.netProfit || 0;
          return (
            <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(profit)}
            </span>
          );
        },
      },
      {
        title: '利润率',
        key: 'profitMargin',
        width: 100,
        render: (_, record) => {
          const margin = record.details.profit?.profitMargin || 0;
          return (
            <span className={margin >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatPercentage(margin)}
            </span>
          );
        },
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 160,
        render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        fixed: 'right',
        render: (_, record) => (
          <Space size="small">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => showModal(record)}
            />
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => showModal(record)}
            />
            <Popconfirm
              title="确定删除这个财务报表吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [showModal, handleDelete]
  );

  // 月份选项（优化）
  const monthOptions = useMemo(() => getMonthOptions(), []);

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarOutlined className="text-green-600" />
          财务报表管理
        </h1>
        <p className="text-gray-600 mt-2">管理和查看各店铺的财务报表数据</p>
      </div>

      {/* 搜索表单 */}
      <Card className="mb-6">
        <Form form={searchForm} layout="inline" onFinish={handleSearch} className="search-form">
          <Form.Item name="shopId" label="店铺">
            <Select
              placeholder="选择店铺"
              style={{ width: 200 }}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {shops.map((shop: any) => (
                <Option key={shop.id} value={shop.id}>
                  {shop.nickname}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="reportMonth" label="报表月份">
            <Select placeholder="选择月份" style={{ width: 150 }} allowClear>
              {monthOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
                新增报表
              </Button>
              <Button icon={<ReloadOutlined />} onClick={refresh}>
                刷新
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={reports}
            rowKey="id"
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
            size="small"
          />
        </Spin>
      </Card>

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
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="pt-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shopId"
                label="店铺"
                rules={[{ required: true, message: '请选择店铺' }]}
              >
                <Select
                  placeholder="选择店铺"
                  showSearch
                  optionFilterProp="children"
                  disabled={!!editingReport}
                >
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
                <Select placeholder="选择月份">
                  {monthOptions.map((option) => (
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
                name="productSales"
                label="产品销售额"
                rules={[{ required: true, message: '请输入产品销售额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入产品销售额"
                  min={0}
                  step={0.01}
                  precision={2}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, ''))}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="productCosts"
                label="产品成本"
                rules={[{ required: true, message: '请输入产品成本' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入产品成本"
                  min={0}
                  step={0.01}
                  precision={2}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, ''))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                  setEditingReport(null);
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingReport ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
