// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// 获取货代列表
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const nickname = searchParams.get('nickname') || '';
    const companyName = searchParams.get('companyName') || '';

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const whereCondition: any = {};
    if (nickname) {
      whereCondition.nickname = {
        contains: nickname,
      };
    }
    if (companyName) {
      whereCondition.companyName = {
        contains: companyName,
      };
    }

    // 获取总数
    const total = await prisma.forwarder.count({
      where: whereCondition,
    });

    // 获取货代列表
    const agents = await prisma.forwarder.findMany({
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
      code: 200,
      msg: '获取货代列表成功',
      data: {
        list: agents,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取货代列表失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
});

// 创建货代
export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const {
      nickname,
      avatarUrl,
      contactPerson,
      contactPhone,
      companyName,
      creditCode,
      bankName,
      bankAccount,
      bankAddress,
      remark,
    } = body;

    // 参数验证
    if (!nickname || !contactPerson || !contactPhone || !companyName) {
      return NextResponse.json(
        { code: 400, msg: '货代昵称、联系人、联系电话和公司名称为必填项' },
        { status: 400 }
      );
    }

    // 检查货代昵称是否已存在
    const existingAgent = await prisma.forwarder.findUnique({
      where: { nickname },
    });

    if (existingAgent) {
      return NextResponse.json({ code: 400, msg: '货代昵称已存在' }, { status: 400 });
    }

    // 创建货代
    const agent = await prisma.forwarder.create({
      data: {
        nickname,
        avatarUrl,
        contactPerson,
        contactPhone,
        companyName,
        creditCode,
        bankName,
        bankAccount,
        bankAddress,
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
      code: 200,
      msg: '货代创建成功',
      data: agent,
    });
  } catch (error) {
    console.error('创建货代失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
});
