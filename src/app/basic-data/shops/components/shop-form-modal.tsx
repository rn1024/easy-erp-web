import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { Form, Input, message, Modal, ModalProps, Upload, Image } from 'antd';
import { useEffect, useState } from 'react';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

/**
 * APIs
 */
import { uploadFile } from '@/services/common';
import { createShop, updateShop, type Shop, type ShopFormData } from '@/services/shops';

/**
 * Types
 */
import type { IntlShape } from 'react-intl';
import type { FormProps } from 'antd';
import type { UploadFile, UploadProps } from 'antd';

// 检查图片比例是否为1:1
const checkImageRatio = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const ratio = img.width / img.height;
        // 允许小幅度误差
        resolve(Math.abs(ratio - 1) < 0.01);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// 自定义上传函数
const customUpload = async (file: File): Promise<string> => {
  try {
    const response = await uploadFile(file, 'avatar');

    if (response.data.code === 0 || response.data.code === 200) {
      return response.data.data.fileUrl;
    } else {
      throw new Error(response.data.msg || '上传失败');
    }
  } catch (error: any) {
    throw new Error(error.message || '上传失败');
  }
};

// form submit
const formSubmit = async (entity: Shop | null, formData: ShopFormData) => {
  // 区分是更新还是新增
  if (entity && entity.id) {
    return await updateShop(entity.id.toString(), formData);
  }
  return await createShop(formData);
};

type Props = {
  open: boolean;
  entity: Shop | null;
  closeModal: (reload?: boolean) => void;
};

const ShopFormModal: React.FC<Props> = ({ open, entity, closeModal }) => {
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
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  /**
   * Effects
   */
  useEffect(() => {
    if (open) {
      if (entity) {
        form.setFieldsValue({
          nickname: entity.nickname,
          avatarUrl: entity.avatarUrl,
          responsiblePerson: entity.responsiblePerson,
          remark: entity.remark,
        });
        // 确保图片URL正确设置
        setImageUrl(entity.avatarUrl || '');
      } else {
        form.resetFields();
        setImageUrl('');
      }
    } else {
      // 模态框关闭时重置状态
      setImageUrl('');
    }
  }, [open, entity, form]);

  // 监听表单字段变化，确保图片URL同步
  useEffect(() => {
    const avatarUrl = form.getFieldValue('avatarUrl');
    if (avatarUrl && avatarUrl !== imageUrl) {
      setImageUrl(avatarUrl);
    }
  }, [form, imageUrl]);

  /**
   * Upload props
   */
  const uploadProps: UploadProps = {
    name: 'file',
    listType: 'picture-card',
    className: 'avatar-uploader',
    showUploadList: false,
    beforeUpload: async (file) => {
      // 检查文件类型
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件!');
        return false;
      }

      // 检查文件大小（400KB）
      const isLt400K = file.size / 1024 < 400;
      if (!isLt400K) {
        message.error('图片大小不能超过400KB!');
        return false;
      }

      // 检查图片比例
      const isSquare = await checkImageRatio(file);
      if (!isSquare) {
        message.error('请上传1:1比例的正方形图片!');
        return false;
      }

      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setUploading(true);
        const url = await customUpload(file as File);
        setImageUrl(url);
        form.setFieldValue('avatarUrl', url);
        onSuccess?.(url);
        message.success('图片上传成功!');
      } catch (error: any) {
        onError?.(error);
        message.error(error.message || '图片上传失败!');
      } finally {
        setUploading(false);
      }
    },
  };

  const uploadButton = (
    <div>
      {uploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>上传头像</div>
    </div>
  );

  /**
   * ModalProps
   */
  const modalProps: ModalProps = {
    open: open,
    title: entity ? '编辑店铺' : '新建店铺',
    width: 600,
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
      setImageUrl('');
    },
  };

  /**
   * FormProps
   */
  const formProps: FormProps<ShopFormData> = {
    form: form,
    layout: 'vertical',
    validateTrigger: 'onBlur',
    preserve: false,
    onFinish: async (formData) => {
      setSubmittingTrue();
      try {
        const res = await formSubmit(entity, formData);
        if (get(res, 'data.code') === 0 || get(res, 'data.code') === 200) {
          message.success(entity ? '店铺更新成功' : '店铺创建成功');
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

  return (
    <Modal {...modalProps}>
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
          extra="请上传1:1比例的正方形图片，大小不超过400KB"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Upload {...uploadProps}>
              {imageUrl ? (
                <div style={{ width: 102, height: 102, position: 'relative' }}>
                  <Image
                    src={imageUrl}
                    alt="avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    preview={false}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.3s',
                      cursor: 'pointer',
                    }}
                    className="upload-overlay"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0';
                    }}
                  >
                    <span style={{ color: 'white', fontSize: 12 }}>重新上传</span>
                  </div>
                </div>
              ) : (
                uploadButton
              )}
            </Upload>
            {imageUrl && (
              <div style={{ flex: 1, color: '#666', fontSize: 12 }}>
                <div>✓ 图片已上传</div>
                <div>比例: 1:1 正方形</div>
                <div>大小: {'<'} 400KB</div>
              </div>
            )}
          </div>
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
    </Modal>
  );
};

export default ShopFormModal;
