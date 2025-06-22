import { NextRequest } from 'next/server';
import { ApiResponse, withAuth } from '@/lib/middleware';
import { OSSService } from '@/lib/oss';
import { redisService, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';

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
    maxSize: 20 * 1024 * 1024, // 20MB
    folder: 'documents',
  },
  avatar: {
    allowedTypes: ['image/jpeg', 'image/png'],
    maxSize: 5 * 1024 * 1024, // 5MB
    folder: 'avatars',
  },
};

// POST /api/v1/upload - 文件上传
async function uploadHandler(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'image';
    const currentUser = (request as any).user;

    if (!file) {
      return ApiResponse.validationError({ file: ['请选择要上传的文件'] }, '文件不能为空');
    }

    // 验证文件类型
    const config = FILE_CONFIG[type as keyof typeof FILE_CONFIG];
    if (!config) {
      return ApiResponse.validationError({ type: ['不支持的文件类型'] }, '文件类型错误');
    }

    // 验证MIME类型
    if (!config.allowedTypes.includes(file.type)) {
      return ApiResponse.validationError(
        { file: [`只支持 ${config.allowedTypes.join(', ')} 格式的文件`] },
        '文件格式不支持'
      );
    }

    // 验证文件大小
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / 1024 / 1024);
      return ApiResponse.validationError({ file: [`文件大小不能超过 ${maxSizeMB}MB`] }, '文件太大');
    }

    // 生成唯一文件名
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${config.folder}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;

    // 将文件转换为Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 上传到OSS
    const ossService = new OSSService();
    let uploadResult: any;

    try {
      switch (type) {
        case 'image':
        case 'avatar':
          uploadResult = await ossService.uploadImage(fileBuffer, file.name, file.type);
          break;
        case 'video':
          uploadResult = await ossService.uploadVideo(fileBuffer, file.name, file.type);
          break;
        case 'document':
          uploadResult = await ossService.uploadDocument(fileBuffer, file.name, file.type);
          break;
        default:
          uploadResult = await ossService.uploadBuffer(
            fileBuffer,
            file.name,
            file.type,
            config.folder
          );
      }
    } catch (error) {
      return ApiResponse.serverError(error instanceof Error ? error.message : '文件上传失败');
    }

    // 生成文件信息
    const fileInfo = {
      id: uuidv4(),
      originalName: file.name,
      fileName,
      filePath,
      fileUrl: uploadResult.url,
      fileSize: file.size,
      fileType: file.type,
      category: type,
      uploader: currentUser.username,
      uploaderId: currentUser.accountId,
      uploadTime: new Date().toISOString(),
    };

    // 缓存文件信息
    const cacheKey = CACHE_KEYS.UPLOAD_TEMP(fileInfo.id);
    await redisService.set(cacheKey, fileInfo, CACHE_TTL.UPLOAD_TEMP);

    return ApiResponse.success(fileInfo, '文件上传成功');
  } catch (error) {
    console.error('Upload error:', error);
    return ApiResponse.serverError('文件上传失败');
  }
}

// 上传参数接口
interface BatchUploadParams {
  type: string;
  files: File[];
}

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
        const ossService = new OSSService();
        let uploadResult: any;

        try {
          switch (type) {
            case 'image':
            case 'avatar':
              uploadResult = await ossService.uploadImage(fileBuffer, file.name, file.type);
              break;
            case 'video':
              uploadResult = await ossService.uploadVideo(fileBuffer, file.name, file.type);
              break;
            case 'document':
              uploadResult = await ossService.uploadDocument(fileBuffer, file.name, file.type);
              break;
            default:
              uploadResult = await ossService.uploadBuffer(
                fileBuffer,
                file.name,
                file.type,
                config.folder
              );
          }
        } catch (uploadError) {
          throw new Error(uploadError instanceof Error ? uploadError.message : '上传失败');
        }

        // 生成文件信息
        const fileInfo = {
          id: uuidv4(),
          originalName: file.name,
          fileName,
          filePath,
          fileUrl: uploadResult.url,
          fileSize: file.size,
          fileType: file.type,
          category: type,
          uploader: currentUser.username,
          uploaderId: currentUser.accountId,
          uploadTime: new Date().toISOString(),
          index,
        };

        // 缓存文件信息
        const cacheKey = CACHE_KEYS.UPLOAD_TEMP(fileInfo.id);
        await redisService.set(cacheKey, fileInfo, CACHE_TTL.UPLOAD_TEMP);

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
      {
        successful: uploadResults,
        failed: errors,
        total: files.length,
        successCount: uploadResults.length,
        failCount: errors.length,
      },
      `批量上传完成：成功 ${uploadResults.length} 个，失败 ${errors.length} 个`
    );
  } catch (error) {
    console.error('Batch upload error:', error);
    return ApiResponse.serverError('批量上传失败');
  }
}

// GET /api/v1/upload/[id] - 获取上传文件信息
async function getUploadInfoHandler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const fileId = pathSegments[pathSegments.length - 1];

    if (!fileId) {
      return ApiResponse.validationError({ id: ['文件ID不能为空'] }, '参数错误');
    }

    // 从缓存获取文件信息
    const cacheKey = CACHE_KEYS.UPLOAD_TEMP(fileId);
    const fileInfo = await redisService.get(cacheKey);

    if (!fileInfo) {
      return ApiResponse.notFound('文件信息不存在或已过期');
    }

    return ApiResponse.success(fileInfo, '获取文件信息成功');
  } catch (error) {
    console.error('Get upload info error:', error);
    return ApiResponse.serverError('获取文件信息失败');
  }
}

// 根据路径分发不同的处理器
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  if (url.pathname.endsWith('/batch')) {
    return withAuth(batchUploadHandler)(request);
  }
  return withAuth(uploadHandler)(request);
}

export const GET = withAuth(getUploadInfoHandler);
