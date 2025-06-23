// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// 获取供应商列表
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
    const total = await prisma.supplier.count({
      where: whereCondition,
    });

    // 获取供应商列表
    const suppliers = await prisma.supplier.findMany({
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
      msg: '获取供应商列表成功',
      data: {
        list: suppliers,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取供应商列表失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
});

// 创建供应商
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
      productionDays,
      deliveryDays,
      remark,
    } = body;

    // 参数验证
    if (!nickname || !contactPerson || !contactPhone || !companyName) {
      return NextResponse.json(
        { code: 400, msg: '供应商昵称、联系人、联系电话和公司名称为必填项' },
        { status: 400 }
      );
    }

    // 检查供应商昵称是否已存在
    const existingSupplier = await prisma.supplier.findUnique({
      where: { nickname },
    });

    if (existingSupplier) {
      return NextResponse.json({ code: 400, msg: '供应商昵称已存在' }, { status: 400 });
    }

    // 检查统一社会信用代码是否重复（如果提供）
    if (creditCode) {
      const existingCreditCode = await prisma.supplier.findUnique({
        where: { creditCode },
      });

      if (existingCreditCode) {
        return NextResponse.json({ code: 400, msg: '统一社会信用代码已存在' }, { status: 400 });
      }
    }

    // 创建供应商
    const supplier = await prisma.supplier.create({
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
        productionDays: productionDays || 0,
        deliveryDays: deliveryDays || 0,
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
      msg: '供应商创建成功',
      data: supplier,
    });
  } catch (error) {
    console.error('创建供应商失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
});
