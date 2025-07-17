'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, Input, Button, Typography, Space, Alert, message, Spin, Row, Col } from 'antd';
import {
  SafetyOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import '../styles.css';

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

      // 保存用户token到localStorage，用于后续API调用
      if (data.userToken) {
        localStorage.setItem(`supply_token_${shareCode}`, data.userToken);
      }

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

  // 检查是否需要显示提取码输入框
  useEffect(() => {
    if (shareCode && !presetExtractCode) {
      // 没有预设提取码，显示提取码输入框
      setNeedsExtractCode(true);
    } else if (shareCode && presetExtractCode) {
      // 有预设提取码，自动验证
      verify(shareCode, presetExtractCode);
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

  // 处理提取码输入 - 移除自动大写限制
  const handleExtractCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 4);
    setExtractCode(value);
  };

  // 处理回车键
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="business-verify-page">
      {/* 页面头部 */}
      <div className="business-header">
        <div className="business-header-content">
          <Space align="center">
            <FileTextOutlined className="business-icon" />
            <div>
              <Title level={3} className="business-title">
                供货记录分享验证
              </Title>
              <Text className="business-subtitle">ERP系统 - 采购订单供货记录访问</Text>
            </div>
          </Space>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="business-content">
        <Row gutter={[32, 32]} justify="center">
          <Col xs={24} sm={15} md={15} lg={15} xl={15}>
            <div className="business-card">
              {loading ? (
                <div className="loading-section">
                  <Spin size="large" />
                  <Paragraph className="loading-text">正在验证分享链接...</Paragraph>
                  <Paragraph className="loading-hint">请耐心等待，通常需要1-3秒</Paragraph>
                </div>
              ) : (
                <>
                  {/* 安全提示 */}
                  <Alert
                    className="business-alert"
                    message={
                      <Space>
                        <SafetyOutlined />
                        <Text strong>安全访问提示</Text>
                      </Space>
                    }
                    description="此页面采用加密分享技术，确保数据安全。请输入正确的提取码以访问供货记录填写页面。"
                    type="info"
                    showIcon={false}
                  />

                  {/* 分享信息展示 */}
                  <div className="share-info-section">
                    <Space direction="vertical" align="center" size="small">
                      <Text className="share-label">分享码</Text>
                      <Text className="share-code">{shareCode}</Text>
                    </Space>
                  </div>

                  {/* 提取码输入区域 */}
                  {needsExtractCode && (
                    <Form form={form} layout="vertical" className="business-form">
                      <Form.Item
                        label={
                          <Space>
                            <KeyOutlined />
                            <Text strong>提取码</Text>
                          </Space>
                        }
                        required
                      >
                        <Input
                          className="business-input"
                          placeholder="请输入4位提取码"
                          value={extractCode}
                          onChange={handleExtractCodeChange}
                          onKeyPress={handleKeyPress}
                          maxLength={4}
                          autoComplete="off"
                          autoFocus
                        />
                        <div className="input-hint">
                          <Text type="secondary">提取码由分享者提供，区分大小写</Text>
                        </div>
                      </Form.Item>

                      <Form.Item className="button-section">
                        <Button
                          type="primary"
                          size="large"
                          className="business-button"
                          onClick={handleVerify}
                          loading={loading}
                          disabled={!extractCode}
                          icon={<CheckCircleOutlined />}
                          block
                        >
                          验证并进入
                        </Button>
                      </Form.Item>
                    </Form>
                  )}

                  {/* 验证成功状态 */}
                  {shareInfo && (
                    <div className="success-section">
                      <Space direction="vertical" align="center" size="large">
                        <CheckCircleOutlined className="success-icon" />
                        <Title level={4} className="success-title">
                          验证成功！
                        </Title>
                        <Text className="success-text">正在跳转到供货记录填写页面...</Text>
                      </Space>
                    </div>
                  )}
                </>
              )}
            </div>
          </Col>

          <Col xs={24} sm={9} md={9} lg={9} xl={9}>
            <div className="business-card">
              {/* 使用说明 */}
              <div className="help-section">
                <Title level={5} className="help-title">
                  <SafetyOutlined />
                  使用说明
                </Title>
                <ul className="help-list">
                  <li>此链接由ERP系统管理员分享，用于填写供货记录</li>
                  <li>验证成功后，您可以查看采购订单详情并填写供货信息</li>
                  <li>所有操作都会被安全记录，请确保信息准确</li>
                  <li>如有疑问，请联系分享此链接的工作人员</li>
                </ul>
              </div>

              {/* 常见问题 */}
              <div className="faq-section">
                <Title level={5} className="faq-title">
                  常见问题
                </Title>
                <div className="faq-content">
                  <Text type="secondary">• 提取码错误？请检查分享信息中的提取码是否正确</Text>
                  <br />
                  <Text type="secondary">• 链接过期？请联系管理员重新获取分享链接</Text>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ShareVerifyPage;
