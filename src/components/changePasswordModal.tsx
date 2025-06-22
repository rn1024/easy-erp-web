import { useBoolean, useLocalStorageState } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { Form, Input, message, Modal, ModalProps } from 'antd';
import store from 'store2';

/**
 * APIs
 */
import { cAccountPwd } from '@/services/account';

/**
 * Utils
 */
import { accountPasswordRegex } from '@/utils';

/**
 * Types
 */
import type { IntlShape } from 'react-intl';
import type { FormProps } from 'antd';
// import type { User } from '@repo/typings/user';

interface User {
  id: string;
  status: number;
  name: string;
}

export type FeFormParams = {
  old_password: string;
  new_password: string;
  new_password_2: string;
};

type Props = {
  open: boolean;
  closeModelForm: () => void;
};

const ComponentChangePasswordModal: React.FC<Props> = ({ open, closeModelForm }) => {
  /**
   * State
   */
  const [submitting, { setFalse: setSubmittingFlase, setTrue: setSubmittingTrue }] =
    useBoolean(false);
  const [form] = Form.useForm();
  const intl: IntlShape = useIntl();
  const [user] = useLocalStorageState<User>('user', {
    defaultValue: {
      id: '',
      status: 0,
      name: '',
    },
  });

  /**
   * Props
   */
  const modalProps: ModalProps = {
    open: open,
    title: <FormattedMessage id="c.cpm.changePassword" />,
    width: 540,
    okButtonProps: {
      loading: submitting,
    },
    onOk: () => {
      form.submit();
    },
    onCancel: () => {
      closeModelForm();
      form.resetFields();
      setSubmittingFlase();
    },
  };

  const formProps: FormProps<FeFormParams> = {
    form: form,
    layout: 'vertical',
    validateTrigger: 'onBlur',
    autoComplete: 'off',
    onFinish: async (formData) => {
      console.log(formData);
      setSubmittingTrue();
      try {
        const res = await cAccountPwd(user!.id, {
          old_password: formData.old_password,
          new_password: formData.new_password,
        });
        if (get(res, 'data.code') === 0) {
          message.success(intl.formatMessage({ id: 'c.operationCompleted' }));
          store.clear();
          window.location.href = '/login';
        } else {
          message.error(get(res, 'data.msg', 'Error'));
          setSubmittingFlase();
        }
      } catch {
        setSubmittingFlase();
      }
      return false;
    },
  };

  return (
    <Modal {...modalProps}>
      <Form {...formProps}>
        <div style={{ height: 20 }}></div>
        <Form.Item
          name="old_password"
          label={intl.formatMessage({ id: 'c.cpm.oldPassword' })}
          rules={[{ required: true }]}
        >
          <Input.Password placeholder="" />
        </Form.Item>

        <Form.Item
          name="new_password"
          label={intl.formatMessage({ id: 'c.cpm.newPassword' })}
          rules={[
            { required: true },
            {
              pattern: accountPasswordRegex,
              message: intl.formatMessage({ id: 'sma.c.inputPWDPlaceholder' }),
            },
          ]}
        >
          <Input.Password placeholder="" />
        </Form.Item>

        <Form.Item
          name="new_password_2"
          label={intl.formatMessage({ id: 'c.cpm.sureNewPassword' })}
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('new_password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(intl.formatMessage({ id: 'c.cpm.inputPasswordNotMatch' }));
              },
            }),
          ]}
          dependencies={['new_password']}
        >
          <Input.Password placeholder="" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ComponentChangePasswordModal;
