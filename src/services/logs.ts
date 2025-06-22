import axios from './index';

/**
 * APIs
 */
// 获取日志列表
export function logs(params: LogsParams) {
  return axios<PageResType<LogsResponse>>('/v1/logs', {
    method: 'get',
    params,
  });
}

/**
 * Types
 */
import { PageResType } from '@/types/api';

// 获取日志列表
export type LogsParams = {
  category?: string;
  limit?: number | string;
  module?: string;
  operation_end?: string;
  operation_start?: string;
  operations?: string[];
  operator_account_id?: string;
  page?: number | string;
  status?: 'Failure' | 'Success';
};

export type LogsResponse = {
  body: { [key: string]: any };
  category: string;
  created_at: string;
  id: string;
  menu: string;
  method: string;
  module: string;
  operation: string;
  operator: string;
  operator_account_id: string;
  params: { [key: string]: any };
  path: string;
  protocol: string;
  query: { [key: string]: any };
  remote_address: string;
  remote_port: string;
  status: 'Failure' | 'Success';
  updated_at: string;
  url: string;
  deleted_at?: string | null;
  err_code?: number;
  err_msg?: string;
};
