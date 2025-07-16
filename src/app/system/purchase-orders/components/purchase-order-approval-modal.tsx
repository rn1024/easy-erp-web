import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Select,
  Input,
  Card,
  Descriptions,
  Timeline,
  Space,
  Tag,
  message,
  Row,
  Col,
  Button,
  Avatar,
} from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, UserOutlined } from '@ant-design/icons';
import {
  EntityType,
  getAvailableTransitions,
  getStatusLabel,
  getStatusColor,
  PurchaseOrderStatus,
} from '@/const/approval';
import type { PurchaseOrderInfo } from '@/services/purchase';

const { Option } = Select;
const { TextArea } = Input;

// 审批历史记录类型
interface ApprovalRecord {
  id: string;
  approverName: string;
  fromStatus: string;
  toStatus: string;
  reason: string;
  remark?: string;
  createdAt: string;
}

// 状态转换选项类型
interface StatusTransition {
  value: string;
  label: string;
  type: 'approve' | 'reject';
}

// 审批弹窗组件 Props
interface ApprovalModalProps {
  open: boolean;
  record: PurchaseOrderInfo | null;
  onClose: (reload?: boolean) => void;
}

// 使用统一的状态转换规则
const getAvailableStatuses = (currentStatus: string): StatusTransition[] => {
  return getAvailableTransitions(EntityType.PURCHASE_ORDER, currentStatus);
};

const PurchaseOrderApprovalModal: React.FC<ApprovalModalProps> = ({ open, record, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 获取审批历史
  const fetchApprovalHistory = async (orderId: string) => {
    setHistoryLoading(true);
    try {
      const response = await fetch(
        `/api/v1/approvals/history?entityType=PURCHASE_ORDER&entityId=${orderId}`
      );
      const result = await response.json();

      if (result.code === 0) {
        setApprovalHistory(result.data || []);
      } else {
        message.error(result.msg || '获取审批历史失败');
      }
    } catch (error) {
      message.error('获取审批历史失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (open && record) {
      form.resetFields();
      fetchApprovalHistory(record.id);
    }
  }, [open, record, form]);

  // 提交审批
  const handleSubmit = async (values: { toStatus: string; reason: string; remark?: string }) => {
    if (!record) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/purchase-orders/${record.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (result.code === 0) {
        message.success('审批成功');
        form.resetFields();
        onClose(true); // 刷新列表
      } else {
        message.error(result.msg || '审批失败');
      }
    } catch (error) {
      message.error('审批失败');
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  const availableStatuses = getAvailableStatuses(record.status);

  return (
    <Modal
      title="采购订单审批"
      open={open}
      onCancel={() => onClose()}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={800}
      okText="提交审批"
      cancelText="取消"
    >
      <Row gutter={16}>
        <Col span={14}>
          {/* 审批表单 */}
          <Card title="审批操作" size="small" style={{ marginBottom: 16 }}>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="toStatus"
                label="审批结果"
                rules={[{ required: true, message: '请选择审批结果' }]}
              >
                <Select placeholder="请选择审批结果">
                  {availableStatuses.map(
                    (status: { value: string; label: string; type: 'approve' | 'reject' }) => (
                      <Option key={status.value} value={status.value}>
                        <Space>
                          {status.type === 'approve' ? (
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          ) : (
                            <CloseCircleOutlined style={{ color: '#f5222d' }} />
                          )}
                          {status.label}
                        </Space>
                      </Option>
                    )
                  )}
                </Select>
              </Form.Item>

              <Form.Item
                name="reason"
                label="审批原因"
                rules={[{ required: true, message: '请输入审批原因' }]}
              >
                <Input placeholder="请输入审批原因" />
              </Form.Item>

              <Form.Item name="remark" label="备注">
                <TextArea rows={3} placeholder="请输入备注信息（可选）" />
              </Form.Item>
            </Form>
          </Card>

          {/* 订单信息 */}
          <Card title="订单信息" size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="订单号">{record.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={getStatusColor(EntityType.PURCHASE_ORDER, record.status)}>
                  {getStatusLabel(EntityType.PURCHASE_ORDER, record.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="店铺">{record.shop?.nickname}</Descriptions.Item>
              <Descriptions.Item label="供应商">{record.supplier?.nickname}</Descriptions.Item>
              <Descriptions.Item label="产品">
                {record.items && record.items.length > 0
                  ? record.items.length === 1
                    ? record.items[0].product?.code
                    : `${record.items.length}个产品`
                  : '暂无产品'}
              </Descriptions.Item>
              <Descriptions.Item label="数量">
                {record.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
              </Descriptions.Item>
              <Descriptions.Item label="金额">
                ¥{record.finalAmount || record.totalAmount}
              </Descriptions.Item>
              <Descriptions.Item label="紧急程度">
                {record.urgent ? <Tag color="red">紧急</Tag> : <Tag color="default">常规</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(record.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="操作员">{record.operator?.name}</Descriptions.Item>
            </Descriptions>
            {record.remark && (
              <div style={{ marginTop: 12 }}>
                <strong>备注：</strong>
                <div style={{ marginTop: 4, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                  {record.remark}
                </div>
              </div>
            )}
          </Card>
        </Col>

        <Col span={10}>
          {/* 审批历史 */}
          <Card
            title="审批历史"
            size="small"
            extra={
              <Button
                size="small"
                onClick={() => fetchApprovalHistory(record.id)}
                loading={historyLoading}
              >
                刷新
              </Button>
            }
          >
            {approvalHistory.length > 0 ? (
              <Timeline>
                {approvalHistory.map((approval) => (
                  <Timeline.Item
                    key={approval.id}
                    dot={
                      <Avatar
                        size="small"
                        icon={<UserOutlined />}
                        style={{ backgroundColor: '#1890ff' }}
                      />
                    }
                  >
                    <div style={{ fontSize: '12px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                        {approval.approverName}
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <Tag color={getStatusColor(EntityType.PURCHASE_ORDER, approval.fromStatus)}>
                          {getStatusLabel(EntityType.PURCHASE_ORDER, approval.fromStatus)}
                        </Tag>
                        →
                        <Tag color={getStatusColor(EntityType.PURCHASE_ORDER, approval.toStatus)}>
                          {getStatusLabel(EntityType.PURCHASE_ORDER, approval.toStatus)}
                        </Tag>
                      </div>
                      <div style={{ color: '#666', marginBottom: 4 }}>原因：{approval.reason}</div>
                      {approval.remark && (
                        <div style={{ color: '#666', marginBottom: 4 }}>
                          备注：{approval.remark}
                        </div>
                      )}
                      <div style={{ color: '#999' }}>
                        {new Date(approval.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>暂无审批记录</div>
            )}
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

export default PurchaseOrderApprovalModal;
