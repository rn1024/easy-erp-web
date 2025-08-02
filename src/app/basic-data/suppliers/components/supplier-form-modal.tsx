import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { Form, Input, message, Modal, ModalProps, Row, Col, InputNumber } from 'antd';
import { useEffect } from 'react';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

/**
 * APIs
 */
import {
  createSupplier as createSupplierApi,
  updateSupplier as updateSupplierApi,
  type Supplier,
  type SupplierFormData,
} from '@/services/suppliers';

/**
 * Types
 */
import type { IntlShape } from 'react-intl';
import type { FormProps } from 'antd';

// form submit
const formSubmit = async (entity: Supplier | null, formData: SupplierFormData) => {
  // 区分是更新还是新增
  if (entity && entity.id) {
    return await updateSupplierApi(entity.id, formData);
  }
  return await createSupplierApi(formData);
};

type Props = {
  open: boolean;
  entity: Supplier | null;
  closeModal: (reload?: boolean) => void;
};

const SupplierFormModal: React.FC<Props> = ({ open, entity, closeModal }) => {
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
          nickname: entity.nickname,
          contactPerson: entity.contactPerson,
          contactPhone: entity.contactPhone,
          companyName: entity.companyName,
          creditCode: entity.creditCode,
          bankName: entity.bankName,
          bankAccount: entity.bankAccount,
          bankAddress: entity.bankAddress,
          productionDays: entity.productionDays,
          deliveryDays: entity.deliveryDays,
          remark: entity.remark,
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
    title: entity ? '编辑供应商' : '新建供应商',
    width: 800,
    okButtonProps: {
      loading: submitting,
    },
    okText: entity ? '更新' : '创建',
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
  const formProps: FormProps<SupplierFormData> = {
    form: form,
    layout: 'vertical',
    validateTrigger: 'onBlur',
    preserve: false,
    requiredMark: false,
    onFinish: async (formData) => {
      setSubmittingTrue();
      try {
        // 处理表单数据
        const submitData: SupplierFormData = {
          nickname: formData.nickname,
          contactPerson: formData.contactPerson,
          contactPhone: formData.contactPhone,
          companyName: formData.companyName,
          creditCode: formData.creditCode,
          bankName: formData.bankName,
          bankAccount: formData.bankAccount,
          bankAddress: formData.bankAddress,
          productionDays: formData.productionDays,
          deliveryDays: formData.deliveryDays,
          remark: formData.remark,
        };

        const res = await formSubmit(entity, submitData);
        if (get(res, 'data.code') === 0 || get(res, 'data.code') === 200) {
          message.success(entity ? '更新供应商成功' : '创建供应商成功');
          closeModal(true);
        } else {
          // 错误信息已由统一拦截器处理，这里只需要停止loading状态
          setSubmittingFalse();
        }
      } catch (error: any) {
        message.error(error.response?.data?.msg || '操作失败');
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
              name="nickname"
              label="供应商昵称"
              rules={[
                { required: true, message: '请输入供应商昵称' },
                { max: 50, message: '昵称长度不能超过50个字符' },
              ]}
            >
              <Input placeholder="请输入供应商昵称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="companyName"
              label="公司名称"
              rules={[
                { required: true, message: '请输入公司名称' },
                { max: 100, message: '公司名称长度不能超过100个字符' },
              ]}
            >
              <Input placeholder="请输入公司名称" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="contactPerson"
              label="联系人"
              rules={[
                { required: true, message: '请输入联系人' },
                { max: 50, message: '联系人长度不能超过50个字符' },
              ]}
            >
              <Input placeholder="请输入联系人" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contactPhone"
              label="联系电话"
              rules={[
                { required: true, message: '请输入联系电话' },
                {
                  pattern: /^1[3-9]\d{9}$/,
                  message: '请输入正确的手机号码',
                },
              ]}
            >
              <Input placeholder="请输入联系电话" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="creditCode"
              label="统一社会信用代码"
              rules={[{ len: 18, message: '统一社会信用代码必须为18位' }]}
            >
              <Input placeholder="请输入统一社会信用代码（可选）" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="bankName" label="开户银行">
              <Input placeholder="请输入开户银行（可选）" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="bankAccount" label="银行账号">
              <Input placeholder="请输入银行账号（可选）" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="bankAddress" label="开户地址">
              <Input placeholder="请输入开户地址（可选）" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="productionDays"
              label="生产周期(天)"
              rules={[{ required: true, message: '请输入生产周期' }]}
            >
              <InputNumber
                placeholder="请输入生产周期"
                min={1}
                max={365}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="deliveryDays"
              label="交货周期(天)"
              rules={[{ required: true, message: '请输入交货周期' }]}
            >
              <InputNumber
                placeholder="请输入交货周期"
                min={1}
                max={365}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="remark" label="备注">
              <Input.TextArea placeholder="请输入备注" rows={4} maxLength={500} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default SupplierFormModal;
