'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, message, Row, Col, InputNumber, Alert } from 'antd';
import { useRequest } from 'ahooks';
import type { PackagingTaskInfo } from '@/services/packaging';
import {
  CreatePackagingTaskData,
  UpdatePackagingTaskData,
  PackagingTaskType,
  getPackagingTaskApi,
} from '@/services/packaging';
import { getShops } from '@/services/shops';
import { getProductsApi } from '@/services/products';
import UniversalProductItemsTable, {
  type UniversalProductItem,
  type ProductOption,
} from '@/components/universal-product-items-table';

const { Option } = Select;

interface PackagingTaskFormModalProps {
  visible: boolean;
  editingTask?: PackagingTaskInfo | null;
  onCancel: () => void;
  onSuccess: () => void;
  onSubmit: (
    data: CreatePackagingTaskData | UpdatePackagingTaskData,
    items: UniversalProductItem[]
  ) => Promise<void>;
}

const PackagingTaskFormModal: React.FC<PackagingTaskFormModalProps> = ({
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
      name: product.name,
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
          progress: editingTask.progress || 0,
        });

        // 加载产品明细
        loadProductItems(editingTask.id);
      } else {
        // 新增模式
        resetForm();
        // 设置默认进度为0
        form.setFieldsValue({ progress: 0 });
      }
    } else {
      resetForm();
    }
  }, [visible, editingTask]);

  // 加载产品明细 - 现在从包装任务数据中获取
  const loadProductItems = async (taskId: string) => {
    try {
      // 从包装任务详情中获取产品明细
      const response = await getPackagingTaskApi(taskId);
      if (response?.data?.items) {
        const items: UniversalProductItem[] = response.data.items.map(
          (item: any, index: number) => ({
            key: `${item.productId}-${index}`,
            productId: item.productId,
            quantity: item.quantity,
            completedQuantity: item.completedQuantity || undefined,
            remark: item.remark,
          })
        );
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

      // 构造提交数据 - 固定为包装任务
      if (editingTask) {
        // 更新模式
        const updateData: UpdatePackagingTaskData = {
          type: 'PACKAGING' as PackagingTaskType,
          progress: values.progress,
        };
        await onSubmit(updateData, productItems);
      } else {
        // 创建模式
        const createData: CreatePackagingTaskData = {
          shopId: values.shopId,
          type: 'PACKAGING' as PackagingTaskType,
          progress: values.progress || 0,
        };
        await onSubmit(createData, productItems);
      }

      message.success(editingTask ? '更新包装任务成功' : '创建包装任务成功');
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
      title={editingTask ? '编辑包装任务' : '新建包装任务'}
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
              label="包装进度 (%)"
              name="progress"
              rules={[
                { required: true, message: '请输入进度' },
                { type: 'number', min: 0, max: 100, message: '进度必须在0-100之间' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入当前包装进度"
                min={0}
                max={100}
                precision={1}
              />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ marginBottom: 16 }}>
          <Alert
            message="包装任务支持进度追踪，可记录已完成数量和完成率。当所有产品的完成数量达到目标数量时，任务将自动标记为已完成。"
            type="info"
            showIcon
          />
        </div>

        <UniversalProductItemsTable
          mode="warehouse-packaging"
          items={productItems}
          onChange={setProductItems}
          productsData={productsOptions}
          disabled={false}
        />
      </Form>
    </Modal>
  );
};

export default PackagingTaskFormModal;
