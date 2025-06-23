// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// 获取店铺详情
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ code: 400, msg: '店铺ID不能为空' }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!shop) {
      return NextResponse.json({ code: 404, msg: '店铺不存在' }, { status: 404 });
    }

    return NextResponse.json({
      code: 200,
      msg: '获取店铺详情成功',
      data: shop,
    });
  } catch (error) {
    console.error('获取店铺详情失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
});

// 更新店铺
export const PUT = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ code: 400, msg: '店铺ID不能为空' }, { status: 400 });
    }

    const body = await request.json();
    const { nickname, avatarUrl, responsiblePerson, remark } = body;

    // 检查店铺是否存在
    const existingShop = await prisma.shop.findUnique({
      where: { id },
    });

    if (!existingShop) {
      return NextResponse.json({ code: 404, msg: '店铺不存在' }, { status: 404 });
    }

    // 如果昵称发生变化，检查新昵称是否已被其他店铺使用
    if (nickname && nickname !== existingShop.nickname) {
      const duplicateShop = await prisma.shop.findFirst({
        where: {
          nickname,
          id: { not: id },
        },
      });

      if (duplicateShop) {
        return NextResponse.json({ code: 400, msg: '店铺昵称已存在' }, { status: 400 });
      }
    }

    // 更新店铺
    const shop = await prisma.shop.update({
      where: { id },
      data: {
        ...(nickname && { nickname }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(responsiblePerson && { responsiblePerson }),
        ...(remark !== undefined && { remark }),
      },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      code: 200,
      msg: '店铺更新成功',
      data: shop,
    });
  } catch (error) {
    console.error('更新店铺失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
});

// 删除店铺
export const DELETE = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ code: 400, msg: '店铺ID不能为空' }, { status: 400 });
    }

    // 检查店铺是否存在
    const existingShop = await prisma.shop.findUnique({
      where: { id },
    });

    if (!existingShop) {
      return NextResponse.json({ code: 404, msg: '店铺不存在' }, { status: 404 });
    }

    // 检查店铺是否有关联数据
    const relatedData = await prisma.productInfo.findFirst({
      where: { shopId: id },
    });

    if (relatedData) {
      return NextResponse.json(
        { code: 400, msg: '该店铺下有关联的产品数据，无法删除' },
        { status: 400 }
      );
    }

    // 删除店铺
    await prisma.shop.delete({
      where: { id },
    });

    return NextResponse.json({
      code: 200,
      msg: '店铺删除成功',
      data: null,
    });
  } catch (error) {
    console.error('删除店铺失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
});
