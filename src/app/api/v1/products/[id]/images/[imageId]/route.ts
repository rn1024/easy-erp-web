import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 更新产品图片信息
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { id: productId, imageId } = params;

    if (!productId || !imageId) {
      return NextResponse.json({ code: 400, msg: '缺少必要参数' }, { status: 400 });
    }

    const body = await request.json();
    const { sortOrder, isCover } = body;

    // 验证产品和图片是否存在
    const image = await prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });

    if (!image) {
      return NextResponse.json({ code: 404, msg: '图片不存在' }, { status: 404 });
    }

    // 构建更新数据
    const updateData: any = {};

    if (typeof sortOrder === 'number') {
      // 验证排序序号范围
      const imageCount = await prisma.productImage.count({
        where: { productId },
      });

      if (sortOrder < 1 || sortOrder > imageCount) {
        return NextResponse.json(
          { code: 400, msg: `排序序号必须在1-${imageCount}之间` },
          { status: 400 }
        );
      }

      updateData.sortOrder = sortOrder;
    }

    if (typeof isCover === 'boolean') {
      updateData.isCover = isCover;

      // 如果设置为封面图，需要取消其他图片的封面状态
      if (isCover) {
        await prisma.productImage.updateMany({
          where: { productId, id: { not: imageId } },
          data: { isCover: false },
        });
      }
    }

    // 更新图片信息
    const updatedImage = await prisma.productImage.update({
      where: { id: imageId },
      data: updateData,
    });

    return NextResponse.json({
      code: 0,
      msg: '更新成功',
      data: updatedImage,
    });
  } catch (error) {
    console.error('更新产品图片失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误', data: null }, { status: 500 });
  }
}

// 删除产品图片
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { id: productId, imageId } = params;

    if (!productId || !imageId) {
      return NextResponse.json({ code: 400, msg: '缺少必要参数' }, { status: 400 });
    }

    // 验证产品和图片是否存在
    const image = await prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });

    if (!image) {
      return NextResponse.json({ code: 404, msg: '图片不存在' }, { status: 404 });
    }

    // 删除图片记录（注意：不删除OSS文件，按用户要求）
    await prisma.productImage.delete({
      where: { id: imageId },
    });

    // 如果删除的是封面图，自动设置第一张图片为封面
    if (image.isCover) {
      const firstImage = await prisma.productImage.findFirst({
        where: { productId },
        orderBy: { sortOrder: 'asc' },
      });

      if (firstImage) {
        await prisma.productImage.update({
          where: { id: firstImage.id },
          data: { isCover: true },
        });
      }
    }

    return NextResponse.json({
      code: 0,
      msg: '删除成功',
      data: null,
    });
  } catch (error) {
    console.error('删除产品图片失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误', data: null }, { status: 500 });
  }
}
