import React from 'react';
import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { App, Button, Drawer, Form, Input, Space, Row, Col } from 'antd';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

/**
 * Services
 */
import {
  createForwarder,
  updateForwarder,
  type Forwarder,
  type ForwarderFormData,
} from '@/services/forwarders';
import type { ResType } from '@/types/api';

// form submit
const formSubmit = async (entity: Forwarder | null, formData: ForwarderFormData) => {
  // 区分是更新还是新增
  if (entity && entity.id) {
    return await updateForwarder(entity.id, formData);
  }
  return await createForwarder(formData);
};

/**
 * Types
 */
import type { DrawerProps, FormProps } from 'antd';
import type { IntlShape } from 'react-intl';

type Props = {
  open: boolean;
  entity: Forwarder | null;
  closeDrawer: (reload?: boolean) => void;
};

const ForwarderFormDrawer: React.FC<Props> = ({ open, entity, closeDrawer }) => {
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
                .then(async (formData: ForwarderFormData) => {
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
    title: entity ? '编辑货代' : '新建货代',
    width: 800,
    afterOpenChange: (open) => {
      if (!open) {
        setSubmittingFalse();
        form.resetFields();
      } else if (entity) {
        form.setFieldsValue({
          nickname: entity.nickname,
          contactPerson: entity.contactPerson,
          contactPhone: entity.contactPhone,
          companyName: entity.companyName,
          creditCode: entity.creditCode,
          bankName: entity.bankName,
          bankAccount: entity.bankAccount,
          bankAddress: entity.bankAddress,
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
    requiredMark: false,
  };

  return (
    <Drawer {...drawerProps}>
      <Form {...formProps}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="nickname"
              label="货代昵称"
              rules={[
                { required: true, message: '请输入货代昵称' },
                { max: 50, message: '昵称长度不能超过50个字符' },
              ]}
            >
              <Input placeholder="请输入货代昵称" />
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
                { max: 20, message: '联系人姓名长度不能超过20个字符' },
              ]}
            >
              <Input placeholder="请输入联系人姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contactPhone"
              label="联系电话"
              rules={[
                { required: true, message: '请输入联系电话' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' },
              ]}
            >
              <Input placeholder="请输入联系电话" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="creditCode"
          label="统一社会信用代码"
          rules={[
            { len: 18, message: '统一社会信用代码必须为18位' },
            {
              pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/,
              message: '请输入正确的统一社会信用代码',
            },
          ]}
        >
          <Input placeholder="请输入统一社会信用代码（可选）" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="bankName"
              label="开户银行"
              rules={[{ max: 50, message: '银行名称长度不能超过50个字符' }]}
            >
              <Input placeholder="请输入开户银行（可选）" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="bankAccount"
              label="银行账号"
              rules={[{ pattern: /^\d{10,30}$/, message: '银行账号应为10-30位数字' }]}
            >
              <Input placeholder="请输入银行账号（可选）" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="bankAddress"
          label="开户行地址"
          rules={[{ max: 200, message: '地址长度不能超过200个字符' }]}
        >
          <Input placeholder="请输入开户行地址（可选）" />
        </Form.Item>

        <Form.Item
          name="remark"
          label="备注"
          rules={[{ max: 500, message: '备注长度不能超过500个字符' }]}
        >
          <Input.TextArea rows={4} placeholder="请输入备注信息（可选）" />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default ForwarderFormDrawer;
