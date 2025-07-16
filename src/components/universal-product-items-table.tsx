'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Select,
  InputNumber,
  Popconfirm,
  Space,
  Typography,
  Card,
  Input,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { Text } = Typography;

// 产品选项类型
export interface ProductOption {
  id: string;
  code: string;
  sku: string;
  specification?: string;
  category?: {
    name: string;
  };
}

// 通用产品明细项类型
export interface UniversalProductItem {
  key?: string;
  productId: string;
  quantity: number;

  // 采购订单专用字段
  unitPrice?: number;
  amount?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount?: number;

  // 仓库任务专用字段
  completedQuantity?: number;

  // 通用字段
  remark?: string;
}

interface UniversalProductItemsTableProps {
  mode: 'purchase' | 'warehouse-packaging' | 'warehouse-shipping';
  items: UniversalProductItem[];
  onChange: (items: UniversalProductItem[]) => void;
  productsData: ProductOption[];
  disabled?: boolean;
}

const UniversalProductItemsTable: React.FC<UniversalProductItemsTableProps> = ({
  mode,
  items = [],
  onChange,
  productsData = [],
  disabled = false,
}) => {
  const [dataSource, setDataSource] = useState<UniversalProductItem[]>([]);
  const [editingKey, setEditingKey] = useState<string>('');

  // 同步外部items到内部状态
  useEffect(() => {
    const itemsWithKeys = items.map((item, index) => ({
      ...item,
      key: item.key || `item-${index}`,
    }));
    setDataSource(itemsWithKeys);
  }, [items]);

  // 更新外部状态
  const updateExternalState = (newItems: UniversalProductItem[]) => {
    const itemsWithoutKeys = newItems.map(({ key, ...item }) => item);
    onChange(itemsWithoutKeys);
  };

  // 添加新行
  const handleAdd = () => {
    const newKey = `new-${Date.now()}`;
    const newItem: UniversalProductItem = {
      key: newKey,
      productId: '',
      quantity: 1,
      remark: '',
    };

    // 根据模式初始化不同字段
    if (mode === 'purchase') {
      newItem.unitPrice = 0;
      newItem.amount = 0;
      newItem.taxRate = 13; // 默认税率13%
      newItem.taxAmount = 0;
      newItem.totalAmount = 0;
    } else if (mode === 'warehouse-packaging') {
      newItem.completedQuantity = 0;
    }

    const newData = [...dataSource, newItem];
    setDataSource(newData);
    setEditingKey(newKey);
  };

  // 删除行
  const handleDelete = (key: string) => {
    const newData = dataSource.filter((item) => item.key !== key);
    setDataSource(newData);
    updateExternalState(newData);
  };

  // 保存编辑
  const handleSave = (key: string) => {
    const item = dataSource.find((item) => item.key === key);
    if (!item || !item.productId) {
      return;
    }
    setEditingKey('');
    updateExternalState(dataSource);
  };

  // 取消编辑
  const handleCancel = () => {
    setEditingKey('');
  };

  // 更新行数据
  const updateItem = (key: string, field: string, value: any) => {
    setDataSource((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          const updated = { ...item, [field]: value };

          // 采购订单模式下自动计算金额
          if (mode === 'purchase' && ['quantity', 'unitPrice', 'taxRate'].includes(field)) {
            const quantity = field === 'quantity' ? value : updated.quantity || 0;
            const unitPrice = field === 'unitPrice' ? value : updated.unitPrice || 0;
            const taxRate = field === 'taxRate' ? value : updated.taxRate || 0;

            const amount = quantity * unitPrice;
            const taxAmount = amount * (taxRate / 100);
            const totalAmount = amount + taxAmount;

            updated.amount = Number(amount.toFixed(2));
            updated.taxAmount = Number(taxAmount.toFixed(2));
            updated.totalAmount = Number(totalAmount.toFixed(2));
          }

          return updated;
        }
        return item;
      })
    );
  };

  // 基础列
  const baseColumns: ColumnsType<UniversalProductItem> = [
    {
      title: '产品',
      dataIndex: 'productId',
      key: 'productId',
      width: 250,
      render: (value, record) => {
        const isEditing = editingKey === record.key;
        if (isEditing) {
          return (
            <Select
              value={value}
              onChange={(val) => updateItem(record.key!, 'productId', val)}
              style={{ width: '100%' }}
              placeholder="请选择产品"
              showSearch
              optionFilterProp="children"
              disabled={disabled}
            >
              {productsData.map((product) => (
                <Option key={product.id} value={product.id}>
                  <div>
                    <div>
                      {product.code} - {product.specification}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      SKU: {product.sku}
                      {product.category && ` | ${product.category.name}`}
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          );
        }

        const product = productsData.find((p) => p.id === value);
        return product ? (
          <div>
            <div>{product.code}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{product.specification}</div>
          </div>
        ) : (
          '-'
        );
      },
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (value, record) => {
        const isEditing = editingKey === record.key;
        if (isEditing) {
          return (
            <InputNumber
              value={value}
              onChange={(val) => updateItem(record.key!, 'quantity', val || 0)}
              min={0}
              style={{ width: '100%' }}
              disabled={disabled}
            />
          );
        }
        return value;
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      render: (value, record) => {
        const isEditing = editingKey === record.key;
        if (isEditing) {
          return (
            <Input
              value={value}
              onChange={(e) => updateItem(record.key!, 'remark', e.target.value)}
              placeholder="请输入备注"
              disabled={disabled}
            />
          );
        }
        return value || '-';
      },
    },
  ];

  // 采购订单专用列
  const purchaseColumns: ColumnsType<UniversalProductItem> =
    mode === 'purchase'
      ? [
          {
            title: '单价',
            dataIndex: 'unitPrice',
            key: 'unitPrice',
            width: 100,
            render: (value, record) => {
              const isEditing = editingKey === record.key;
              if (isEditing) {
                return (
                  <InputNumber
                    value={value}
                    onChange={(val) => updateItem(record.key!, 'unitPrice', val || 0)}
                    min={0}
                    precision={2}
                    style={{ width: '100%' }}
                    disabled={disabled}
                  />
                );
              }
              return value ? `¥${Number(value).toFixed(2)}` : '-';
            },
          },
          {
            title: '金额',
            dataIndex: 'amount',
            key: 'amount',
            width: 100,
            render: (value) => (value ? `¥${Number(value).toFixed(2)}` : '-'),
          },
          {
            title: '税率(%)',
            dataIndex: 'taxRate',
            key: 'taxRate',
            width: 100,
            render: (value, record) => {
              const isEditing = editingKey === record.key;
              if (isEditing) {
                return (
                  <InputNumber
                    value={value}
                    onChange={(val) => updateItem(record.key!, 'taxRate', val || 0)}
                    min={0}
                    max={100}
                    precision={2}
                    style={{ width: '100%' }}
                    disabled={disabled}
                  />
                );
              }
              return value ? `${value}%` : '-';
            },
          },
          {
            title: '税额',
            dataIndex: 'taxAmount',
            key: 'taxAmount',
            width: 100,
            render: (value) => (value ? `¥${Number(value).toFixed(2)}` : '-'),
          },
          {
            title: '含税总额',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: 120,
            render: (value) => (value ? `¥${Number(value).toFixed(2)}` : '-'),
          },
        ]
      : [];

  // 仓库包装任务专用列
  const packagingColumns: ColumnsType<UniversalProductItem> =
    mode === 'warehouse-packaging'
      ? [
          {
            title: '已完成数量',
            dataIndex: 'completedQuantity',
            key: 'completedQuantity',
            width: 120,
            render: (value, record) => {
              const isEditing = editingKey === record.key;
              if (isEditing) {
                return (
                  <InputNumber
                    value={value}
                    onChange={(val) => updateItem(record.key!, 'completedQuantity', val || 0)}
                    min={0}
                    max={record.quantity}
                    style={{ width: '100%' }}
                    disabled={disabled}
                  />
                );
              }
              return value ?? '-';
            },
          },
          {
            title: '完成率',
            key: 'completionRate',
            width: 100,
            render: (_, record) => {
              if (record.quantity && record.completedQuantity !== undefined) {
                const rate = (record.completedQuantity / record.quantity) * 100;
                return `${rate.toFixed(1)}%`;
              }
              return '-';
            },
          },
        ]
      : [];

  // 操作列
  const actionColumns: ColumnsType<UniversalProductItem> = disabled
    ? []
    : [
        {
          title: '操作',
          key: 'action',
          width: 150,
          render: (_, record) => {
            const isEditing = editingKey === record.key;
            if (isEditing) {
              return (
                <Space>
                  <Button type="link" size="small" onClick={() => handleSave(record.key!)}>
                    保存
                  </Button>
                  <Button type="link" size="small" onClick={handleCancel}>
                    取消
                  </Button>
                </Space>
              );
            }
            return (
              <Space>
                <Button type="link" size="small" onClick={() => setEditingKey(record.key!)}>
                  编辑
                </Button>
                <Popconfirm
                  title="确定要删除这个产品明细吗？"
                  onConfirm={() => handleDelete(record.key!)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            );
          },
        },
      ];

  const columns = [...baseColumns, ...purchaseColumns, ...packagingColumns, ...actionColumns];

  // 统计信息
  const getStatistics = () => {
    if (mode === 'purchase') {
      const totalAmount = dataSource.reduce((sum, item) => sum + (item.amount || 0), 0);
      const totalTaxAmount = dataSource.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
      const finalAmount = dataSource.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

      return (
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <Space direction="vertical" size={4}>
            <Text>合计金额: ¥{totalAmount.toFixed(2)}</Text>
            <Text>税额合计: ¥{totalTaxAmount.toFixed(2)}</Text>
            <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
              含税总额: ¥{finalAmount.toFixed(2)}
            </Text>
          </Space>
        </div>
      );
    }

    if (mode === 'warehouse-packaging') {
      const totalQuantity = dataSource.reduce((sum, item) => sum + item.quantity, 0);
      const totalCompleted = dataSource.reduce(
        (sum, item) => sum + (item.completedQuantity || 0),
        0
      );
      const completionRate = totalQuantity > 0 ? (totalCompleted / totalQuantity) * 100 : 0;

      return (
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <Space direction="vertical" size={4}>
            <Text>总数量: {totalQuantity}</Text>
            <Text>已完成: {totalCompleted}</Text>
            <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
              完成率: {completionRate.toFixed(1)}%
            </Text>
          </Space>
        </div>
      );
    }

    return null;
  };

  return (
    <Card title="产品明细" size="small">
      {!disabled && (
        <div style={{ marginBottom: 16 }}>
          <Button
            type="dashed"
            onClick={handleAdd}
            disabled={editingKey !== ''}
            icon={<PlusOutlined />}
          >
            添加产品明细
          </Button>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="key"
        pagination={false}
        scroll={{ x: 800 }}
        size="small"
      />

      {getStatistics()}
    </Card>
  );
};

export default UniversalProductItemsTable;
