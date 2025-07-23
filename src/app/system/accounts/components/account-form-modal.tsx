import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { App, Button, Modal, Form, Input, Space, Select } from 'antd';
import { useEffect } from 'react';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

/**
 * APIs
 */
import { cAccount, uAccount } from '@/services/account';

/**
 * Types
 */
import type { ModalProps, FormProps } from 'antd';
import type { IntlShape } from 'react-intl';
import type { AccountsResponse, CAccountData } from '@/services/account';
import type { RoleDataResult } from '@/services/roles';

// form submit
const formSubmit = async (entity: AccountsResponse | null, formData: CAccountData) => {
  // 区分是更新还是新增
  if (entity && entity.id) {
    return await uAccount(entity.id, formData);
  }
  return await cAccount(formData);
};

type Props = {
  open: boolean;
  entity: AccountsResponse | null;
  closeModal: (reload?: boolean) => void;
  roleOptions?: { label: string; value: string }[];
};

const AccountFormModal: React.FC<Props> = ({ open, entity, closeModal, roleOptions = [] }) => {
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
      if (get(res, 'code') === 0 || get(res, 'code') === 200) {
        message.success(entity ? '更新成功' : '创建成功');
        closeModal(true);
      } else {
        message.error(get(res, 'msg') || '操作失败');
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
          roleIds: entity.roles?.map((role: any) => role.id) || [],
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
    title: entity ? '编辑账户' : '新建账户',
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
          label="账户名称"
          rules={[{ required: true, message: '请输入账户名称' }]}
        >
          <Input placeholder="请输入账户名称" />
        </Form.Item>

        {!entity && (
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
        )}

        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
          <Select>
            <Select.Option value={1}>启用</Select.Option>
            <Select.Option value={0}>禁用</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="roleIds" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
          <Select mode="multiple" placeholder="请选择角色" options={roleOptions} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AccountFormModal;
