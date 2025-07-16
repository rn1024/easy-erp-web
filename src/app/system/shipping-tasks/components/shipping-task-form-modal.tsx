'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Row,
  Col,
  InputNumber,
  Switch,
  Alert,
} from 'antd';
import { useRequest } from 'ahooks';
import type {
  WarehouseTaskInfo,
  CreateWarehouseTaskData,
  UpdateWarehouseTaskData,
  WarehouseTaskType,
} from '@/services/warehouse';
import { getShops } from '@/services/shops';
import { getProductsApi } from '@/services/products';
import {
  getProductItemsApi,
  type ProductItemInfo,
  ProductItemRelatedType,
} from '@/services/product-items';
import UniversalProductItemsTable, {
  type UniversalProductItem,
  type ProductOption,
} from '@/components/universal-product-items-table';

const { Option } = Select;

interface ShippingTaskFormModalProps {
  visible: boolean;
  editingTask?: WarehouseTaskInfo | null;
  onCancel: () => void;
  onSuccess: () => void;
  onSubmit: (
    data: CreateWarehouseTaskData | UpdateWarehouseTaskData,
    items: UniversalProductItem[]
  ) => Promise<void>;
}

const ShippingTaskFormModal: React.FC<ShippingTaskFormModalProps> = ({
  visible,
  editingTask,
  onCancel,
  onSuccess,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [productItems, setProductItems] = useState<UniversalProductItem[]>([]);

  // 获取店铺数据
  const { data: shopsData } = useRequest(() => getShops({}));

  // 获取产品数据
  const { data: productsData } = useRequest(() => getProductsApi());

  const shops = shopsData?.data?.data?.list || [];
  const productsOptions: ProductOption[] = (productsData?.data?.data?.list || []).map(
    (product) => ({
      id: product.id,
      code: product.code,
      sku: product.sku,
      specification: product.specification,
      category: product.category,
    })
  );

  // 重置表单
  const resetForm = () => {
    form.resetFields();
    setProductItems([]);
  };

  // 监听modal显示状态
  useEffect(() => {
    if (visible) {
      if (editingTask) {
        // 编辑模式
        form.setFieldsValue({
          shopId: editingTask.shopId,
        });

        // 加载产品明细
        loadProductItems(editingTask.id);
      } else {
        // 新增模式
        resetForm();
      }
    } else {
      resetForm();
    }
  }, [visible, editingTask]);

  // 加载产品明细
  const loadProductItems = async (taskId: string) => {
    try {
      const response = await getProductItemsApi(ProductItemRelatedType.WAREHOUSE_TASK, taskId);
      if (response?.data) {
        const items: UniversalProductItem[] = response.data.map((item: ProductItemInfo) => ({
          key: item.id,
          productId: item.productId,
          quantity: item.quantity,
          completedQuantity: undefined, // 发货任务不需要完成数量
          remark: item.remark,
        }));
        setProductItems(items);
      }
    } catch (error) {
      console.error('加载产品明细失败:', error);
      // 不显示错误消息，继续使用空数组
      setProductItems([]);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      setLoading(true);

      // 验证基本表单
      const values = await form.validateFields();

      // 验证产品明细
      if (productItems.length === 0) {
        message.error('请至少添加一个产品明细');
        return;
      }

      // 构造提交数据 - 固定为发货任务
      if (editingTask) {
        // 更新模式
        const updateData: UpdateWarehouseTaskData = {
          type: 'SHIPPING' as WarehouseTaskType,
          progress: undefined, // 发货任务不需要进度
        };
        await onSubmit(updateData, productItems);
      } else {
        // 创建模式
        const createData: CreateWarehouseTaskData = {
          shopId: values.shopId,
          type: 'SHIPPING' as WarehouseTaskType,
          progress: undefined, // 发货任务不需要进度
        };
        await onSubmit(createData, productItems);
      }

      message.success(editingTask ? '更新发货任务成功' : '创建发货任务成功');
      onSuccess();
    } catch (error: any) {
      console.error('提交失败:', error);
      message.error(error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={editingTask ? '编辑发货任务' : '新建发货任务'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={1000}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="店铺"
              name="shopId"
              rules={[{ required: true, message: '请选择店铺' }]}
            >
              <Select
                placeholder="请选择店铺"
                showSearch
                optionFilterProp="children"
                disabled={!!editingTask} // 编辑时不可修改店铺
              >
                {shops.map((shop) => (
                  <Option key={shop.id} value={shop.id}>
                    {shop.nickname}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <div style={{ marginBottom: 16 }}>
          <Alert
            message="发货任务专注于基础产品信息管理，无需进度追踪。适用于产品出库、物流配送等发货流程管理。"
            type="info"
            showIcon
          />
        </div>

        <UniversalProductItemsTable
          mode="warehouse-shipping"
          items={productItems}
          onChange={setProductItems}
          productsData={productsOptions}
          disabled={false}
        />
      </Form>
    </Modal>
  );
};

export default ShippingTaskFormModal;
