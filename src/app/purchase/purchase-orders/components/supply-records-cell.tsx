'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Tooltip, Spin } from 'antd';
import { getSupplyRecordsApi } from '../../../../services/supply';
import type { SupplyRecord, SupplyStatistics } from '../../../../services/supply';

// API响应类型定义
interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

// 缓存接口定义
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface SupplyRecordsResponse {
  statistics: SupplyStatistics;
  records: SupplyRecord[];
  orderInfo: {
    id: string;
    orderNumber: string;
    totalAmount: string;
    status: string;
  };
}

// 缓存管理类
class SupplyRecordsCache {
  private cache = new Map<string, CacheItem<SupplyRecordsResponse>>();
  private readonly TTL = 5 * 60 * 1000; // 5分钟缓存
  
  set(key: string, data: SupplyRecordsResponse): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.TTL
    });
  }
  
  get(key: string): SupplyRecordsResponse | null {
    const item = this.cache.get(key);
    if (!item || this.isExpired(key)) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }
  
  isExpired(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return true;
    return Date.now() - item.timestamp > item.ttl;
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// 全局缓存实例
const supplyRecordsCache = new SupplyRecordsCache();

// 请求去重管理类
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();
  
  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }
    
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }
}

// 全局请求去重实例
const requestDeduplicator = new RequestDeduplicator();

// Hook: 供货记录数据管理
interface UseSupplyRecordsResult {
  data: SupplyRecordsResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const useSupplyRecords = (purchaseOrderId: string): UseSupplyRecordsResult => {
  const [data, setData] = useState<SupplyRecordsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchData = useCallback(async () => {
    // 缓存检查
    const cached = supplyRecordsCache.get(purchaseOrderId);
    if (cached && !supplyRecordsCache.isExpired(purchaseOrderId)) {
      setData(cached);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await requestDeduplicator.dedupe(
        `supply-records-${purchaseOrderId}`,
        () => getSupplyRecordsApi(purchaseOrderId)
      );
      
      // axios响应结构: response.data包含实际的API响应
      const apiResponse = response.data as ApiResponse<SupplyRecordsResponse>;
      
      if (apiResponse.code === 0) {
        setData(apiResponse.data);
        supplyRecordsCache.set(purchaseOrderId, apiResponse.data);
      } else {
        throw new Error(apiResponse.msg || '获取供货记录失败');
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error(`Supply Records API Error [${purchaseOrderId}]:`, error);
    } finally {
      setLoading(false);
    }
  }, [purchaseOrderId]);
  
  useEffect(() => {
    if (purchaseOrderId) {
      fetchData();
    }
  }, [fetchData, purchaseOrderId]);
  
  return { data, loading, error, refetch: fetchData };
};

// 组件属性接口
interface SupplyRecordsCellProps {
  purchaseOrderId: string;
  fallbackCount?: number;
  onClick?: (records: SupplyRecord[], statistics: SupplyStatistics) => void;
}

// 供货记录单元格组件
const SupplyRecordsCell: React.FC<SupplyRecordsCellProps> = ({
  purchaseOrderId,
  fallbackCount = 0,
  onClick
}) => {
  const { data, loading, error } = useSupplyRecords(purchaseOrderId);
  
  const handleClick = () => {
    if (data && onClick) {
      onClick(data.records, data.statistics);
    }
  };
  
  // 显示的记录数量
  const displayCount = data?.statistics.totalRecords ?? fallbackCount;
  
  // 加载状态
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="small" />
        <span style={{ marginLeft: 4, color: '#666' }}>加载中...</span>
      </div>
    );
  }
  
  // 错误状态
  if (error) {
    return (
      <Tooltip title={`加载失败: ${error.message}`}>
        <Button
          type="link"
          size="small"
          danger
          style={{ padding: 0 }}
          onClick={() => {
            // 错误状态下点击重试
            window.location.reload();
          }}
        >
          <span style={{ color: '#ff4d4f' }}>加载失败</span>
        </Button>
      </Tooltip>
    );
  }
  
  // 正常状态
  return (
    <Button
      type="link"
      size="small"
      onClick={handleClick}
      style={{ padding: 0 }}
      disabled={!data}
    >
      <span style={{ color: data ? '#1890ff' : '#999' }}>
        共{displayCount}条
      </span>
    </Button>
  );
};

// 导出缓存管理函数，供外部使用
export const preloadSupplyRecords = (purchaseOrderIds: string[]): void => {
  purchaseOrderIds.forEach(id => {
    if (!supplyRecordsCache.get(id)) {
      // 异步预加载，不阻塞主流程
      getSupplyRecordsApi(id)
        .then((response: any) => {
          const apiResponse = response.data;
          if (apiResponse.code === 0) {
            supplyRecordsCache.set(id, apiResponse.data);
          }
        })
        .catch(() => {}); // 静默失败
    }
  });
};

export const clearSupplyRecordsCache = (): void => {
  supplyRecordsCache.clear();
};

export default SupplyRecordsCell;