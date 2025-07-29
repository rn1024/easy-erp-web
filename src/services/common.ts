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

// upload image (OSS)
export const uploadImage = (data: UploadImageData) => {
  const formData = new FormData();
  formData.append('file', data.file);
  if (data.category) {
    formData.append('category', data.category);
  }

  return axios<ResType<any>>('/api/v1/oss/image', {
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

  return axios<ResType<{ fileUrl: string }>>('/api/v1/upload', {
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

  return axios<ResType<Array<{ fileUrl: string; fileName: string }>>>('/api/v1/upload/batch', {
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    method: 'post',
  });
};

// upload video (OSS)
export const uploadVideo = (data: UploadVideoData) => {
  const formData = new FormData();
  formData.append('file', data.file);
  if (data.category) {
    formData.append('category', data.category);
  }
  if (data.description) {
    formData.append('description', data.description);
  }

  return axios<ResType<any>>('/api/v1/oss/video', {
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
  category?: string;
};

// upload video
export type UploadVideoData = {
  file: File;
  category?: string;
  description?: string;
};
