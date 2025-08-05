import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { Form, Input, message, Modal, ModalProps, Select, Row, Col, InputNumber } from 'antd';
import { useEffect } from 'react';
import React from 'react';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

/**
 * Services
 */
import {
  createFinishedInventory,
  updateFinishedInventory,
  type FinishedInventoryItem,
  type FinishedInventoryParams,
} from '@/services/inventory';
import { getProductsApi } from '@/services/products';

/**
 * Types
 */
import type { IntlShape } from 'react-intl';
import type { FormProps } from 'antd';

const { Option } = Select;

// form submit
const formSubmit = async (
  entity: FinishedInventoryItem | null,
  formData: FinishedInventoryParams
) => {
  // 区分是更新还是新增
  if (entity && entity.id) {
    return await updateFinishedInventory(entity.id, formData);
  }
  return await createFinishedInventory(formData);
};

type Props = {
  open: boolean;
  entity: FinishedInventoryItem | null;
  closeModal: (reload?: boolean) => void;
  shopData?: any[];
  categoryData?: any[];
};

const InventoryFormModal: React.FC<Props> = ({
  open,
  entity,
  closeModal,
  shopData = [],
  categoryData = [],
}) => {
  /**
   * Hooks
   */
  const intl: IntlShape = useIntl();

  /**
   * State
   */
  const [submitting, { setFalse: setSubmittingFalse, setTrue: setSubmittingTrue }] =
    useBoolean(false);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>();
  const [productData, setProductData] = React.useState<any[]>([]);
  const [form] = Form.useForm();

  // 获取产品列表
  const loadProducts = async (categoryId: string) => {
    try {
      const response = await getProductsApi({ categoryId, pageSize: 100 });
      setProductData(response.data?.data?.list || []);
    } catch (error) {
      setProductData([]);
    }
  };

  /**
   * Effects
   */
  useEffect(() => {
    if (open) {
      if (entity) {
        setSelectedCategoryId(entity.categoryId);
        loadProducts(entity.categoryId);
        form.setFieldsValue({
          shopId: entity.shopId,
          categoryId: entity.categoryId,
          productId: entity.productId,
          boxSize: entity.boxSize,
          packQuantity: entity.packQuantity,
          weight: entity.weight,
          location: entity.location,
          stockQuantity: entity.stockQuantity,
        });
      } else {
        form.resetFields();
        setSelectedCategoryId(undefined);
        setProductData([]);
      }
    }
  }, [open, entity, form]);

  /**
   * ModalProps
   */
  const modalProps: ModalProps = {
    open: open,
    title: entity ? '编辑成品库存' : '新建成品库存',
    width: 800,
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
      setSelectedCategoryId(undefined);
      setProductData([]);
    },
  };

  /**
   * FormProps
   */
  const formProps: FormProps<FinishedInventoryParams> = {
    form: form,
    layout: 'vertical',
    validateTrigger: 'onBlur',
    preserve: false,
    onFinish: async (formData) => {
      setSubmittingTrue();
      try {
        const res = await formSubmit(entity, formData);
        if (get(res, 'data.code') === 0 || get(res, 'data.code') === 200) {
          message.success(entity ? '更新成功' : '创建成功');
          setSubmittingFalse();
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
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="shopId"
              label="店铺"
              rules={[{ required: true, message: '请选择店铺' }]}
            >
              <Select placeholder="选择店铺" showSearch optionFilterProp="children">
                {shopData.map((shop: any) => (
                  <Option key={shop.id} value={shop.id}>
                    {shop.nickname}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="categoryId"
              label="产品分类"
              rules={[{ required: true, message: '请选择产品分类' }]}
            >
              <Select
                placeholder="选择产品分类"
                showSearch
                optionFilterProp="children"
                onChange={(value) => {
                  setSelectedCategoryId(value);
                  form.setFieldValue('productId', undefined);
                  loadProducts(value);
                }}
              >
                {categoryData.map((category: any) => (
                  <Option key={category.id} value={category.id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="productId"
          label="产品"
          rules={[{ required: true, message: '请选择产品' }]}
        >
          <Select
            placeholder="选择产品"
            showSearch
            optionFilterProp="children"
            disabled={!selectedCategoryId}
          >
            {productData.map((product: any) => (
              <Option key={product.id} value={product.id}>
                {product.name || '无名称'} {product.specification ? `- ${product.specification}` : ''}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="boxSize" label="箱型规格">
              <Input placeholder="输入箱型规格" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="packQuantity" label="装箱数量">
              <InputNumber min={1} placeholder="装箱数量" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="weight" label="重量(kg)">
              <InputNumber min={0} step={0.1} placeholder="产品重量" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="stockQuantity" label="库存数量">
              <InputNumber min={0} placeholder="库存数量" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="location" label="存储位置">
          <Input placeholder="输入存储位置" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default InventoryFormModal;
