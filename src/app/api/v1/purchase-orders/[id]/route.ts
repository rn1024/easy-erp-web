// 标记为动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 计算订单总金额
function calculateOrderTotal(items: any[]): {
  totalAmount: number;
  finalAmount: number;
  discountAmount: number;
} {
  const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
  // 这里可以根据业务需求计算优惠
  const discountAmount = 0; // 暂时不计算优惠
  const finalAmount = totalAmount - discountAmount;

  return { totalAmount, finalAmount, discountAmount };
}

// 获取采购订单详情
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
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
        operator: {
          select: {
            id: true,
            name: true,
          },
        },
        // 产品明细通过独立API查询：GET /api/v1/product-items?relatedType=PURCHASE_ORDER&relatedId=orderId
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json({ code: 404, msg: '采购订单不存在' }, { status: 404 });
    }

    return NextResponse.json({
      code: 0,
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
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { shopId, supplierId, status, urgent, remark, discountRate, items } = body;

    // 检查采购订单是否存在
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ code: 404, msg: '采购订单不存在' }, { status: 404 });
    }

    // 如果有产品明细更新，验证明细
    if (items) {
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ code: 400, msg: '产品明细不能为空' }, { status: 400 });
      }

      // 验证产品明细
      for (const item of items) {
        if (!item.productId || !item.quantity || !item.unitPrice) {
          return NextResponse.json({ code: 400, msg: '产品明细信息不完整' }, { status: 400 });
        }
        if (item.quantity <= 0 || item.unitPrice <= 0) {
          return NextResponse.json({ code: 400, msg: '产品数量和单价必须大于0' }, { status: 400 });
        }
      }

      // 验证所有产品是否存在
      const productIds = items.map((item: any) => item.productId);
      const products = await prisma.productInfo.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        return NextResponse.json({ code: 400, msg: '部分产品不存在' }, { status: 400 });
      }
    }

    // 构建更新数据
    const updateData: any = {};
    if (shopId !== undefined) updateData.shopId = shopId;
    if (supplierId !== undefined) updateData.supplierId = supplierId;
    if (status !== undefined) updateData.status = status;
    if (urgent !== undefined) updateData.urgent = Boolean(urgent);
    if (remark !== undefined) updateData.remark = remark || null;
    if (discountRate !== undefined)
      updateData.discountRate = discountRate ? parseFloat(discountRate) : null;

    // 如果更改了关联数据，验证是否存在
    if (shopId || supplierId) {
      const checks = [];
      if (shopId) checks.push(prisma.shop.findUnique({ where: { id: shopId } }));
      if (supplierId) checks.push(prisma.supplier.findUnique({ where: { id: supplierId } }));

      const results = await Promise.all(checks);

      if (shopId && !results[0]) {
        return NextResponse.json({ code: 400, msg: '店铺不存在' }, { status: 400 });
      }
      if (supplierId && !results[shopId ? 1 : 0]) {
        return NextResponse.json({ code: 400, msg: '供应商不存在' }, { status: 400 });
      }
    }

    // 如果有产品明细更新，计算新的总金额
    let calculatedItems: any[] = [];
    if (items) {
      calculatedItems = items.map((item: any) => {
        const amount = item.quantity * item.unitPrice;
        const totalAmount = amount; // 移除税率计算，总金额等于小计金额

        return {
          id: item.id || undefined, // 如果有ID则是更新，否则是新增
          productId: item.productId,
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          amount: parseFloat(amount.toFixed(2)),
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          remark: item.remark || null,
        };
      });

      // 计算订单总金额
      const { totalAmount, finalAmount, discountAmount } = calculateOrderTotal(calculatedItems);
      updateData.totalAmount = parseFloat(totalAmount.toFixed(2));
      updateData.finalAmount = parseFloat(finalAmount.toFixed(2));
      if (discountAmount > 0) {
        updateData.discountAmount = parseFloat(discountAmount.toFixed(2));
      }
    }

    // 使用事务更新订单和明细
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 更新采购订单基本信息
      const order = await tx.purchaseOrder.update({
        where: { id },
        data: updateData,
      });

      // 如果有产品明细更新
      if (items) {
        // 删除现有明细
        await tx.productItem.deleteMany({
          where: {
            relatedType: 'PURCHASE_ORDER',
            relatedId: id,
          },
        });

        // 创建新明细
        await tx.productItem.createMany({
          data: calculatedItems.map((item) => ({
            relatedType: 'PURCHASE_ORDER',
            relatedId: id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            totalAmount: item.totalAmount,
            remark: item.remark,
          })),
        });
      }

      return order;
    });

    // 获取完整的更新后订单信息
    const fullOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
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
        operator: {
          select: {
            id: true,
            name: true,
          },
        },
        // 产品明细通过独立API查询：GET /api/v1/product-items?relatedType=PURCHASE_ORDER&relatedId=orderId
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
          updatedData: updateData,
          itemsCount: items ? items.length : undefined,
        },
      },
    });

    return NextResponse.json({
      code: 0,
      msg: '更新成功',
      data: fullOrder,
    });
  } catch (error) {
    console.error('更新采购订单失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
}

// 删除采购订单
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
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
    if (!['CREATED', 'PENDING', 'CANCELLED'].includes(existingOrder.status)) {
      return NextResponse.json(
        { code: 400, msg: '只有已创建、待处理和已取消的订单可以删除' },
        { status: 400 }
      );
    }

    // 删除采购订单（明细会通过CASCADE自动删除）
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
          orderNumber: existingOrder.orderNumber,
        },
      },
    });

    return NextResponse.json({
      code: 0,
      msg: '删除成功',
    });
  } catch (error) {
    console.error('删除采购订单失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
}
