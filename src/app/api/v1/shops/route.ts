// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// 获取店铺列表
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const nickname = searchParams.get('nickname') || '';

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const whereCondition: any = {};
    if (nickname) {
      whereCondition.nickname = {
        contains: nickname,
      };
    }

    // 获取总数
    const total = await prisma.shop.count({
      where: whereCondition,
    });

    // 获取店铺列表
    const shops = await prisma.shop.findMany({
      where: whereCondition,
      include: {
        operator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSize,
    });

    return NextResponse.json({
      code: 0,
      msg: '获取店铺列表成功',
      data: {
        list: shops,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取店铺列表失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
});

// 创建店铺
export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { nickname, avatarUrl, responsiblePerson, remark } = body;

    // 参数验证
    if (!nickname || !responsiblePerson) {
      return NextResponse.json({ code: 400, msg: '店铺昵称和负责人为必填项' }, { status: 400 });
    }

    // 检查店铺昵称是否已存在
    const existingShop = await prisma.shop.findUnique({
      where: { nickname },
    });

    if (existingShop) {
      return NextResponse.json({ code: 400, msg: '店铺昵称已存在' }, { status: 400 });
    }

    // 创建店铺
    const shop = await prisma.shop.create({
      data: {
        nickname,
        avatarUrl,
        responsiblePerson,
        remark,
        operatorId: user.id,
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
      code: 0,
      msg: '店铺创建成功',
      data: shop,
    });
  } catch (error) {
    console.error('创建店铺失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
});
