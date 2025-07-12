import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { App, Button, Modal, Form, Input, Space, Select, Row, Col, Divider, Checkbox } from 'antd';
import { useEffect } from 'react';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

/**
 * APIs
 */
import { createRoleApi, updateRoleApi } from '@/services/roles';

/**
 * Types
 */
import type { ModalProps, FormProps } from 'antd';
import type { IntlShape } from 'react-intl';
import type { RoleDataResult, CreateRoleData, UpdateRoleData } from '@/services/roles';

const { Option } = Select;
const { TextArea } = Input;

// form submit
const formSubmit = async (
  entity: RoleDataResult | null,
  formData: CreateRoleData | UpdateRoleData
) => {
  // 区分是更新还是新增
  if (entity && entity.id) {
    const updateData: UpdateRoleData = {
      ...formData,
      updated_at: new Date().toISOString(),
      permissions: (formData.permissions as string[]) || null,
    };
    return await updateRoleApi(entity.id, updateData);
  }
  return await createRoleApi(formData as CreateRoleData);
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
  permissionsLoading = false,
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

  /**
   * Handlers
   */
  const handleSubmit = async () => {
    try {
      const formData = await form.validateFields();
      setSubmittingTrue();

      const res = await formSubmit(entity, formData);
      if (get(res, 'data.code') === 0) {
        message.success(entity ? '更新成功' : '创建成功');
        closeModal(true);
      } else {
        message.error(get(res, 'data.msg') || '操作失败');
        setSubmittingFalse();
      }
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误，不显示错误消息
        return;
      }
      message.error(error.response?.data?.msg || '操作失败');
      setSubmittingFalse();
    }
  };

  const handleCancel = () => {
    closeModal();
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
        form.setFieldsValue({
          status: 1,
        });
      }
    } else {
      setSubmittingFalse();
      form.resetFields();
    }
  }, [open, entity, form]);

  /**
   * ModalProps
   */
  const modalProps: ModalProps = {
    title: entity ? '编辑角色' : '新建角色',
    open: open,
    onOk: handleSubmit,
    onCancel: handleCancel,
    okText: entity ? '更新' : '创建',
    cancelText: '取消',
    confirmLoading: submitting,
    destroyOnClose: true,
    maskClosable: false,
    width: 600,
    centered: true,
    bodyStyle: { maxHeight: '70vh', overflowY: 'auto' },
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
    <Modal {...modalProps}>
      <Form {...formProps}>
        <Form.Item
          name="name"
          label="角色名称"
          rules={[{ required: true, message: '请输入角色名称' }]}
        >
          <Input placeholder="请输入角色名称" />
        </Form.Item>

        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
          <Select>
            <Option value={1}>启用</Option>
            <Option value={0}>禁用</Option>
          </Select>
        </Form.Item>

        <Divider>权限配置</Divider>

        <Form.Item name="permissions" label="权限">
          {permissionsLoading ? (
            <div style={{ textAlign: 'center', padding: 20 }}>加载权限列表中...</div>
          ) : (
            <Checkbox.Group style={{ width: '100%' }}>
              <Row>
                {permissionsData?.data?.list?.map((permission: any) => (
                  <Col span={8} key={permission.code}>
                    <Checkbox value={permission.code} style={{ marginBottom: 8 }}>
                      {permission.name}
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RoleFormModal;
