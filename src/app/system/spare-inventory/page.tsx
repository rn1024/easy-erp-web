'use client';

import React, { useState } from 'react';
import {
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Popconfirm,
  message,
  Row,
  Col,
  Tag,
  Flex,
} from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';

/**
 * Services
 */
import {
  getSpareInventoryList,
  createSpareInventory,
  updateSpareInventory,
  deleteSpareInventory,
  type SpareInventoryItem,
  type SpareInventoryQueryParams,
  type SpareInventoryParams,
} from '@/services/inventory';
import { getShops } from '@/services/shops';
import { getProductCategoriesApi, getProductsApi } from '@/services/products';

const { Option } = Select;

interface SearchFormData {
  shopId?: string;
  categoryId?: string;
  productId?: string;
  spareType?: string;
  location?: string;
  page?: number;
  pageSize?: number;
}

const SpareInventoryPage: React.FC = () => {
  const [searchForm] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [editingRecord, setEditingRecord] = useState<SpareInventoryItem | null>(null);
  const [searchParams, setSearchParams] = useState<SpareInventoryQueryParams>({
    page: 1,
    pageSize: 10,
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>();

  // 获取散件库存列表
  const {
    data: inventoryData,
    loading,
    refresh,
  } = useRequest(
    async () => {
      const response = await getSpareInventoryList(searchParams);
      return response.data;
    },
    {
      refreshDeps: [searchParams],
    }
  );

  // 获取店铺列表
  const { data: shopData = [] } = useRequest(async () => {
    const response = await getShops({ pageSize: 100 });
    return response.data?.data?.list || [];
  });

  // 获取产品分类列表
  const { data: categoryData = [] } = useRequest(async () => {
    const response = await getProductCategoriesApi({ pageSize: 100 });
    return response.data?.data?.list || [];
  });

  // 获取产品列表
  const { data: productData = [] } = useRequest(
    async () => {
      if (!selectedCategoryId) return [];
      const response = await getProductsApi({ categoryId: selectedCategoryId, pageSize: 100 });
      return response.data?.data?.list || [];
    },
    {
      refreshDeps: [selectedCategoryId],
    }
  );

  // 创建/更新散件库存
  const { run: submitInventory, loading: submitting } = useRequest(
    async (values: SpareInventoryParams) => {
      if (modalType === 'create') {
        const response = await createSpareInventory(values);
        return response.data;
      } else {
        const response = await updateSpareInventory(editingRecord!.id, values);
        return response.data;
      }
    },
    {
      manual: true,
      onSuccess: (result) => {
        if (result.code === 0) {
          message.success(modalType === 'create' ? '创建成功' : '更新成功');
          setIsModalVisible(false);
          modalForm.resetFields();
          setEditingRecord(null);
          refresh();
        } else {
          message.error(result.msg || '操作失败');
        }
      },
      onError: () => {
        message.error('操作失败');
      },
    }
  );

  // 删除散件库存
  const { run: handleDelete } = useRequest(
    async (id: string) => {
      const response = await deleteSpareInventory(id);
      return response.data;
    },
    {
      manual: true,
      onSuccess: (result) => {
        if (result.code === 0) {
          message.success('删除成功');
          refresh();
        } else {
          message.error(result.msg || '删除失败');
        }
      },
      onError: () => {
        message.error('删除失败');
      },
    }
  );

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

  // 打开新建弹窗
  const handleCreate = () => {
    setModalType('create');
    setEditingRecord(null);
    setSelectedCategoryId(undefined);
    modalForm.resetFields();
    setIsModalVisible(true);
  };

  // 打开编辑弹窗
  const handleEdit = (record: SpareInventoryItem) => {
    setModalType('edit');
    setEditingRecord(record);
    setSelectedCategoryId(record.categoryId);
    modalForm.setFieldsValue({
      shopId: record.shopId,
      categoryId: record.categoryId,
      productId: record.productId,
      spareType: record.spareType,
      location: record.location,
      quantity: record.quantity,
    });
    setIsModalVisible(true);
  };

  // 表格列配置
  const columns: ProColumns<SpareInventoryItem>[] = [
    {
      title: '店铺',
      dataIndex: ['shop', 'nickname'],
      width: 120,
    },
    {
      title: '产品分类',
      dataIndex: ['category', 'name'],
      width: 120,
    },
    {
      title: '产品信息',
      width: 200,
      render: (_, record) => (
        <div>
          <div>编码: {record.product.code || '无编码'}</div>
          <div>SKU: {record.product.sku || '无SKU'}</div>
          {record.product.specification && <div>规格: {record.product.specification}</div>}
          {record.product.color && <Tag color="blue">{record.product.color}</Tag>}
        </div>
      ),
    },
    {
      title: '散件类型',
      dataIndex: 'spareType',
      width: 120,
      render: (_, record) =>
        record.spareType ? <Tag color="purple">{record.spareType}</Tag> : '-',
    },
    {
      title: '存储位置',
      dataIndex: 'location',
      width: 120,
      render: (_, record) => record.location || '-',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 100,
      render: (_, record) => (
        <Tag color={record.quantity > 0 ? 'green' : 'red'}>{record.quantity}</Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 160,
      render: (_, record) => new Date(record.updatedAt).toLocaleString(),
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
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

  const list = inventoryData?.data?.list || [];
  const meta = inventoryData?.data?.meta || { page: 1, pageSize: 10, total: 0, totalPages: 0 };

  // ProTable 配置
  const proTableProps: ProTableProps<SpareInventoryItem, any> = {
    columns,
    dataSource: list,
    loading,
    rowKey: 'id',
    search: false,
    pagination: {
      current: Number(searchParams.page) || 1,
      pageSize: Number(searchParams.pageSize) || 20,
      total: meta.total || 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
      onChange: (page, pageSize) => {
        setSearchParams({ ...searchParams, page: page, pageSize: pageSize || 20 });
      },
    },
    options: {
      reload: refresh,
    },
    toolBarRender: () => [
      <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
        新建散件库存
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
              <Select
                placeholder="选择店铺"
                allowClear
                style={{ width: 150 }}
                showSearch
                optionFilterProp="children"
              >
                {shopData.map((shop: any) => (
                  <Option key={shop.id} value={shop.id}>
                    {shop.nickname}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="categoryId" style={{ marginRight: 0 }}>
              <Select
                placeholder="选择分类"
                allowClear
                style={{ width: 150 }}
                showSearch
                optionFilterProp="children"
              >
                {categoryData.map((category: any) => (
                  <Option key={category.id} value={category.id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="spareType" style={{ marginRight: 0 }}>
              <Input placeholder="输入散件类型" style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="location" style={{ marginRight: 0 }}>
              <Input placeholder="输入位置" style={{ width: 150 }} />
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

      {/* 新建/编辑弹窗 */}
      <Modal
        title={modalType === 'create' ? '新建散件库存' : '编辑散件库存'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          modalForm.resetFields();
          setEditingRecord(null);
        }}
        footer={null}
        width={600}
      >
        <Form form={modalForm} layout="vertical" onFinish={submitInventory}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shopId"
                label="店铺"
                rules={[{ required: true, message: '请选择店铺' }]}
              >
                <Select placeholder="选择店铺" showSearch optionFilterProp="children">
                  {shopData.map((shop: any) => (
                    <Option key={shop.id} value={shop.id}>
                      {shop.nickname}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label="产品分类"
                rules={[{ required: true, message: '请选择产品分类' }]}
              >
                <Select
                  placeholder="选择产品分类"
                  showSearch
                  optionFilterProp="children"
                  onChange={(value) => {
                    setSelectedCategoryId(value);
                    modalForm.setFieldValue('productId', undefined);
                  }}
                >
                  {categoryData.map((category: any) => (
                    <Option key={category.id} value={category.id}>
                      {category.name}
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
            <Select
              placeholder="选择产品"
              showSearch
              optionFilterProp="children"
              disabled={!selectedCategoryId}
            >
              {productData.map((product: any) => (
                <Option key={product.id} value={product.id}>
                  {product.code || '无编码'} - {product.specification}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="spareType" label="散件类型">
                <Input placeholder="输入散件类型" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="存储位置">
                <Input placeholder="输入存储位置" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="quantity"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="输入数量" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {modalType === 'create' ? '创建' : '更新'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SpareInventoryPage;
