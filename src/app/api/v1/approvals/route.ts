import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 创建审批记录
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问' }, { status: 401 });
    }

    const body = await request.json();
    const { entityType, entityId, entityNumber, toStatus, reason, remark } = body;

    // 验证必填字段
    if (!entityType || !entityId || !entityNumber || !toStatus || !reason) {
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

    // 获取当前业务单据状态
    let currentStatus = '';
    let entityExists = false;

    switch (entityType) {
      case 'PURCHASE_ORDER':
        const purchaseOrder = await prisma.purchaseOrder.findUnique({
          where: { id: entityId },
          select: { status: true, orderNumber: true },
        });

        if (!purchaseOrder) {
          return NextResponse.json({ code: 404, msg: '采购订单不存在' }, { status: 404 });
        }

        if (purchaseOrder.orderNumber !== entityNumber) {
          return NextResponse.json({ code: 400, msg: '订单号不匹配' }, { status: 400 });
        }

        currentStatus = purchaseOrder.status;
        entityExists = true;
        break;

      // 预留其他业务类型的处理
      default:
        return NextResponse.json({ code: 400, msg: '暂不支持该业务类型的审批' }, { status: 400 });
    }

    if (!entityExists) {
      return NextResponse.json({ code: 404, msg: '业务单据不存在' }, { status: 404 });
    }

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 创建审批记录
      const approvalRecord = await tx.approvalRecord.create({
        data: {
          entityType,
          entityId,
          entityNumber,
          approverId: user.id,
          fromStatus: currentStatus,
          toStatus,
          reason,
          remark: remark || null,
        },
        include: {
          approver: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // 更新业务单据状态
      switch (entityType) {
        case 'PURCHASE_ORDER':
          // 验证目标状态是否有效
          const validPurchaseStatuses = [
            'CREATED',
            'PENDING',
            'APPROVED',
            'REJECTED',
            'COMPLETED',
            'CANCELLED',
          ];
          if (!validPurchaseStatuses.includes(toStatus)) {
            throw new Error('无效的采购订单状态');
          }
          await tx.purchaseOrder.update({
            where: { id: entityId },
            data: { status: toStatus },
          });
          break;
      }

      return approvalRecord;
    });

    return NextResponse.json({
      code: 200,
      msg: '审批成功',
      data: result,
    });
  } catch (error) {
    console.error('创建审批记录失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
}

// 查询审批历史
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const entityNumber = searchParams.get('entityNumber');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // 构建查询条件
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (entityNumber) where.entityNumber = entityNumber;

    // 分页查询审批记录
    const [records, total] = await Promise.all([
      prisma.approvalRecord.findMany({
        where,
        include: {
          approver: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.approvalRecord.count({ where }),
    ]);

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: {
        list: records,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取审批记录失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
}
