import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  App,
  Button,
  Drawer,
  Form,
  Input,
  Space,
  Select,
  Row,
  Col,
  InputNumber,
  Switch,
} from 'antd';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

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

/**
 * Types
 */
import type { DrawerProps, FormProps } from 'antd';
import type { IntlShape } from 'react-intl';

type Props = {
  open: boolean;
  entity: PurchaseOrderInfo | null;
  closeDrawer: (reload?: boolean) => void;
  shopsData?: any[];
  suppliersData?: any[];
  productsData?: any[];
};

const PurchaseOrderFormDrawer: React.FC<Props> = ({
  open,
  entity,
  closeDrawer,
  shopsData = [],
  suppliersData = [],
  productsData = [],
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
                    if (get(res, 'success') || get(res, 'code') === 200) {
                      message.success(entity ? '更新成功' : '创建成功');
                      closeDrawer(true);
                    } else {
                      message.error(get(res, 'msg') || get(res, 'message') || '操作失败');
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
    title: entity ? '编辑采购订单' : '新增采购订单',
    width: 600,
    afterOpenChange: (open) => {
      if (!open) {
        setSubmittingFalse();
        form.resetFields();
      } else if (entity) {
        form.setFieldsValue({
          shopId: entity.shopId,
          supplierId: entity.supplierId,
          productId: entity.productId,
          quantity: entity.quantity,
          totalAmount: entity.totalAmount,
          status: entity.status,
          urgent: entity.urgent,
          remark: entity.remark,
        });
      } else {
        form.setFieldsValue({
          urgent: false,
          quantity: 1,
          totalAmount: 0,
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
            <Form.Item
              name="supplierId"
              label="供应商"
              rules={[{ required: true, message: '请选择供应商' }]}
            >
              <Select placeholder="请选择供应商">
                {suppliersData.map((supplier: any) => (
                  <Option key={supplier.id} value={supplier.id}>
                    {supplier.nickname}
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
          <Select placeholder="请选择产品" showSearch optionFilterProp="children">
            {productsData.map((product: any) => (
              <Option key={product.id} value={product.id}>
                {product.code} - {product.specification || product.sku}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="quantity"
              label="数量"
              rules={[
                { required: true, message: '请输入数量' },
                { type: 'number', min: 1, message: '数量必须大于0' },
              ]}
            >
              <InputNumber placeholder="请输入数量" style={{ width: '100%' }} min={1} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="totalAmount"
              label="总金额"
              rules={[
                { required: true, message: '请输入总金额' },
                { type: 'number', min: 0, message: '金额不能为负数' },
              ]}
            >
              <InputNumber
                placeholder="请输入总金额"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                prefix="¥"
              />
            </Form.Item>
          </Col>
        </Row>

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
          <Col span={12}>
            <Form.Item name="urgent" label="紧急标记" valuePropName="checked">
              <Switch checkedChildren="紧急" unCheckedChildren="常规" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="remark" label="备注">
          <TextArea rows={4} placeholder="请输入备注信息" maxLength={500} />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default PurchaseOrderFormDrawer;
