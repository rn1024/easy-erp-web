'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Button,
  Select,
  InputNumber,
  Popconfirm,
  Space,
  Typography,
  Card,
  message,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { Text } = Typography;

// 产品明细项类型
export interface PurchaseOrderItem {
  key?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  amount: number; // 小计金额 (quantity * unitPrice)
  remark?: string;
}

// 批量更新接口
export interface RowUpdateData {
  [field: string]: any;
}

// 产品成本接口
export interface ProductCost {
  id: string;
  productId: string;
  costInfo?: string;
  price?: string;
  unit?: string;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
}

// 产品选项接口
export interface ProductOption {
  id: string;
  code?: string;
  name?: string;
  sku?: string;
  specification?: string;
  category?: {
    name: string;
  };
  costs?: ProductCost[]; // 产品成本数组
}

interface PurchaseOrderItemsTableProps {
  items: PurchaseOrderItem[];
  onChange: (items: PurchaseOrderItem[]) => void;
  productsData: ProductOption[];
  disabled?: boolean;
}

const PurchaseOrderItemsTable: React.FC<PurchaseOrderItemsTableProps> = ({
  items = [],
  onChange,
  productsData = [],
  disabled = false,
}) => {
  // 内部状态
  const [dataSource, setDataSource] = useState<PurchaseOrderItem[]>([]);
  const [editingKey, setEditingKey] = useState<string>('');

  // 同步外部数据
  useEffect(() => {
    const itemsWithKeys = items.map((item, index) => ({
      ...item,
      key: item.key || `item-${index}`,
    }));
    setDataSource(itemsWithKeys);
  }, [items]);

  // 生成唯一key
  const generateKey = () => `new-item-${Date.now()}-${Math.random()}`;

  // 计算单行金额
  const calculateRowAmounts = (quantity: number, unitPrice: number) => {
    const safeQuantity = Number(quantity) || 0;
    const safeUnitPrice = Number(unitPrice) || 0;
    const amount = safeQuantity * safeUnitPrice;

    return {
      amount: parseFloat(amount.toFixed(2)),
    };
  };

  // 更新数据源并触发父组件更新
  const updateDataSource = (newDataSource: PurchaseOrderItem[]) => {
    setDataSource(newDataSource);
    // 移除key字段后传递给父组件
    const itemsWithoutKey = newDataSource.map(({ key, ...item }) => item);
    onChange(itemsWithoutKey);
  };

  // 添加新行
  const handleAdd = () => {
    const newItem: PurchaseOrderItem = {
      key: generateKey(),
      productId: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      remark: '',
    };

    const newDataSource = [...dataSource, newItem];
    updateDataSource(newDataSource);
    setEditingKey(newItem.key!);
  };

  // 删除行
  const handleDelete = (key: string) => {
    const newDataSource = dataSource.filter((item) => item.key !== key);
    updateDataSource(newDataSource);
  };

  // 更新单行数据
  const handleRowChange = (key: string, field: string, value: any) => {
    const newDataSource = dataSource.map((item) => {
      if (item.key === key) {
        const updatedItem = { ...item, [field]: value };

        // 如果更新的是影响计算的字段，重新计算金额
        if (['quantity', 'unitPrice'].includes(field)) {
          const { amount } = calculateRowAmounts(
            field === 'quantity' ? Number(value) || 0 : Number(updatedItem.quantity) || 0,
            field === 'unitPrice' ? Number(value) || 0 : Number(updatedItem.unitPrice) || 0
          );

          updatedItem.amount = amount;
        }

        return updatedItem;
      }
      return item;
    });

    updateDataSource(newDataSource);
  };

  // 批量更新单行数据（解决竞态条件问题）
  const handleMultipleRowChange = useCallback(
    (key: string, updates: RowUpdateData) => {
      try {
        // 输入验证
        if (!key || typeof key !== 'string') {
          console.error('handleMultipleRowChange: 无效的 key 参数');
          return;
        }

        if (!updates || typeof updates !== 'object') {
          console.error('handleMultipleRowChange: 无效的 updates 参数');
          return;
        }

        // 查找目标行
        const targetIndex = dataSource.findIndex((item) => item.key === key);
        if (targetIndex === -1) {
          console.error(`handleMultipleRowChange: 未找到 key 为 ${key} 的行`);
          return;
        }

        const newDataSource = dataSource.map((item) => {
          if (item.key === key) {
            // 合并所有更新字段
            const updatedItem = { ...item, ...updates };

            // 数值字段验证和处理
            if ('quantity' in updates) {
              updatedItem.quantity = Math.max(0, Number(updatedItem.quantity) || 0);
            }
            if ('unitPrice' in updates) {
              updatedItem.unitPrice = Math.max(0, Number(updatedItem.unitPrice) || 0);
            }

            // 检查是否需要重新计算金额
            const hasQuantityOrPriceUpdate = ['quantity', 'unitPrice'].some(
              (field) => field in updates
            );
            if (hasQuantityOrPriceUpdate) {
              const { amount } = calculateRowAmounts(
                Number(updatedItem.quantity) || 0,
                Number(updatedItem.unitPrice) || 0
              );
              updatedItem.amount = amount;
            }

            return updatedItem;
          }
          return item;
        });

        updateDataSource(newDataSource);
      } catch (error) {
        console.error('handleMultipleRowChange 执行出错:', error);
        message.error('更新数据时发生错误，请重试');
      }
    },
    [dataSource, updateDataSource]
  );

  // 计算合计（使用 useMemo 优化性能）
  const summary = useMemo(
    () => ({
      totalQuantity: dataSource.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
      totalAmount: dataSource.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    }),
    [dataSource]
  );

  // 表格列定义
  const columns: ColumnsType<PurchaseOrderItem> = [
    {
      title: '序号',
      dataIndex: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: '产品名称',
      dataIndex: 'productId',
      width: 250,
      render: (value, record) => {
        if (disabled) {
          const product = productsData.find((p) => p.id === value);
          return product
            ? `${product.name || '无名称'} ${product.specification || '无规格'}`
            : value;
        }

        return (
          <Select
            value={value}
            placeholder={productsData.length > 0 ? '请选择产品' : '暂无产品数据'}
            style={{ width: '100%' }}
            showSearch
            optionFilterProp="children"
            disabled={disabled || productsData.length === 0}
            notFoundContent={
              productsData.length === 0 ? '暂无产品数据，请先添加产品' : '未找到匹配的产品'
            }
            onChange={(val) => {
              // 获取选中产品的成本价格
              const selectedProduct = productsData.find((p) => p.id === val);
              if (!selectedProduct) {
                message.error('选择的产品不存在，请重新选择');
                return;
              }

              const firstCost = selectedProduct?.costs?.[0];
              const unitPrice = firstCost?.price ? parseFloat(firstCost.price) : 0;

              // 使用批量更新避免竞态条件
              const updates: RowUpdateData = { productId: val };

              // 如果有成本价格，同时更新单价
              if (unitPrice > 0) {
                updates.unitPrice = unitPrice;
                message.success(`已自动填充单价：¥${unitPrice.toFixed(2)}`);
              } else {
                message.warning('该产品暂无成本价格，请手动输入单价');
              }

              // 一次性批量更新，避免竞态条件
              handleMultipleRowChange(record.key!, updates);
            }}
            filterOption={(input, option) => {
              const label = option?.label || option?.children;
              const searchText = typeof label === 'string' ? label : String(label);
              return searchText.toLowerCase().includes(input.toLowerCase());
            }}
          >
            {productsData.map((product) => (
              <Option key={product.id} value={product.id}>
                {product.name || '无名称'} {product.specification || '无规格'}
              </Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 120,
      render: (value, record) => {
        if (disabled) {
          return value;
        }

        return (
          <InputNumber
            value={value}
            min={1}
            precision={0}
            style={{ width: '100%' }}
            onChange={(val) => handleRowChange(record.key!, 'quantity', val || 1)}
          />
        );
      },
    },
    {
      title: '产品单价',
      dataIndex: 'unitPrice',
      width: 120,
      render: (value, record) => {
        if (disabled) {
          return `¥${(Number(value) || 0).toFixed(2)}`;
        }

        return (
          <InputNumber
            value={value}
            min={0}
            precision={2}
            style={{ width: '100%' }}
            prefix="¥"
            onChange={(val) => handleRowChange(record.key!, 'unitPrice', val || 0)}
          />
        );
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 120,
      align: 'right',
      render: (value) => <Text strong>¥{(Number(value) || 0).toFixed(2)}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record) => {
        if (disabled) {
          return null;
        }

        return (
          <Popconfirm
            title="确定删除这个产品吗？"
            onConfirm={() => handleDelete(record.key!)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div>
      <Card
        title="订单产品清单"
        size="small"
        extra={
          !disabled && (
            <Button type="dashed" icon={<PlusOutlined />} onClick={handleAdd}>
              添加产品
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          size="small"
          scroll={{ x: 1000 }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}>
                <Text strong>合计</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2}>
                <Text strong>{summary.totalQuantity}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} />
              <Table.Summary.Cell index={4}>
                <Text strong>¥{(Number(summary.totalAmount) || 0).toFixed(2)}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} />
            </Table.Summary.Row>
          )}
        />

        {/* 底部合计信息 */}
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space direction="vertical" size="small">
            <div>
              <Text>产品总数量：</Text>
              <Text strong>{summary.totalQuantity}</Text>
            </div>
            <div>
              <Text>总金额：</Text>
              <Text strong type="success" style={{ fontSize: 16 }}>
                ¥{(Number(summary.totalAmount) || 0).toFixed(2)}
              </Text>
            </div>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default PurchaseOrderItemsTable;
