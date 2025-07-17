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
} from 'antd';
import { CopyOutlined, ShareAltOutlined, QrcodeOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import {
  createShareLinkApi,
  getShareLinkApi,
  updateShareLinkApi,
  disableShareLinkApi,
  ShareConfig,
  ShareLinkInfo,
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
  const [hasExistingShare, setHasExistingShare] = useState(false);

  // 获取现有分享信息
  const { data: existingShareData, loading: getShareLoading } = useRequest(
    () => getShareLinkApi(purchaseOrderId),
    {
      ready: open && !!purchaseOrderId,
      refreshDeps: [open, purchaseOrderId],
      onSuccess: (response) => {
        const data = response.data?.data;
        if (data?.shareInfo) {
          setShareInfo(data.shareInfo);
          setHasExistingShare(true);
          // 设置表单初始值
          form.setFieldsValue({
            expiresIn: calculateHoursFromExpiration(data.shareInfo.expiresAt),
            extractCode: data.shareInfo.extractCode,
            accessLimit: data.shareInfo.accessLimit,
          });
        } else {
          setHasExistingShare(false);
          // 设置默认值
          form.setFieldsValue({
            expiresIn: 7 * 24, // 默认7天
            extractCode: '',
            accessLimit: undefined,
          });
        }
      },
      onError: () => {
        setHasExistingShare(false);
        form.setFieldsValue({
          expiresIn: 7 * 24,
          extractCode: '',
          accessLimit: undefined,
        });
      },
    }
  );

  // 创建分享链接
  const { run: createShare, loading: createLoading } = useRequest(createShareLinkApi, {
    manual: true,
    onSuccess: (response) => {
      const data = response.data?.data;
      setShareInfo(data.shareInfo);
      setShareText(data.shareText);
      setHasExistingShare(true);
      message.success('分享链接创建成功');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.msg || '创建分享链接失败');
    },
  });

  // 更新分享链接
  const { run: updateShare, loading: updateLoading } = useRequest(updateShareLinkApi, {
    manual: true,
    onSuccess: (response) => {
      const data = response.data?.data;
      setShareInfo(data.shareInfo);
      setShareText(data.shareText);
      message.success('分享链接更新成功');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.msg || '更新分享链接失败');
    },
  });

  // 禁用分享链接
  const { run: disableShare, loading: disableLoading } = useRequest(disableShareLinkApi, {
    manual: true,
    onSuccess: () => {
      setShareInfo(null);
      setShareText('');
      setHasExistingShare(false);
      message.success('分享链接已禁用');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.msg || '禁用分享链接失败');
    },
  });

  // 计算过期时间到现在的小时数
  const calculateHoursFromExpiration = (expiresAt: string) => {
    const expireTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const diffHours = Math.ceil((expireTime - now) / (1000 * 60 * 60));
    return Math.max(1, diffHours);
  };

  // 处理创建/更新分享
  const handleCreateOrUpdate = () => {
    form.validateFields().then((values: ShareConfig) => {
      if (hasExistingShare) {
        updateShare(purchaseOrderId, values);
      } else {
        createShare(purchaseOrderId, values);
      }
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

  // 关闭弹窗
  const handleClose = () => {
    handleReset();
    onClose();
  };

  const loading = getShareLoading || createLoading || updateLoading || disableLoading;

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
              {hasExistingShare ? <Tag color="green">已分享</Tag> : <Tag>未分享</Tag>}
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
          <Button type="primary" loading={loading} onClick={handleCreateOrUpdate}>
            {hasExistingShare ? '更新分享' : '创建分享'}
          </Button>
          {hasExistingShare && (
            <Button danger loading={loading} onClick={() => disableShare(purchaseOrderId)}>
              禁用分享
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
};

export default SupplyShareModal;
