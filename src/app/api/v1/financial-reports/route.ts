import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRequestToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 获取财务报表列表
export async function GET(request: NextRequest) {
  try {
    // 验证token
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ message: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const shopId = searchParams.get('shopId');
    const reportMonth = searchParams.get('reportMonth');

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};
    if (shopId) where.shopId = shopId;
    if (reportMonth) where.reportMonth = reportMonth;

    // 查询财务报表
    const [reports, total] = await Promise.all([
      prisma.financialReport.findMany({
        where,
        include: {
          shop: {
            select: {
              id: true,
              nickname: true,
              responsiblePerson: true,
            },
          },
        },
        orderBy: { reportMonth: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.financialReport.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        list: reports,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error('Get financial reports error:', error);
    return NextResponse.json(
      { message: '获取财务报表失败', error: error.message },
      { status: 500 }
    );
  }
}

// 创建财务报表
export async function POST(request: NextRequest) {
  try {
    // 验证token
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ message: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { shopId, reportMonth, details } = body;

    // 参数验证
    if (!shopId || !reportMonth) {
      return NextResponse.json({ message: '缺少必需参数: shopId, reportMonth' }, { status: 400 });
    }

    // 检查是否已存在相同月份的报表
    const existingReport = await prisma.financialReport.findUnique({
      where: {
        shopId_reportMonth: {
          shopId,
          reportMonth,
        },
      },
    });

    if (existingReport) {
      return NextResponse.json({ message: '该月份的财务报表已存在' }, { status: 400 });
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
            responsiblePerson: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: report,
      message: '创建财务报表成功',
    });
  } catch (error: any) {
    console.error('Create financial report error:', error);
    return NextResponse.json(
      { message: '创建财务报表失败', error: error.message },
      { status: 500 }
    );
  }
}
