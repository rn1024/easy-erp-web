import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 设置产品封面图
export async function PATCH(
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

    // 如果已经是封面图，不需要更改
    if (image.isCover) {
      return NextResponse.json({
        code: 0,
        msg: '该图片已经是封面图',
        data: image,
      });
    }

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (prisma) => {
      // 取消其他图片的封面状态
      await prisma.productImage.updateMany({
        where: { productId, id: { not: imageId } },
        data: { isCover: false },
      });

      // 设置当前图片为封面
      const updatedImage = await prisma.productImage.update({
        where: { id: imageId },
        data: { isCover: true },
      });

      return updatedImage;
    });

    return NextResponse.json({
      code: 0,
      msg: '封面图设置成功',
      data: result,
    });
  } catch (error) {
    console.error('设置封面图失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误', data: null }, { status: 500 });
  }
}
