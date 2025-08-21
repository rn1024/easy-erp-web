'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Radio,
  Input,
  Select,
  Button,
  Space,
  message,
  Typography,
  Divider,
  Row,
  Col,
  Card,
  Tag,
  Tooltip,
  Alert,
  Table,
  Drawer,
} from 'antd';
import {
  CopyOutlined,
  ShareAltOutlined,
  QrcodeOutlined,
  HistoryOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import {
  createShareLinkApi,
  getShareHistoryApi,
  ShareConfig,
  ShareLinkInfo,
  ShareHistoryItem,
} from '@/services/supply';

const { TextArea } = Input;
const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

interface SupplyShareModalProps {
  open: boolean;
  purchaseOrderId: string;
  orderNumber: string;
  onClose: () => void;
}

const SupplyShareModal: React.FC<SupplyShareModalProps> = ({
  open,
  purchaseOrderId,
  orderNumber,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [shareInfo, setShareInfo] = useState<ShareLinkInfo | null>(null);
  const [shareText, setShareText] = useState<string>('');
  const [hasShareHistory, setHasShareHistory] = useState(false);
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);

  // 弹层打开时设置默认值和检查分享历史
  useEffect(() => {
    if (open) {
      // 重置为默认状态
      setShareInfo(null);
      setShareText('');
      // 设置表单默认值
      form.setFieldsValue({
        expiresIn: 7 * 24, // 默认7天
        extractCode: '',
        accessLimit: undefined,
      });

      // 检查是否有分享历史
      checkShareHistory();
    }
  }, [open, form]);

  // 检查分享历史
  const checkShareHistory = async () => {
    try {
      const response = await getShareHistoryApi({ purchaseOrderId, page: 1, pageSize: 1 });
      const shareHistory = response.data?.data?.shareHistory || [];
      setHasShareHistory(shareHistory.length > 0);
    } catch (error) {
      setHasShareHistory(false);
    }
  };

  // 创建分享链接
  const { run: createShare, loading: createLoading } = useRequest(createShareLinkApi, {
    manual: true,
    onSuccess: (response) => {
      const data = response.data?.data;
      setShareInfo(data.shareInfo);
      setShareText(data.shareText);
      setHasShareHistory(true);
      message.success('分享链接创建成功');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.msg || '创建分享链接失败');
    },
  });

  // 获取分享历史
  const {
    data: shareHistoryData,
    loading: historyLoading,
    refresh: refreshHistory,
  } = useRequest(() => getShareHistoryApi({ purchaseOrderId, page: 1, pageSize: 50 }), {
    manual: true,
    onError: (error: any) => {
      message.error(error.response?.data?.msg || '获取分享历史失败');
    },
  });

  // 处理创建分享
  const handleCreateShare = () => {
    form.validateFields().then((values: ShareConfig) => {
      createShare(purchaseOrderId, values);
    });
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        message.success(`${type}已复制到剪贴板`);
      })
      .catch(() => {
        message.error('复制失败，请手动复制');
      });
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setShareInfo(null);
    setShareText('');
  };

  // 打开分享历史抽屉
  const handleOpenHistory = () => {
    setHistoryDrawerVisible(true);
    refreshHistory();
  };

  // 关闭分享历史抽屉
  const handleCloseHistory = () => {
    setHistoryDrawerVisible(false);
  };

  // 关闭弹窗
  const handleClose = () => {
    handleReset();
    setHistoryDrawerVisible(false);
    onClose();
  };

  const loading = createLoading;

  // 分享历史表格列定义
  const historyColumns = [
    {
      title: '分享密钥',
      dataIndex: 'shareCode',
      key: 'shareCode',
      width: 120,
      render: (code: string) => (
        <Text code style={{ fontSize: '12px' }}>
          {code}
        </Text>
      ),
    },
    {
      title: '分享链接',
      dataIndex: 'shareUrl',
      key: 'shareUrl',
      width: 200,
      render: (url: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Text
            ellipsis={{ tooltip: url }}
            style={{ fontSize: '12px', maxWidth: 150, cursor: 'pointer' }}
            onClick={() => copyToClipboard(url, '分享链接')}
          >
            {url}
          </Text>
          <Tooltip title="复制链接">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(url, '分享链接')}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: '提取码',
      dataIndex: 'extractCode',
      key: 'extractCode',
      width: 100,
      render: (code: string) => (
        code ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tag
              color="blue"
              style={{ cursor: 'pointer', margin: 0 }}
              onClick={() => copyToClipboard(code, '提取码')}
            >
              {code}
            </Tag>
            <Tooltip title="复制提取码">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(code, '提取码')}
              />
            </Tooltip>
          </div>
        ) : (
          <Text type="secondary" style={{ fontSize: '12px' }}>无</Text>
        )
      ),
    },
    {
      title: '采购订单',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 140,
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '有效' : '已失效'}
        </Tag>
      ),
    },
    {
      title: '访问统计',
      key: 'access',
      width: 120,
      render: (record: ShareHistoryItem) => (
        <Space direction="vertical" size="small">
          <Text type="secondary" style={{ fontSize: '12px' }}>
            总访问: {record.accessCount}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            独立用户: {record.uniqueUserCount}
          </Text>
        </Space>
      ),
    },
    {
      title: '访问限制',
      dataIndex: 'accessLimit',
      key: 'accessLimit',
      width: 80,
      render: (limit: number) => (limit ? `${limit}人` : '无限制'),
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  const shareHistoryList: ShareHistoryItem[] = shareHistoryData?.data?.data?.shareHistory || [];

  return (
    <Modal
      title={
        <Space>
          <ShareAltOutlined />
          分享给供应商
        </Space>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <Alert
          message="通过分享链接，供应商可以直接填写供货记录，无需登录系统"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Card size="small" style={{ backgroundColor: '#f8f9fa' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>采购订单：</Text>
              <Tag color="blue">{orderNumber}</Tag>
            </Col>
            <Col span={12}>
              <Text strong>分享状态：</Text>
              {hasShareHistory ? <Tag color="green">已分享</Tag> : <Tag>未分享</Tag>}
            </Col>
          </Row>
        </Card>
      </div>

      <Form form={form} layout="vertical" disabled={loading}>
        <Form.Item
          label="有效期"
          name="expiresIn"
          rules={[{ required: true, message: '请选择有效期' }]}
        >
          <Radio.Group>
            <Radio value={24}>1天</Radio>
            <Radio value={7 * 24}>7天</Radio>
            <Radio value={30 * 24}>30天</Radio>
            <Radio value={365 * 24}>365天</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="提取码" name="extractCode" extra="留空则系统自动生成4位提取码">
          <Input placeholder="请输入4位提取码（可选）" maxLength={4} style={{ width: 200 }} />
        </Form.Item>

        <Form.Item label="访问人数限制" name="accessLimit" extra="不限制则留空">
          <Select placeholder="请选择访问人数限制" style={{ width: 200 }} allowClear>
            <Option value={1}>1人</Option>
            <Option value={5}>5人</Option>
            <Option value={10}>10人</Option>
            <Option value={20}>20人</Option>
            <Option value={50}>50人</Option>
          </Select>
        </Form.Item>
      </Form>

      {/* 分享链接展示区域 */}
      {shareInfo && (
        <>
          <Divider />
          <div style={{ marginBottom: 16 }}>
            <Title level={5}>分享信息</Title>

            <Card style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>分享链接：</Text>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
                    <Input value={shareInfo.shareUrl} readOnly style={{ marginRight: 8 }} />
                    <Tooltip title="复制链接">
                      <Button
                        icon={<CopyOutlined />}
                        onClick={() => copyToClipboard(shareInfo.shareUrl, '分享链接')}
                      />
                    </Tooltip>
                  </div>
                </div>

                {shareInfo.extractCode && (
                  <div>
                    <Text strong>提取码：</Text>
                    <Tag
                      color="blue"
                      style={{ marginLeft: 8, cursor: 'pointer' }}
                      onClick={() => copyToClipboard(shareInfo.extractCode, '提取码')}
                    >
                      {shareInfo.extractCode} <CopyOutlined />
                    </Tag>
                  </div>
                )}

                <div>
                  <Text strong>有效期至：</Text>
                  <Text>{new Date(shareInfo.expiresAt).toLocaleString()}</Text>
                </div>

                {shareInfo.accessLimit && (
                  <div>
                    <Text strong>访问限制：</Text>
                    <Text>{shareInfo.accessLimit}人</Text>
                  </div>
                )}
              </Space>
            </Card>

            {shareText && (
              <div>
                <Text strong>分享文案：</Text>
                <div style={{ marginTop: 8 }}>
                  <TextArea value={shareText} readOnly rows={4} style={{ marginBottom: 8 }} />
                  <Button
                    block
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(shareText, '分享文案')}
                  >
                    复制分享文案
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 操作按钮 */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Space>
          <Button onClick={handleClose}>取消</Button>
          <Button icon={<HistoryOutlined />} onClick={handleOpenHistory} style={{ marginRight: 8 }}>
            查看分享历史
          </Button>
          <Button type="primary" loading={loading} onClick={handleCreateShare}>
            创建分享
          </Button>
        </Space>
      </div>

      {/* 分享历史抽屉 */}
      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            分享历史
          </Space>
        }
        open={historyDrawerVisible}
        onClose={handleCloseHistory}
        width={1200}
        extra={
          <Button icon={<ReloadOutlined />} onClick={refreshHistory} loading={historyLoading}>
            刷新
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Alert
            message={`采购订单 ${orderNumber} 的所有分享记录`}
            description="显示该采购订单的历史分享记录和访问统计，每次创建分享都会生成新的分享码"
            type="info"
            showIcon
          />
        </div>

        <Table
          columns={historyColumns}
          dataSource={shareHistoryList}
          rowKey="id"
          loading={historyLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1000 }}
          size="small"
          bordered
        />
      </Drawer>
    </Modal>
  );
};

export default SupplyShareModal;
