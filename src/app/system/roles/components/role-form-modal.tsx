import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { Form, Input, message, Modal, ModalProps, Select, Row, Col, Divider, Checkbox } from 'antd';
import { useEffect } from 'react';

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

/**
 * Types
 */
import type { IntlShape } from 'react-intl';
import type { FormProps } from 'antd';

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

type Props = {
  open: boolean;
  entity: RoleDataResult | null;
  closeModal: (reload?: boolean) => void;
  permissionsData?: any;
  permissionsLoading?: boolean;
};

const RoleFormModal: React.FC<Props> = ({
  open,
  entity,
  closeModal,
  permissionsData,
  permissionsLoading,
}) => {
  /**
   * Hooks
   */
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
   * Effects
   */
  useEffect(() => {
    if (open) {
      if (entity) {
        form.setFieldsValue({
          name: entity.name,
          status: entity.status,
          permissions: entity.permissions || [],
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          status: 1,
        });
      }
    }
  }, [open, entity, form]);

  /**
   * ModalProps
   */
  const modalProps: ModalProps = {
    open: open,
    title: entity ? '编辑角色' : '新建角色',
    width: 800,
    okButtonProps: {
      loading: submitting,
    },
    onOk: () => {
      form.submit();
    },
    onCancel: () => {
      closeModal();
      form.resetFields();
      setSubmittingFalse();
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
    onFinish: async (formData) => {
      setSubmittingTrue();
      try {
        const res = await formSubmit(entity, formData);
        if (get(res, 'data.code') === 0) {
          message.success(entity ? '更新成功' : '创建成功');
          closeModal(true);
        } else {
          message.error(get(res, 'data.msg') || '操作失败');
          setSubmittingFalse();
        }
      } catch (error) {
        message.error('操作失败');
        setSubmittingFalse();
      }
    },
  };

  return (
    <Modal {...modalProps}>
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
    </Modal>
  );
};

export default RoleFormModal;
