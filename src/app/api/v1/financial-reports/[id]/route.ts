import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 获取财务报表详情
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { id } = params;

    const report = await prisma.financialReport.findUnique({
      where: { id },
      include: {
        shop: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ code: 404, msg: '财务报表不存在', data: null }, { status: 404 });
    }

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: report,
    });
  } catch (error) {
    console.error('获取财务报表详情失败:', error);
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

// 更新财务报表
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { shopId, reportMonth, details } = body;

    // 检查报表是否存在
    const existingReport = await prisma.financialReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json({ code: 404, msg: '财务报表不存在', data: null }, { status: 404 });
    }

    // 构建更新数据
    const updateData: any = {};
    if (shopId !== undefined) updateData.shopId = shopId;
    if (reportMonth !== undefined) updateData.reportMonth = reportMonth;
    if (details !== undefined) updateData.details = details;

    // 如果更新了shopId，验证店铺是否存在
    if (shopId && shopId !== existingReport.shopId) {
      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) {
        return NextResponse.json({ code: 400, msg: '店铺不存在' }, { status: 400 });
      }
    }

    // 如果更新了shopId或reportMonth，检查唯一性
    if (
      (shopId && shopId !== existingReport.shopId) ||
      (reportMonth && reportMonth !== existingReport.reportMonth)
    ) {
      const conflictReport = await prisma.financialReport.findUnique({
        where: {
          shopId_reportMonth: {
            shopId: shopId || existingReport.shopId,
            reportMonth: reportMonth || existingReport.reportMonth,
          },
        },
      });

      if (conflictReport && conflictReport.id !== id) {
        return NextResponse.json(
          { code: 400, msg: '该店铺该月份的财务报表已存在' },
          { status: 400 }
        );
      }
    }

    // 更新财务报表
    const updatedReport = await prisma.financialReport.update({
      where: { id },
      data: updateData,
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
      code: 200,
      msg: '更新成功',
      data: updatedReport,
    });
  } catch (error) {
    console.error('更新财务报表失败:', error);
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

// 删除财务报表
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { id } = params;

    // 检查报表是否存在
    const existingReport = await prisma.financialReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json({ code: 404, msg: '财务报表不存在', data: null }, { status: 404 });
    }

    // 删除财务报表
    await prisma.financialReport.delete({
      where: { id },
    });

    return NextResponse.json({
      code: 200,
      msg: '删除成功',
      data: null,
    });
  } catch (error) {
    console.error('删除财务报表失败:', error);
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
