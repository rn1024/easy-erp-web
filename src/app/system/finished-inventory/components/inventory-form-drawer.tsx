import React from 'react';
import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { App, Button, Drawer, Form, Input, Space, Select, Row, Col, InputNumber } from 'antd';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

const { Option } = Select;

interface FinishedInventoryItem {
  id: string;
  shopId: string;
  categoryId: string;
  productId: string;
  boxSize?: string;
  packQuantity: number;
  weight?: number;
  location?: string;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
  shop: {
    id: string;
    nickname: string;
  };
  category: {
    id: string;
    name: string;
  };
  product: {
    id: string;
    code: string;
    sku: string;
    specification?: string;
    color?: string;
  };
}

// API 调用函数
const createInventory = async (data: any) => {
  const response = await fetch('/api/v1/finished-inventory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

const updateInventory = async (id: string, data: any) => {
  const response = await fetch(`/api/v1/finished-inventory/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

const getProducts = async (categoryId: string) => {
  const response = await fetch(`/api/v1/products?categoryId=${categoryId}&pageSize=100`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  const result = await response.json();
  return result.data?.list || [];
};

// form submit
const formSubmit = async (entity: FinishedInventoryItem | null, formData: any) => {
  // 区分是更新还是新增
  if (entity && entity.id) {
    return await updateInventory(entity.id, formData);
  }
  return await createInventory(formData);
};

/**
 * Types
 */
import type { DrawerProps, FormProps } from 'antd';
import type { IntlShape } from 'react-intl';

type Props = {
  open: boolean;
  entity: FinishedInventoryItem | null;
  closeDrawer: (reload?: boolean) => void;
  shopData?: any[];
  categoryData?: any[];
};

const InventoryFormDrawer: React.FC<Props> = ({
  open,
  entity,
  closeDrawer,
  shopData = [],
  categoryData = [],
}) => {
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
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>();
  const [productData, setProductData] = React.useState<any[]>([]);
  const [form] = Form.useForm();

  // 获取产品列表
  const loadProducts = async (categoryId: string) => {
    try {
      const products = await getProducts(categoryId);
      setProductData(products);
    } catch (error) {
      setProductData([]);
    }
  };

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
    title: entity ? '编辑成品库存' : '新建成品库存',
    width: 600,
    afterOpenChange: (open) => {
      if (!open) {
        setSubmittingFalse();
        form.resetFields();
        setSelectedCategoryId(undefined);
        setProductData([]);
      } else if (entity) {
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
                {product.code} - {product.sku}
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
    </Drawer>
  );
};

export default InventoryFormDrawer;
