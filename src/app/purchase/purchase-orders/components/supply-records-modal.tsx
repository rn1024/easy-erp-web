'use client';

import React, { useState } from 'react';
import {
  Modal,
  Table,
  Select,
  Button,
  Space,
  message,
  Typography,
  Divider,
  Row,
  Col,
  Card,
  Statistic,
  Tag,
  Tooltip,
  Popconfirm,
  Progress,
  Descriptions,
  Alert,
  Spin,
} from 'antd';
import {
  EyeOutlined,
  StopOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { ColumnsType } from 'antd/es/table';
import {
  getSupplyRecordsApi,
  disableSupplyRecordApi,
  getSupplierHistoryRecordsApi,
  checkAndUpdateOrderStatusApi,
  SupplyRecord,
  SupplyStatistics,
} from '@/services/supply';

const { Text, Title } = Typography;
const { Option } = Select;

interface SupplyRecordsModalProps {
  open: boolean;
  purchaseOrderId: string;
  orderNumber: string;
  onClose: () => void;
  onRefresh?: () => void;
}

const SupplyRecordsModal: React.FC<SupplyRecordsModalProps> = ({
  open,
  purchaseOrderId,
  orderNumber,
  onClose,
  onRefresh,
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<SupplyRecord | null>(null);
  const [supplierHistoryRecords, setSupplierHistoryRecords] = useState<SupplyRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 获取供应商历史记录
  const fetchSupplierHistory = async (supplierId: string) => {
    setHistoryLoading(true);
    try {
      const response = await getSupplierHistoryRecordsApi(supplierId);
      if (response.data.code === 0) {
        setSupplierHistoryRecords(response.data.data || []);
      } else {
        console.warn('获取供应商历史记录失败:', response.data.msg);
        setSupplierHistoryRecords([]);
      }
    } catch (error: any) {
      console.warn('获取供应商历史记录失败:', error.message);
      setSupplierHistoryRecords([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 获取供货记录列表和统计
  const {
    data: supplyData,
    loading: recordsLoading,
    refresh: refreshRecords,
  } = useRequest(() => getSupplyRecordsApi(purchaseOrderId), {
    ready: open && !!purchaseOrderId,
    refreshDeps: [open, purchaseOrderId],
    onSuccess: (data) => {
      // 获取供应商历史记录（如果有供应商信息）
      const records = data?.data?.data?.records;
      if (records?.length > 0 && records[0]?.supplierInfo?.id) {
        fetchSupplierHistory(records[0].supplierInfo.id);
      }
    },
  });

  // 失效供货记录
  const { run: disableRecord, loading: disableLoading } = useRequest(disableSupplyRecordApi, {
    manual: true,
    onSuccess: async () => {
      message.success('供货记录已失效');
      refreshRecords();
      setDetailRecord(null);
      
      // 检查并更新采购订单状态
      if (purchaseOrderId) {
        try {
          await checkAndUpdateOrderStatusApi(purchaseOrderId);
          // 刷新采购订单列表
          onRefresh?.();
        } catch (error) {
          console.warn('检查订单状态失败:', error);
        }
      }
    },
    onError: (error: any) => {
      message.error(error.response?.data?.msg || '失效操作失败');
    },
  });

  const statistics: SupplyStatistics = supplyData?.data?.data?.statistics || {
    totalRecords: 0,
    activeRecords: 0,
    totalAmount: 0,
    productStatuses: [],
  };

  const records: SupplyRecord[] = supplyData?.data?.data?.records || [];
  const orderInfo = supplyData?.data?.data?.orderInfo;

  // 处理记录选择
  const handleRecordChange = (recordId: string) => {
    setSelectedRecordId(recordId);
    const record = records.find((r) => r.id === recordId);
    setDetailRecord(record || null);
  };

  // 失效确认
  const handleDisable = (recordId: string) => {
    disableRecord(recordId);
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            有效
          </Tag>
        );
      case 'disabled':
        return (
          <Tag color="red" icon={<CloseCircleOutlined />}>
            已失效
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // 产品状态表格列
  const productColumns: ColumnsType<any> = [
    {
      title: '产品',
      width: 200,
      render: (_, record) => (
        <div>
          <Text strong>{record.product?.code || record.productId}</Text>
          {record.product?.specification && (
            <div style={{ color: '#666', fontSize: '12px' }}>{record.product.specification}</div>
          )}
        </div>
      ),
    },
    {
      title: '采购数量',
      dataIndex: 'purchaseQuantity',
      align: 'center',
      width: 100,
    },
    {
      title: '已供货',
      dataIndex: 'suppliedQuantity',
      align: 'center',
      width: 100,
      render: (value, record) => (
        <Text style={{ color: value > 0 ? '#1890ff' : '#999' }}>{value}</Text>
      ),
    },
    {
      title: '可供货',
      dataIndex: 'availableQuantity',
      align: 'center',
      width: 100,
      render: (value) => <Text style={{ color: value > 0 ? '#52c41a' : '#ff4d4f' }}>{value}</Text>,
    },
    {
      title: '供货进度',
      dataIndex: 'supplyProgress',
      align: 'center',
      width: 120,
      render: (progress) => (
        <Progress percent={progress} size="small" status={progress >= 100 ? 'success' : 'active'} />
      ),
    },
  ];

  // 供货记录明细表格列
  const itemColumns: ColumnsType<any> = [
    {
      title: '产品',
      width: 150,
      render: (_, record) => (
        <div>
          <Text strong>{record.product?.code}</Text>
          {record.product?.specification && (
            <div style={{ color: '#666', fontSize: '12px' }}>{record.product.specification}</div>
          )}
        </div>
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      align: 'center',
      width: 80,
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      align: 'right',
      width: 100,
      render: (value) => `¥${Number(value).toFixed(2)}`,
    },
    {
      title: '小计',
      dataIndex: 'totalPrice',
      align: 'right',
      width: 100,
      render: (value) => (
        <Text strong style={{ color: '#f50' }}>
          ¥{Number(value).toFixed(2)}
        </Text>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
    },
  ];

  const loading = recordsLoading || disableLoading;

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined />
          供货记录管理 - {orderNumber}
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={1000}
      destroyOnClose
    >
      {/* 统计信息区域 */}
      <div style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总记录数"
                value={statistics.totalRecords}
                prefix={<InfoCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="有效记录"
                value={statistics.activeRecords}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="失效记录"
                value={statistics.totalRecords - statistics.activeRecords}
                valueStyle={{ color: '#cf1322' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="供货总额"
                value={statistics.totalAmount}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* 产品供货进度 */}
      {statistics.productStatuses.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Title level={5}>产品供货进度</Title>
          <Table
            dataSource={statistics.productStatuses}
            columns={productColumns}
            rowKey="productId"
            size="small"
            pagination={false}
            scroll={{ y: 200 }}
          />
        </div>
      )}

      <Divider />

      {/* 供货记录选择和详情 */}
      <div style={{ marginBottom: 16 }}>
        <Space align="center">
          <Text strong>选择供货记录：</Text>
          <Select
            style={{ width: 300 }}
            placeholder="请选择要查看的供货记录"
            loading={loading}
            value={selectedRecordId}
            onChange={handleRecordChange}
            allowClear
          >
            {records.map((record) => (
              <Option key={record.id} value={record.id}>
                <Space>
                  {getStatusTag(record.status)}
                  <Text>
                    {new Date(record.createdAt).toLocaleDateString()} -{record.itemCount}个产品 - ¥
                    {Number(record.totalAmount).toFixed(2)}
                  </Text>
                </Space>
              </Option>
            ))}
          </Select>
        </Space>
      </div>

      {/* 记录详情 */}
      {detailRecord && (
        <Card
          title={
            <Space>
              <Text strong>供货记录详情</Text>
              {getStatusTag(detailRecord.status)}
            </Space>
          }
          extra={
            detailRecord.status === 'active' && (
              <Popconfirm
                title="确定要失效这条供货记录吗？"
                description="失效后将释放对应的产品数量，且不可恢复"
                onConfirm={() => handleDisable(detailRecord.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button danger icon={<StopOutlined />} loading={loading} size="small">
                  失效记录
                </Button>
              </Popconfirm>
            )
          }
          size="small"
        >
          <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="供应商信息">
              {typeof detailRecord.supplierInfo === 'object' && detailRecord.supplierInfo.name
                ? detailRecord.supplierInfo.name
                : '未填写'}
            </Descriptions.Item>
            <Descriptions.Item label="总金额">
              <Text strong style={{ color: '#f50' }}>
                ¥{Number(detailRecord.totalAmount).toFixed(2)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(detailRecord.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {new Date(detailRecord.updatedAt).toLocaleString()}
            </Descriptions.Item>
            {detailRecord.remark && (
              <Descriptions.Item label="备注" span={2}>
                {detailRecord.remark}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Title level={5}>产品明细</Title>
          <Table
            dataSource={detailRecord.items}
            columns={itemColumns}
            rowKey="id"
            size="small"
            pagination={false}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Text strong>合计</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <Text strong style={{ color: '#f50' }}>
                      ¥{Number(detailRecord.totalAmount).toFixed(2)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} />
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Card>
      )}

      {/* 供应商历史记录 */}
      {detailRecord && detailRecord.supplierInfo && (
        <Card
          title={<Text strong>供应商历史记录</Text>}
          size="small"
          style={{ marginTop: 16 }}
        >
          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Spin tip="加载供应商历史记录..." />
            </div>
          ) : supplierHistoryRecords.length > 0 ? (
            <Table
              dataSource={supplierHistoryRecords}
              columns={[
                {
                  title: '订单编号',
                  dataIndex: ['purchaseOrder', 'orderNumber'],
                  key: 'orderNumber',
                  width: 150,
                  render: (text) => text || '-',
                },
                {
                  title: '供货金额',
                  dataIndex: 'totalAmount',
                  key: 'totalAmount',
                  width: 120,
                  render: (amount) => (
                    <Text style={{ color: '#f50' }}>¥{Number(amount).toFixed(2)}</Text>
                  ),
                },
                {
                  title: '产品数量',
                  dataIndex: 'itemCount',
                  key: 'itemCount',
                  width: 100,
                  render: (count) => `${count}个`,
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  width: 80,
                  render: (status) => getStatusTag(status),
                },
                {
                  title: '创建时间',
                  dataIndex: 'createdAt',
                  key: 'createdAt',
                  width: 150,
                  render: (date) => new Date(date).toLocaleDateString(),
                },
                {
                  title: '备注',
                  dataIndex: 'remark',
                  key: 'remark',
                  ellipsis: true,
                  render: (text) => text || '-',
                },
              ]}
              rowKey="id"
              size="small"
              pagination={{
                pageSize: 5,
                showSizeChanger: false,
                showQuickJumper: false,
              }}
              scroll={{ y: 200 }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
              暂无历史记录
            </div>
          )}
        </Card>
      )}

      {/* 空状态提示 */}
      {!loading && records.length === 0 && (
        <Alert
          message="暂无供货记录"
          description="该采购订单还没有供应商提交供货记录"
          type="info"
          showIcon
        />
      )}
    </Modal>
  );
};

export default SupplyRecordsModal;
