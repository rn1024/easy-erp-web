// 基础响应类型
export type ResType<T> = {
  code: number;
  msg: string;
  data: T;
};

// 分页响应元数据
export interface PageMeta {
  currentPage: number;
  perPage: number;
  total: number;
  totalPages: number;
}

// 通用分页响应类型
export type PageResType<T> = {
  code: number;
  msg: string;
  data: {
    list: T[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
};

// 错误响应类型
export interface ErrorResponse {
  code: number;
  msg: string;
  data?: any;
  errors?: Record<string, string[]>;
}

// 基础请求参数类型
export interface BaseParams {
  page?: number;
  limit?: number;
}

// 时间范围查询参数
export interface DateRangeParams {
  created_start?: string;
  created_end?: string;
}

// 排序参数
export interface SortParams {
  [key: string]: 'asc' | 'desc';
}

// API 状态码常量
export const API_CODE = {
  SUCCESS: 0,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500,
} as const;

// HTTP 状态码类型
export type ApiCode = (typeof API_CODE)[keyof typeof API_CODE];

// 导出记录状态
export enum ExportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// 导出任务响应
export interface ExportTaskResponse {
  task_id: string;
  status: ExportStatus;
}

// 角色类型
export interface Role {
  id: string;
  name: string;
  status: number;
  permissions: string[];
  operator: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// 账户类型 (替代User类型)
export interface Account {
  id: string;
  name: string;
  status: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  roles?: Role[];
}

// 为了兼容性保留User类型，映射到Account
export type User = Account;
