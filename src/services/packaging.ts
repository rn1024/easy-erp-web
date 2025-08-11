import axios from './index';
import type { ResType, PageResType } from '@/types/api';

// 包装任务状态枚举
export enum PackagingTaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// 包装任务类型枚举
export enum PackagingTaskType {
  PACKAGING = 'PACKAGING',
}

// 包装任务状态选项
export const packagingTaskStatusOptions = [
  { label: '待处理', value: PackagingTaskStatus.PENDING, color: 'orange' },
  { label: '进行中', value: PackagingTaskStatus.IN_PROGRESS, color: 'blue' },
  { label: '已完成', value: PackagingTaskStatus.COMPLETED, color: 'green' },
  { label: '已取消', value: PackagingTaskStatus.CANCELLED, color: 'red' },
];

// 包装任务类型选项
export const packagingTaskTypeOptions = [
  { label: '包装', value: PackagingTaskType.PACKAGING, color: 'purple' },
];

// 获取状态标签配置
export const getPackagingTaskStatusLabel = (status: string) => {
  return (
    packagingTaskStatusOptions.find((option) => option.value === status) || {
      label: status,
      value: status,
      color: 'default',
    }
  );
};

// 获取类型标签配置
export const getPackagingTaskTypeLabel = (type: string) => {
  return (
    packagingTaskTypeOptions.find((option) => option.value === type) || {
      label: type,
      value: type,
      color: 'default',
    }
  );
};

// 包装任务信息接口
export interface PackagingTaskInfo {
  id: string;
  shopId: string;
  progress?: number;
  status: PackagingTaskStatus;
  type: PackagingTaskType;
  operatorId: string;
  createdAt: string;
  updatedAt: string;

  // 产品明细
  items?: {
    productId: string;
    quantity: number;
    completedQuantity?: number;
    remark?: string;
  }[];

  // 关联数据
  shop?: {
    id: string;
    nickname: string;
  };
  operator?: {
    id: string;
    name: string;
  };
}

// 创建包装任务数据接口
export interface CreatePackagingTaskData {
  shopId: string;
  type: PackagingTaskType;
  progress?: number;
  items?: {
    productId: string;
    quantity: number;
    completedQuantity?: number;
    remark?: string;
  }[];
}

// 更新包装任务数据接口
export interface UpdatePackagingTaskData {
  progress?: number;
  status?: PackagingTaskStatus;
  type?: PackagingTaskType;
  items?: {
    productId: string;
    quantity: number;
    completedQuantity?: number;
    remark?: string;
  }[];
}

// 包装任务查询参数接口
export interface PackagingTaskQueryParams {
  shopId?: string;
  status?: PackagingTaskStatus;
  type?: PackagingTaskType;
  page?: number;
  pageSize?: number;
}

// 包装任务查询参数接口别名
export type PackagingTasksParams = PackagingTaskQueryParams;

// 获取包装任务列表
export const getPackagingTasksApi = (params: PackagingTasksParams = {}) => {
  return axios<PageResType<PackagingTaskInfo>>('/packaging-tasks', {
    method: 'get',
    params,
  });
};

// 获取包装任务详情
export const getPackagingTaskApi = (id: string) => {
  return axios<PackagingTaskInfo>(`/packaging-tasks/${id}`, {
    method: 'get',
  });
};

// 创建包装任务
export const createPackagingTaskApi = (data: CreatePackagingTaskData) => {
  return axios<PackagingTaskInfo>('/packaging-tasks', {
    method: 'post',
    data,
  });
};

// 更新包装任务
export const updatePackagingTaskApi = (id: string, data: UpdatePackagingTaskData) => {
  return axios<PackagingTaskInfo>(`/packaging-tasks/${id}`, {
    method: 'put',
    data,
  });
};

// 删除包装任务
export const deletePackagingTaskApi = (id: string) => {
  return axios<{ message: string }>(`/packaging-tasks/${id}`, {
    method: 'delete',
  });
};
