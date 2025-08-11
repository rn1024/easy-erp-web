// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { ApiResponse, withAuth } from '@/lib/middleware';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// 文件类型配置
const FILE_CONFIG = {
  image: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    folder: 'images',
  },
  video: {
    allowedTypes: ['video/mp4', 'video/webm', 'video/mov'],
    maxSize: 100 * 1024 * 1024, // 100MB
    folder: 'videos',
  },
  document: {
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    folder: 'documents',
  },
  avatar: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    folder: 'avatars',
  },
  shipment: {
    allowedTypes: [
      'application/pdf',
      'application/vnd.rar',
      'application/x-rar-compressed',
      'application/zip',
      'application/x-zip-compressed',
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    folder: 'shipments',
  },
  accessory: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    folder: 'accessories',
  },
};

// 获取正确的上传根目录
const getUploadRoot = () => {
  // 统一使用项目根目录，无论开发环境还是生产环境
  return process.cwd();
};

// 确保上传目录存在
const ensureUploadDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// 本地文件上传函数
const uploadToLocal = async (fileBuffer: Buffer, filePath: string): Promise<string> => {
  const uploadRoot = getUploadRoot();
  const fullPath = path.join(uploadRoot, 'upload', filePath);
  const dir = path.dirname(fullPath);

  // 确保目录存在
  ensureUploadDir(dir);

  // 写入文件
  await fs.promises.writeFile(fullPath, fileBuffer);

  // 仅在生产环境执行权限修复
  if (process.env.NODE_ENV === 'production') {
    try {
      fs.chmodSync(fullPath, 0o644); // 文件权限
      fs.chmodSync(dir, 0o755); // 目录权限
    } catch (error) {
      console.warn('权限设置失败:', error);
    }
  }

  // 返回访问URL
  return `/upload/${filePath}`;
};

// POST /api/v1/upload/batch - 批量文件上传
async function batchUploadHandler(request: NextRequest) {
  try {
    const formData = await request.formData();
    const type = (formData.get('type') as string) || 'image';
    const currentUser = (request as any).user;

    // 获取所有文件
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('files') && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return ApiResponse.validationError({ files: ['请选择要上传的文件'] }, '文件不能为空');
    }

    // 限制批量上传数量
    if (files.length > 10) {
      return ApiResponse.validationError({ files: ['单次最多上传10个文件'] }, '文件数量超限');
    }

    // 验证文件类型配置
    const config = FILE_CONFIG[type as keyof typeof FILE_CONFIG];
    if (!config) {
      return ApiResponse.validationError({ type: ['不支持的文件类型'] }, '文件类型错误');
    }

    const uploadResults: any[] = [];
    const errors: any[] = [];

    // 并行上传文件
    const uploadPromises = files.map(async (file, index) => {
      try {
        // 验证单个文件
        if (!config.allowedTypes.includes(file.type)) {
          throw new Error(`文件 ${file.name} 格式不支持`);
        }

        if (file.size > config.maxSize) {
          const maxSizeMB = Math.round(config.maxSize / 1024 / 1024);
          throw new Error(`文件 ${file.name} 大小超过 ${maxSizeMB}MB`);
        }

        // 生成文件信息
        const fileExtension = file.name.split('.').pop() || '';
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `${config.folder}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;

        // 上传文件
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        let fileUrl: string;

        try {
          fileUrl = await uploadToLocal(fileBuffer, filePath);
        } catch (uploadError) {
          throw new Error(uploadError instanceof Error ? uploadError.message : '上传失败');
        }

        // 生成文件信息
        const fileInfo = {
          id: uuidv4(),
          originalName: file.name,
          fileName,
          filePath,
          fileUrl,
          fileSize: file.size,
          fileType: file.type,
          category: type,
          uploader: currentUser?.username || 'unknown',
          uploaderId: currentUser?.accountId || 'unknown',
          uploadTime: new Date().toISOString(),
          index,
        };

        return { success: true, data: fileInfo };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '上传失败',
          fileName: file.name,
          index,
        };
      }
    });

    const results = await Promise.allSettled(uploadPromises);

    // 分离成功和失败的结果
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          uploadResults.push(result.value.data);
        } else {
          errors.push({
            error: result.value.error,
            fileName: result.value.fileName,
            index: result.value.index,
          });
        }
      } else {
        errors.push({
          error: result.reason?.message || '上传失败',
          fileName: files[index].name,
          index,
        });
      }
    });

    return ApiResponse.success(
      uploadResults,
      `批量上传完成：成功 ${uploadResults.length} 个，失败 ${errors.length} 个`
    );
  } catch (error) {
    console.error('Batch upload error:', error);
    return ApiResponse.serverError('批量上传失败');
  }
}

export const POST = withAuth(batchUploadHandler);