import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { App, Button, Modal, Form, Input, Space } from 'antd';
import { useEffect } from 'react';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

/**
 * APIs
 */
import { cAccountPwd } from '@/services/account';

/**
 * Types
 */
import type { ModalProps, FormProps } from 'antd';
import type { IntlShape } from 'react-intl';
import type { AccountsResponse, UpdateAccountPasswordData } from '@/services/account';

// form submit
const formSubmit = async (entity: AccountsResponse | null, formData: UpdateAccountPasswordData) => {
  if (entity && entity.id) {
    return await cAccountPwd(entity.id, formData);
  }
  throw new Error('账户信息不存在');
};

type Props = {
  open: boolean;
  entity: AccountsResponse | null;
  closeModal: (reload?: boolean) => void;
};

const AccountPasswordModal: React.FC<Props> = ({ open, entity, closeModal }) => {
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
        message.success('密码修改成功');
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
      message.error(error.response?.data?.msg || error.message || '操作失败');
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
      form.resetFields();
    } else {
      setSubmittingFalse();
      form.resetFields();
    }
  }, [open, form]);

  /**
   * ModalProps
   */
  const modalProps: ModalProps = {
    title: `修改密码 - ${entity?.name || ''}`,
    open: open,
    onOk: handleSubmit,
    onCancel: handleCancel,
    okText: '确定',
    cancelText: '取消',
    confirmLoading: submitting,
    destroyOnClose: true,
    maskClosable: false,
    width: 500,
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
          name="old_password"
          label="当前密码"
          rules={[{ required: true, message: '请输入当前密码' }]}
        >
          <Input.Password placeholder="请输入当前密码" />
        </Form.Item>

        <Form.Item
          name="new_password"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码至少6个字符' },
          ]}
        >
          <Input.Password placeholder="请输入新密码" />
        </Form.Item>

        <Form.Item
          name="confirm_password"
          label="确认新密码"
          dependencies={['new_password']}
          rules={[
            { required: true, message: '请确认新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('new_password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="请确认新密码" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AccountPasswordModal;
