'use client';

import React, { useState } from 'react';
import { useRequest } from 'ahooks';
import { Button, Form, Input, Select, Space, message, Image, Tag, Tooltip, Flex } from 'antd';
import { ProCard, ProTable } from '@ant-design/pro-components';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  TagOutlined,
  ShopOutlined,
  PictureOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

/**
 * Components
 */
import ProductFormModal from './components/product-form-modal';
import ProductDetailModal from './components/product-detail-modal';

/**
 * APIs
 */
import {
  getProductsApi,
  deleteProductApi,
  getProductApi,
  getProductCategoriesApi,
  type ProductInfo,
  type ProductsParams,
} from '@/services/products';

/**
 * Types
 */
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';

const ProductManagement: React.FC = () => {
  /**
   * Hooks
   */
  const [searchForm] = Form.useForm();

  /**
   * State
   */
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductInfo | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ProductInfo | null>(null);

  const [searchParams, setSearchParams] = useState<ProductsParams>({
    page: 1,
    pageSize: 20,
  });

  /**
   * Requests
   */
  const {
    data: productsData,
    loading,
    refresh,
  } = useRequest(() => getProductsApi(searchParams), {
    refreshDeps: [searchParams],
  });

  const { data: categoriesData } = useRequest(() =>
    getProductCategoriesApi({ page: 1, pageSize: 100 })
  );

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

  const { run: fetchProductDetail } = useRequest(
    async (id: string) => {
      const res = await getProductApi(id);
      setViewingProduct(res.data.data);
      setDetailDrawerVisible(true);
    },
    {
      manual: true,
      onError: (error: any) => {
        message.error(error?.response?.data?.msg || '获取详情失败');
      },
    }
  );

  /**
   * Event Handlers
   */
  const handleCreateClick = () => {
    setEditingProduct(null);
    setDrawerVisible(true);
  };

  const handleEditClick = (product: ProductInfo) => {
    setEditingProduct(product);
    setDrawerVisible(true);
  };

  const handleViewClick = (product: ProductInfo) => {
    fetchProductDetail(product.id);
  };

  const handleDeleteClick = (product: ProductInfo) => {
    handleDelete(product.id);
  };

  const handleSearch = (values: any) => {
    setSearchParams({
      ...searchParams,
      page: 1,
      categoryId: values.categoryId,
      shopId: values.shopId,
      code: values.code?.trim(),
      sku: values.sku?.trim(),
      asin: values.asin?.trim(),
    });
  };

  const handleResetSearch = () => {
    searchForm.resetFields();
    setSearchParams({
      page: 1,
      pageSize: 20,
    });
  };

  const closeDrawer = (reload?: boolean) => {
    setDrawerVisible(false);
    setEditingProduct(null);
    if (reload) {
      refresh();
    }
  };

  const closeDetailDrawer = () => {
    setDetailDrawerVisible(false);
    setViewingProduct(null);
  };

  /**
   * Table Columns
   */
  const columns: ProColumns<ProductInfo>[] = [
    {
      title: '序号',
      dataIndex: 'index',
      valueType: 'index',
      width: 50,
      align: 'center',
    },
    {
      title: '产品图片',
      dataIndex: 'imageUrl',
      width: 80,
      render: (_, record: ProductInfo) => (
        <Image
          width={40}
          height={40}
          src={record.imageUrl}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
          style={{ objectFit: 'cover', borderRadius: 4 }}
        />
      ),
    },
    {
      title: '产品编码',
      dataIndex: 'code',
      width: 120,
      ellipsis: true,
      render: (_, record: ProductInfo) => (
        <Tooltip title={record.code}>
          <Tag color="blue" icon={<TagOutlined />}>
            {record.code}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      width: 120,
      ellipsis: true,
      render: (_, record: ProductInfo) => (
        <Tooltip title={record.sku}>
          <span>{record.sku}</span>
        </Tooltip>
      ),
    },
    {
      title: 'ASIN',
      dataIndex: 'asin',
      width: 120,
      ellipsis: true,
      render: (_, record: ProductInfo) => (
        <Tooltip title={record.asin}>
          <span>{record.asin || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '规格',
      dataIndex: 'specification',
      width: 150,
      ellipsis: true,
      render: (_, record: ProductInfo) => (
        <Tooltip title={record.specification}>
          <span>{record.specification}</span>
        </Tooltip>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
      ellipsis: true,
      render: (_, record: ProductInfo) => <span>{record.category?.name || '未分类'}</span>,
    },
    {
      title: '所属店铺',
      dataIndex: 'shop',
      width: 120,
      ellipsis: true,
      render: (_, record: ProductInfo) => (
        <Space>
          <ShopOutlined />
          <span>{record.shop?.nickname || '未知店铺'}</span>
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (_, record: ProductInfo) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record: ProductInfo) => [
        <Button
          key="view"
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewClick(record)}
        >
          查看
        </Button>,
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEditClick(record)}
        >
          编辑
        </Button>,
        <Button
          key="delete"
          type="link"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteClick(record)}
        >
          删除
        </Button>,
      ],
    },
  ];

  /**
   * ProTableProps
   */
  const proTableProps: ProTableProps<ProductInfo, ProductsParams> = {
    columns,
    dataSource: productsData?.data?.data?.list || [],
    loading,
    rowKey: 'id',
    pagination: {
      current: searchParams.page || 1,
      pageSize: searchParams.pageSize || 20,
      total: productsData?.data?.data?.meta?.total || 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
      onChange: (page, pageSize) => {
        setSearchParams({ ...searchParams, page, pageSize: pageSize || 20 });
      },
    },
    search: false,
    options: {
      reload: refresh,
      density: false,
      fullScreen: false,
      setting: false,
    },
    toolBarRender: () => [
      <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreateClick}>
        新增产品
      </Button>,
      <Button key="refresh" icon={<ReloadOutlined />} onClick={refresh}>
        刷新
      </Button>,
    ],
    scroll: { x: 1200 },
    size: 'middle',
  };

  return (
    <>
      {/* 搜索区域 */}
      <ProCard className="mb-16">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Flex gap={16} wrap={true}>
            <Form.Item name="categoryId" style={{ marginRight: 0 }}>
              <Select placeholder="请选择分类" style={{ width: 150 }} allowClear>
                {categoriesData?.data?.data?.list?.map((category: any) => (
                  <Select.Option key={category.id} value={category.id}>
                    {category.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="code" style={{ marginRight: 0 }}>
              <Input placeholder="产品编码" style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="sku" style={{ marginRight: 0 }}>
              <Input placeholder="SKU" style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="asin" style={{ marginRight: 0 }}>
              <Input placeholder="ASIN" style={{ width: 150 }} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
              搜索
            </Button>
            <Button onClick={handleResetSearch}>重置</Button>
          </Flex>
        </Form>
      </ProCard>

      {/* 表格区域 */}
      <ProTable {...proTableProps} />

      {/* 产品表单弹窗 */}
      <ProductFormModal open={drawerVisible} entity={editingProduct} closeModal={closeDrawer} />

      {/* 产品详情弹窗 */}
      <ProductDetailModal
        open={detailDrawerVisible}
        entity={viewingProduct}
        closeModal={closeDetailDrawer}
      />
    </>
  );
};

export default ProductManagement;
