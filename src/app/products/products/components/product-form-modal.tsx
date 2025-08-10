import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import {
  App,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  InputNumber,
  Upload,
} from 'antd';
import { useEffect, useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import ProductImageUploader from '@/components/product-image-uploader';
import AccessoryImageUploader from '@/components/accessory-image-uploader';

/**
 * APIs
 */
import { createProductApi, updateProductApi, getProductCategoriesApi, uploadProductImagesApi } from '@/services/products';
import { getShops } from '@/services/shops';
import { uploadFile } from '@/services/common';

/**
 * Types
 */
import type { ModalProps, FormProps } from 'antd';
import type { ProductInfo, ProductFormData, ProductCategory } from '@/services/products';
import type { Shop } from '@/services/shops';

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
  categoriesList?: ProductCategory[];
};

const ProductFormModal: React.FC<Props> = ({ open, entity, closeModal, categoriesList }) => {
  /**
   * Hooks
   */
  const { message } = App.useApp();

  /**
   * State
   */
  const [submitting, { setFalse: setSubmittingFalse, setTrue: setSubmittingTrue }] =
    useBoolean(false);
  const [form] = Form.useForm();
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  
  // 使用传入的categoriesList或空数组
  const categories = categoriesList || [];

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
        packageWeight: formData.packageWeight ? parseFloat(formData.packageWeight) : undefined,
        setQuantity: formData.setQuantity || 1,
      };

      const res = await formSubmit(entity, submitData);
      if (get(res, 'data.code') === 0 || get(res, 'data.code') === 200) {
        // 如果是新增产品且有临时图片，需要将图片关联到新创建的产品
        if (!entity && res.data.data?.id) {
          const newProductId = res.data.data.id;
          const productImages = formData.productImages || [];
          const accessoryImages = formData.accessoryImages || [];
          
          // 保存产品图片
          if (productImages.length > 0) {
            const tempImages = productImages.filter((img: any) => img.id?.startsWith('temp-'));
            if (tempImages.length > 0) {
              try {
                const imageData = tempImages.map((img: any) => ({
                  imageUrl: img.imageUrl,
                  fileName: img.fileName,
                  fileSize: img.fileSize,
                  sortOrder: img.sortOrder,
                  isCover: img.isCover,
                }));
                await uploadProductImagesApi(newProductId, imageData);
              } catch (imageError) {
                console.error('保存产品图片失败:', imageError);
                // 不阻止产品创建成功的提示
              }
            }
          }
          
          // 配件图片已经通过uploadBatchFiles上传，不需要额外处理
        }
        
        message.success(entity ? '更新成功' : '创建成功');
        setSubmittingFalse();
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
   * Data Loading
   */
  const fetchShops = async () => {
    try {
      setShopsLoading(true);
      const response = await getShops({ pageSize: 1000 });
      if (response.data?.code === 0) {
        setShops(response.data.data.list);
      }
    } catch (error) {
      console.error('获取店铺列表失败:', error);
    } finally {
      setShopsLoading(false);
    }
  };

  // fetchCategories函数已移除，现在使用传入的categoriesList

  /**
   * Effects
   */
  useEffect(() => {
    if (open) {
      // 获取店铺数据
      fetchShops();
    } else {
      setSubmittingFalse();
      form.resetFields();
    }
  }, [open]);

  // 单独处理表单数据回填，确保在数据加载完成后执行
  useEffect(() => {
    if (open && entity) {
      // 等待店铺数据加载完成后再回填
      if (!shopsLoading && shops.length > 0) {
        form.setFieldsValue({
          ...entity,
          shopId: entity.shop?.id,
          categoryId: entity.category?.id,
          weight: entity.weight?.toString(),
          packageWeight: entity.packageWeight?.toString(),
          // 回填产品图片和配件图片
          productImages: entity.images || [],
          accessoryImages: entity.accessoryImages || [],
        });
      }
    } else if (open && !entity) {
      // 新增模式：重置表单
      form.resetFields();
    }
  }, [open, entity, form, shopsLoading, shops.length, categories.length]);

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
                <Select 
                  placeholder="选择店铺"
                  loading={shopsLoading}
                  showSearch
                  filterOption={(input, option) =>
                     (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                   }
                >
                  {shops.map(shop => (
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
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select 
                  placeholder="选择分类"
                  showSearch
                  filterOption={(input, option) => {
                    const label = option?.label || option?.children;
                    return String(label).toLowerCase().includes(input.toLowerCase());
                  }}
                >
                  {categories.map(category => (
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
              <Form.Item name="name" label="产品名称">
                <Input placeholder="产品名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sku" label="SKU">
                <Input placeholder="SKU" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="asin" label="ASIN">
                <Input placeholder="Amazon ASIN" maxLength={20} />
              </Form.Item>
            </Col>
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
          </Row>

          <Row gutter={16}>
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
            <Col span={8}>
              <Form.Item name="packageType" label="包装类型">
                <Select placeholder="选择包装类型">
                  <Option value="box">盒装</Option>
                  <Option value="bag">袋装</Option>
                  <Option value="bottle">瓶装</Option>
                  <Option value="tube">管装</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="packageOuterSize" label="包装外尺寸">
                <Input placeholder="包装外尺寸" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="packageInnerSize" label="包装内尺寸">
                <Input placeholder="包装内尺寸" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="packageWeight" label="包装重量(g)">
                <InputNumber min={0} placeholder="包装重量" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="outerBoxSize" label="外箱尺寸">
                <Input placeholder="外箱尺寸" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="labelFileUrl" label="标签文件">
                <Upload
                  customRequest={async (options) => {
                    const { file, onSuccess, onError } = options;
                    try {
                      const response = await uploadFile(file as File, 'label');
                      if (response.data.code === 0 || response.data.code === 200) {
                        form.setFieldsValue({
                          labelFileUrl: response.data.data.fileUrl
                        });
                        onSuccess?.(response.data.data);
                        message.success('标签文件上传成功');
                      } else {
                        throw new Error(response.data.msg || '上传失败');
                      }
                    } catch (error: any) {
                      onError?.(error);
                      message.error(error.message || '标签文件上传失败');
                    }
                  }}
                  beforeUpload={(file) => {
                    const isPDF = file.type === 'application/pdf';
                    const isRAR = file.type === 'application/x-rar-compressed' || file.name.toLowerCase().endsWith('.rar');
                    
                    if (!isPDF && !isRAR) {
                      message.error('只能上传 PDF 或 RAR 文件!');
                      return false;
                    }
                    
                    const isLt50M = file.size / 1024 / 1024 < 50;
                    if (!isLt50M) {
                      message.error('文件大小不能超过 50MB!');
                      return false;
                    }
                    
                    return true;
                  }}
                  accept=".pdf,.rar"
                  listType="text"
                  maxCount={1}
                  showUploadList={true}
                >
                  <Button icon={<UploadOutlined />}>上传标签文件</Button>
                </Upload>
                <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                  支持 PDF、RAR 格式，单个文件不超过 50MB
                </div>
              </Form.Item>
            </Col>
          </Row>

          {/* 产品图片上传 */}
          <Form.Item name="productImages" label="产品图片">
            <ProductImageUploader
              productId={entity?.id || ''}
              disabled={false}
              maxCount={10}
            />
          </Form.Item>

          {/* 配件图片上传 */}
          <Form.Item name="accessoryImages" label="配件图片">
            <AccessoryImageUploader
              productId={entity?.id || ''}
              disabled={false}
              maxCount={20}
            />
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
