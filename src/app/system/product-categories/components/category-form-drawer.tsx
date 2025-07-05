import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { App, Button, Drawer, Form, Input, Space } from 'antd';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

interface ProductCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
  };
}

// API 调用函数
const createCategory = async (data: any) => {
  const response = await fetch('/api/v1/product-categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

const updateCategory = async (id: string, data: any) => {
  const response = await fetch(`/api/v1/product-categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

// form submit
const formSubmit = async (entity: ProductCategory | null, formData: any) => {
  // 区分是更新还是新增
  if (entity && entity.id) {
    return await updateCategory(entity.id, formData);
  }
  return await createCategory(formData);
};

/**
 * Types
 */
import type { DrawerProps, FormProps } from 'antd';
import type { IntlShape } from 'react-intl';

type Props = {
  open: boolean;
  entity: ProductCategory | null;
  closeDrawer: (reload?: boolean) => void;
};

const CategoryFormDrawer: React.FC<Props> = ({ open, entity, closeDrawer }) => {
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
                .then(async (formData: any) => {
                  setSubmittingTrue();
                  try {
                    const res = await formSubmit(entity, formData);
                    if (get(res, 'code') === 200) {
                      message.success(entity ? '更新成功' : '创建成功');
                      closeDrawer(true);
                    } else {
                      message.error(get(res, 'msg') || '操作失败');
                      setSubmittingFalse();
                    }
                  } catch (error: any) {
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
    title: entity ? '编辑产品分类' : '新增产品分类',
    width: 500,
    afterOpenChange: (open) => {
      if (!open) {
        setSubmittingFalse();
        form.resetFields();
      } else if (entity) {
        form.setFieldsValue({
          name: entity.name,
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
          label="分类名称"
          rules={[
            { required: true, message: '请输入分类名称' },
            { max: 50, message: '分类名称不能超过50个字符' },
          ]}
        >
          <Input placeholder="请输入分类名称" maxLength={50} />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default CategoryFormDrawer;
