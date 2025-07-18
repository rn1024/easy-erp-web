import axios from './index';
import type { ResType } from '@/types/api';

/**
 * APIs
 */
// check group id
export const checkGroupId = (id: number | string) => {
  return axios<ResType<{ exists: boolean }>>(`/check/gid/${id}`, {
    method: 'get',
  });
};

// check post id
export const checkPostId = (id: number | string) => {
  return axios<ResType<{ exists: boolean }>>(`/check/pid/${id}`, {
    method: 'get',
  });
};

// check user id
export const checkUserId = (id: number | string) => {
  return axios<ResType<{ exists: boolean }>>(`/check/uid/${id}`, {
    method: 'get',
  });
};

// upload image
export const uploadImage = (data: UploadImageData) => {
  const formData = new FormData();
  formData.append('file', data.file);

  return axios<ResType<string[]>>('/oss/image', {
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    method: 'post',
  });
};

// 单文件上传（通用）
export const uploadFile = (file: File, type?: string) => {
  const formData = new FormData();
  formData.append('file', file);
  if (type) {
    formData.append('type', type);
  }

  return axios<ResType<{ fileUrl: string }>>('/upload', {
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    method: 'post',
  });
};

// 批量文件上传
export const uploadBatchFiles = (files: File[], type?: string) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  if (type) {
    formData.append('type', type);
  }

  return axios<ResType<Array<{ fileUrl: string; fileName: string }>>>('/upload/batch', {
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    method: 'post',
  });
};

// upload video
export const uploadVideo = (data: UploadVideoData) => {
  const formData = new FormData();
  formData.append('file', data.file);

  return axios<ResType<string[]>>('/oss/video', {
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    method: 'post',
  });
};

// get operators
export const gOperators = (model: string) => {
  return axios<ResType<string[]>>('/operators', {
    params: { model, page: 1, limit: 999 },
  });
};

/**
 * Types
 */

// upload image
export type UploadImageData = {
  file: File;
};

// upload video
export type UploadVideoData = UploadImageData;
