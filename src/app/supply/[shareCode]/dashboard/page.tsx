'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Typography,
  Space,
  Alert,
  message,
  Spin,
  Descriptions,
  Tag,
  Divider,
  Progress,
  Row,
  Col,
  Image,
} from 'antd';
import {
  InfoCircleOutlined,
  ShopOutlined,
  UserOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import {
  getSharedPurchaseOrderApi,
  getSharedProductsApi,
  submitSupplyListApi,
  type SupplySubmitData,
} from '@/services/supply';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface DashboardPageProps {
  params: { shareCode: string };
}

interface SupplyItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  remark?: string;
}

// 获取采购订单信息API
const getPurchaseOrderInfo = async (shareCode: string, extractCode?: string) => {
  try {
    const response = await getSharedPurchaseOrderApi(shareCode, extractCode);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.msg || error.message || '获取订单信息失败');
  }
};

// 获取实时可选产品列表API
const getAvailableProducts = async (shareCode: string, extractCode?: string) => {
  try {
    const response = await getSharedProductsApi(shareCode, extractCode);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.msg || error.message || '获取产品列表失败');
  }
};

// 提交供货记录API
const submitSupplyRecord = async (
  shareCode: string,
  data: SupplySubmitData & { extractCode?: string }
) => {
  try {
    const response = await submitSupplyListApi(shareCode, data, data.extractCode);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.msg || error.message || '提交失败');
  }
};

