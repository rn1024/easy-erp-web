// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync } from 'fs';

// POST /api/v1/oss/video - 上传视频
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
      return NextResponse.json({ code: 400, msg: '请选择要上传的视频' }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/flv'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { code: 400, msg: '只支持 MP4、MOV、AVI、WMV、FLV 格式的视频' },
        { status: 400 }
      );
    }

    // 验证文件大小（100MB）
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ code: 400, msg: '视频大小不能超过 100MB' }, { status: 400 });
    }

    // 生成唯一文件名
    const fileExtension = file.name.split('.').pop() || 'mp4';
    const fileName = `${uuidv4()}.${fileExtension}`;
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    // 本地存储路径（实际项目中应该上传到OSS）
    const uploadDir = join(
      process.cwd(),
      'public',
      'uploads',
      'videos',
      year.toString(),
      month.toString()
    );
    const filePath = join(uploadDir, fileName);
    const fileUrl = `/uploads/videos/${year}/${month}/${fileName}`;

    try {
      // 确保目录存在
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }

      // 保存文件到本地
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // 创建数据库记录
      const fileRecord = await prisma.fileUpload.create({
        data: {
          originalName: file.name,
          fileName: fileName,
          fileUrl: fileUrl,
          fileSize: file.size,
          fileType: file.type,
          category: category,
          storage: 'local',
          uploaderId: user.id,
        },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return NextResponse.json({
        code: 0,
        msg: '视频上传成功',
        data: fileRecord,
      });
    } catch (uploadError) {
      console.error('视频上传失败:', uploadError);
      return NextResponse.json({ code: 500, msg: '视频上传失败' }, { status: 500 });
    }
  } catch (error) {
    console.error('上传视频失败:', error);
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

// GET /api/v1/oss/video - 获取视频列表
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
    const fileName = searchParams.get('fileName');

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      fileType: {
        startsWith: 'video/',
      },
    };

    if (category) {
      where.category = category;
    }

    if (fileName) {
      where.OR = [{ fileName: { contains: fileName } }, { originalName: { contains: fileName } }];
    }

    // 从数据库查询视频文件记录
    const [videos, total] = await Promise.all([
      prisma.fileUpload.findMany({
        where,
        skip,
        take: limit,
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.fileUpload.count({ where }),
    ]);

    return NextResponse.json({
      code: 0,
      msg: '获取成功',
      data: {
        list: videos,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取视频列表失败:', error);
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
      code: 0,
      msg: '删除成功',
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
