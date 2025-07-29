// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync } from 'fs';



// POST /api/v1/oss/image - 上传图片
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
      return NextResponse.json({ code: 400, msg: '请选择要上传的文件' }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ code: 400, msg: '不支持的文件类型' }, { status: 400 });
    }

    // 验证文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ code: 400, msg: '文件大小不能超过5MB' }, { status: 400 });
    }

    // 生成唯一文件名
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${fileExtension}`;
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    // 本地存储路径（实际项目中应该上传到OSS）
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'images', year.toString(), month.toString());
    const filePath = join(uploadDir, fileName);
    const fileUrl = `/uploads/images/${year}/${month}/${fileName}`;

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
        code: 200,
        msg: '上传成功',
        data: fileRecord,
      });
    } catch (uploadError) {
      console.error('文件上传失败:', uploadError);
      return NextResponse.json(
        {
          code: 500,
          msg: '文件上传失败',
          data: null,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('上传图片失败:', error);
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

// GET /api/v1/oss/image - 获取图片列表
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
    const fileType = searchParams.get('fileType');

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (fileName) {
      where.OR = [
        { fileName: { contains: fileName } },
        { originalName: { contains: fileName } },
      ];
    }
    
    if (fileType) {
      where.fileType = fileType;
    }

    // 从数据库查询文件上传记录
    const [files, total] = await Promise.all([
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
      code: 200,
      msg: '获取成功',
      data: {
        list: files,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取图片列表失败:', error);
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