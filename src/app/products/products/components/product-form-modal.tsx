import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { App, Button, Modal, Form, Input, Space, Select, Row, Col, InputNumber } from 'antd';
import { useEffect } from 'react';
import ProductImageUploader from '@/components/product-image-uploader';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

/**
 * APIs
 */
import { createProductApi, updateProductApi } from '@/services/products';

/**
 * Types
 */
import type { ModalProps, FormProps } from 'antd';
import type { IntlShape } from 'react-intl';
import type { ProductInfo, ProductFormData } from '@/services/products';

const { Option } = Select;
const { TextArea } = Input;

// form submit
const formSubmit = async (entity: ProductInfo | null, formData: ProductFormData) => {
  // 区分是更新还是新增
  if (entity && entity.id) {
    return await updateProductApi(entity.id, formData);
  }
  return await createProductApi(formData);
};

type Props = {
  open: boolean;
  entity: ProductInfo | null;
  closeModal: (reload?: boolean) => void;
  categoriesList?: any[];
};

const ProductFormModal: React.FC<Props> = ({ open, entity, closeModal, categoriesList = [] }) => {
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

      // 处理表单数据
      const submitData: ProductFormData = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        setQuantity: formData.setQuantity || 1,
      };

      const res = await formSubmit(entity, submitData);
      if (get(res, 'code') === 0 || get(res, 'code') === 200) {
        message.success(entity ? '更新产品成功' : '创建产品成功');
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
          ...entity,
          weight: entity.weight?.toString(),
        });
      } else {
        form.resetFields();
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
    title: entity ? '编辑产品' : '新增产品',
    open: open,
    onOk: handleSubmit,
    onCancel: handleCancel,
    okText: entity ? '更新' : '创建',
    cancelText: '取消',
    confirmLoading: submitting,
    destroyOnClose: true,
    maskClosable: false,
    width: 1200,
    centered: true,
    bodyStyle: {
      maxHeight: '70vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      padding: '24px',
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
    style: { maxWidth: '100%' },
  };

  return (
    <Modal {...modalProps}>
      <div style={{ width: '100%', overflowX: 'hidden' }}>
        <Form {...formProps}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shopId"
                label="所属店铺"
                rules={[{ required: true, message: '请选择店铺' }]}
              >
                <Select placeholder="选择店铺">
                  <Option value="test-shop-1">测试店铺1</Option>
                  <Option value="test-shop-2">测试店铺2</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label="产品分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="选择分类">
                  {categoriesList.map((category: any) => (
                    <Option key={category.id} value={category.id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="code" label="产品编码">
                <Input placeholder="产品编码" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sku" label="SKU">
                <Input placeholder="SKU" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="asin" label="ASIN">
                <Input placeholder="Amazon ASIN" maxLength={20} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="specification" label="规格">
                <Input placeholder="规格" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="color" label="颜色">
                <Input placeholder="颜色" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="setQuantity" label="套装数量">
                <InputNumber min={1} placeholder="套装数量" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="internalSize" label="内部尺寸">
                <Input placeholder="内部尺寸" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="externalSize" label="外部尺寸">
                <Input placeholder="外部尺寸" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="weight" label="重量(g)">
                <InputNumber min={0} placeholder="重量" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="label" label="标签">
                <Input placeholder="标签" />
              </Form.Item>
            </Col>
          </Row>

          {/* 产品图片上传 */}
          <Form.Item label="产品图片">
            <ProductImageUploader
              productId={entity?.id || ''}
              disabled={!entity?.id}
              maxCount={10}
            />
            {!entity?.id && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                请先保存产品信息后再上传图片
              </div>
            )}
          </Form.Item>

          <Form.Item name="styleInfo" label="款式信息">
            <TextArea rows={3} placeholder="款式信息" />
          </Form.Item>

          <Form.Item name="accessoryInfo" label="配件信息">
            <TextArea rows={3} placeholder="配件信息" />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="备注" />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default ProductFormModal;
