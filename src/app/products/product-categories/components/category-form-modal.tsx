import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { Form, Input, message, Modal, ModalProps } from 'antd';
import { useEffect } from 'react';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

/**
 * Services
 */
import {
  createProductCategoryApi,
  updateProductCategoryApi,
  type ProductCategory,
  type ProductCategoryFormData,
} from '@/services/products';

/**
 * Types
 */
import type { IntlShape } from 'react-intl';
import type { FormProps } from 'antd';

// form submit
const formSubmit = async (entity: ProductCategory | null, formData: ProductCategoryFormData) => {
  // 区分是更新还是新增
  if (entity && entity.id) {
    return await updateProductCategoryApi(entity.id, formData);
  }
  return await createProductCategoryApi(formData);
};

type Props = {
  open: boolean;
  entity: ProductCategory | null;
  closeModal: (reload?: boolean) => void;
};

const CategoryFormModal: React.FC<Props> = ({ open, entity, closeModal }) => {
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

  /**
   * Effects
   */
  useEffect(() => {
    if (open) {
      if (entity) {
        form.setFieldsValue({
          name: entity.name,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, entity, form]);

  /**
   * ModalProps
   */
  const modalProps: ModalProps = {
    open: open,
    title: entity ? '编辑产品分类' : '新建产品分类',
    width: 500,
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
  const formProps: FormProps<ProductCategoryFormData> = {
    form: form,
    layout: 'vertical',
    validateTrigger: 'onBlur',
    preserve: false,
    requiredMark: false,
    onFinish: async (formData) => {
      setSubmittingTrue();
      try {
        const res = await formSubmit(entity, formData);
        if (get(res, 'code') === 0 || get(res, 'code') === 200) {
          message.success(entity ? '更新成功' : '创建成功');
          closeModal(true);
        } else {
          message.error(get(res, 'msg') || '操作失败');
          setSubmittingFalse();
        }
      } catch (error: any) {
        message.error('操作失败');
        setSubmittingFalse();
      }
    },
  };

  return (
    <Modal {...modalProps}>
      <Form {...formProps}>
        <Form.Item
          name="name"
          label="分类名称"
          rules={[
            { required: true, message: '请输入分类名称' },
            { max: 50, message: '分类名称长度不能超过50个字符' },
          ]}
        >
          <Input placeholder="请输入分类名称" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CategoryFormModal;
