'use client';

import React, { useState } from 'react';
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Row,
  Col,
  Popconfirm,
  message,
  DatePicker,
  Descriptions,
  Flex,
  Alert,
  Avatar,
} from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  ProductOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import {
  getShipmentRecordsApi,
  createShipmentRecordApi,
  updateShipmentRecordApi,
  deleteShipmentRecordApi,
  getShipmentRecordApi,
  type ShipmentRecordInfo,
  type CreateShipmentRecordData,
  type UpdateShipmentRecordData,
  type ShipmentRecordQueryParams,
  ShipmentRecordStatus,
  shipmentRecordStatusOptions,
  getShipmentRecordStatusLabel,
} from '@/services/delivery';
import { getShops } from '@/services/shops';
import { getProductsApi } from '@/services/products';
import { getForwarders } from '@/services/forwarders';
import UniversalProductItemsTable, {
  type UniversalProductItem,
  type ProductOption,
  type ForwarderOption,
} from '@/components/universal-product-items-table';
import ShipmentFileUploader from '@/components/shipment-file-uploader';
// import type { ShipmentFileInfo } from '@/services/delivery'; // 不再需要

const { Option } = Select;
const { TextArea } = Input;

const DeliveryRecordsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ShipmentRecordInfo | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ShipmentRecordInfo | null>(null);
  const [productItems, setProductItems] = useState<UniversalProductItem[]>([]);
  const [shipmentFile, setShipmentFile] = useState<string | undefined>(undefined);

  // 搜索参数
  const [searchParams, setSearchParams] = useState<ShipmentRecordQueryParams>({
    page: 1,
    pageSize: 10,
  });

  // 获取发货记录列表
  const {
    data: recordsResponse,
    loading: recordsLoading,
    refresh: refreshRecords,
  } = useRequest(() => getShipmentRecordsApi(searchParams), {
    refreshDeps: [searchParams],
  });

  // 获取店铺列表
  const { data: shopsResponse } = useRequest(() => getShops({ page: 1, pageSize: 1000 }));

  // 获取产品列表
  const { data: productsResponse } = useRequest(() => getProductsApi({ page: 1, pageSize: 1000 }));

  // 获取货代列表
  const { data: forwardersResponse } = useRequest(async () => {
    const response = await getForwarders({ page: 1, pageSize: 1000 });
    return response.data;
  });

  // 处理数据
  const recordsData = recordsResponse?.data;
  const shopsData = shopsResponse?.data?.data?.list || [];
  const productsData = productsResponse?.data?.data?.list || [];
  const forwardersData = forwardersResponse?.data?.list || [];

  // 转换为组件需要的格式
  const productsOptions: ProductOption[] =
    productsData?.map((product: any) => ({
      id: product.id,
      code: product.code,
      name: product.name,
      sku: product.sku,
      specification: product.specification,
      category: product.category,
    })) || [];

  const forwardersOptions: ForwarderOption[] =
    forwardersData?.map((forwarder: any) => ({
      id: forwarder.id,
      nickname: forwarder.nickname,
      contactPerson: forwarder.contactPerson,
      contactPhone: forwarder.contactPhone,
    })) || [];

  // 创建/更新发货记录
  const { run: handleSubmit, loading: submitLoading } = useRequest(
    async (values: CreateShipmentRecordData | UpdateShipmentRecordData) => {
      if (editingRecord) {
        return updateShipmentRecordApi(editingRecord.id, values as UpdateShipmentRecordData);
      } else {
        return createShipmentRecordApi(values as CreateShipmentRecordData);
      }
    },
    {
      manual: true,
      onSuccess: (response: any) => {
        if (response?.data?.code === 0) {
          message.success(editingRecord ? '更新成功' : '创建成功');
          setIsModalVisible(false);
          setEditingRecord(null);
          form.resetFields();
          setProductItems([]);
          setShipmentFile(undefined);
          refreshRecords();
        } else {
          message.error(response?.data?.msg || '操作失败');
        }
      },
      onError: (error) => {
        message.error(error.message || '操作失败');
      },
    }
  );

  // 删除发货记录
  const { run: handleDelete } = useRequest(deleteShipmentRecordApi, {
    manual: true,
    onSuccess: (response: any) => {
      if (response?.data?.code === 0) {
        message.success('删除成功');
        refreshRecords();
      } else {
        message.error(response?.data?.msg || '删除失败');
      }
    },
    onError: (error) => {
      message.error(error.message || '删除失败');
    },
  });

  // 获取发货记录详情
  const { run: handleGetDetail } = useRequest(getShipmentRecordApi, {
    manual: true,
    onSuccess: (result) => {
      setSelectedRecord(result.data);
      setIsDetailModalVisible(true);
    },
    onError: (error) => {
      message.error(error.message || '获取详情失败');
    },
  });

  // 搜索
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    setSearchParams({
      ...values,
      page: 1,
      pageSize: searchParams.pageSize,
    });
  };

  // 重置搜索
  const handleResetSearch = () => {
    searchForm.resetFields();
    setSearchParams({
      page: 1,
      pageSize: 10,
    });
  };

  // 打开模态框
  const handleOpenModal = (record?: ShipmentRecordInfo) => {
    if (record) {
      setEditingRecord(record);
      // 填充表单数据
      form.setFieldsValue({
        shopId: record.shopId,
        country: record.country,
        channel: record.channel,
        shippingChannel: record.shippingChannel,
        warehouseReceiptDeadline: record.warehouseReceiptDeadline
          ? dayjs(record.warehouseReceiptDeadline)
          : null,
        shippingDetails: record.shippingDetails,
        date: dayjs(record.date),
        status: record.status,
        shipmentFile: record.shipmentFile, // 添加shipmentFile字段回填
      });

      // 转换产品数据
      const items: UniversalProductItem[] =
        record.shipmentProducts?.map((product) => ({
          productId: product.productId,
          forwarderId: product.forwarderId || '',
          totalBoxes: product.totalBoxes,
          fbaShipmentCode: product.fbaShipmentCode || '',
          fbaWarehouseCode: product.fbaWarehouseCode || '',
          quantity: product.totalBoxes, // 保持兼容性
        })) || [];
      setProductItems(items);

      // 设置文件数据
      setShipmentFile(record.shipmentFile || undefined);
    } else {
      setEditingRecord(null);
      form.resetFields();
      setProductItems([]);
      setShipmentFile(undefined);
    }
    setIsModalVisible(true);
  };

  // 提交表单
  const onFinish = (values: any) => {
    // 验证产品明细
    if (productItems.length === 0) {
      message.error('请至少添加一个产品明细');
      return;
    }

    const submitData = {
      ...values,
      date: values.date?.format('YYYY-MM-DD'),
      warehouseReceiptDeadline: values.warehouseReceiptDeadline?.format('YYYY-MM-DD'),
      shipmentFile: form.getFieldValue('shipmentFile'),
      products: productItems.map((item) => ({
        productId: item.productId,
        forwarderId: item.forwarderId || undefined,
        totalBoxes: item.totalBoxes,
        fbaShipmentCode: item.fbaShipmentCode || undefined,
        fbaWarehouseCode: item.fbaWarehouseCode || undefined,
      })),
    };

    handleSubmit(submitData);
  };

  // 表格列定义
  const columns: ProColumns<ShipmentRecordInfo>[] = [
    {
      title: '序号',
      dataIndex: 'index',
      valueType: 'index',
      width: 50,
      align: 'center',
    },
    {
      title: '店铺',
      dataIndex: ['shop', 'nickname'],
      width: 120,
    },
    {
      title: '产品概览',
      width: 300,
      render: (_, record) => {
        const items = record.shipmentProducts || [];

        if (items.length === 0) {
          return <span style={{ color: '#ccc' }}>暂无产品</span>;
        }

        return (
          <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
            {items.map((item: any, index: number) => (
              <div key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: index < items.length - 1 ? '8px' : '0',
                padding: '4px 0',
                borderBottom: index < items.length - 1 ? '1px solid #f0f0f0' : 'none'
              }}>
                <Avatar
                  src={item?.product?.imageUrl}
                  icon={<ProductOutlined />}
                  size="small"
                  style={{ marginRight: 8, flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '13px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item?.product?.name || item?.product?.code || '产品未命名'}
                  </div>
                  <div style={{ 
                    color: '#666', 
                    fontSize: '11px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item?.forwarder?.nickname || '无货代'} | SKU: {item?.product?.sku || '无'}
                  </div>
                </div>
                <div style={{ 
                  marginLeft: '8px',
                  fontWeight: 'bold',
                  color: '#1890ff',
                  fontSize: '12px',
                  flexShrink: 0
                }}>
                  ×{item?.totalBoxes || 0}箱
                </div>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: '国家/渠道',
      width: 120,
      render: (_, record) => (
        <div>
          <div>{record.country || '-'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.channel || '-'}</div>
        </div>
      ),
    },
    {
      title: '运输渠道',
      dataIndex: 'shippingChannel',
      width: 100,
      render: (_, record) => record.shippingChannel || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_, record) => {
        const statusConfig = getShipmentRecordStatusLabel(record.status);
        return <Tag color={statusConfig.color}>{statusConfig.label}</Tag>;
      },
    },
    {
      title: '发货日期',
      dataIndex: 'date',
      width: 120,
      render: (_, record) => dayjs(record.date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleGetDetail(record.id)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条发货记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!['PENDING'].includes(record.status)}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ProTable 配置
  const proTableProps: ProTableProps<ShipmentRecordInfo, any> = {
    columns,
    dataSource: recordsData?.list || [],
    loading: recordsLoading,
    rowKey: 'id',
    search: false,
    pagination: {
      current: Number(searchParams.page) || 1,
      pageSize: Number(searchParams.pageSize) || 20,
      total: recordsData?.total || 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
      onChange: (page, pageSize) => {
        setSearchParams({ ...searchParams, page: page, pageSize: pageSize || 20 });
      },
    },
    options: {
      reload: refreshRecords,
    },
    toolBarRender: () => [
      <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
        新增发货记录
      </Button>,
      <Button key="refresh" icon={<ReloadOutlined />} onClick={refreshRecords}>
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
              <Select style={{ width: 150 }} placeholder="选择店铺" allowClear>
                {shopsData?.map((shop: any) => (
                  <Option key={shop.id} value={shop.id}>
                    {shop.nickname}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="status" style={{ marginRight: 0 }}>
              <Select style={{ width: 120 }} placeholder="选择状态" allowClear>
                {shipmentRecordStatusOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="country" style={{ marginRight: 0 }}>
              <Input style={{ width: 120 }} placeholder="输入国家" />
            </Form.Item>
            <Form.Item name="channel" style={{ marginRight: 0 }}>
              <Input style={{ width: 120 }} placeholder="输入渠道" />
            </Form.Item>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={recordsLoading}
            >
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleResetSearch}>
              重置
            </Button>
          </Flex>
        </Form>
      </ProCard>

      {/* 表格区域 */}
      <ProTable {...proTableProps} />

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑发货记录' : '新增发货记录'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingRecord(null);
          form.resetFields();
          setProductItems([]);
          setShipmentFile(undefined);
        }}
        onOk={() => form.submit()}
        confirmLoading={submitLoading}
        width={1200}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shopId"
                label="店铺"
                rules={[{ required: true, message: '请选择店铺' }]}
              >
                <Select placeholder="选择店铺">
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
                name="date"
                label="发货日期"
                rules={[{ required: true, message: '请选择发货日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="country" label="国家">
                <Input placeholder="输入国家" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="channel" label="渠道">
                <Input placeholder="输入渠道" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="shippingChannel" label="运输渠道">
                <Input placeholder="输入运输渠道" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="warehouseReceiptDeadline" label="货代仓库截止收货时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          {editingRecord && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="status" label="状态">
                  <Select placeholder="选择状态">
                    {shipmentRecordStatusOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          <Form.Item name="shippingDetails" label="运输详情">
            <TextArea rows={3} placeholder="输入运输详情" />
          </Form.Item>

          <Form.Item name="shipmentFile" label="发货文件">
            <ShipmentFileUploader
              value={form.getFieldValue('shipmentFile')}
              onChange={(fileUrl) => form.setFieldsValue({ shipmentFile: fileUrl })}
              disabled={false}
            />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <Alert
              message="发货记录：管理发货产品的详细信息，货代为可选字段，支持FBA货件编码管理"
              type="info"
              showIcon
            />
          </div>

          <UniversalProductItemsTable
            mode="shipment-record"
            items={productItems}
            onChange={setProductItems}
            productsData={productsOptions}
            forwardersData={forwardersOptions}
            disabled={false}
          />
        </Form>
      </Modal>

      {/* 详情模态框 */}
      <Modal
        title="发货记录详情"
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setSelectedRecord(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsDetailModalVisible(false);
              setSelectedRecord(null);
            }}
          >
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedRecord && (
          <>
            <Descriptions column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="发货ID">{selectedRecord.id}</Descriptions.Item>
              <Descriptions.Item label="店铺">{selectedRecord.shop?.nickname}</Descriptions.Item>
              <Descriptions.Item label="国家">{selectedRecord.country || '-'}</Descriptions.Item>
              <Descriptions.Item label="渠道">{selectedRecord.channel || '-'}</Descriptions.Item>
              <Descriptions.Item label="运输渠道">
                {selectedRecord.shippingChannel || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getShipmentRecordStatusLabel(selectedRecord.status).color}>
                  {getShipmentRecordStatusLabel(selectedRecord.status).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="发货日期">
                {dayjs(selectedRecord.date).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="货代仓库截止收货时间">
                {selectedRecord.warehouseReceiptDeadline
                  ? dayjs(selectedRecord.warehouseReceiptDeadline).format('YYYY-MM-DD')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="操作员">{selectedRecord.operator?.name}</Descriptions.Item>
            </Descriptions>

            {selectedRecord.shippingDetails && (
              <div style={{ marginBottom: 16 }}>
                <strong>运输详情：</strong>
                <div
                  style={{ marginTop: 8, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}
                >
                  {selectedRecord.shippingDetails}
                </div>
              </div>
            )}

            {selectedRecord.shipmentFile && (
              <div style={{ marginBottom: 16 }}>
                <strong>发货文件：</strong>
                <div style={{ marginTop: 8, color: '#1890ff' }}>
                  <a href={selectedRecord.shipmentFile} target="_blank" rel="noopener noreferrer">
                    查看发货文件
                  </a>
                </div>
              </div>
            )}

            <UniversalProductItemsTable
              mode="shipment-record"
              items={
                selectedRecord.shipmentProducts?.map((product) => ({
                  productId: product.productId,
                  forwarderId: product.forwarderId || '',
                  totalBoxes: product.totalBoxes,
                  fbaShipmentCode: product.fbaShipmentCode || '',
                  fbaWarehouseCode: product.fbaWarehouseCode || '',
                  quantity: product.totalBoxes,
                })) || []
              }
              onChange={() => {}} // 详情模式不允许编辑
              productsData={productsOptions}
              forwardersData={forwardersOptions}
              disabled={true}
            />
          </>
        )}
      </Modal>
    </>
  );
};

export default DeliveryRecordsPage;
