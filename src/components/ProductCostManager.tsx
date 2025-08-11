'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Typography,
  Popconfirm,
  Input,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface ProductCost {
  id: string;
  costInfo?: string; // 成本信息（文本输入）
  price?: string; // 价格（文本输入）
  unit?: string; // 单位（文本输入）
  supplier?: string; // 供应商（文本输入）
}

interface ProductCostManagerProps {
  productId: string;
  costs?: ProductCost[];
  onCostsChange?: (costs: ProductCost[]) => void;
  readonly?: boolean;
}

const ProductCostManager: React.FC<ProductCostManagerProps> = ({
  productId,
  costs = [],
  onCostsChange,
  readonly = false,
}) => {
  const [costList, setCostList] = useState<ProductCost[]>(costs);

  useEffect(() => {
    setCostList(costs);
  }, [costs]);

  // 生成唯一key
  const generateKey = () => `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 准备表格数据源
  const dataSource = costList.map((cost, index) => ({
    ...cost,
    key: cost.id || generateKey(),
    index: index + 1,
  }));

  // 处理行数据变更
  const handleRowChange = (key: string, field: keyof ProductCost, value: any) => {
    const newCosts = costList.map((cost, index) => {
      const currentKey = cost.id || generateKey();
      if (currentKey === key || index === dataSource.findIndex(item => item.key === key)) {
        return { ...cost, [field]: value };
      }
      return cost;
    });
    setCostList(newCosts);
    onCostsChange?.(newCosts);
  };

  // 添加新行
  const handleAdd = () => {
    const newCost: ProductCost = {
      id: generateKey(),
      costInfo: '',
      price: '',
      unit: '',
      supplier: '',
    };
    const newCosts = [...costList, newCost];
    setCostList(newCosts);
    onCostsChange?.(newCosts);
  };

  // 删除行
  const handleDelete = (key: string) => {
    const newCosts = costList.filter((_, index) => {
      const currentKey = dataSource[index]?.key;
      return currentKey !== key;
    });
    setCostList(newCosts);
    onCostsChange?.(newCosts);
  };



  // 表格列定义
  const columns = [
    {
      title: '序号',
      dataIndex: 'index',
      width: 60,
      align: 'center' as const,
    },
    {
      title: '成本信息',
      dataIndex: 'costInfo',
      width: 200,
      render: (value: string, record: any) => {
        if (readonly) {
          return <Text>{value}</Text>;
        }

        return (
          <Input
            value={value}
            placeholder="请输入成本信息"
            style={{ width: '100%' }}
            onChange={(e) => handleRowChange(record.key, 'costInfo', e.target.value)}
          />
        );
      },
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 120,
      render: (value: string, record: any) => {
        if (readonly) {
          return <Text>{value}</Text>;
        }

        return (
          <Input
            value={value}
            placeholder="请输入价格"
            style={{ width: '100%' }}
            onChange={(e) => handleRowChange(record.key, 'price', e.target.value)}
          />
        );
      },
    },
    {
      title: '单位',
      dataIndex: 'unit',
      width: 100,
      render: (value: string, record: any) => {
        if (readonly) {
          return <Text>{value}</Text>;
        }

        return (
          <Input
            value={value}
            placeholder="请输入单位"
            style={{ width: '100%' }}
            onChange={(e) => handleRowChange(record.key, 'unit', e.target.value)}
          />
        );
      },
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      width: 150,
      render: (value: string, record: any) => {
        if (readonly) {
          return <Text>{value}</Text>;
        }

        return (
          <Input
            value={value}
            placeholder="请输入供应商"
            style={{ width: '100%' }}
            onChange={(e) => handleRowChange(record.key, 'supplier', e.target.value)}
          />
        );
      },
    },

    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'center' as const,
      render: (_: any, record: any) => {
        if (readonly) {
          return <Text type="secondary">-</Text>;
        }

        return (
          <Popconfirm
            title="确定删除这个成本项吗？"
            onConfirm={() => handleDelete(record.key)}
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
    <div className="product-cost-manager">
      <Card
        title="产品成本明细"
        size="small"
        extra={
          !readonly && (
            <Button type="dashed" icon={<PlusOutlined />} onClick={handleAdd}>
              添加成本项
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default ProductCostManager;