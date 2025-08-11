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
    maxSize: 20 * 1024 * 1024, // 20MB
    folder: 'documents',
  },
  avatar: {
    allowedTypes: ['image/jpeg', 'image/png'],
    maxSize: 5 * 1024 * 1024, // 5MB
    folder: 'avatars',
  },
  // 前端需要的文件类型
  accessory: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    folder: 'accessories',
  },
  label: {
    allowedTypes: [
      'application/pdf',
      'application/x-rar-compressed',
      'application/vnd.rar',
      'application/rar',
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    folder: 'labels',
  },
  shipment: {
    allowedTypes: [
      'application/pdf',
      'application/x-rar-compressed',
      'application/zip',
      'application/x-zip-compressed',
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    folder: 'shipments',
  },
};

// 确保上传目录存在
const ensureUploadDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// 本地文件上传函数
const uploadToLocal = async (fileBuffer: Buffer, filePath: string): Promise<string> => {
  const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);
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
  return `/uploads/${filePath}`;
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

    // 上传到本地
    let fileUrl: string;
    try {
      fileUrl = await uploadToLocal(fileBuffer, filePath);
    } catch (error) {
      console.error('Local upload error:', error);
      return ApiResponse.serverError('文件保存失败');
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
    };

    return ApiResponse.success(fileInfo, '文件上传成功');
  } catch (error) {
    console.error('Upload error:', error);
    return ApiResponse.serverError('文件上传失败');
  }
}



// GET /api/v1/upload/[id] - 简化版文件信息获取
async function getUploadInfoHandler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const fileId = pathSegments[pathSegments.length - 1];

    if (!fileId) {
      return ApiResponse.validationError({ id: ['文件ID不能为空'] }, '参数错误');
    }

    // 简化实现：直接返回错误，因为我们移除了缓存
    return ApiResponse.notFound('文件信息不存在或已过期');
  } catch (error) {
    console.error('Get upload info error:', error);
    return ApiResponse.serverError('获取文件信息失败');
  }
}

export const POST = withAuth(uploadHandler);

export const GET = withAuth(getUploadInfoHandler);
