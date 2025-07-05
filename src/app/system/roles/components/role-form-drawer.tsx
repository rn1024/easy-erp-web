import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { App, Button, Drawer, Form, Input, Space, Select, Row, Col, Divider, Checkbox } from 'antd';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

/**
 * APIs
 */
import {
  createRoleApi,
  updateRoleApi,
  type RoleDataResult,
  type Permission,
  getPermissionsApi,
} from '@/services/roles';

// form submit
const formSubmit = async (entity: RoleDataResult | null, formData: any) => {
  const params = {
    ...formData,
    operator: 'admin', // 当前操作人
  };

  // 区分是更新还是新增
  if (entity && entity.id) {
    return await updateRoleApi(entity.id, params);
  }
  return await createRoleApi(params);
};

/**
 * Types
 */
import type { DrawerProps, FormProps } from 'antd';
import type { IntlShape } from 'react-intl';

type Props = {
  open: boolean;
  entity: RoleDataResult | null;
  closeDrawer: (reload?: boolean) => void;
  permissionsData?: any;
  permissionsLoading?: boolean;
};

const RoleFormDrawer: React.FC<Props> = ({
  open,
  entity,
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
  const [submitting, { setFalse: setSubmittingFalse, setTrue: setSubmittingTrue }] =
    useBoolean(false);
  const [form] = Form.useForm();

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

  /**
   * DrawerProps
   */
  const drawerProps: DrawerProps = {
    footer: (
      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button type="default" onClick={() => closeDrawer()}>
            取消
          </Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={() => {
              form
                .validateFields()
                .then(async (formData: any) => {
                  setSubmittingTrue();
                  try {
                    const res = await formSubmit(entity, formData);
                    if (get(res, 'data.code') === 0) {
                      message.success(entity ? '更新成功' : '创建成功');
                      closeDrawer(true);
                    } else {
                      message.error(get(res, 'data.msg') || '操作失败');
                      setSubmittingFalse();
                    }
                  } catch (error) {
                    message.error('操作失败');
                    setSubmittingFalse();
                  }
                })
                .catch(() => {});
            }}
          >
            确定
          </Button>
        </Space>
      </div>
    ),
    destroyOnClose: true,
    maskClosable: false,
    open: open,
    title: entity ? '编辑角色' : '新建角色',
    width: 800,
    afterOpenChange: (open) => {
      if (!open) {
        setSubmittingFalse();
        form.resetFields();
      } else if (entity) {
        form.setFieldsValue({
          name: entity.name,
          status: entity.status,
          permissions: entity.permissions || [],
        });
      } else {
        form.setFieldsValue({
          status: 1,
        });
      }
    },
    onClose: () => {
      closeDrawer();
    },
  };

  /**
   * FormProps
   */
  const formProps: FormProps = {
    form: form,
    layout: 'vertical',
    validateTrigger: 'onBlur',
    preserve: false,
  };

  return (
    <Drawer {...drawerProps}>
      <Form {...formProps}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="角色名称"
              rules={[{ required: true, message: '请输入角色名称' }]}
            >
              <Input placeholder="请输入角色名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select>
                <Select.Option value={1}>启用</Select.Option>
                <Select.Option value={0}>禁用</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider>权限配置</Divider>

        {permissionsLoading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>加载权限列表中...</div>
        ) : (
          <Form.Item name="permissions" label="选择权限">
            <Checkbox.Group style={{ width: '100%' }}>
              {Object.entries((permissionsData?.data as any)?.grouped || {}).map(
                ([module, permissions]) => (
                  <div key={module} style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                      {getModuleName(module)}
                    </div>
                    <Row gutter={[8, 8]}>
                      {(permissions as Permission[]).map((permission) => (
                        <Col span={8} key={permission.code}>
                          <Checkbox value={permission.code}>{permission.name}</Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )
              )}
            </Checkbox.Group>
          </Form.Item>
        )}
      </Form>
    </Drawer>
  );
};

export default RoleFormDrawer;
