'use client';

import React, { useState } from 'react';
import { useRequest } from 'ahooks';
import {
  Button,
  Form,
  Input,
  Select,
  Space,
  message,
  Image,
  Tag,
  Tooltip,
  Flex,
  Badge,
  Popover,
} from 'antd';
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
import { getPackageTypeLabel } from '../constants/package-type';

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
    onError: (error) => {
      console.error('产品数据加载失败:', error);
      message.error('加载产品数据失败');
    },
  });

  const { data: categoriesData } = useRequest(() =>
    getProductCategoriesApi({ page: 1, pageSize: 100 })
  );

  const { run: handleDelete } = useRequest(deleteProductApi, {
    manual: true,
    onSuccess: (response) => {
      if (response?.data?.code === 0) {
        message.success('删除产品成功');
        refresh();
      } else {
        message.error(response?.data?.msg || '删除失败');
      }
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.msg || '删除失败');
    },
  });

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

  const { run: fetchProductForEdit } = useRequest(
    async (id: string) => {
      const res = await getProductApi(id);
      console.log('🔍 fetchProductForEdit - API响应:', res);
      console.log('🔍 fetchProductForEdit - 产品数据:', res.data.data);
      console.log('🔍 fetchProductForEdit - shop数据:', res.data.data?.shop);
      console.log('🔍 fetchProductForEdit - category数据:', res.data.data?.category);
      setEditingProduct(res.data.data);
      setDrawerVisible(true);
    },
    {
      manual: true,
      onError: (error: any) => {
        message.error(error?.response?.data?.msg || '获取产品信息失败');
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
    fetchProductForEdit(product.id);
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
      dataIndex: 'images',
      width: 100,
      render: (_, record: ProductInfo) => {
        const images = record.images || [];
        const coverImage = images.find((img) => img.isCover) || images[0];

        if (!coverImage) {
          return (
            <Image
              width={40}
              height={40}
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQr"
              style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #d9d9d9' }}
              preview={false}
            />
          );
        }

        // 多图片预览内容
        const previewContent = (
          <div style={{ maxWidth: 320 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {images.slice(0, 8).map((img, index) => (
                <Image
                  key={img.id}
                  width={60}
                  height={60}
                  src={img.imageUrl}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
              ))}
            </div>
            {images.length > 8 && (
              <div style={{ textAlign: 'center', marginTop: 8, color: '#666', fontSize: 12 }}>
                还有 {images.length - 8} 张图片...
              </div>
            )}
          </div>
        );

        const imageElement = (
          <Badge count={images.length > 1 ? images.length : 0} size="small">
            <Image
              width={40}
              height={40}
              src={coverImage.imageUrl}
              style={{
                objectFit: 'cover',
                borderRadius: 4,
                cursor: images.length > 1 ? 'pointer' : 'default',
              }}
              preview={{
                src: coverImage.imageUrl,
              }}
            />
          </Badge>
        );

        return images.length > 1 ? (
          <Popover content={previewContent} trigger="hover" placement="right">
            {imageElement}
          </Popover>
        ) : (
          imageElement
        );
      },
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
      title: '产品名称',
      dataIndex: 'name',
      width: 150,
      ellipsis: true,
      render: (_, record: ProductInfo) => (
        <Tooltip title={record.name}>
          <span>{record.name || '-'}</span>
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
      title: '成本',
      dataIndex: 'costs',
      width: 120,
      ellipsis: true,
      render: (_, record: ProductInfo) => {
         // 成本显示逻辑：优先显示最新的成本记录
         const getCostDisplay = (costs?: any[]) => {
           if (!costs || costs.length === 0) return '-';
           
           // 按创建时间排序，获取最新的成本记录
           const sortedCosts = [...costs].sort((a, b) => 
             new Date(b.createdAt || b.updatedAt || 0).getTime() - 
             new Date(a.createdAt || a.updatedAt || 0).getTime()
           );
           
           const latestCost = sortedCosts[0];
           
           // 优先级：price + unit > price > costInfo > 空值
           if (latestCost.price && latestCost.unit) {
             return `${latestCost.price} ${latestCost.unit}`;
           }
           if (latestCost.price) {
             return `${latestCost.price}`;
           }
           if (latestCost.costInfo) {
             return latestCost.costInfo;
           }
           return '-';
         };
         
         const costDisplay = getCostDisplay(record.costs);
         const hasMultipleCosts = record.costs && record.costs.length > 1;
         
         return (
           <Tooltip 
             title={hasMultipleCosts ? `${costDisplay} (共${record.costs?.length}条成本记录)` : costDisplay}
           >
             <span style={{ color: costDisplay === '-' ? '#999' : '#333' }}>
               {costDisplay}
               {hasMultipleCosts && (
                 <Badge 
                   count={record.costs?.length || 0} 
                   size="small" 
                   style={{ marginLeft: 4 }}
                 />
               )}
             </span>
           </Tooltip>
         );
       },
    },
    {
      title: '重量(g)',
      dataIndex: 'weight',
      width: 80,
      render: (_, record: ProductInfo) => (record.weight ? `${record.weight}g` : '-'),
    },
    {
      title: '包装类型',
      dataIndex: 'packageType',
      width: 100,
      render: (_, record: ProductInfo) => getPackageTypeLabel(record.packageType),
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
      <ProductFormModal
        open={drawerVisible}
        entity={editingProduct}
        closeModal={closeDrawer}
        categoriesList={categoriesData?.data?.data?.list || []}
      />

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
