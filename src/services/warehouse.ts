import axios from './index';

// 仓库任务状态枚举
export enum WarehouseTaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// 仓库任务类型枚举
export enum WarehouseTaskType {
  PACKAGING = 'PACKAGING',
}

// 仓库任务状态选项
export const warehouseTaskStatusOptions = [
  { label: '待处理', value: WarehouseTaskStatus.PENDING, color: 'orange' },
  { label: '进行中', value: WarehouseTaskStatus.IN_PROGRESS, color: 'blue' },
  { label: '已完成', value: WarehouseTaskStatus.COMPLETED, color: 'green' },
  { label: '已取消', value: WarehouseTaskStatus.CANCELLED, color: 'red' },
];

// 仓库任务类型选项
export const warehouseTaskTypeOptions = [
  { label: '包装', value: WarehouseTaskType.PACKAGING, color: 'purple' },
];

// 获取状态标签配置
export const getWarehouseTaskStatusLabel = (status: string) => {
  return (
    warehouseTaskStatusOptions.find((option) => option.value === status) || {
      label: status,
      value: status,
      color: 'default',
    }
  );
};

// 获取类型标签配置
export const getWarehouseTaskTypeLabel = (type: string) => {
  return (
    warehouseTaskTypeOptions.find((option) => option.value === type) || {
      label: type,
      value: type,
      color: 'default',
    }
  );
};

// 仓库任务信息接口
export interface WarehouseTaskInfo {
  id: string;
  shopId: string;
  progress?: number; // 包装任务才有进度，发货任务为null
  status: WarehouseTaskStatus;
  type: WarehouseTaskType;
  operatorId: string;
  createdAt: string;
  updatedAt: string;

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

// 创建仓库任务数据接口
export interface CreateWarehouseTaskData {
  shopId: string;
  type: WarehouseTaskType;
  progress?: number; // 包装任务才有进度，发货任务为null
}

// 更新仓库任务数据接口
export interface UpdateWarehouseTaskData {
  progress?: number;
  status?: WarehouseTaskStatus;
  type?: WarehouseTaskType;
}

// 仓库任务查询参数接口
export interface WarehouseTaskQueryParams {
  shopId?: string;
  status?: WarehouseTaskStatus;
  type?: WarehouseTaskType;
  page?: number;
  pageSize?: number;
}

// 获取仓库任务列表
export const getWarehouseTasksApi = (params: WarehouseTaskQueryParams = {}) => {
  return axios<{
    list: WarehouseTaskInfo[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>('/warehouse-tasks', {
    method: 'get',
    params,
  });
};

// 获取仓库任务详情
export const getWarehouseTaskApi = (id: string) => {
  return axios<WarehouseTaskInfo>(`/warehouse-tasks/${id}`, {
    method: 'get',
  });
};

// 创建仓库任务
export const createWarehouseTaskApi = (data: CreateWarehouseTaskData) => {
  return axios<WarehouseTaskInfo>('/warehouse-tasks', {
    method: 'post',
    data,
  });
};

// 更新仓库任务
export const updateWarehouseTaskApi = (id: string, data: UpdateWarehouseTaskData) => {
  return axios<WarehouseTaskInfo>(`/warehouse-tasks/${id}`, {
    method: 'put',
    data,
  });
};

// 删除仓库任务
export const deleteWarehouseTaskApi = (id: string) => {
  return axios<{ message: string }>(`/warehouse-tasks/${id}`, {
    method: 'delete',
  });
};
