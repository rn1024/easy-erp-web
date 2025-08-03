import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Form,
  Input,
  message,
  Modal,
  ModalProps,
  Select,
  Row,
  Col,
  InputNumber,
  Switch,
  Divider,
} from 'antd';
import { useEffect, useState } from 'react';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

/**
 * Components
 */
import PurchaseOrderItemsTable, {
  type PurchaseOrderItem,
  type ProductOption,
} from './purchase-order-items-table';

/**
 * APIs
 */
import {
  createPurchaseOrderApi,
  updatePurchaseOrderApi,
  type PurchaseOrderInfo,
  type CreatePurchaseOrderData,
  type UpdatePurchaseOrderData,
  purchaseOrderStatusOptions,
} from '@/services/purchase';

/**
 * Types
 */
import type { IntlShape } from 'react-intl';
import type { FormProps } from 'antd';

const { Option } = Select;
const { TextArea } = Input;

// form submit
const formSubmit = async (
  entity: PurchaseOrderInfo | null,
  formData: CreatePurchaseOrderData | UpdatePurchaseOrderData
) => {
  // 区分是更新还是新增
  if (entity && entity.id) {
    return await updatePurchaseOrderApi(entity.id, formData as UpdatePurchaseOrderData);
  }
  return await createPurchaseOrderApi(formData as CreatePurchaseOrderData);
};

type Props = {
  open: boolean;
  entity: PurchaseOrderInfo | null;
  closeModal: (reload?: boolean) => void;
  shopsData?: any[];
  suppliersData?: any[];
  productsData?: any[];
};

const PurchaseOrderFormModal: React.FC<Props> = ({
  open,
  entity,
  closeModal,
  shopsData = [],
  suppliersData = [],
  productsData = [],
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
  const [form] = Form.useForm();
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);

  // 转换产品数据格式
  const productOptions: ProductOption[] = productsData.map((product: any) => ({
    id: product.id,
    code: product.code,
    sku: product.sku,
    specification: product.specification,
    category: product.category,
  }));

  /**
   * Effects
   */
  useEffect(() => {
    if (open) {
      if (entity) {
        // 编辑模式：设置所有字段包括状态
        form.setFieldsValue({
          shopId: entity.shopId,
          supplierId: entity.supplierId,
          status: entity.status,
          urgent: entity.urgent,
          remark: entity.remark,
        });

        // 设置产品明细
        if (entity.items && entity.items.length > 0) {
          const items: PurchaseOrderItem[] = entity.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            remark: item.remark || '',
          }));
          setOrderItems(items);
        } else {
          setOrderItems([]);
        }
      } else {
        // 创建模式：重置表单和产品明细
        form.resetFields();
        form.setFieldsValue({
          urgent: false,
        });
        setOrderItems([]);
      }
    }
  }, [open, entity, form]);

  /**
   * ModalProps
   */
  const modalProps: ModalProps = {
    open: open,
    title: entity ? '编辑采购订单' : '新增采购订单',
    width: 1200,
    okButtonProps: {
      loading: submitting,
    },
    onOk: () => {
      form.submit();
    },
    onCancel: () => {
      closeModal();
      form.resetFields();
      setOrderItems([]);
      setSubmittingFalse();
    },
    destroyOnClose: true,
    maskClosable: false,
  };

  /**
   * FormProps
   */
  const formProps: FormProps = {
    form: form,
    layout: 'vertical',
    validateTrigger: 'onBlur',
    preserve: false,
    onFinish: async (formData) => {
      // 验证产品明细
      if (!orderItems || orderItems.length === 0) {
        message.error('请添加至少一个产品');
        return;
      }

      // 验证每个产品明细
      const invalidItems = orderItems.filter(
        (item) => !item.productId || item.quantity <= 0 || item.unitPrice <= 0
      );

      if (invalidItems.length > 0) {
        message.error('请完善产品明细信息，确保产品、数量、单价均已正确填写');
        return;
      }

      setSubmittingTrue();
      try {
        // 准备提交数据
        const submitData = {
          ...formData,
          items: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            remark: item.remark || '',
          })),
        };

        // 如果是创建模式，移除状态字段（后端会默认设置为 CREATED）
        if (!entity) {
          delete submitData.status;
        }

        const res = await formSubmit(entity, submitData);
        if (get(res, 'data.code') === 0 || get(res, 'data.code') === 200) {
          message.success(entity ? '更新成功' : '创建成功');
          setSubmittingFalse();
          closeModal(true);
        } else {
          message.error(get(res, 'msg') || '操作失败');
          setSubmittingFalse();
        }
      } catch (error: any) {
        message.error(error.response?.data?.msg || '操作失败');
        setSubmittingFalse();
      }
    },
  };

  // 处理产品明细变更
  const handleItemsChange = (items: PurchaseOrderItem[]) => {
    setOrderItems(items);
  };

  return (
    <Modal {...modalProps}>
      <Form {...formProps}>
        {/* 基本信息 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="shopId"
              label="店铺"
              rules={[{ required: true, message: '请选择店铺' }]}
            >
              <Select placeholder="请选择店铺">
                {shopsData.map((shop: any) => (
                  <Option key={shop.id} value={shop.id}>
                    {shop.nickname}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="supplierId" label="供应商">
              <Select placeholder="请选择供应商" allowClear>
                {suppliersData.map((supplier: any) => (
                  <Option key={supplier.id} value={supplier.id}>
                    {supplier.nickname}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="urgent" label="是否紧急" valuePropName="checked">
              <Switch checkedChildren="紧急" unCheckedChildren="常规" />
            </Form.Item>
          </Col>
        </Row>

        {/* 只在编辑模式下显示状态选择器 */}
        {entity && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select placeholder="请选择状态">
                  {purchaseOrderStatusOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        )}

        <Form.Item name="remark" label="备注">
          <TextArea rows={3} placeholder="请输入备注信息" maxLength={500} />
        </Form.Item>

        <Divider orientation="left">产品明细</Divider>

        {/* 产品明细表格 */}
        <PurchaseOrderItemsTable
          items={orderItems}
          onChange={handleItemsChange}
          productsData={productOptions}
          disabled={false}
        />
      </Form>
    </Modal>
  );
};

export default PurchaseOrderFormModal;
