'use client';

import React, { useState } from 'react';
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
import { useRequest } from 'ahooks';
import type { ProTableProps, ProColumns } from '@ant-design/pro-components';
import { Pagination } from '@/components/ui/pagination';
import dayjs from 'dayjs';

/**
 * Components
 */
import ProductFormDrawer from './components/product-form-drawer';
import ProductDetailDrawer from './components/product-detail-drawer';

// 导入相关服务
import {
  getProductsApi,
  deleteProductApi,
  getProductApi,
  getProductCategoriesApi,
  type ProductInfo,
  type ProductsParams,
} from '@/services/products';

const ProductManagement: React.FC = () => {
  const [searchForm] = Form.useForm();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductInfo | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ProductInfo | null>(null);

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
      setDetailDrawerVisible(true);
    },
    {
      manual: true,
      onError: (error: any) => {
        message.error(error?.response?.data?.msg || '获取详情失败');
      },
    }
  );

  // 表格列定义
  const columns: ProColumns<ProductInfo>[] = [
    {
      title: '产品图片',
      dataIndex: 'imageUrl',
      width: 80,
      render: (_, record) =>
        record.imageUrl ? (
          <Image
            width={50}
            height={50}
            src={record.imageUrl}
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
      width: 120,
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      width: 150,
    },
    {
      title: '所属店铺',
      dataIndex: ['shop', 'nickname'],
      width: 120,
      render: (_, record) => (
        <Tag icon={<ShopOutlined />} color="blue">
          {record.shop?.nickname || '未知店铺'}
        </Tag>
      ),
    },
    {
      title: '产品分类',
      dataIndex: ['category', 'name'],
      width: 100,
      render: (_, record) => (
        <Tag icon={<TagOutlined />} color="green">
          {record.category?.name || '未分类'}
        </Tag>
      ),
    },
    {
      title: '规格',
      dataIndex: 'specification',
      width: 120,
      ellipsis: true,
    },
    {
      title: '颜色',
      dataIndex: 'color',
      width: 80,
    },
    {
      title: '重量(g)',
      dataIndex: 'weight',
      width: 80,
      render: (_, record) => (record.weight ? `${record.weight}g` : '-'),
    },
    {
      title: '套装数量',
      dataIndex: 'setQuantity',
      width: 80,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 120,
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
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
                const confirmed = window.confirm(`确定要删除产品 "${record.code}" 吗？`);
                if (confirmed) {
                  handleDelete(record.id);
                }
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
    setDrawerVisible(true);
  };

  // 处理创建
  const handleCreate = () => {
    setEditingProduct(null);
    setDrawerVisible(true);
  };

  // 关闭表单抽屉
  const closeFormDrawer = (reload?: boolean) => {
    setDrawerVisible(false);
    setEditingProduct(null);
    if (reload) {
      refresh();
    }
  };

  // 关闭详情抽屉
  const closeDetailDrawer = () => {
    setDetailDrawerVisible(false);
    setViewingProduct(null);
  };

  const productsList = (productsData?.data as any)?.list || [];
  const totalProducts = (productsData?.data as any)?.meta?.total || 0;
  const categoriesList = (categoriesData?.data as any)?.list || [];

  // ProTable 配置
  const proTableProps: ProTableProps<ProductInfo, any> = {
    columns,
    dataSource: productsList,
    loading,
    rowKey: 'id',
    search: false,
    pagination: false,
    options: {
      reload: refresh,
    },
    toolBarRender: () => [
      <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
        新增产品
      </Button>,
      <Button key="refresh" icon={<ReloadOutlined />} onClick={refresh}>
        刷新
      </Button>,
    ],
    scroll: { x: 1500 },
  };

  return (
    <>
      {/* 搜索区域 */}
      <ProCard className="mb-16">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Flex gap={16} wrap={true}>
            <Form.Item name="code" style={{ marginRight: 0 }}>
              <Input placeholder="产品编码" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="sku" style={{ marginRight: 0 }}>
              <Input placeholder="SKU" style={{ width: 120 }} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Flex>
        </Form>
      </ProCard>

      {/* 表格区域 */}
      <ProTable {...proTableProps} />

      {/* 分页区域 */}
      <Pagination
        current={Number(searchParams.page) || 1}
        size={Number(searchParams.pageSize) || 20}
        total={totalProducts}
        hasMore={false}
        searchAfter=""
        onChange={({ page, size }) => {
          setSearchParams({ ...searchParams, page, pageSize: size || 20 });
        }}
        isLoading={loading}
      />

      {/* 产品表单抽屉 */}
      <ProductFormDrawer
        open={drawerVisible}
        entity={editingProduct}
        closeDrawer={closeFormDrawer}
        categoriesList={categoriesList}
      />

      {/* 产品详情抽屉 */}
      <ProductDetailDrawer
        open={detailDrawerVisible}
        entity={viewingProduct}
        closeDrawer={closeDetailDrawer}
      />
    </>
  );
};

export default ProductManagement;
