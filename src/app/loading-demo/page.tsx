'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Switch, Select, Button, Space, Typography } from 'antd';
import Loading, { FullScreenLoading, PageLoading, ButtonLoading } from '@/components/ui/loading';

const { Title, Text } = Typography;

const LoadingDemo: React.FC = () => {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [loadingType, setLoadingType] = useState<'spin' | 'dots' | 'pulse' | 'bars' | 'bounce'>(
    'spin'
  );
  const [size, setSize] = useState<'small' | 'default' | 'large'>('default');
  const [theme, setTheme] = useState<'primary' | 'secondary' | 'light' | 'dark'>('primary');
  const [showText, setShowText] = useState(true);

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Loading 组件演示</Title>

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title="控制面板">
            <Space wrap>
              <div>
                类型：
                <Select
                  value={loadingType}
                  onChange={setLoadingType}
                  style={{ width: 120, marginLeft: 8 }}
                >
                  <Select.Option value="spin">旋转</Select.Option>
                  <Select.Option value="dots">圆点</Select.Option>
                  <Select.Option value="pulse">脉冲</Select.Option>
                  <Select.Option value="bars">条形</Select.Option>
                  <Select.Option value="bounce">弹跳</Select.Option>
                </Select>
              </div>

              <div>
                尺寸：
                <Select value={size} onChange={setSize} style={{ width: 100, marginLeft: 8 }}>
                  <Select.Option value="small">小</Select.Option>
                  <Select.Option value="default">中</Select.Option>
                  <Select.Option value="large">大</Select.Option>
                </Select>
              </div>

              <div>
                主题：
                <Select value={theme} onChange={setTheme} style={{ width: 120, marginLeft: 8 }}>
                  <Select.Option value="primary">主要</Select.Option>
                  <Select.Option value="secondary">次要</Select.Option>
                  <Select.Option value="light">浅色</Select.Option>
                  <Select.Option value="dark">深色</Select.Option>
                </Select>
              </div>

              <div>
                显示文本：
                <Switch checked={showText} onChange={setShowText} style={{ marginLeft: 8 }} />
              </div>

              <Button type="primary" onClick={() => setShowFullScreen(true)}>
                显示全屏加载
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="基础加载组件" style={{ minHeight: 200 }}>
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Loading
                type={loadingType}
                size={size}
                theme={theme}
                text={showText ? '加载中...' : undefined}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="居中加载组件" style={{ minHeight: 200, position: 'relative' }}>
            <Loading
              type={loadingType}
              size={size}
              theme={theme}
              text={showText ? '数据加载中...' : undefined}
              centered
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="页面加载组件">
            <PageLoading
              type={loadingType}
              size={size}
              theme={theme}
              text={showText ? '页面加载中...' : undefined}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="按钮加载组件">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" loading={false}>
                <ButtonLoading size="small" />
                <span style={{ marginLeft: 8 }}>小尺寸按钮</span>
              </Button>

              <Button type="default" loading={false} size="large">
                <ButtonLoading size="default" />
                <span style={{ marginLeft: 8 }}>默认尺寸按钮</span>
              </Button>
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="所有类型展示">
            <Row gutter={[16, 16]}>
              {(['spin', 'dots', 'pulse', 'bars', 'bounce'] as const).map((type) => (
                <Col key={type} xs={12} sm={8} md={6} lg={4}>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: 20,
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                    }}
                  >
                    <Loading type={type} size="default" theme="primary" text={type} />
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="主题色展示">
            <Row gutter={[16, 16]}>
              {(['primary', 'secondary', 'light', 'dark'] as const).map((themeColor) => (
                <Col key={themeColor} xs={12} sm={6}>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: 20,
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      backgroundColor:
                        themeColor === 'light'
                          ? '#333'
                          : themeColor === 'dark'
                            ? '#f5f5f5'
                            : 'transparent',
                    }}
                  >
                    <Loading type="dots" size="default" theme={themeColor} text={themeColor} />
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {showFullScreen && (
        <FullScreenLoading
          type={loadingType}
          size={size}
          theme={theme}
          text={showText ? '全屏加载中，请稍等...' : undefined}
        />
      )}

      {showFullScreen && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 10000 }}>
          <Button onClick={() => setShowFullScreen(false)}>关闭全屏加载</Button>
        </div>
      )}
    </div>
  );
};

export default LoadingDemo;
