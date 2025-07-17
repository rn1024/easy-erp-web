'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Form, Input, Button, Typography, Space, Alert, message, Spin } from 'antd';
import {
  SafetyOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';

const { Title, Text, Paragraph } = Typography;

interface VerifyPageProps {
  params: { shareCode: string };
}

// 模拟验证API调用
const verifyShareLink = async (shareCode: string, extractCode?: string) => {
  const response = await fetch('/api/v1/share/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      shareCode,
      extractCode,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || '验证失败');
  }

  return response.json();
};

const ShareVerifyPage: React.FC<VerifyPageProps> = ({ params }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const [extractCode, setExtractCode] = useState('');
  const [needsExtractCode, setNeedsExtractCode] = useState(false);
  const [shareInfo, setShareInfo] = useState<any>(null);

  const shareCode = params.shareCode;
  const presetExtractCode = searchParams.get('pwd') || searchParams.get('extractCode');

  // 验证分享链接
  const { run: verify, loading } = useRequest(verifyShareLink, {
    manual: true,
    onSuccess: (response) => {
      const data = response.data;
      setShareInfo(data.shareInfo);
      message.success('验证成功，正在跳转...');

      // 延迟跳转以显示成功消息
      setTimeout(() => {
        const targetUrl = `/supply/${shareCode}/dashboard?extractCode=${extractCode || presetExtractCode}`;
        router.push(targetUrl);
      }, 1000);
    },
    onError: (error: any) => {
      if (error.message.includes('提取码')) {
        setNeedsExtractCode(true);
        message.error('请输入正确的提取码');
      } else {
        message.error(error.message || '验证失败');
      }
    },
  });

  // 自动验证（如果有预设的提取码）
  useEffect(() => {
    if (shareCode) {
      if (presetExtractCode) {
        // 有预设提取码，直接验证
        verify(shareCode, presetExtractCode);
      } else {
        // 没有提取码，先尝试无提取码验证
        verify(shareCode);
      }
    }
  }, [shareCode, presetExtractCode]);

  // 手动验证
  const handleVerify = () => {
    if (needsExtractCode && !extractCode) {
      message.error('请输入提取码');
      return;
    }
    verify(shareCode, extractCode);
  };

  // 处理提取码输入
  const handleExtractCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 4);
    setExtractCode(value);
  };

  // 处理回车键
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="verify-form">
      <Card className="supply-card">
        <div className="supply-card-header">
          <Space direction="vertical" align="center" size="large">
            <div style={{ fontSize: '48px', color: '#1890ff' }}>
              <FileTextOutlined />
            </div>
            <Title level={2} style={{ margin: 0 }}>
              供货记录分享
            </Title>
            <Text type="secondary">通过ERP系统分享的采购订单供货记录</Text>
          </Space>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <Paragraph style={{ marginTop: 16, color: '#666' }}>正在验证分享链接...</Paragraph>
            <Paragraph style={{ fontSize: '12px', color: '#999', marginTop: 8 }}>
              请耐心等待，通常需要1-3秒
            </Paragraph>
          </div>
        ) : (
          <>
            {/* 安全提示 */}
            <Alert
              className="security-tips"
              message={
                <Space>
                  <SafetyOutlined />
                  <Text>安全访问提示</Text>
                </Space>
              }
              description="此页面采用加密分享技术，确保数据安全。请输入正确的提取码以访问供货记录填写页面。"
              type="success"
              showIcon={false}
              style={{ marginBottom: 24 }}
            />

            {/* 分享信息展示 */}
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <Space direction="vertical" size="small">
                <Text strong>分享码: </Text>
                <Text code style={{ fontSize: '16px', padding: '4px 8px' }}>
                  {shareCode}
                </Text>
              </Space>
            </div>

            {/* 提取码输入区域 */}
            {needsExtractCode && (
              <Form form={form} layout="vertical">
                <Form.Item
                  label={
                    <Space>
                      <KeyOutlined />
                      <Text strong>请输入提取码</Text>
                    </Space>
                  }
                  required
                >
                  <Input
                    className="verify-input"
                    placeholder="请输入4位提取码"
                    value={extractCode}
                    onChange={handleExtractCodeChange}
                    onKeyPress={handleKeyPress}
                    maxLength={4}
                    style={{ textAlign: 'center', fontSize: '18px' }}
                    autoComplete="off"
                    autoFocus
                  />
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      提取码由分享者提供，区分大小写
                    </Text>
                  </div>
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
                  <Button
                    type="primary"
                    size="large"
                    className="supply-btn supply-btn-primary"
                    onClick={handleVerify}
                    loading={loading}
                    disabled={!extractCode}
                    icon={<CheckCircleOutlined />}
                    style={{ width: '200px' }}
                  >
                    验证并进入
                  </Button>
                </Form.Item>
              </Form>
            )}

            {/* 验证成功状态 */}
            {shareInfo && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Space direction="vertical" align="center" size="large">
                  <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
                  <Title level={3} style={{ color: '#52c41a', margin: 0 }}>
                    验证成功！
                  </Title>
                  <Text>正在跳转到供货记录填写页面...</Text>
                </Space>
              </div>
            )}

            {/* 使用说明 */}
            <div
              style={{ marginTop: 32, padding: '16px', background: '#fafafa', borderRadius: '6px' }}
            >
              <Title level={5} style={{ marginBottom: 12 }}>
                <SafetyOutlined style={{ marginRight: 8 }} />
                使用说明
              </Title>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>此链接由ERP系统管理员分享，用于填写供货记录</li>
                <li>验证成功后，您可以查看采购订单详情并填写供货信息</li>
                <li>所有操作都会被安全记录，请确保信息准确</li>
                <li>如有疑问，请联系分享此链接的工作人员</li>
              </ul>
            </div>

            {/* 常见问题 */}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                提取码错误？请检查分享信息中的提取码是否正确 |
                链接过期？请联系管理员重新获取分享链接
              </Text>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ShareVerifyPage;
