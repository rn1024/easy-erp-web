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
  InputNumber,
  Popconfirm,
  message,
  DatePicker,
  Descriptions,
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
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import {
  getDeliveryRecordsApi,
  createDeliveryRecordApi,
  updateDeliveryRecordApi,
  deleteDeliveryRecordApi,
  getDeliveryRecordApi,
  type DeliveryRecordInfo,
  type CreateDeliveryRecordData,
  type UpdateDeliveryRecordData,
  type DeliveryRecordQueryParams,
  DeliveryRecordStatus,
  deliveryRecordStatusOptions,
  getDeliveryRecordStatusLabel,
} from '@/services/delivery';
import { getShops } from '@/services/shops';
import { getProductsApi } from '@/services/products';
import { getForwarders } from '@/services/forwarders';

const { Option } = Select;
const { TextArea } = Input;

const DeliveryRecordsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DeliveryRecordInfo | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<DeliveryRecordInfo | null>(null);

  // 搜索参数
  const [searchParams, setSearchParams] = useState<DeliveryRecordQueryParams>({
    page: 1,
    pageSize: 10,
  });

  // 获取发货记录列表
  const {
    data: recordsResponse,
    loading: recordsLoading,
    refresh: refreshRecords,
  } = useRequest(() => getDeliveryRecordsApi(searchParams), {
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

  // 创建/更新发货记录
  const { run: handleSubmit, loading: submitLoading } = useRequest(
    async (values: CreateDeliveryRecordData | UpdateDeliveryRecordData) => {
      if (editingRecord) {
        return updateDeliveryRecordApi(editingRecord.id, values as UpdateDeliveryRecordData);
      } else {
        return createDeliveryRecordApi(values as CreateDeliveryRecordData);
      }
    },
    {
      manual: true,
      onSuccess: () => {
        message.success(editingRecord ? '更新成功' : '创建成功');
        setIsModalVisible(false);
        setEditingRecord(null);
        form.resetFields();
        refreshRecords();
      },
      onError: (error) => {
        message.error(error.message || '操作失败');
      },
    }
  );

  // 删除发货记录
  const { run: handleDelete } = useRequest(deleteDeliveryRecordApi, {
    manual: true,
    onSuccess: () => {
      message.success('删除成功');
      refreshRecords();
    },
    onError: (error) => {
      message.error(error.message || '删除失败');
    },
  });

  // 获取发货记录详情
  const { run: handleGetDetail } = useRequest(getDeliveryRecordApi, {
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

  // 打开新增/编辑模态框
  const handleOpenModal = (record?: DeliveryRecordInfo) => {
    if (record) {
      setEditingRecord(record);
      form.setFieldsValue({
        ...record,
        date: record.date ? dayjs(record.date) : null,
        warehouseShippingDeadline: record.warehouseShippingDeadline
          ? dayjs(record.warehouseShippingDeadline)
          : null,
        warehouseReceiptDeadline: record.warehouseReceiptDeadline
          ? dayjs(record.warehouseReceiptDeadline)
          : null,
      });
    } else {
      setEditingRecord(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  // 表单提交
  const onFinish = (values: any) => {
    const formData = {
      ...values,
      date: values.date ? values.date.format('YYYY-MM-DD') : undefined,
      warehouseShippingDeadline: values.warehouseShippingDeadline
        ? values.warehouseShippingDeadline.format('YYYY-MM-DD')
        : undefined,
      warehouseReceiptDeadline: values.warehouseReceiptDeadline
        ? values.warehouseReceiptDeadline.format('YYYY-MM-DD')
        : undefined,
    };
    handleSubmit(formData);
  };

  const columns: ProColumns<DeliveryRecordInfo>[] = [
    {
      title: 'FBA编码',
      dataIndex: 'fbaShipmentCode',
      width: 150,
      render: (_, record) => record.fbaShipmentCode || '-',
    },
    {
      title: '店铺',
      dataIndex: ['shop', 'nickname'],
      width: 120,
    },
    {
      title: '产品信息',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{record.product?.code}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.product?.specification}</div>
        </div>
      ),
    },
    {
      title: '货代',
      dataIndex: ['forwarder', 'nickname'],
      width: 120,
    },
    {
      title: '箱数',
      dataIndex: 'totalBoxes',
      width: 80,
      render: (_, record) => `${record.totalBoxes}箱`,
    },
    {
      title: '国家',
      dataIndex: 'country',
      width: 100,
      render: (_, record) => record.country || '-',
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      width: 100,
      render: (_, record) => record.channel || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_, record) => {
        const statusConfig = getDeliveryRecordStatusLabel(record.status);
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
              disabled={!['PREPARING', 'CANCELLED'].includes(record.status)}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ProTable 配置
  const proTableProps: ProTableProps<DeliveryRecordInfo, any> = {
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
    scroll: { x: 1500 },
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
            <Form.Item name="forwarderId" style={{ marginRight: 0 }}>
              <Select style={{ width: 150 }} placeholder="选择货代" allowClear>
                {forwardersData?.map((forwarder: any) => (
                  <Option key={forwarder.id} value={forwarder.id}>
                    {forwarder.nickname}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="status" style={{ marginRight: 0 }}>
              <Select style={{ width: 120 }} placeholder="选择状态" allowClear>
                {deliveryRecordStatusOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="fbaShipmentCode" style={{ marginRight: 0 }}>
              <Input style={{ width: 150 }} placeholder="输入FBA编码" />
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
        }}
        footer={null}
        width={800}
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
                name="productId"
                label="产品"
                rules={[{ required: true, message: '请选择产品' }]}
              >
                <Select placeholder="选择产品">
                  {productsData?.map((product: any) => (
                    <Option key={product.id} value={product.id}>
                      {product.code} - {product.specification}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="forwarderId"
                label="货代"
                rules={[{ required: true, message: '请选择货代' }]}
              >
                <Select placeholder="选择货代">
                  {forwardersData?.map((forwarder: any) => (
                    <Option key={forwarder.id} value={forwarder.id}>
                      {forwarder.nickname}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalBoxes"
                label="箱数"
                rules={[{ required: true, message: '请输入箱数' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="输入箱数" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fbaShipmentCode" label="FBA发货编码">
                <Input placeholder="输入FBA发货编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fbaWarehouseCode" label="FBA仓库编码">
                <Input placeholder="输入FBA仓库编码" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="country" label="国家">
                <Input placeholder="输入国家" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="channel" label="渠道">
                <Input placeholder="输入渠道" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="shippingChannel" label="运输渠道">
                <Input placeholder="输入运输渠道" />
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
            <Col span={12}>
              <Form.Item name="warehouseShippingDeadline" label="仓库发货截止日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="warehouseReceiptDeadline" label="仓库收货截止日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          {editingRecord && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="status" label="状态">
                  <Select placeholder="选择状态">
                    {deliveryRecordStatusOptions.map((option) => (
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
            <TextArea rows={4} placeholder="输入运输详情" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  setEditingRecord(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={submitLoading}>
                {editingRecord ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
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
        footer={null}
        width={800}
      >
        {selectedRecord && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="FBA发货编码">
              {selectedRecord.fbaShipmentCode || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="FBA仓库编码">
              {selectedRecord.fbaWarehouseCode || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="店铺">{selectedRecord.shop?.nickname}</Descriptions.Item>
            <Descriptions.Item label="产品">
              {selectedRecord.product?.code} - {selectedRecord.product?.specification}
            </Descriptions.Item>
            <Descriptions.Item label="货代">{selectedRecord.forwarder?.nickname}</Descriptions.Item>
            <Descriptions.Item label="箱数">{selectedRecord.totalBoxes}箱</Descriptions.Item>
            <Descriptions.Item label="国家">{selectedRecord.country || '-'}</Descriptions.Item>
            <Descriptions.Item label="渠道">{selectedRecord.channel || '-'}</Descriptions.Item>
            <Descriptions.Item label="运输渠道">
              {selectedRecord.shippingChannel || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getDeliveryRecordStatusLabel(selectedRecord.status).color}>
                {getDeliveryRecordStatusLabel(selectedRecord.status).label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="发货日期">
              {dayjs(selectedRecord.date).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="仓库发货截止日期">
              {selectedRecord.warehouseShippingDeadline
                ? dayjs(selectedRecord.warehouseShippingDeadline).format('YYYY-MM-DD')
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="仓库收货截止日期">
              {selectedRecord.warehouseReceiptDeadline
                ? dayjs(selectedRecord.warehouseReceiptDeadline).format('YYYY-MM-DD')
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="操作员">{selectedRecord.operator?.name}</Descriptions.Item>
            <Descriptions.Item label="运输详情" span={2}>
              {selectedRecord.shippingDetails || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(selectedRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {dayjs(selectedRecord.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

export default DeliveryRecordsPage;
