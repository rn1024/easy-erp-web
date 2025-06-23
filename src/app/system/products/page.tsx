'use client';

import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Input,
  Select,
  Row,
  Col,
  Space,
  Modal,
  message,
  Image,
  Tag,
  Tooltip,
  Descriptions,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  TagOutlined,
  ShopOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

// 导入相关服务
import {
  getProductsApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  getProductApi,
  getProductCategoriesApi,
  type ProductInfo,
  type ProductsParams,
  type ProductFormData,
} from '@/services/products';

const { Option } = Select;
const { TextArea } = Input;

const ProductManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductInfo | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ProductInfo | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [searchParams, setSearchParams] = useState<ProductsParams>({
    page: 1,
    pageSize: 20,
  });

  // 获取产品列表
  const {
    data: productsData,
    loading,
    refresh,
  } = useRequest(() => getProductsApi(searchParams), {
    refreshDeps: [searchParams],
  });

  // 获取产品分类
  const { data: categoriesData } = useRequest(() =>
    getProductCategoriesApi({ page: 1, pageSize: 100 })
  );

  // 创建/更新产品
  const { run: handleSubmit, loading: submitLoading } = useRequest(
    async (values: ProductFormData) => {
      if (editingProduct) {
        await updateProductApi(editingProduct.id, values);
        message.success('更新产品成功');
      } else {
        await createProductApi(values);
        message.success('创建产品成功');
      }
    },
    {
      manual: true,
      onSuccess: () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        form.resetFields();
        refresh();
      },
      onError: (error: any) => {
        message.error(error?.response?.data?.msg || '操作失败');
      },
    }
  );

  // 删除产品
  const { run: handleDelete } = useRequest(
    async (id: string) => {
      await deleteProductApi(id);
      message.success('删除产品成功');
    },
    {
      manual: true,
      onSuccess: () => {
        refresh();
      },
      onError: (error: any) => {
        message.error(error?.response?.data?.msg || '删除失败');
      },
    }
  );

  // 查看产品详情
  const { run: fetchProductDetail } = useRequest(
    async (id: string) => {
      const res = await getProductApi(id);
      setViewingProduct(res.data.data);
      setIsViewModalOpen(true);
    },
    {
      manual: true,
      onError: (error: any) => {
        message.error(error?.response?.data?.msg || '获取详情失败');
      },
    }
  );

  // 表格列定义
  const columns: ColumnsType<ProductInfo> = [
    {
      title: '产品图片',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (imageUrl: string) =>
        imageUrl ? (
          <Image
            width={50}
            height={50}
            src={imageUrl}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
          />
        ) : (
          <div className="w-[50px] h-[50px] bg-gray-100 rounded flex items-center justify-center">
            <PictureOutlined className="text-gray-400" />
          </div>
        ),
    },
    {
      title: '产品编码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 150,
    },
    {
      title: '所属店铺',
      dataIndex: ['shop', 'nickname'],
      key: 'shop',
      width: 120,
      render: (nickname: string) => (
        <Tag icon={<ShopOutlined />} color="blue">
          {nickname || '未知店铺'}
        </Tag>
      ),
    },
    {
      title: '产品分类',
      dataIndex: ['category', 'name'],
      key: 'category',
      width: 100,
      render: (name: string) => (
        <Tag icon={<TagOutlined />} color="green">
          {name || '未分类'}
        </Tag>
      ),
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      width: 120,
      ellipsis: true,
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 80,
    },
    {
      title: '重量(g)',
      dataIndex: 'weight',
      key: 'weight',
      width: 80,
      render: (weight: number) => (weight ? `${weight}g` : '-'),
    },
    {
      title: '套装数量',
      dataIndex: 'setQuantity',
      key: 'setQuantity',
      width: 80,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => fetchProductDetail(record.id)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: `确定要删除产品 "${record.code}" 吗？`,
                  onOk: () => handleDelete(record.id),
                });
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 处理搜索
  const handleSearch = (values: any) => {
    setSearchParams({ ...searchParams, ...values, page: 1 });
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({ page: 1, pageSize: 20 });
  };

  // 处理编辑
  const handleEdit = (product: ProductInfo) => {
    setEditingProduct(product);
    form.setFieldsValue({
      ...product,
      weight: product.weight?.toString(),
    });
    setIsModalOpen(true);
  };

  // 处理创建
  const handleCreate = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // 表单提交
  const onFinish = (values: any) => {
    const formData: ProductFormData = {
      ...values,
      weight: values.weight ? parseFloat(values.weight) : undefined,
      setQuantity: values.setQuantity || 1,
    };
    handleSubmit(formData);
  };

  const productsList = (productsData?.data as any)?.list || [];
  const totalProducts = (productsData?.data as any)?.meta?.total || 0;
  const categoriesList = (categoriesData?.data as any)?.list || [];

  return (
    <div className="p-6">
      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-4">产品管理</h2>

          {/* 搜索表单 */}
          <Form form={searchForm} layout="inline" onFinish={handleSearch} className="mb-4">
            <Form.Item name="code" label="产品编码">
              <Input placeholder="产品编码" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="sku" label="SKU">
              <Input placeholder="SKU" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleReset}>重置</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  新增产品
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>

        {/* 产品表格 */}
        <Table
          columns={columns}
          dataSource={productsList}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total: totalProducts,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setSearchParams({ ...searchParams, page, pageSize });
            },
          }}
        />
      </Card>

      {/* 创建/编辑产品弹窗 */}
      <Modal
        title={editingProduct ? '编辑产品' : '新增产品'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish} className="mt-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shopId"
                label="所属店铺"
                rules={[{ required: true, message: '请选择店铺' }]}
              >
                <Select placeholder="选择店铺">
                  <Option value="test-shop-1">测试店铺1</Option>
                  <Option value="test-shop-2">测试店铺2</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label="产品分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="选择分类">
                  {categoriesList.map((category: any) => (
                    <Option key={category.id} value={category.id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="产品编码"
                rules={[{ required: true, message: '请输入产品编码' }]}
              >
                <Input placeholder="产品编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sku" label="SKU" rules={[{ required: true, message: '请输入SKU' }]}>
                <Input placeholder="SKU" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="specification" label="规格">
                <Input placeholder="规格" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="color" label="颜色">
                <Input placeholder="颜色" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="setQuantity" label="套装数量">
                <InputNumber min={1} placeholder="套装数量" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="internalSize" label="内部尺寸">
                <Input placeholder="内部尺寸" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="externalSize" label="外部尺寸">
                <Input placeholder="外部尺寸" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="weight" label="重量(g)">
                <InputNumber min={0} placeholder="重量" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="label" label="标签">
                <Input placeholder="标签" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="imageUrl" label="产品图片">
                <Input placeholder="图片URL" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="styleInfo" label="款式信息">
            <TextArea rows={3} placeholder="款式信息" />
          </Form.Item>

          <Form.Item name="accessoryInfo" label="配件信息">
            <TextArea rows={3} placeholder="配件信息" />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="备注" />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingProduct(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={submitLoading}>
                {editingProduct ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 产品详情弹窗 */}
      <Modal
        title="产品详情"
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        footer={null}
        width={800}
      >
        {viewingProduct && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="产品编码">{viewingProduct.code}</Descriptions.Item>
            <Descriptions.Item label="SKU">{viewingProduct.sku}</Descriptions.Item>
            <Descriptions.Item label="所属店铺">{viewingProduct.shop?.nickname}</Descriptions.Item>
            <Descriptions.Item label="产品分类">{viewingProduct.category?.name}</Descriptions.Item>
            <Descriptions.Item label="规格">
              {viewingProduct.specification || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="颜色">{viewingProduct.color || '-'}</Descriptions.Item>
            <Descriptions.Item label="套装数量">{viewingProduct.setQuantity}</Descriptions.Item>
            <Descriptions.Item label="重量">
              {viewingProduct.weight ? `${viewingProduct.weight}g` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="内部尺寸">
              {viewingProduct.internalSize || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="外部尺寸">
              {viewingProduct.externalSize || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="标签">{viewingProduct.label || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(viewingProduct.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="款式信息" span={2}>
              {viewingProduct.styleInfo || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="配件信息" span={2}>
              {viewingProduct.accessoryInfo || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>
              {viewingProduct.remark || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ProductManagement;
