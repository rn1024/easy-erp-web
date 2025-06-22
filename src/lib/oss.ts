import OSS from 'ali-oss';
import { v4 as uuidv4 } from 'uuid';

// OSS配置接口
interface OSSConfig {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  endpoint: string;
  pathPrefix: string;
}

// 获取OSS配置
const getOSSConfig = (): OSSConfig => ({
  region: process.env.OSS_REGION || 'oss-cn-hangzhou',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
  bucket: process.env.OSS_BUCKET || 'ecoagri-x',
  endpoint: process.env.OSS_ENDPOINT || 'CMS.oss-cn-hangzhou.aliyuncs.com',
  pathPrefix: process.env.OSS_PATH_PREFIX || 'template',
});

// OSS客户端实例
let ossClient: OSS | null = null;

// 获取OSS客户端实例
const getOSSClient = (): OSS => {
  if (!ossClient) {
    const config = getOSSConfig();
    ossClient = new OSS({
      region: config.region,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      bucket: config.bucket,
    });
  }
  return ossClient;
};

// 文件上传结果接口
export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// OSS服务类
export class OSSService {
  private client: OSS;
  private config: OSSConfig;

  constructor() {
    this.config = getOSSConfig();
    this.client = getOSSClient();
  }

  // 生成唯一文件名
  private generateFileName(originalName: string): string {
    const ext = originalName.split('.').pop() || '';
    const timestamp = Date.now();
    const uuid = uuidv4().replace(/-/g, '');
    return `${timestamp}_${uuid}.${ext}`;
  }

  // 生成文件路径
  private generateFilePath(filename: string, folder?: string): string {
    const basePath = this.config.pathPrefix;
    if (folder) {
      return `${basePath}/${folder}/${filename}`;
    }
    return `${basePath}/${filename}`;
  }

  // 获取文件完整URL
  private getFileUrl(path: string): string {
    return `https://${this.config.endpoint}/${path}`;
  }

  // 上传文件（Buffer）
  async uploadBuffer(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder?: string
  ): Promise<UploadResult> {
    try {
      const filename = this.generateFileName(originalName);
      const filepath = this.generateFilePath(filename, folder);

      const result = await this.client.put(filepath, buffer, {
        headers: {
          'Content-Type': mimeType,
        },
      });

      return {
        url: this.getFileUrl(filepath),
        filename: filename,
        size: buffer.length,
        mimeType: mimeType,
      };
    } catch (error) {
      console.error('OSS upload error:', error);
      throw new Error('File upload failed');
    }
  }

  // 上传图片
  async uploadImage(buffer: Buffer, originalName: string, mimeType: string): Promise<UploadResult> {
    // 验证图片类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
      throw new Error('Invalid image type. Only JPEG, PNG, GIF and WebP are allowed.');
    }

    // 验证文件大小（5MB限制）
    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }

    return this.uploadBuffer(buffer, originalName, mimeType, 'images');
  }

  // 上传视频
  async uploadVideo(buffer: Buffer, originalName: string, mimeType: string): Promise<UploadResult> {
    // 验证视频类型
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
    if (!allowedTypes.includes(mimeType)) {
      throw new Error('Invalid video type. Only MP4, AVI, MOV and WMV are allowed.');
    }

    // 验证文件大小（100MB限制）
    if (buffer.length > 100 * 1024 * 1024) {
      throw new Error('File size too large. Maximum size is 100MB.');
    }

    return this.uploadBuffer(buffer, originalName, mimeType, 'videos');
  }

  // 上传文档
  async uploadDocument(
    buffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<UploadResult> {
    // 验证文档类型
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];
    if (!allowedTypes.includes(mimeType)) {
      throw new Error('Invalid document type.');
    }

    // 验证文件大小（10MB限制）
    if (buffer.length > 10 * 1024 * 1024) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }

    return this.uploadBuffer(buffer, originalName, mimeType, 'documents');
  }

  // 删除文件
  async deleteFile(filepath: string): Promise<void> {
    try {
      await this.client.delete(filepath);
    } catch (error) {
      console.error('OSS delete error:', error);
      throw new Error('File deletion failed');
    }
  }

  // 检查文件是否存在
  async fileExists(filepath: string): Promise<boolean> {
    try {
      await this.client.head(filepath);
      return true;
    } catch (error) {
      return false;
    }
  }

  // 获取文件信息
  async getFileInfo(filepath: string): Promise<{
    size: number;
    lastModified: Date;
    contentType: string;
  } | null> {
    try {
      const result = await this.client.head(filepath);
      return {
        size: parseInt((result.res.headers as any)['content-length'] || '0'),
        lastModified: new Date((result.res.headers as any)['last-modified'] || ''),
        contentType: (result.res.headers as any)['content-type'] || '',
      };
    } catch (error) {
      return null;
    }
  }

  // 生成临时访问URL（用于私有文件）
  async generateSignedUrl(filepath: string, expiresInSeconds: number = 3600): Promise<string> {
    try {
      return await this.client.signatureUrl(filepath, {
        expires: expiresInSeconds,
      });
    } catch (error) {
      console.error('OSS signed URL error:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  // 批量上传文件
  async uploadMultiple(
    files: Array<{
      buffer: Buffer;
      originalName: string;
      mimeType: string;
      folder?: string;
    }>
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) =>
      this.uploadBuffer(file.buffer, file.originalName, file.mimeType, file.folder)
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Batch upload error:', error);
      throw new Error('Batch upload failed');
    }
  }
}

// 导出OSS服务单例
export const ossService = new OSSService();

// 文件类型检测工具
export class FileTypeHelper {
  // 根据文件扩展名获取MIME类型
  static getMimeTypeFromExtension(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop() || '';
    const mimeTypes: Record<string, string> = {
      // 图片
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      // 视频
      mp4: 'video/mp4',
      avi: 'video/avi',
      mov: 'video/mov',
      wmv: 'video/wmv',
      // 文档
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // 检查是否为图片文件
  static isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  // 检查是否为视频文件
  static isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/');
  }

  // 检查是否为文档文件
  static isDocument(mimeType: string): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];
    return documentTypes.includes(mimeType);
  }

  // 格式化文件大小
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
