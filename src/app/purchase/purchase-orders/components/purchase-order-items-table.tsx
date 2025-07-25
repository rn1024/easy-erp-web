'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Select, InputNumber, Popconfirm, Space, Typography, Card } from 'antd';
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

// 产品选项类型
export interface ProductOption {
  id: string;
  code?: string;
  sku?: string;
  specification?: string;
  category?: {
    name: string;
  };
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
    const amount = quantity * unitPrice;

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
            field === 'quantity' ? value : updatedItem.quantity,
            field === 'unitPrice' ? value : updatedItem.unitPrice
          );

          updatedItem.amount = amount;
        }

        return updatedItem;
      }
      return item;
    });

    updateDataSource(newDataSource);
  };

  // 计算合计
  const summary = {
    totalQuantity: dataSource.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    totalAmount: dataSource.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
  };

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
            ? `${product.code || '无编码'} - ${product.specification || product.sku || '无SKU'}`
            : value;
        }

        return (
          <Select
            value={value}
            placeholder="请选择产品"
            style={{ width: '100%' }}
            showSearch
            optionFilterProp="children"
            onChange={(val) => handleRowChange(record.key!, 'productId', val)}
            filterOption={(input, option) => {
              const label = option?.label || option?.children;
              const searchText = typeof label === 'string' ? label : String(label);
              return searchText.toLowerCase().includes(input.toLowerCase());
            }}
          >
            {productsData.map((product) => (
              <Option key={product.id} value={product.id}>
                {product.code || '无编码'} - {product.specification || product.sku || '无SKU'}
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
          return `¥${value.toFixed(2)}`;
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
      render: (value) => <Text strong>¥{value.toFixed(2)}</Text>,
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
