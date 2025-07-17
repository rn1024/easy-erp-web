import axios from './index';

/**
 * APIs
 */
// 获取导出列表
export function exports(params: ExportParams) {
  return axios<PageResType<ExportResponse>>('/export/records', {
    method: 'get',
    params,
  });
}

/**
 * Types
 */
import { PageResType } from '@/types/api';

// 获取导出列表
export type ExportParams = {
  operator_account_id?: string;
  create_start?: string;
  create_end?: string;
  page?: number | string;
  limit?: number | string;
  order_by?: string;
  order_sort?: 'asc' | 'desc';
};

export type ExportResponse = {
  operator_account?: {
    id: string;
    name: string;
  };
  detail: Record<string, unknown>;
  download_url?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
};
