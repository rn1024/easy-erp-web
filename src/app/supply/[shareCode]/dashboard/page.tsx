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
  Table,
  Tag,
  Divider,
  Progress,
  Row,
  Col,
  Modal,
} from 'antd';
import {
  InfoCircleOutlined,
  ShopOutlined,
  UserOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { ColumnsType } from 'antd/es/table';

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

interface SupplierInfo {
  name: string;
  contactPerson: string;
  contactPhone: string;
  remark?: string;
}

// 获取采购订单信息API
const getPurchaseOrderInfo = async (shareCode: string, extractCode?: string) => {
  const url = `/api/v1/share/${shareCode}/info${extractCode ? `?extractCode=${extractCode}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || '获取订单信息失败');
  }

  return response.json();
};

// 提交供货记录API
const submitSupplyRecord = async (
  shareCode: string,
  data: {
    supplierInfo: SupplierInfo;
    items: SupplyItem[];
    totalAmount: number;
    remark?: string;
    extractCode?: string;
  }
) => {
  const response = await fetch(`/api/v1/share/${shareCode}/supply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || '提交失败');
  }

  return response.json();
};

const SupplyDashboardPage: React.FC<DashboardPageProps> = ({ params }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const [supplierForm] = Form.useForm();

  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [supplyItems, setSupplyItems] = useState<SupplyItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);

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

  // 提交供货记录
  const { run: submitRecord, loading: submitLoading } = useRequest(submitSupplyRecord, {
    manual: true,
    onSuccess: () => {
      message.success('供货记录提交成功！');
      setSubmitModalVisible(false);
      // 可以选择刷新数据或跳转到成功页面
      window.location.reload();
    },
    onError: (error: any) => {
      message.error(error.message || '提交失败');
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

  // 验证并显示提交确认
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

    setSubmitModalVisible(true);
  };

  // 确认提交
  const confirmSubmit = () => {
    supplierForm.validateFields().then((supplierValues) => {
      const validItems = supplyItems.filter((item) => item.quantity > 0);

      submitRecord(shareCode, {
        supplierInfo: supplierValues,
        items: validItems,
        totalAmount,
        remark: form.getFieldValue('remark'),
        extractCode: extractCode || undefined,
      });
    });
  };

  // 产品表格列定义
  const columns: ColumnsType<any> = [
    {
      title: '产品信息',
      width: 200,
      render: (_, record) => {
        const productInfo = getProductInfo(record.productId);
        if (!productInfo) return null;

        return (
          <div>
            <Text strong style={{ color: '#1890ff' }}>
              {productInfo.product.code}
            </Text>
            {productInfo.product.specification && (
              <div style={{ color: '#666', fontSize: '12px' }}>
                {productInfo.product.specification}
              </div>
            )}
            {productInfo.product.sku && (
              <div style={{ color: '#999', fontSize: '11px' }}>SKU: {productInfo.product.sku}</div>
            )}
          </div>
        );
      },
    },
    {
      title: '采购数量',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const productInfo = getProductInfo(record.productId);
        return productInfo?.purchaseQuantity || 0;
      },
    },
    {
      title: '已供货',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const productInfo = getProductInfo(record.productId);
        const supplied = productInfo?.suppliedQuantity || 0;
        return <Text style={{ color: supplied > 0 ? '#1890ff' : '#999' }}>{supplied}</Text>;
      },
    },
    {
      title: '可供货',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const productInfo = getProductInfo(record.productId);
        const available = productInfo?.availableQuantity || 0;
        return <Text style={{ color: available > 0 ? '#52c41a' : '#ff4d4f' }}>{available}</Text>;
      },
    },
    {
      title: '本次供货',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <InputNumber
          min={0}
          max={getProductInfo(record.productId)?.availableQuantity || 0}
          value={record.quantity}
          onChange={(value) => updateSupplyItem(record.productId, 'quantity', value || 0)}
          style={{ width: '100%' }}
          placeholder="0"
        />
      ),
    },
    {
      title: '单价',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <InputNumber
          min={0}
          precision={2}
          value={record.unitPrice}
          onChange={(value) => updateSupplyItem(record.productId, 'unitPrice', value || 0)}
          style={{ width: '100%' }}
          placeholder="0.00"
          addonBefore="¥"
        />
      ),
    },
    {
      title: '小计',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <Text strong style={{ color: record.totalPrice > 0 ? '#f50' : '#999' }}>
          ¥{Number(record.totalPrice || 0).toFixed(2)}
        </Text>
      ),
    },
    {
      title: '备注',
      width: 150,
      render: (_, record) => (
        <Input
          placeholder="备注"
          value={record.remark}
          onChange={(e) => updateSupplyItem(record.productId, 'remark', e.target.value)}
          style={{ width: '100%' }}
        />
      ),
    },
  ];

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
        <div className="supply-card-header">
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
        </div>

        <Descriptions column={2} size="small">
          <Descriptions.Item label="订单号">{orderInfo.orderNumber}</Descriptions.Item>
          <Descriptions.Item label="订单状态">
            <Tag color="blue">{orderInfo.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="店铺">
            <Space>
              <ShopOutlined />
              {orderInfo.shop.name}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="负责人">{orderInfo.shop.responsiblePerson}</Descriptions.Item>
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
        <Title level={4} style={{ marginBottom: 16 }}>
          填写供货记录
        </Title>

        <Alert
          message="填写说明"
          description="请根据实际供货情况填写产品数量和单价。系统会自动校验数量，确保不超出可供货余量。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form form={form} layout="vertical">
          <Table
            columns={columns}
            dataSource={supplyItems}
            rowKey="productId"
            pagination={false}
            size="small"
            scroll={{ x: 800 }}
            summary={() => {
              const validItems = supplyItems.filter((item) => item.quantity > 0);
              const totalQuantity = validItems.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4}>
                      <Text strong>合计</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4}>
                      <Text strong>{totalQuantity}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5}>-</Table.Summary.Cell>
                    <Table.Summary.Cell index={6}>
                      <Text strong style={{ color: '#f50' }}>
                        ¥{totalAmount.toFixed(2)}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7}>-</Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />

          <Form.Item label="备注" name="remark" style={{ marginTop: 24 }}>
            <TextArea rows={3} placeholder="请填写供货备注信息（可选）" maxLength={500} />
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
            >
              提交供货记录
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 提交确认弹窗 */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            确认提交供货记录
          </Space>
        }
        open={submitModalVisible}
        onCancel={() => setSubmitModalVisible(false)}
        footer={null}
        width={600}
      >
        <Alert
          message="请确认供应商信息"
          description="提交后将创建正式的供货记录，请确保信息准确无误"
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form form={supplierForm} layout="vertical">
          <Form.Item
            label="供应商名称"
            name="name"
            rules={[{ required: true, message: '请输入供应商名称' }]}
          >
            <Input placeholder="请输入供应商名称" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="联系人"
                name="contactPerson"
                rules={[{ required: true, message: '请输入联系人' }]}
              >
                <Input placeholder="请输入联系人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="联系电话"
                name="contactPhone"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="供应商备注" name="remark">
            <TextArea rows={2} placeholder="供应商备注信息（可选）" />
          </Form.Item>
        </Form>

        <Divider />

        <div>
          <Text strong>供货汇总:</Text>
          <div
            style={{ marginTop: 8, padding: '12px', background: '#fafafa', borderRadius: '4px' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Text>供货种类: {supplyItems.filter((item) => item.quantity > 0).length} 种</Text>
              </Col>
              <Col span={12}>
                <Text>总数量: {supplyItems.reduce((sum, item) => sum + item.quantity, 0)} 件</Text>
              </Col>
              <Col span={24} style={{ marginTop: 8 }}>
                <Text strong style={{ color: '#f50' }}>
                  总金额: ¥{totalAmount.toFixed(2)}
                </Text>
              </Col>
            </Row>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Space>
            <Button onClick={() => setSubmitModalVisible(false)}>取消</Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={confirmSubmit}
              loading={submitLoading}
            >
              确认提交
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default SupplyDashboardPage;
