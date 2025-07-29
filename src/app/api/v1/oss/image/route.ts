// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// OSS配置（实际项目中应该从环境变量读取）
const OSS_CONFIG = {
  // 这里可以配置阿里云OSS、腾讯云COS等云存储服务
  // 暂时使用本地存储模拟OSS功能
  endpoint: process.env.OSS_ENDPOINT || 'local',
  bucket: process.env.OSS_BUCKET || 'erp-images',
  region: process.env.OSS_REGION || 'local',
};

// 模拟OSS上传函数
const uploadToOSS = async (file: File, fileName: string): Promise<string> => {
  // 实际项目中这里应该调用OSS SDK上传文件
  // 这里返回模拟的OSS URL
  const ossUrl = `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.endpoint}/images/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;
  
  // 模拟上传延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return ossUrl;
};

// POST /api/v1/oss/image - OSS图片上传
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = (formData.get('category') as string) || 'general';

    if (!file) {
      return NextResponse.json({ code: 400, msg: '请选择要上传的图片' }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { code: 400, msg: '只支持 JPEG、PNG、GIF、WebP 格式的图片' },
        { status: 400 }
      );
    }

    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { code: 400, msg: '图片大小不能超过 10MB' },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${fileExtension}`;

    try {
      // 上传到OSS
      const ossUrl = await uploadToOSS(file, fileName);

      // 生成文件信息
      const fileInfo = {
        id: uuidv4(),
        originalName: file.name,
        fileName,
        fileUrl: ossUrl,
        fileSize: file.size,
        fileType: file.type,
        category,
        uploader: user.name,
        uploaderId: user.id,
        uploadTime: new Date().toISOString(),
        storage: 'oss',
      };

      return NextResponse.json({
        code: 200,
        msg: '图片上传成功',
        data: fileInfo,
      });
    } catch (uploadError) {
      console.error('OSS上传失败:', uploadError);
      return NextResponse.json(
        { code: 500, msg: 'OSS上传失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('OSS图片上传失败:', error);
    return NextResponse.json(
      {
        code: 500,
        msg: '服务器内部错误',
        data: null,
      },
      { status: 500 }
    );
  }
}

// GET /api/v1/oss/image - 获取OSS图片列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');

    // 模拟OSS图片列表数据
    const mockImages = [
      {
        id: '1',
        originalName: 'product1.jpg',
        fileName: 'uuid1.jpg',
        fileUrl: `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.endpoint}/images/2024/1/uuid1.jpg`,
        fileSize: 1024000,
        fileType: 'image/jpeg',
        category: 'product',
        uploader: user.name,
        uploadTime: new Date().toISOString(),
      },
      {
        id: '2',
        originalName: 'avatar.png',
        fileName: 'uuid2.png',
        fileUrl: `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.endpoint}/images/2024/1/uuid2.png`,
        fileSize: 512000,
        fileType: 'image/png',
        category: 'avatar',
        uploader: user.name,
        uploadTime: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    // 应用筛选条件
    let filteredImages = mockImages;
    if (category) {
      filteredImages = filteredImages.filter(img => img.category === category);
    }

    const total = filteredImages.length;
    const skip = (page - 1) * limit;
    const paginatedImages = filteredImages.slice(skip, skip + limit);

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: {
        list: paginatedImages,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取OSS图片列表失败:', error);
    return NextResponse.json(
      {
        code: 500,
        msg: '服务器内部错误',
        data: null,
      },
      { status: 500 }
    );
  }
}