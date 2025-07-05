import axios from './index';

/**
 * APIs
 */
// table list
export const roleListApi = (query: Record<string, any>) => {
  return axios<PageResType<RoleDataResult>>('/roles', {
    method: 'get',
    params: query,
  });
};

// delete role by id
export const deleteRoleByIdApi = (id: string) => {
  return axios<ResType<RoleDataResult>>(`/roles/${id}`, {
    method: 'delete',
  });
};

// create role
export const createRoleApi = (data: CreateRoleData) => {
  return axios<ResType<RoleDataResult>>('/roles', {
    method: 'post',
    data,
  });
};

// update role
export const updateRoleApi = (id: string, data: UpdateRoleData) => {
  return axios<ResType<RoleDataResult>>(`/roles/${id}`, {
    data,
    method: 'put',
  });
};

// query role by id
export const queryRoleByIdApi = (id: string) => {
  return axios<ResType<RoleDataResult>>(`/roles/${id}`, {
    method: 'get',
  });
};

// query role by name
export const queryRoleByNameApi = (name: string) => {
  return axios<ResType<RoleDataResult>>(`/roles/name/${name}`, {
    method: 'get',
  });
};

// get permissions list
export const getPermissionsApi = (type?: string) => {
  return axios<ResType<PermissionsResult>>('/permissions', {
    method: 'get',
    params: type ? { type } : {},
  });
};

/**
 * Types
 */
import type { PageResType, ResType } from '@/types/api';

// role item
export type RoleDataResult = {
  id: string;
  name: string;
  status: number;
  permissions: string[] | null;
  operator: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

// create role
export type CreateRoleData = {
  name: string;
  status: number;
  operator: string;
  permissions?: string[];
};

export type UpdateRoleData = {
  updated_at: string;
  permissions: string[] | null;
} & CreateRoleData;

// permissions result
export type PermissionsResult = {
  list: Permission[];
  grouped: Record<string, Permission[]>;
};

export type Permission = {
  code: string;
  name: string;
};