const SupplyDashboardPage: React.FC<DashboardPageProps> = ({ params }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();

  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [supplyItems, setSupplyItems] = useState<SupplyItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [refreshingProducts, setRefreshingProducts] = useState(false);

  const shareCode = params.shareCode;
  const extractCode = searchParams.get('extractCode');

  // 获取采购订单信息
  const {
    data: orderData,
    loading: orderLoading,
    error,
  } = useRequest(() => getPurchaseOrderInfo(shareCode, extractCode || ''), {
    ready: !!shareCode,
    onSuccess: (response) => {
      const data = response.data;
      setOrderInfo(data.orderInfo);
      setProducts(data.products);
      setStatistics(data.statistics);

      // 初始化供货明细
      const initialItems = data.products.map((product: any) => ({
        productId: product.product.id,
        quantity: 0,
        unitPrice: Number(product.unitPrice) || 0,
        totalPrice: 0,
        remark: '',
      }));
      setSupplyItems(initialItems);
    },
    onError: (err) => {
      message.error(err.message);
      // 验证失败，返回验证页面
      router.push(`/supply/${shareCode}`);
    },
  });

  // 刷新产品列表
  const { run: refreshProducts } = useRequest(getAvailableProducts, {
    manual: true,
    onBefore: () => {
      setRefreshingProducts(true);
    },
    onSuccess: (response) => {
      const availableProducts = response.data.products || [];

      // 更新products状态
      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          const updated = availableProducts.find((p: any) => p.productId === product.product.id);
          if (updated) {
            return {
              ...product,
              suppliedQuantity: updated.suppliedQuantity,
              availableQuantity: updated.availableQuantity,
            };
          }
          return product;
        })
      );

      // 重置已填写但现在不可选的产品数量
      setSupplyItems((prevItems) =>
        prevItems.map((item) => {
          const productInfo = availableProducts.find((p: any) => p.productId === item.productId);
          if (!productInfo || productInfo.availableQuantity === 0) {
            return { ...item, quantity: 0, totalPrice: 0 };
          }
          // 如果填写的数量超过了现在的可用数量，调整为最大可用数量
          if (item.quantity > productInfo.availableQuantity) {
            const newQuantity = productInfo.availableQuantity;
            return {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * item.unitPrice,
            };
          }
          return item;
        })
      );

      message.success('产品列表已刷新');
    },
    onError: (error: any) => {
      message.error('刷新产品列表失败：' + error.message);
    },
    onFinally: () => {
      setRefreshingProducts(false);
    },
  });

  // 提交供货记录
  const { run: submitRecord, loading: submitLoading } = useRequest(submitSupplyRecord, {
    manual: true,
    onSuccess: (response: any) => {
      if (response?.code === 0) {
        message.success('供货记录提交成功！');
        // 可以选择刷新数据或跳转到成功页面
        window.location.reload();
      } else {
        message.error(response?.msg || '提交失败');
      }
    },
    onError: (error: any) => {
      // 检查是否是产品冲突错误
      if (error.message.includes('数量超限') || error.message.includes('不符合要求')) {
        message.error(error.message + '，请刷新产品列表后重试');
        refreshProducts(shareCode, extractCode || '');
      } else {
        message.error(error.message || '提交失败');
      }
    },
  });

  // 更新供货明细
  const updateSupplyItem = (productId: string, field: keyof SupplyItem, value: any) => {
    setSupplyItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const updated = { ...item, [field]: value };

          // 自动计算小计
          if (field === 'quantity' || field === 'unitPrice') {
            updated.totalPrice = updated.quantity * updated.unitPrice;
          }

          return updated;
        }
        return item;
      })
    );
  };

  // 计算总金额
  useEffect(() => {
    const total = supplyItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    setTotalAmount(total);
  }, [supplyItems]);

  // 获取产品信息
  const getProductInfo = (productId: string) => {
    return products.find((p) => p.product.id === productId);
  };

  // 验证并提交供货记录
  const handleSubmit = () => {
    const validItems = supplyItems.filter((item) => item.quantity > 0);

    if (validItems.length === 0) {
      message.error('请至少填写一个产品的供货数量');
      return;
    }

    // 验证数量是否超限
    const errors: string[] = [];
    validItems.forEach((item) => {
      const productInfo = getProductInfo(item.productId);
      if (productInfo && item.quantity > productInfo.availableQuantity) {
        errors.push(`${productInfo.product.code} 供货数量超出可用数量`);
      }
    });

    if (errors.length > 0) {
      message.error(errors.join('；'));
      return;
    }

    // 直接提交供货记录
    submitRecord(shareCode, {
      items: validItems,
      totalAmount,
      remark: form.getFieldValue('remark'),
      extractCode: extractCode || undefined,
    });
  };

  // 渲染产品供货卡片
  const renderProductCard = (item: SupplyItem) => {
    const productInfo = getProductInfo(item.productId);
    if (!productInfo) return null;

    const supplied = productInfo.suppliedQuantity || 0;
    const available = productInfo.availableQuantity || 0;

    return (
      <Card
        key={item.productId}
        size="small"
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: '16px' }}
      >
        {/* 产品信息头部 */}
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[12, 12]}>
            {/* 产品图片 */}
            <Col xs={8} sm={6}>
              {productInfo.product.images && productInfo.product.images.length > 0 ? (
                <div style={{ position: 'relative' }}>
                  <Image
                    src={productInfo.product.images.find((img: any) => img.isCover)?.imageUrl || productInfo.product.images[0]?.imageUrl}
                    alt={productInfo.product.code}
                    style={{
                      width: '100%',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid #f0f0f0'
                    }}
                    preview={{
                      src: productInfo.product.images.find((img: any) => img.isCover)?.imageUrl || productInfo.product.images[0]?.imageUrl
                    }}
                  />
                  {productInfo.product.images.length > 1 && (
                    <div style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      background: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      fontSize: '10px',
                      padding: '2px 4px',
                      borderRadius: '2px'
                    }}>
                      +{productInfo.product.images.length - 1}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  width: '100%',
                  height: '80px',
                  background: '#f5f5f5',
                  borderRadius: '6px',
                  border: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: '12px'
                }}>
                  暂无图片
                </div>
              )}
            </Col>
            
            {/* 产品基本信息 */}
            <Col xs={16} sm={18}>
              <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                {productInfo.product.code}
              </Text>
              {productInfo.product.specification && (
                <div style={{ color: '#666', fontSize: '12px', marginTop: 4 }}>
                  {productInfo.product.specification}
                </div>
              )}
              {productInfo.product.sku && (
                <div style={{ color: '#999', fontSize: '11px', marginTop: 2 }}>
                  SKU: {productInfo.product.sku}
                </div>
              )}
              {productInfo.product.color && (
                <div style={{ color: '#999', fontSize: '11px', marginTop: 2 }}>
                  颜色: {productInfo.product.color}
                </div>
              )}
            </Col>
          </Row>
        </div>

        {/* 数量统计信息 */}
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col xs={6} sm={6}>
            <div
              style={{
                textAlign: 'center',
                padding: '8px',
                background: '#f5f5f5',
                borderRadius: '4px',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                {productInfo.purchaseQuantity || 0}
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>采购数量</div>
            </div>
          </Col>
          <Col xs={6} sm={6}>
            <div
              style={{
                textAlign: 'center',
                padding: '8px',
                background: '#f5f5f5',
                borderRadius: '4px',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: supplied > 0 ? '#1890ff' : '#999',
                }}
              >
                {supplied}
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>已供货</div>
            </div>
          </Col>
          <Col xs={6} sm={6}>
            <div
              style={{
                textAlign: 'center',
                padding: '8px',
                background: '#f5f5f5',
                borderRadius: '4px',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: available > 0 ? '#52c41a' : '#ff4d4f',
                }}
              >
                {available}
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>可供货</div>
            </div>
          </Col>
          <Col xs={6} sm={6}>
            <div
              style={{
                textAlign: 'center',
                padding: '8px',
                background: item.totalPrice > 0 ? '#fff2e8' : '#f5f5f5',
                borderRadius: '4px',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: item.totalPrice > 0 ? '#f50' : '#999',
                }}
              >
                ¥{Number(item.totalPrice || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>小计</div>
            </div>
          </Col>
        </Row>

        {/* 输入区域 */}
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={8}>
            <div>
              <Text style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: 4 }}>
                本次供货数量
              </Text>
              <InputNumber
                min={0}
                max={available}
                value={item.quantity}
                onChange={(value) => updateSupplyItem(item.productId, 'quantity', value || 0)}
                style={{ width: '100%' }}
                placeholder="0"
                size="small"
              />
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div>
              <Text style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: 4 }}>
                单价
              </Text>
              <InputNumber
                min={0}
                precision={2}
                value={item.unitPrice}
                onChange={(value) => updateSupplyItem(item.productId, 'unitPrice', value || 0)}
                style={{ width: '100%' }}
                placeholder="0.00"
                addonBefore="¥"
                size="small"
              />
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div>
              <Text style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: 4 }}>
                备注
              </Text>
              <Input
                placeholder="备注"
                value={item.remark}
                onChange={(e) => updateSupplyItem(item.productId, 'remark', e.target.value)}
                style={{ width: '100%' }}
                size="small"
              />
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  if (orderLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16 }}>正在加载采购订单信息...</Paragraph>
        <Paragraph style={{ fontSize: '12px', color: '#999', marginTop: 8 }}>
          正在获取产品信息和供货统计数据，请稍候
        </Paragraph>
      </div>
    );
  }

  if (error || !orderInfo) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Alert
          message="加载失败"
          description="无法获取采购订单信息，请检查分享链接是否有效"
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="supply-form">
      {/* 订单信息区域 */}
      <Card className="supply-card" style={{ marginBottom: 16 }}>
        <div
          className="supply-card-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Space>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>
              采购订单信息
            </Title>
            <Tag color="blue">{orderInfo.orderNumber}</Tag>
            <Tag color={orderInfo.urgent ? 'red' : 'default'}>
              {orderInfo.urgent ? '紧急' : '常规'}
            </Tag>
          </Space>
          <div style={{ fontSize: '14px', color: '#666' }}>
            日期：{new Date(orderInfo.createdAt).toLocaleDateString()}
          </div>
        </div>

        <Descriptions column={2} size="small">
          <Descriptions.Item label="订单号">{orderInfo.orderNumber}</Descriptions.Item>
          <Descriptions.Item label="供应商">
            <Space>
              <UserOutlined />
              {orderInfo.supplier.name}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="联系人">{orderInfo.supplier.contactPerson}</Descriptions.Item>
          <Descriptions.Item label="订单金额">
            <Text strong style={{ color: '#f50' }}>
              ¥{Number(orderInfo.finalAmount).toLocaleString()}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(orderInfo.createdAt).toLocaleString()}
          </Descriptions.Item>
          {orderInfo.remark && (
            <Descriptions.Item label="订单备注" span={2}>
              {orderInfo.remark}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 统计信息 */}
      {statistics && (
        <Card className="supply-card" style={{ marginBottom: 16 }}>
          <Title level={5} style={{ marginBottom: 16 }}>
            <CalculatorOutlined style={{ marginRight: 8 }} />
            供货统计
          </Title>
          <Row gutter={16}>
            <Col span={6}>
              <div className="stat-card">
                <div className="stat-value">{statistics.totalProducts}</div>
                <div className="stat-label">产品种类</div>
              </div>
            </Col>
            <Col span={6}>
              <div className="stat-card">
                <div className="stat-value">{statistics.totalSupplyRecords}</div>
                <div className="stat-label">供货记录</div>
              </div>
            </Col>
            <Col span={6}>
              <div className="stat-card">
                <div className="stat-value">{statistics.activeSupplyRecords}</div>
                <div className="stat-label">有效记录</div>
              </div>
            </Col>
            <Col span={6}>
              <div className="stat-card">
                <div className="stat-value">¥{Number(statistics.totalSupplyAmount).toFixed(0)}</div>
                <div className="stat-label">已供货金额</div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* 供货记录填写区域 */}
      <Card className="supply-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            填写供货记录
          </Title>
          <Button
            type="default"
            icon={<CheckCircleOutlined />}
            loading={refreshingProducts}
            onClick={() => refreshProducts(shareCode, extractCode || '')}
            size="small"
          >
            刷新产品列表
          </Button>
        </div>

        <Alert
          message="填写说明"
          description="请根据实际供货情况填写产品数量和单价。系统会自动校验数量，确保不超出可供货余量。如遇到数量冲突，请点击右上角刷新按钮。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form form={form} layout="vertical">
          {/* 产品供货卡片列表 */}
          <div style={{ marginBottom: 24 }}>
            {supplyItems.map((item) => renderProductCard(item))}
          </div>

          {/* 汇总信息卡片 */}
          <Card
            size="small"
            style={{ marginBottom: 24, background: '#fafafa' }}
            bodyStyle={{ padding: '16px' }}
          >
            <Row gutter={[16, 8]} align="middle">
              <Col xs={24} sm={6}>
                <Text strong style={{ fontSize: '16px' }}>
                  合计
                </Text>
              </Col>
              <Col xs={8} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                    {supplyItems.filter((item) => item.quantity > 0).length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>供货种类</div>
                </div>
              </Col>
              <Col xs={8} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                    {supplyItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>总数量</div>
                </div>
              </Col>
              <Col xs={8} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f50' }}>
                    ¥{totalAmount.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>总金额</div>
                </div>
              </Col>
            </Row>
          </Card>

          <Form.Item label="备注" name="remark" style={{ marginTop: 24 }}>
            <TextArea rows={3} placeholder="请填写物流单号和备注信息" maxLength={500} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'center', marginTop: 32 }}>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              className="supply-btn supply-btn-primary"
              style={{ width: '200px' }}
              disabled={totalAmount <= 0}
              loading={submitLoading}
            >
              提交供货记录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SupplyDashboardPage;
