'use client';

import React from 'react';
import { Card, Space, Tag, Descriptions, Button, Alert, Divider } from 'antd';
import { useLocalStorageState } from 'ahooks';
import Permission, { SuperAdminPermission, useAccess } from '@/components/permission';

const PermissionTestPage: React.FC = () => {
  const [userPermissions] = useLocalStorageState<string[]>('permissions', {
    defaultValue: [],
  });

  const [userRoles] = useLocalStorageState<string[]>('roles', {
    defaultValue: [],
  });

  const access = useAccess();

  return (
    <div style={{ padding: 24 }}>
      <Card title="权限系统测试页面" style={{ marginBottom: 16 }}>
        <Alert
          message="此页面用于测试权限系统功能，验证超级管理员和普通用户的权限控制"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Descriptions title="当前用户信息" bordered>
          <Descriptions.Item label="权限列表" span={3}>
            {userPermissions?.length > 0 ? (
              userPermissions.map((perm) => (
                <Tag key={perm} color="blue" style={{ margin: 2 }}>
                  {perm}
                </Tag>
              ))
            ) : (
              <Tag color="red">无权限</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="角色列表" span={3}>
            {userRoles?.length > 0 ? (
              userRoles.map((role) => (
                <Tag key={role} color="green" style={{ margin: 2 }}>
                  {role}
                </Tag>
              ))
            ) : (
              <Tag color="red">无角色</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="是否超级管理员">
            <Tag color={access.isSuperAdmin() ? 'green' : 'red'}>
              {access.isSuperAdmin() ? '是' : '否'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="是否管理员">
            <Tag color={access.isAdmin() ? 'green' : 'red'}>{access.isAdmin() ? '是' : '否'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="是否有任何权限">
            <Tag color={access.hasAnyAccess() ? 'green' : 'red'}>
              {access.hasAnyAccess() ? '是' : '否'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="权限组件测试" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <h4>超级管理员专用组件：</h4>
            <SuperAdminPermission fallback={<Alert message="您不是超级管理员" type="warning" />}>
              <Alert message="🎉 恭喜！您是超级管理员，可以看到这个内容" type="success" />
            </SuperAdminPermission>
          </div>

          <Divider />

          <div>
            <h4>单个权限测试：</h4>
            <Space wrap>
              <Permission
                permission="purchase.approve"
                fallback={<Tag color="red">无采购审批权限</Tag>}
              >
                <Tag color="green">有采购审批权限</Tag>
              </Permission>

              <Permission permission="admin.user" fallback={<Tag color="red">无用户管理权限</Tag>}>
                <Tag color="green">有用户管理权限</Tag>
              </Permission>

              <Permission
                permission="financial.view"
                fallback={<Tag color="red">无财务查看权限</Tag>}
              >
                <Tag color="green">有财务查看权限</Tag>
              </Permission>
            </Space>
          </div>

          <Divider />

          <div>
            <h4>多个权限测试（需要任一权限）：</h4>
            <Permission
              permissions={['purchase.approve', 'admin.user', 'financial.view']}
              requireAll={false}
              fallback={<Alert message="您没有采购、用户管理或财务相关权限" type="warning" />}
            >
              <Alert message="您至少拥有采购、用户管理或财务中的一个权限" type="success" />
            </Permission>
          </div>

          <Divider />

          <div>
            <h4>多个权限测试（需要所有权限）：</h4>
            <Permission
              permissions={['purchase.approve', 'admin.user']}
              requireAll={true}
              fallback={<Alert message="您需要同时拥有采购审批和用户管理权限" type="warning" />}
            >
              <Alert message="您同时拥有采购审批和用户管理权限" type="success" />
            </Permission>
          </div>
        </Space>
      </Card>

      <Card title="useAccess Hook 测试">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <h4>权限检查方法测试：</h4>
            <Space wrap>
              <Tag color={access.hasPermission('purchase.approve') ? 'green' : 'red'}>
                采购审批权限: {access.hasPermission('purchase.approve') ? '有' : '无'}
              </Tag>
              <Tag color={access.hasPermission('admin.user') ? 'green' : 'red'}>
                用户管理权限: {access.hasPermission('admin.user') ? '有' : '无'}
              </Tag>
              <Tag
                color={
                  access.hasAllPermissions(['purchase.approve', 'admin.user']) ? 'green' : 'red'
                }
              >
                同时拥有采购和用户权限:{' '}
                {access.hasAllPermissions(['purchase.approve', 'admin.user']) ? '是' : '否'}
              </Tag>
              <Tag
                color={
                  access.hasAnyPermission(['purchase.approve', 'admin.user']) ? 'green' : 'red'
                }
              >
                拥有采购或用户权限:{' '}
                {access.hasAnyPermission(['purchase.approve', 'admin.user']) ? '是' : '否'}
              </Tag>
            </Space>
          </div>

          <Divider />

          <div>
            <h4>权限操作测试：</h4>
            <Space wrap>
              <Permission permission="purchase.approve">
                <Button type="primary">审批采购订单</Button>
              </Permission>

              <Permission permission="admin.user">
                <Button type="primary">管理用户</Button>
              </Permission>

              <Permission permission="financial.manage">
                <Button type="primary">财务管理</Button>
              </Permission>

              <SuperAdminPermission>
                <Button type="primary" danger>
                  超级管理员操作
                </Button>
              </SuperAdminPermission>
            </Space>
          </div>
        </Space>
      </Card>

      <Card title="权限说明">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="超级管理员检查逻辑"
            description={
              <ul>
                <li>
                  权限中包含 <code>admin.*</code> 或 <code>*</code> 或 <code>super_admin</code>
                </li>
                <li>
                  角色中包含 <code>超级管理员</code>
                </li>
                <li>超级管理员可以访问所有功能，无需具体权限检查</li>
              </ul>
            }
            type="info"
          />

          <Alert
            message="权限组件使用说明"
            description={
              <ul>
                <li>
                  <code>Permission</code>: 基础权限组件，支持单个或多个权限检查
                </li>
                <li>
                  <code>SuperAdminPermission</code>: 超级管理员专用组件
                </li>
                <li>
                  <code>useAccess</code>: 权限检查 Hook，提供各种权限检查方法
                </li>
                <li>所有组件都会优先检查超级管理员身份</li>
              </ul>
            }
            type="success"
          />
        </Space>
      </Card>
    </div>
  );
};

export default PermissionTestPage;
