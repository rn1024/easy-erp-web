import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { App, Button, Drawer, Form, Input, Space, Select } from 'antd';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

/**
 * APIs
 */
import { cAccount, uAccount, type AccountsResponse, type CAccountData } from '@/services/account';
import type { RoleDataResult } from '@/services/roles';

// form submit
const formSubmit = async (entity: AccountsResponse | null, formData: CAccountData) => {
  // 区分是更新还是新增
  if (entity && entity.id) {
    return await uAccount(entity.id, formData);
  }
  return await cAccount(formData);
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
  roleOptions?: { label: string; value: string }[];
};

const AccountFormDrawer: React.FC<Props> = ({ open, entity, closeDrawer, roleOptions = [] }) => {
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
                .then(async (formData: CAccountData) => {
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
                  } catch (error: any) {
                    message.error(error.response?.data?.msg || '操作失败');
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
    title: entity ? '编辑账户' : '新建账户',
    width: 600,
    afterOpenChange: (open) => {
      if (!open) {
        setSubmittingFalse();
        form.resetFields();
      } else if (entity) {
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
    </Drawer>
  );
};

export default AccountFormDrawer;
