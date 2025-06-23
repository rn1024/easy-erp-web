import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRequestToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 获取财务报表详情
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证token
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ message: '未授权' }, { status: 401 });
    }

    const { id } = params;

    const report = await prisma.financialReport.findUnique({
      where: { id },
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

    if (!report) {
      return NextResponse.json({ message: '财务报表不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('Get financial report error:', error);
    return NextResponse.json(
      { message: '获取财务报表详情失败', error: error.message },
      { status: 500 }
    );
  }
}

// 更新财务报表
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证token
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ message: '未授权' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { reportMonth, details } = body;

    // 检查财务报表是否存在
    const existingReport = await prisma.financialReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json({ message: '财务报表不存在' }, { status: 404 });
    }

    // 如果修改了报表月份，检查是否冲突
    if (reportMonth && reportMonth !== existingReport.reportMonth) {
      const conflictReport = await prisma.financialReport.findUnique({
        where: {
          shopId_reportMonth: {
            shopId: existingReport.shopId,
            reportMonth,
          },
        },
      });

      if (conflictReport) {
        return NextResponse.json({ message: '该月份的财务报表已存在' }, { status: 400 });
      }
    }

    // 更新财务报表
    const report = await prisma.financialReport.update({
      where: { id },
      data: {
        ...(reportMonth && { reportMonth }),
        ...(details && { details }),
        updatedAt: new Date(),
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
      message: '更新财务报表成功',
    });
  } catch (error: any) {
    console.error('Update financial report error:', error);
    return NextResponse.json(
      { message: '更新财务报表失败', error: error.message },
      { status: 500 }
    );
  }
}

// 删除财务报表
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证token
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ message: '未授权' }, { status: 401 });
    }

    const { id } = params;

    // 检查财务报表是否存在
    const existingReport = await prisma.financialReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json({ message: '财务报表不存在' }, { status: 404 });
    }

    // 删除财务报表
    await prisma.financialReport.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '删除财务报表成功',
    });
  } catch (error: any) {
    console.error('Delete financial report error:', error);
    return NextResponse.json(
      { message: '删除财务报表失败', error: error.message },
      { status: 500 }
    );
  }
}
