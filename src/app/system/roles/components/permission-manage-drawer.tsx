import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { App, Button, Drawer, Space, Alert, Tree, Tag, Divider, Row, Col, Card } from 'antd';
import type { DataNode } from 'antd/es/tree';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

/**
 * APIs
 */
import { type RoleDataResult, type Permission, queryRoleByIdApi } from '@/services/roles';

/**
 * Types
 */
import type { DrawerProps } from 'antd';
import type { IntlShape } from 'react-intl';

type Props = {
  open: boolean;
  currentRoleId: string;
  currentRoleName: string;
  closeDrawer: () => void;
  permissionsData?: any;
  permissionsLoading?: boolean;
};

const PermissionManageDrawer: React.FC<Props> = ({
  open,
  currentRoleId,
  currentRoleName,
  closeDrawer,
  permissionsData,
  permissionsLoading,
}) => {
  /**
   * Hooks
   */
  const { message } = App.useApp();
  const intl: IntlShape = useIntl();

  /**
   * State
   */
  const [loading, { setFalse: setLoadingFalse, setTrue: setLoadingTrue }] = useBoolean(false);

  // 获取模块中文名
  const getModuleName = (module: string) => {
    const moduleNames: Record<string, string> = {
      admin: '系统管理',
      account: '账户管理',
      role: '角色管理',
      log: '日志管理',
      file: '文件管理',
      shop: '店铺管理',
      supplier: '供应商管理',
      forwarder: '货代管理',
      product: '产品管理',
      purchase: '采购管理',
      warehouse: '仓库管理',
      export: '出口管理',
      delivery: '配送管理',
      financial: '财务管理',
    };
    return moduleNames[module] || module;
  };

  // 渲染权限树
  const renderPermissionTree = () => {
    const permissionsGrouped = (permissionsData?.data as any)?.grouped;
    if (!permissionsGrouped) return [];

    const treeData: DataNode[] = Object.entries(permissionsGrouped).map(
      ([module, permissions]) => ({
        title: getModuleName(module),
        key: module,
        children: (permissions as Permission[]).map((permission) => ({
          title: permission.name,
          key: permission.code,
        })),
      })
    );

    return treeData;
  };

  /**
   * DrawerProps
   */
  const drawerProps: DrawerProps = {
    footer: (
      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button type="default" onClick={() => closeDrawer()}>
            关闭
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={() => {
              message.info('权限更新功能开发中...');
            }}
          >
            保存权限
          </Button>
        </Space>
      </div>
    ),
    destroyOnClose: true,
    maskClosable: false,
    open: open,
    title: `权限管理 - ${currentRoleName}`,
    width: 600,
    afterOpenChange: (open) => {
      if (!open) {
        setLoadingFalse();
      }
    },
    onClose: () => {
      closeDrawer();
    },
  };

  return (
    <Drawer {...drawerProps}>
      <Alert
        message="权限管理功能"
        description="此功能正在开发中，将支持更精细的权限配置。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Divider>权限详情</Divider>

      {permissionsLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>加载权限列表中...</div>
      ) : (
        <div>
          {Object.entries((permissionsData?.data as any)?.grouped || {}).map(
            ([module, permissions]) => (
              <Card
                key={module}
                title={getModuleName(module)}
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Row gutter={[8, 8]}>
                  {(permissions as Permission[]).map((permission) => (
                    <Col span={8} key={permission.code}>
                      <Tag
                        color="blue"
                        style={{
                          marginBottom: 8,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          message.info(`权限代码: ${permission.code}`);
                        }}
                      >
                        {permission.name}
                      </Tag>
                    </Col>
                  ))}
                </Row>
              </Card>
            )
          )}
        </div>
      )}

      <Divider>权限树形结构</Divider>

      {!permissionsLoading && (
        <Tree
          treeData={renderPermissionTree()}
          defaultExpandAll
          showIcon={false}
          style={{ marginTop: 16 }}
        />
      )}
    </Drawer>
  );
};

export default PermissionManageDrawer;
