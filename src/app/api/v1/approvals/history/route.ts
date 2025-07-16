import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 获取审批历史记录
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    // 验证必填参数
    if (!entityType || !entityId) {
      return NextResponse.json({ code: 400, msg: '缺少必要参数' }, { status: 400 });
    }

    // 验证业务类型
    const validEntityTypes = [
      'PURCHASE_ORDER',
      'SALES_ORDER',
      'INVENTORY_TRANSFER',
      'EXPENSE_REPORT',
    ];
    if (!validEntityTypes.includes(entityType)) {
      return NextResponse.json({ code: 400, msg: '无效的业务类型' }, { status: 400 });
    }

    // 查询审批历史记录
    const approvals = await prisma.approvalRecord.findMany({
      where: {
        entityType: entityType as any,
        entityId,
      },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: approvals,
    });
  } catch (error) {
    console.error('获取审批历史失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
}
