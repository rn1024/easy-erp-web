import React from 'react';
import { Select } from 'antd';
import { useRequest } from 'ahooks';
import { gOperators } from '@/services/common';

const { Option } = Select;

type OperatorProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  showSearch?: boolean;
  style?: React.CSSProperties;
  model: string;
};

const ComponentSearchFormSelectOperator: React.FC<OperatorProps> = ({
  value,
  onChange,
  placeholder = '请选择操作人',
  allowClear = true,
  showSearch = true,
  style,
  model,
}) => {
  const {
    data: operatorData,
    loading,
    error,
  } = useRequest(() => gOperators(model), {
    cacheKey: `operators-${model}`,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });

  const operators = (operatorData?.data || []) as string[];

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      allowClear={allowClear}
      showSearch={showSearch}
      style={style}
      loading={loading}
      filterOption={(input, option) =>
        (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
      }
    >
      {operators.map((operator: string) => (
        <Option key={operator} value={operator}>
          {operator}
        </Option>
      ))}
    </Select>
  );
};

export default ComponentSearchFormSelectOperator;
