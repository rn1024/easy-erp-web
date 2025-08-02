import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 获取财务报表列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const shopId = searchParams.get('shopId');
    const reportMonth = searchParams.get('reportMonth');

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};
    if (shopId) {
      where.shopId = shopId;
    }
    if (reportMonth) {
      where.reportMonth = reportMonth;
    }

    // 获取财务报表列表和总数
    const [reports, total] = await Promise.all([
      prisma.financialReport.findMany({
        where,
        include: {
          shop: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: {
          reportMonth: 'desc',
        },
      }),
      prisma.financialReport.count({ where }),
    ]);

    return NextResponse.json({
      code: 0,
      msg: '获取成功',
      data: {
        list: reports,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取财务报表列表失败:', error);
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

// 创建财务报表
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const body = await request.json();
    const { shopId, reportMonth, details } = body;

    // 验证必填字段
    if (!shopId || !reportMonth) {
      return NextResponse.json({ code: 400, msg: '缺少必要参数' }, { status: 400 });
    }

    // 验证店铺是否存在
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      return NextResponse.json({ code: 400, msg: '店铺不存在' }, { status: 400 });
    }

    // 检查报表是否已存在
    const existingReport = await prisma.financialReport.findUnique({
      where: {
        shopId_reportMonth: {
          shopId,
          reportMonth,
        },
      },
    });

    if (existingReport) {
      return NextResponse.json({ code: 400, msg: '该月份的财务报表已存在' }, { status: 400 });
    }

    // 创建财务报表
    const report = await prisma.financialReport.create({
      data: {
        shopId,
        reportMonth,
        details: details || {},
      },
      include: {
        shop: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    return NextResponse.json({
      code: 0,
      msg: '创建成功',
      data: report,
    });
  } catch (error) {
    console.error('创建财务报表失败:', error);
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
