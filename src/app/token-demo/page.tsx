'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Tag,
  Typography,
  Alert,
  Progress,
  Descriptions,
} from 'antd';
import { ReloadOutlined, LoginOutlined, ApiOutlined } from '@ant-design/icons';
import { useToken } from '@/hooks/useToken';

const { Title, Text } = Typography;

const TokenDemo: React.FC = () => {
  const { isValid, isExpiring, timeUntilExpiry, user, refreshToken, logout, updateTokenInfo } =
    useToken();
  const [refreshing, setRefreshing] = useState(false);
  const [apiTesting, setApiTesting] = useState(false);
  const [apiResults, setApiResults] = useState<string[]>([]);

  // 格式化时间
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}时${minutes}分${seconds}秒`;
  };

  // 手动刷新token
  const handleRefreshToken = async () => {
    setRefreshing(true);
    try {
      const success = await refreshToken();
      if (success) {
        setApiResults((prev) => [...prev, `✅ ${new Date().toLocaleTimeString()} - Token刷新成功`]);
        updateTokenInfo();
      } else {
        setApiResults((prev) => [...prev, `❌ ${new Date().toLocaleTimeString()} - Token刷新失败`]);
      }
    } catch (error) {
      setApiResults((prev) => [
        ...prev,
        `❌ ${new Date().toLocaleTimeString()} - Token刷新出错: ${error}`,
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // 测试API调用
  const testApiCall = async () => {
    setApiTesting(true);
    try {
      const response = await fetch('/api/v1/me', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiResults((prev) => [
          ...prev,
          `✅ ${new Date().toLocaleTimeString()} - API调用成功: ${data.data?.name}`,
        ]);
      } else {
        setApiResults((prev) => [
          ...prev,
          `❌ ${new Date().toLocaleTimeString()} - API调用失败: ${response.status}`,
        ]);
      }
    } catch (error) {
      setApiResults((prev) => [
        ...prev,
        `❌ ${new Date().toLocaleTimeString()} - API调用出错: ${error}`,
      ]);
    } finally {
      setApiTesting(false);
    }
  };

  // 清空日志
  const clearLogs = () => {
    setApiResults([]);
  };

  useEffect(() => {
    // 每5秒更新一次显示
    const interval = setInterval(() => {
      updateTokenInfo();
    }, 5000);

    return () => clearInterval(interval);
  }, [updateTokenInfo]);

  const getTokenStatus = () => {
    if (!isValid) return { color: 'red', text: '已过期' };
    if (isExpiring) return { color: 'orange', text: '即将过期' };
    return { color: 'green', text: '正常' };
  };

  const tokenStatus = getTokenStatus();
  const progressPercent = isValid
    ? Math.max(0, Math.min(100, (timeUntilExpiry / (8 * 60 * 60 * 1000)) * 100))
    : 0;

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Token自动刷新机制演示</Title>

      <Row gutter={[24, 24]}>
        {/* Token状态卡片 */}
        <Col xs={24} lg={12}>
          <Card title="Token状态监控" bordered={false}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="用户">{user ? user.name : '未登录'}</Descriptions.Item>
              <Descriptions.Item label="Token状态">
                <Tag color={tokenStatus.color}>{tokenStatus.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="剩余时间">
                {isValid ? formatTime(timeUntilExpiry) : '0时0分0秒'}
              </Descriptions.Item>
              <Descriptions.Item label="有效期进度">
                <Progress
                  percent={progressPercent}
                  strokeColor={
                    progressPercent > 20 ? '#52c41a' : progressPercent > 10 ? '#faad14' : '#ff4d4f'
                  }
                  size="small"
                />
              </Descriptions.Item>
            </Descriptions>

            {isExpiring && (
              <Alert
                message="Token即将过期"
                description="系统将在token过期前自动刷新，或您可以手动刷新。"
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}

            {!isValid && (
              <Alert
                message="Token已过期"
                description="请重新登录或使用refresh token刷新。"
                type="error"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </Card>
        </Col>

        {/* 功能测试卡片 */}
        <Col xs={24} lg={12}>
          <Card title="功能测试" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                loading={refreshing}
                onClick={handleRefreshToken}
                block
              >
                手动刷新Token
              </Button>

              <Button
                type="default"
                icon={<ApiOutlined />}
                loading={apiTesting}
                onClick={testApiCall}
                block
              >
                测试API调用
              </Button>

              <Button danger icon={<LoginOutlined />} onClick={logout} block>
                退出登录
              </Button>

              <Button type="dashed" onClick={clearLogs} block>
                清空日志
              </Button>
            </Space>
          </Card>
        </Col>

        {/* 功能说明 */}
        <Col span={24}>
          <Card title="自动刷新机制说明" bordered={false}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Title level={4}>机制特点</Title>
                <ul>
                  <li>
                    <Text strong>无感知刷新：</Text>用户操作不会被中断
                  </li>
                  <li>
                    <Text strong>智能时机：</Text>在token过期前5分钟自动刷新
                  </li>
                  <li>
                    <Text strong>失败重试：</Text>请求失败时自动重试刷新
                  </li>
                  <li>
                    <Text strong>安全退出：</Text>刷新失败时自动跳转登录页
                  </li>
                </ul>
              </Col>
              <Col xs={24} md={12}>
                <Title level={4}>配置参数</Title>
                <ul>
                  <li>
                    <Text strong>Access Token：</Text>8小时有效期
                  </li>
                  <li>
                    <Text strong>Refresh Token：</Text>30天有效期
                  </li>
                  <li>
                    <Text strong>刷新阈值：</Text>5分钟内过期时触发
                  </li>
                  <li>
                    <Text strong>检查频率：</Text>每分钟检查一次
                  </li>
                </ul>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 操作日志 */}
        <Col span={24}>
          <Card title="操作日志" bordered={false}>
            <div
              style={{
                maxHeight: 300,
                overflow: 'auto',
                backgroundColor: '#f5f5f5',
                padding: 16,
                borderRadius: 6,
                fontFamily: 'monospace',
                fontSize: 13,
              }}
            >
              {apiResults.length === 0 ? (
                <Text type="secondary">暂无日志记录...</Text>
              ) : (
                apiResults.map((result, index) => (
                  <div key={index} style={{ marginBottom: 4 }}>
                    {result}
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TokenDemo;
