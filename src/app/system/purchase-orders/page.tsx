'use client';

import React, { useState } from 'react';
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  message,
  Row,
  Col,
  Tag,
  InputNumber,
  Switch,
  Avatar,
  Tooltip,
  Badge,
  Flex,
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
import { Pagination } from '@/components/ui/pagination';
import {
  getPurchaseOrdersApi,
  createPurchaseOrderApi,
  updatePurchaseOrderApi,
  deletePurchaseOrderApi,
  PurchaseOrderInfo,
  CreatePurchaseOrderData,
  UpdatePurchaseOrderData,
  PurchaseOrderStatus,
  purchaseOrderStatusOptions,
  getPurchaseOrderStatusLabel,
  getPurchaseOrderStatusColor,
} from '@/services/purchase';
import { getShops } from '@/services/shops';
import { getSuppliers } from '@/services/suppliers';
import { getProductsApi } from '@/services/products';

const { Option } = Select;
const { TextArea } = Input;

interface SearchFormData {
  shopId?: string;
  supplierId?: string;
  productId?: string;
  status?: PurchaseOrderStatus;
  urgent?: boolean;
  page?: number;
  pageSize?: number;
}

export default function PurchaseOrdersPage() {
  const [searchForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
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

  // 处理数据
  const purchaseOrdersData = purchaseOrdersResponse?.data?.data;
  const shopsData = shopsResponse?.data?.data?.list || [];
  const suppliersData = suppliersResponse?.data?.data?.list || [];
  const productsData = productsResponse?.data?.data?.list || [];

  // 创建/更新采购订单
  const { run: submitPurchaseOrder, loading: submitting } = useRequest(
    async (values: CreatePurchaseOrderData | UpdatePurchaseOrderData) => {
      if (editingRecord) {
        return updatePurchaseOrderApi(editingRecord.id, values as UpdatePurchaseOrderData);
      } else {
        return createPurchaseOrderApi(values as CreatePurchaseOrderData);
      }
    },
    {
      manual: true,
      onSuccess: () => {
        message.success(editingRecord ? '更新成功' : '创建成功');
        setIsModalVisible(false);
        setEditingRecord(null);
        editForm.resetFields();
        refreshPurchaseOrders();
      },
      onError: (error: any) => {
        message.error(error.response?.data?.msg || '操作失败');
      },
    }
  );

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

  // 打开编辑弹窗
  const handleEdit = (record: PurchaseOrderInfo) => {
    setEditingRecord(record);
    editForm.setFieldsValue({
      shopId: record.shopId,
      supplierId: record.supplierId,
      productId: record.productId,
      quantity: record.quantity,
      totalAmount: record.totalAmount,
      status: record.status,
      urgent: record.urgent,
      remark: record.remark,
    });
    setIsModalVisible(true);
  };

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingRecord(null);
    editForm.resetFields();
    setIsModalVisible(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      submitPurchaseOrder(values);
    } catch (error) {
      console.error('表单验证失败:', error);
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
            订单#{record.id.slice(-8)}
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
    pagination: false,
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
            <Form.Item name="urgent" valuePropName="checked" style={{ marginRight: 0 }}>
              <Switch checkedChildren="紧急" unCheckedChildren="常规" />
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

      {/* 分页区域 */}
      <Pagination
        current={Number(searchParams.page) || 1}
        size={Number(searchParams.pageSize) || 10}
        total={purchaseOrdersData?.meta?.total || 0}
        hasMore={false}
        searchAfter=""
        onChange={({ page, size }) => {
          setSearchParams({
            ...searchParams,
            page,
            pageSize: size || 10,
          });
        }}
        isLoading={purchaseOrdersLoading}
      />

      {/* 编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑采购订单' : '新增采购订单'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingRecord(null);
          editForm.resetFields();
        }}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          initialValues={{
            urgent: false,
            quantity: 1,
            totalAmount: 0,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shopId"
                label="店铺"
                rules={[{ required: true, message: '请选择店铺' }]}
              >
                <Select placeholder="请选择店铺">
                  {shopsData?.map((shop: any) => (
                    <Option key={shop.id} value={shop.id}>
                      {shop.nickname}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="supplierId"
                label="供应商"
                rules={[{ required: true, message: '请选择供应商' }]}
              >
                <Select placeholder="请选择供应商">
                  {suppliersData?.map((supplier: any) => (
                    <Option key={supplier.id} value={supplier.id}>
                      {supplier.nickname}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="productId"
            label="产品"
            rules={[{ required: true, message: '请选择产品' }]}
          >
            <Select placeholder="请选择产品" showSearch optionFilterProp="children">
              {productsData?.map((product: any) => (
                <Option key={product.id} value={product.id}>
                  {product.code} - {product.specification || product.sku}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="数量"
                rules={[
                  { required: true, message: '请输入数量' },
                  { type: 'number', min: 1, message: '数量必须大于0' },
                ]}
              >
                <InputNumber placeholder="请输入数量" style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalAmount"
                label="总金额"
                rules={[
                  { required: true, message: '请输入总金额' },
                  { type: 'number', min: 0, message: '金额不能为负数' },
                ]}
              >
                <InputNumber
                  placeholder="请输入总金额"
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select placeholder="请选择状态">
                  {purchaseOrderStatusOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="urgent" label="紧急标记" valuePropName="checked">
                <Switch checkedChildren="紧急" unCheckedChildren="常规" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="remark" label="备注">
            <TextArea rows={4} placeholder="请输入备注信息" maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
