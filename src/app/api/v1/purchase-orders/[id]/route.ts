// 标记为动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRequestToken } from '@/lib/auth';

// 获取采购订单详情
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyRequestToken(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问' }, { status: 401 });
    }

    const { id } = params;

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        shop: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            responsiblePerson: true,
          },
        },
        supplier: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            contactPerson: true,
            contactPhone: true,
            companyName: true,
            productionDays: true,
            deliveryDays: true,
          },
        },
        product: {
          select: {
            id: true,
            code: true,
            specification: true,
            sku: true,
            color: true,
            setQuantity: true,
            internalSize: true,
            externalSize: true,
            weight: true,
            imageUrl: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
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

    if (!purchaseOrder) {
      return NextResponse.json({ code: 404, msg: '采购订单不存在' }, { status: 404 });
    }

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: purchaseOrder,
    });
  } catch (error) {
    console.error('获取采购订单详情失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
}

// 更新采购订单
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyRequestToken(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { shopId, supplierId, productId, quantity, totalAmount, status, urgent, remark } = body;

    // 检查采购订单是否存在
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ code: 404, msg: '采购订单不存在' }, { status: 404 });
    }

    // 构建更新数据
    const updateData: any = {};
    if (shopId !== undefined) updateData.shopId = shopId;
    if (supplierId !== undefined) updateData.supplierId = supplierId;
    if (productId !== undefined) updateData.productId = productId;
    if (quantity !== undefined) {
      if (quantity <= 0) {
        return NextResponse.json({ code: 400, msg: '数量必须大于0' }, { status: 400 });
      }
      updateData.quantity = parseInt(quantity);
    }
    if (totalAmount !== undefined) {
      if (totalAmount <= 0) {
        return NextResponse.json({ code: 400, msg: '金额必须大于0' }, { status: 400 });
      }
      updateData.totalAmount = parseFloat(totalAmount);
    }
    if (status !== undefined) updateData.status = status;
    if (urgent !== undefined) updateData.urgent = Boolean(urgent);
    if (remark !== undefined) updateData.remark = remark || null;

    // 如果更改了关联数据，验证是否存在
    if (shopId || supplierId || productId) {
      const checks = [];
      if (shopId) checks.push(prisma.shop.findUnique({ where: { id: shopId } }));
      if (supplierId) checks.push(prisma.supplier.findUnique({ where: { id: supplierId } }));
      if (productId) checks.push(prisma.productInfo.findUnique({ where: { id: productId } }));

      const results = await Promise.all(checks);

      if (shopId && !results[0]) {
        return NextResponse.json({ code: 400, msg: '店铺不存在' }, { status: 400 });
      }
      if (supplierId && !results[shopId ? 1 : 0]) {
        return NextResponse.json({ code: 400, msg: '供应商不存在' }, { status: 400 });
      }
      if (productId && !results[results.length - 1]) {
        return NextResponse.json({ code: 400, msg: '产品不存在' }, { status: 400 });
      }
    }

    // 更新采购订单
    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
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
            avatarUrl: true,
            contactPerson: true,
            contactPhone: true,
          },
        },
        product: {
          select: {
            id: true,
            code: true,
            specification: true,
            sku: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
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

    // 记录操作日志
    await prisma.log.create({
      data: {
        category: 'PURCHASE',
        module: 'PURCHASE_ORDER',
        operation: 'UPDATE',
        operatorAccountId: user.id,
        status: 'SUCCESS',
        details: {
          purchaseOrderId: id,
          originalData: existingOrder,
          updatedData: updateData,
        },
      },
    });

    return NextResponse.json({
      code: 200,
      msg: '更新成功',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('更新采购订单失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
}

// 删除采购订单
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyRequestToken(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问' }, { status: 401 });
    }

    const { id } = params;

    // 检查采购订单是否存在
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ code: 404, msg: '采购订单不存在' }, { status: 404 });
    }

    // 检查是否可以删除（只有待处理和已取消的订单可以删除）
    if (!['PENDING', 'CANCELLED'].includes(existingOrder.status)) {
      return NextResponse.json(
        { code: 400, msg: '只有待处理和已取消的订单可以删除' },
        { status: 400 }
      );
    }

    // 删除采购订单
    await prisma.purchaseOrder.delete({
      where: { id },
    });

    // 记录操作日志
    await prisma.log.create({
      data: {
        category: 'PURCHASE',
        module: 'PURCHASE_ORDER',
        operation: 'DELETE',
        operatorAccountId: user.id,
        status: 'SUCCESS',
        details: {
          purchaseOrderId: id,
          deletedData: existingOrder,
        },
      },
    });

    return NextResponse.json({
      code: 200,
      msg: '删除成功',
    });
  } catch (error) {
    console.error('删除采购订单失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
}
