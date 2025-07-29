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
  bucket: process.env.OSS_BUCKET || 'erp-videos',
  region: process.env.OSS_REGION || 'local',
};

// 模拟OSS上传函数
const uploadToOSS = async (file: File, fileName: string): Promise<string> => {
  // 实际项目中这里应该调用OSS SDK上传文件
  // 这里返回模拟的OSS URL
  const ossUrl = `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.endpoint}/videos/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;
  
  // 模拟上传延迟（视频文件较大，上传时间较长）
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  return ossUrl;
};

// POST /api/v1/oss/video - OSS视频上传
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = (formData.get('category') as string) || 'general';
    const description = (formData.get('description') as string) || '';

    if (!file) {
      return NextResponse.json({ code: 400, msg: '请选择要上传的视频' }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { code: 400, msg: '只支持 MP4、AVI、MOV、WMV、FLV、WebM 格式的视频' },
        { status: 400 }
      );
    }

    // 验证文件大小（100MB）
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { code: 400, msg: '视频大小不能超过 100MB' },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const fileExtension = file.name.split('.').pop() || 'mp4';
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
        description,
        uploader: user.name,
        uploaderId: user.id,
        uploadTime: new Date().toISOString(),
        storage: 'oss',
        status: 'uploaded', // uploaded, processing, ready, failed
        duration: null, // 视频时长，需要后续处理获取
        thumbnail: null, // 视频缩略图，需要后续处理生成
      };

      return NextResponse.json({
        code: 200,
        msg: '视频上传成功',
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
    console.error('OSS视频上传失败:', error);
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

// GET /api/v1/oss/video - 获取OSS视频列表
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
    const status = searchParams.get('status');

    // 模拟OSS视频列表数据
    const mockVideos = [
      {
        id: '1',
        originalName: 'product_demo.mp4',
        fileName: 'uuid1.mp4',
        fileUrl: `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.endpoint}/videos/2024/1/uuid1.mp4`,
        fileSize: 50 * 1024 * 1024,
        fileType: 'video/mp4',
        category: 'product',
        description: '产品演示视频',
        uploader: user.name,
        uploadTime: new Date().toISOString(),
        status: 'ready',
        duration: 120, // 2分钟
        thumbnail: `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.endpoint}/thumbnails/uuid1.jpg`,
      },
      {
        id: '2',
        originalName: 'training.mov',
        fileName: 'uuid2.mov',
        fileUrl: `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.endpoint}/videos/2024/1/uuid2.mov`,
        fileSize: 80 * 1024 * 1024,
        fileType: 'video/mov',
        category: 'training',
        description: '培训视频',
        uploader: user.name,
        uploadTime: new Date(Date.now() - 3600000).toISOString(),
        status: 'processing',
        duration: null,
        thumbnail: null,
      },
    ];

    // 应用筛选条件
    let filteredVideos = mockVideos;
    if (category) {
      filteredVideos = filteredVideos.filter(video => video.category === category);
    }
    if (status) {
      filteredVideos = filteredVideos.filter(video => video.status === status);
    }

    const total = filteredVideos.length;
    const skip = (page - 1) * limit;
    const paginatedVideos = filteredVideos.slice(skip, skip + limit);

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: {
        list: paginatedVideos,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取OSS视频列表失败:', error);
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

// DELETE /api/v1/oss/video - 删除OSS视频
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('id');

    if (!videoId) {
      return NextResponse.json({ code: 400, msg: '视频ID不能为空' }, { status: 400 });
    }

    // 实际项目中这里应该:
    // 1. 从数据库查询视频信息
    // 2. 验证用户权限
    // 3. 从OSS删除文件
    // 4. 从数据库删除记录

    return NextResponse.json({
      code: 200,
      msg: '视频删除成功',
      data: null,
    });
  } catch (error) {
    console.error('删除OSS视频失败:', error);
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