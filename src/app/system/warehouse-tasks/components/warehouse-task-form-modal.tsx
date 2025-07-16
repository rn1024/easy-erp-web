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

interface WarehouseTaskFormModalProps {
  visible: boolean;
  editingTask?: WarehouseTaskInfo | null;
  onCancel: () => void;
  onSuccess: () => void;
  onSubmit: (
    data: CreateWarehouseTaskData | UpdateWarehouseTaskData,
    items: UniversalProductItem[]
  ) => Promise<void>;
}

const WarehouseTaskFormModal: React.FC<WarehouseTaskFormModalProps> = ({
  visible,
  editingTask,
  onCancel,
  onSuccess,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [productItems, setProductItems] = useState<UniversalProductItem[]>([]);
  const [selectedTaskType, setSelectedTaskType] = useState<WarehouseTaskType | undefined>(
    undefined
  );

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
    setSelectedTaskType(undefined);
  };

  // 监听任务类型变化
  const handleTaskTypeChange = (type: WarehouseTaskType) => {
    setSelectedTaskType(type);
    // 清空产品明细，让用户重新选择
    setProductItems([]);
  };

  // 监听modal显示状态
  useEffect(() => {
    if (visible) {
      if (editingTask) {
        // 编辑模式
        form.setFieldsValue({
          shopId: editingTask.shopId,
          type: editingTask.type,
          progress: editingTask.progress,
        });
        setSelectedTaskType(editingTask.type);

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
          completedQuantity: item.completedQuantity || undefined,
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

      // 构造提交数据
      if (editingTask) {
        // 更新模式
        const updateData: UpdateWarehouseTaskData = {
          type: values.type,
          progress: values.type === 'PACKAGING' ? values.progress : undefined,
        };
        await onSubmit(updateData, productItems);
      } else {
        // 创建模式
        const createData: CreateWarehouseTaskData = {
          shopId: values.shopId,
          type: values.type,
          progress: values.type === 'PACKAGING' ? values.progress || 0 : undefined,
        };
        await onSubmit(createData, productItems);
      }

      message.success(editingTask ? '更新仓库任务成功' : '创建仓库任务成功');
      onSuccess();
    } catch (error: any) {
      console.error('提交失败:', error);
      message.error(error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取组件模式
  const getComponentMode = () => {
    if (!selectedTaskType) return 'warehouse-shipping';
    return selectedTaskType === 'PACKAGING' ? 'warehouse-packaging' : 'warehouse-shipping';
  };

  return (
    <Modal
      title={editingTask ? '编辑仓库任务' : '新建仓库任务'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={1000}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Row gutter={16}>
          <Col span={12}>
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

          <Col span={12}>
            <Form.Item
              label="任务类型"
              name="type"
              rules={[{ required: true, message: '请选择任务类型' }]}
            >
              <Select
                placeholder="请选择任务类型"
                onChange={handleTaskTypeChange}
                disabled={!!editingTask} // 编辑时不可修改类型
              >
                <Option value="PACKAGING">包装任务</Option>
                <Option value="SHIPPING">发货任务</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {selectedTaskType === 'PACKAGING' && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="当前进度 (%)"
                name="progress"
                rules={[
                  { required: true, message: '请输入进度' },
                  { type: 'number', min: 0, max: 100, message: '进度必须在0-100之间' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入当前进度"
                  min={0}
                  max={100}
                  precision={1}
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        {selectedTaskType && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Alert
                message={
                  selectedTaskType === 'PACKAGING'
                    ? '包装任务：支持进度追踪，可记录已完成数量和完成率'
                    : '发货任务：基础产品信息管理，无需进度追踪'
                }
                type="info"
                showIcon
              />
            </div>

            <UniversalProductItemsTable
              mode={getComponentMode()}
              items={productItems}
              onChange={setProductItems}
              productsData={productsOptions}
              disabled={false}
            />
          </>
        )}
      </Form>
    </Modal>
  );
};

export default WarehouseTaskFormModal;
