'use client';

import React from 'react';
import { Layout, Typography, Space, Divider } from 'antd';
import { ShopOutlined, SafetyOutlined } from '@ant-design/icons';
import './styles.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

interface SupplyLayoutProps {
  children: React.ReactNode;
}

const SupplyLayout: React.FC<SupplyLayoutProps> = ({ children }) => {
  return (
    <Layout className="supply-layout">
      <Header className="supply-header">
        <div className="supply-header-content">
          <Space align="center">
            <ShopOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0, color: '#fff' }}>
              ERP供货记录填写
            </Title>
          </Space>
          <Space align="center" style={{ color: '#rgba(255,255,255,0.8)' }}>
            <SafetyOutlined />
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>安全验证访问</Text>
          </Space>
        </div>
      </Header>

      <Content className="supply-content">
        <div className="supply-container">{children}</div>
      </Content>

      <Footer className="supply-footer">
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">ERP管理系统 © 2024 | 供应商专用页面 | 无需注册登录</Text>
          <Divider type="vertical" />
          <Text type="secondary">通过分享链接安全访问</Text>
        </div>
      </Footer>
    </Layout>
  );
};

export default SupplyLayout;
