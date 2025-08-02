import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 获取产品图片列表
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { id: productId } = params;

    if (!productId) {
      return NextResponse.json({ code: 400, msg: '缺少产品ID参数' }, { status: 400 });
    }

    // 验证产品是否存在
    const product = await prisma.productInfo.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ code: 404, msg: '产品不存在' }, { status: 404 });
    }

    // 获取产品图片列表，按排序顺序排列
    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      code: 0,
      msg: '获取成功',
      data: images,
    });
  } catch (error) {
    console.error('获取产品图片列表失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误', data: null }, { status: 500 });
  }
}

// 批量上传产品图片
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { id: productId } = params;

    if (!productId) {
      return NextResponse.json({ code: 400, msg: '缺少产品ID参数' }, { status: 400 });
    }

    const body = await request.json();
    const { images } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ code: 400, msg: '请提供图片数据' }, { status: 400 });
    }

    // 验证产品是否存在
    const product = await prisma.productInfo.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ code: 404, msg: '产品不存在' }, { status: 404 });
    }

    // 检查当前图片数量
    const currentImageCount = await prisma.productImage.count({
      where: { productId },
    });

    if (currentImageCount + images.length > 10) {
      return NextResponse.json(
        { code: 400, msg: `最多只能上传10张图片，当前已有${currentImageCount}张` },
        { status: 400 }
      );
    }

    // 验证图片数据格式
    for (const image of images) {
      if (!image.imageUrl || !image.fileName || typeof image.fileSize !== 'number') {
        return NextResponse.json({ code: 400, msg: '图片数据格式不正确' }, { status: 400 });
      }

      // 检查文件大小限制 (10MB)
      if (image.fileSize > 10 * 1024 * 1024) {
        return NextResponse.json(
          { code: 400, msg: `图片 ${image.fileName} 超过10MB大小限制` },
          { status: 400 }
        );
      }
    }

    // 获取下一个可用的排序序号
    const maxSortOrder = await prisma.productImage.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    });

    let nextSortOrder = (maxSortOrder._max.sortOrder || 0) + 1;

    // 批量创建图片记录
    const createdImages = [];
    for (const image of images) {
      const isCover = currentImageCount === 0 && nextSortOrder === 1; // 第一张图片自动设为封面

      const createdImage = await prisma.productImage.create({
        data: {
          productId,
          imageUrl: image.imageUrl,
          fileName: image.fileName,
          fileSize: image.fileSize,
          sortOrder: nextSortOrder,
          isCover,
        },
      });

      createdImages.push(createdImage);
      nextSortOrder++;
    }

    return NextResponse.json({
      code: 0,
      msg: '图片上传成功',
      data: createdImages,
    });
  } catch (error) {
    console.error('上传产品图片失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误', data: null }, { status: 500 });
  }
}
