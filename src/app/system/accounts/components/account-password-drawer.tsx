import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { App, Button, Drawer, Form, Input, Space } from 'antd';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

/**
 * APIs
 */
import { cAccountPwd, type AccountsResponse } from '@/services/account';

// form submit
const formSubmit = async (
  entity: AccountsResponse | null,
  formData: { old_password: string; new_password: string }
) => {
  if (!entity?.id) {
    throw new Error('账户ID不能为空');
  }
  return await cAccountPwd(entity.id, formData);
};

/**
 * Types
 */
import type { DrawerProps, FormProps } from 'antd';
import type { IntlShape } from 'react-intl';

type Props = {
  open: boolean;
  entity: AccountsResponse | null;
  closeDrawer: (reload?: boolean) => void;
};

const AccountPasswordDrawer: React.FC<Props> = ({ open, entity, closeDrawer }) => {
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
                .then(
                  async (formData: {
                    old_password: string;
                    new_password: string;
                    confirm_password: string;
                  }) => {
                    setSubmittingTrue();
                    try {
                      // 移除确认密码字段，只传递实际需要的字段
                      const { confirm_password, ...submitData } = formData;
                      const res = await formSubmit(entity, submitData);
                      if (get(res, 'data.code') === 0) {
                        message.success('密码修改成功');
                        closeDrawer(true);
                      } else {
                        message.error(get(res, 'data.msg') || '密码修改失败');
                        setSubmittingFalse();
                      }
                    } catch (error: any) {
                      message.error(error.response?.data?.msg || '密码修改失败');
                      setSubmittingFalse();
                    }
                  }
                )
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
    title: `修改密码 - ${entity?.name || ''}`,
    width: 500,
    afterOpenChange: (open) => {
      if (!open) {
        setSubmittingFalse();
        form.resetFields();
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
    </Drawer>
  );
};

export default AccountPasswordDrawer;
