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
import { createShop, updateShop, type Shop, type ShopFormData } from '@/services/shops';

// form submit
const formSubmit = async (entity: Shop | null, formData: ShopFormData) => {
  // 区分是更新还是新增
  if (entity && entity.id) {
    return await updateShop(entity.id, formData);
  }
  return await createShop(formData);
};

/**
 * Types
 */
import type { DrawerProps, FormProps } from 'antd';
import type { IntlShape } from 'react-intl';

type Props = {
  open: boolean;
  entity: Shop | null;
  closeDrawer: (reload?: boolean) => void;
};

const ShopFormDrawer: React.FC<Props> = ({ open, entity, closeDrawer }) => {
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
                .then(async (formData: ShopFormData) => {
                  setSubmittingTrue();
                  try {
                    const res = await formSubmit(entity, formData);
                    if (get(res, 'data.code') === 0) {
                      message.success(entity ? '店铺更新成功' : '店铺创建成功');
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
    title: entity ? '编辑店铺' : '新建店铺',
    width: 600,
    afterOpenChange: (open) => {
      if (!open) {
        setSubmittingFalse();
        form.resetFields();
      } else if (entity) {
        form.setFieldsValue({
          nickname: entity.nickname,
          avatarUrl: entity.avatarUrl,
          responsiblePerson: entity.responsiblePerson,
          remark: entity.remark,
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
          name="nickname"
          label="店铺昵称"
          rules={[
            { required: true, message: '请输入店铺昵称' },
            { max: 50, message: '店铺昵称不能超过50个字符' },
          ]}
        >
          <Input placeholder="请输入店铺昵称" />
        </Form.Item>

        <Form.Item
          name="avatarUrl"
          label="店铺头像"
          rules={[{ type: 'url', message: '请输入有效的URL地址' }]}
        >
          <Input placeholder="请输入店铺头像URL（可选）" />
        </Form.Item>

        <Form.Item
          name="responsiblePerson"
          label="负责人"
          rules={[
            { required: true, message: '请输入负责人姓名' },
            { max: 20, message: '负责人姓名不能超过20个字符' },
          ]}
        >
          <Input placeholder="请输入负责人姓名" />
        </Form.Item>

        <Form.Item
          name="remark"
          label="备注"
          rules={[{ max: 500, message: '备注不能超过500个字符' }]}
        >
          <Input.TextArea placeholder="请输入备注信息（可选）" rows={4} />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default ShopFormDrawer;
