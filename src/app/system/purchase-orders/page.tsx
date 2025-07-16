'use client';

import React, { useState } from 'react';
import {
  Button,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  message,
  Tag,
  Avatar,
  Tooltip,
  Badge,
  Flex,
  DatePicker,
} from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  ShopOutlined,
  UserOutlined,
  ProductOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';

/**
 * Components
 */
import PurchaseOrderFormModal from './components/purchase-order-form-modal';

/**
 * APIs
 */
import {
  getPurchaseOrdersApi,
  deletePurchaseOrderApi,
  PurchaseOrderInfo,
  PurchaseOrderStatus,
  purchaseOrderStatusOptions,
  getPurchaseOrderStatusLabel,
  getPurchaseOrderStatusColor,
} from '@/services/purchase';
import { getShops } from '@/services/shops';
import { getSuppliers } from '@/services/suppliers';
import { getProductsApi } from '@/services/products';
import { accounts } from '@/services/account';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface SearchFormData {
  shopId?: string;
  supplierId?: string;
  productId?: string;
  status?: PurchaseOrderStatus;
  urgent?: boolean;
  operatorId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

const PurchaseOrdersPage: React.FC = () => {
  const [searchForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PurchaseOrderInfo | null>(null);
  const [searchParams, setSearchParams] = useState<SearchFormData>({
    page: 1,
    pageSize: 10,
  });

  // 获取采购订单列表
  const {
    data: purchaseOrdersResponse,
    loading: purchaseOrdersLoading,
    refresh: refreshPurchaseOrders,
  } = useRequest(() => getPurchaseOrdersApi(searchParams), {
    refreshDeps: [searchParams],
  });

  // 获取店铺列表
  const { data: shopsResponse } = useRequest(() => getShops({ page: 1, pageSize: 100 }));

  // 获取供应商列表
  const { data: suppliersResponse } = useRequest(() => getSuppliers({ page: 1, pageSize: 100 }));

  // 获取产品列表
  const { data: productsResponse } = useRequest(() => getProductsApi({ page: 1, pageSize: 100 }));

  // 员工搜索状态
  const [operatorSearchValue, setOperatorSearchValue] = useState('');

  // 获取员工列表 - 支持搜索
  const { data: accountsResponse, loading: accountsLoading } = useRequest(
    () =>
      accounts({
        page: 1,
        limit: operatorSearchValue ? 50 : 20, // 搜索时多显示，默认显示最常用的
        name: operatorSearchValue || undefined,
      }),
    {
      refreshDeps: [operatorSearchValue],
      debounceWait: 300, // 防抖300ms
    }
  );

  // 处理数据
  const purchaseOrdersData = purchaseOrdersResponse?.data?.data;
  const shopsData = shopsResponse?.data?.data?.list || [];
  const suppliersData = suppliersResponse?.data?.data?.list || [];
  const productsData = productsResponse?.data?.data?.list || [];
  const accountsData = accountsResponse?.data?.data?.list || [];

  // 删除采购订单
  const { run: deletePurchaseOrder } = useRequest(deletePurchaseOrderApi, {
    manual: true,
    onSuccess: () => {
      message.success('删除成功');
      refreshPurchaseOrders();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.msg || '删除失败');
    },
  });

  // 搜索处理
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    const { dateRange, urgent, ...otherValues } = values;

    // 处理日期范围
    let startDate, endDate;
    if (dateRange && dateRange.length === 2) {
      startDate = dateRange[0].format('YYYY-MM-DD 00:00:00');
      endDate = dateRange[1].format('YYYY-MM-DD 23:59:59');
    }

    // 处理紧急程度筛选
    const params: any = {
      ...otherValues,
      startDate,
      endDate,
      page: 1,
      pageSize: searchParams.pageSize,
    };

    // 只有选择了具体的紧急程度才传递参数
    if (urgent !== undefined && urgent !== '') {
      params.urgent = urgent;
    }

    setSearchParams(params);
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setOperatorSearchValue(''); // 重置操作员搜索
    setSearchParams({
      page: 1,
      pageSize: 10,
    });
  };

  // 打开编辑弹窗
  const handleEdit = (record: PurchaseOrderInfo) => {
    setEditingRecord(record);
    setModalVisible(true);
  };

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingRecord(null);
    setModalVisible(true);
  };

  const closeModal = (reload?: boolean) => {
    setModalVisible(false);
    setEditingRecord(null);
    if (reload) {
      refreshPurchaseOrders();
    }
  };

  // 表格列定义
  const columns: ProColumns<PurchaseOrderInfo>[] = [
    {
      title: '订单信息',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            {record.urgent && <Badge dot color="red" style={{ marginRight: 4 }} />}
            <span style={{ fontFamily: 'monospace' }}>{record.orderNumber}</span>
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            创建时间: {new Date(record.createdAt).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      title: '店铺',
      width: 150,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={record.shop.avatarUrl}
            icon={<ShopOutlined />}
            size="small"
            style={{ marginRight: 8 }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.shop.nickname}</div>
            {record.shop.responsiblePerson && (
              <div style={{ color: '#666', fontSize: '12px' }}>{record.shop.responsiblePerson}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '供应商',
      width: 150,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={record.supplier.avatarUrl}
            icon={<UserOutlined />}
            size="small"
            style={{ marginRight: 8 }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.supplier.nickname}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>{record.supplier.contactPerson}</div>
          </div>
        </div>
      ),
    },
    {
      title: '产品',
      width: 180,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={record.product.imageUrl}
            icon={<ProductOutlined />}
            size="small"
            style={{ marginRight: 8 }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.product.code}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              {record.product.specification || record.product.sku}
            </div>
            <div style={{ color: '#999', fontSize: '12px' }}>{record.product.category.name}</div>
          </div>
        </div>
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {record.quantity.toLocaleString()}
        </span>
      ),
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      width: 100,
      align: 'right',
      render: (_, record) => (
        <span style={{ fontWeight: 'bold', color: '#f50' }}>
          ¥{record.totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Tag color={getPurchaseOrderStatusColor(record.status)}>
          {getPurchaseOrderStatusLabel(record.status)}
        </Tag>
      ),
    },
    {
      title: '操作员',
      width: 100,
      render: (_, record) => record.operator.name,
    },
    {
      title: '订单时间',
      width: 160,
      render: (_, record) => new Date(record.createdAt).toLocaleString(),
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个采购订单吗？"
              onConfirm={() => deletePurchaseOrder(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
                disabled={!['PENDING', 'CANCELLED'].includes(record.status)}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ProTable 配置
  const proTableProps: ProTableProps<PurchaseOrderInfo, any> = {
    columns,
    dataSource: purchaseOrdersData?.list || [],
    loading: purchaseOrdersLoading,
    rowKey: 'id',
    search: false,
    pagination: {
      current: Number(searchParams.page) || 1,
      pageSize: Number(searchParams.pageSize) || 20,
      total: purchaseOrdersData?.meta?.total || 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
      onChange: (page, pageSize) => {
        setSearchParams({ ...searchParams, page: page, pageSize: pageSize || 20 });
      },
    },
    options: {
      reload: refreshPurchaseOrders,
    },
    toolBarRender: () => [
      <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
        新增采购订单
      </Button>,
      <Button key="refresh" icon={<ReloadOutlined />} onClick={refreshPurchaseOrders}>
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
              <Select placeholder="请选择店铺" style={{ width: 150 }} allowClear>
                {shopsData?.map((shop: any) => (
                  <Option key={shop.id} value={shop.id}>
                    {shop.nickname}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="supplierId" style={{ marginRight: 0 }}>
              <Select placeholder="请选择供应商" style={{ width: 150 }} allowClear>
                {suppliersData?.map((supplier: any) => (
                  <Option key={supplier.id} value={supplier.id}>
                    {supplier.nickname}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="status" style={{ marginRight: 0 }}>
              <Select placeholder="请选择状态" style={{ width: 120 }} allowClear>
                {purchaseOrderStatusOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="urgent" style={{ marginRight: 0 }}>
              <Select placeholder="请选择紧急程度" style={{ width: 150 }} allowClear>
                <Option value="">全部</Option>
                <Option value="true">紧急</Option>
                <Option value="false">常规</Option>
              </Select>
            </Form.Item>
            <Form.Item name="operatorId" style={{ marginRight: 0 }}>
              <Select
                placeholder="请选择操作员"
                style={{ width: 150 }}
                allowClear
                showSearch
                loading={accountsLoading}
                filterOption={false}
                onSearch={(value) => setOperatorSearchValue(value.trim())}
                onClear={() => setOperatorSearchValue('')}
                notFoundContent={accountsLoading ? '搜索中...' : '暂无数据'}
              >
                {accountsData?.map((account: any) => (
                  <Option key={account.id} value={account.id}>
                    {account.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="dateRange" style={{ marginRight: 0 }}>
              <RangePicker placeholder={['开始日期', '结束日期']} style={{ width: 280 }} />
            </Form.Item>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={purchaseOrdersLoading}
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

      {/* 采购订单表单弹窗 */}
      <PurchaseOrderFormModal
        open={modalVisible}
        entity={editingRecord}
        closeModal={closeModal}
        shopsData={shopsData}
        suppliersData={suppliersData}
        productsData={productsData}
      />
    </>
  );
};

export default PurchaseOrdersPage;
