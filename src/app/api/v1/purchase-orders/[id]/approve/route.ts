import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withPermission } from '@/lib/middleware';

// 采购订单审批接口
const approveHandler = async (
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const body = await request.json();
    const { toStatus, reason, remark } = body;

    // 验证必填字段
    if (!toStatus || !reason) {
      return NextResponse.json({ code: 400, msg: '缺少必要参数' }, { status: 400 });
    }

    // 验证采购订单是否存在
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        shop: { select: { nickname: true } },
        supplier: { select: { nickname: true } },
        // 产品明细通过独立API查询：GET /api/v1/product-items?relatedType=PURCHASE_ORDER&relatedId=orderId
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json({ code: 404, msg: '采购订单不存在' }, { status: 404 });
    }

    // 验证状态转换的合理性
    // 根据 Prisma schema 中的 PurchaseOrderStatus 枚举定义
    const validTransitions: Record<string, string[]> = {
      CREATED: ['PENDING', 'CANCELLED'],
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PRODUCTION', 'CANCELLED'],
      PRODUCTION: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['RECEIVED', 'CANCELLED'],
      RECEIVED: [], // 最终状态
      CANCELLED: [], // 最终状态
    };

    if (!validTransitions[purchaseOrder.status]?.includes(toStatus)) {
      return NextResponse.json(
        {
          code: 400,
          msg: `不能从状态 ${purchaseOrder.status} 转换到 ${toStatus}`,
        },
        { status: 400 }
      );
    }

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 创建审批记录
      const approvalRecord = await tx.approvalRecord.create({
        data: {
          entityType: 'PURCHASE_ORDER',
          entityId: id,
          entityNumber: purchaseOrder.orderNumber,
          approverId: user.id,
          fromStatus: purchaseOrder.status,
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

      // 更新采购订单状态
      const updatedOrder = await tx.purchaseOrder.update({
        where: { id },
        data: { status: toStatus },
        include: {
          shop: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
          supplier: {
            select: {
              id: true,
              nickname: true,
              contactPerson: true,
            },
          },
          operator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        approvalRecord,
        updatedOrder,
      };
    });

    return NextResponse.json({
      code: 0,
      msg: '审批成功',
      data: {
        approval: result.approvalRecord,
        order: result.updatedOrder,
      },
    });
  } catch (error) {
    console.error('采购订单审批失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
};

// 导出带权限验证的接口
export const POST = withPermission(['purchase.approve'])((request: NextRequest, user: any) => {
  // 从 request.url 中解析 params
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 2]; // 获取 id 部分

  return approveHandler(request, user, { params: { id } });
});
