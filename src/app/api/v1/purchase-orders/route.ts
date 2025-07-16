// 标记为动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 生成采购订单号：CGDD+时间+序号（6位）
async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD格式

  // 查询当天的订单数量（基于订单号前缀）
  const todayPrefix = `CGDD${dateStr}`;
  const todayCount = await prisma.purchaseOrder.count({
    where: {
      orderNumber: {
        startsWith: todayPrefix,
      },
    },
  });

  // 生成6位序号（从000001开始）
  const sequenceNumber = (todayCount + 1).toString().padStart(6, '0');

  return `${todayPrefix}${sequenceNumber}`;
}

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

// 获取采购订单列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const shopId = searchParams.get('shopId');
    const supplierId = searchParams.get('supplierId');
    const productId = searchParams.get('productId');
    const status = searchParams.get('status');
    const urgent = searchParams.get('urgent');
    const operatorId = searchParams.get('operatorId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};
    if (shopId) where.shopId = shopId;
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;
    if (urgent !== null && urgent !== undefined) {
      where.urgent = urgent === 'true';
    }
    if (operatorId) where.operatorId = operatorId;
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.createdAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.createdAt = {
        lte: new Date(endDate),
      };
    }

    // 如果按产品查询，需要在订单明细中查找
    if (productId) {
      where.items = {
        some: {
          productId: productId,
        },
      };
    }

    // 获取总数
    const total = await prisma.purchaseOrder.count({ where });

    // 获取列表数据
    const list = await prisma.purchaseOrder.findMany({
      where,
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
        items: {
          include: {
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
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: [{ urgent: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: pageSize,
    });

    // 获取每个订单的最新审批记录
    const orderIds = list.map((order) => order.id);
    const latestApprovals = await Promise.all(
      orderIds.map(async (orderId) => {
        const latestApproval = await prisma.approvalRecord.findFirst({
          where: {
            entityType: 'PURCHASE_ORDER',
            entityId: orderId,
          },
          include: {
            approver: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        return { orderId, approval: latestApproval };
      })
    );

    // 将审批记录关联到对应的订单
    const listWithApprovals = list.map((order) => {
      const approvalData = latestApprovals.find((item) => item.orderId === order.id);
      return {
        ...order,
        latestApproval: approvalData?.approval || null,
      };
    });

    return NextResponse.json({
      code: 0,
      msg: '获取成功',
      data: {
        list: listWithApprovals,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取采购订单列表失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
}

// 创建采购订单
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问' }, { status: 401 });
    }

    const body = await request.json();
    const { shopId, supplierId, urgent = false, remark, discountRate = 0, items } = body;

    // 验证必填字段
    if (!shopId || !supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ code: 400, msg: '缺少必要参数或产品明细为空' }, { status: 400 });
    }

    // 验证产品明细
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.unitPrice || item.taxRate === undefined) {
        return NextResponse.json({ code: 400, msg: '产品明细信息不完整' }, { status: 400 });
      }
      if (item.quantity <= 0 || item.unitPrice <= 0) {
        return NextResponse.json({ code: 400, msg: '产品数量和单价必须大于0' }, { status: 400 });
      }
    }

    // 验证关联数据是否存在
    const [shop, supplier] = await Promise.all([
      prisma.shop.findUnique({ where: { id: shopId } }),
      prisma.supplier.findUnique({ where: { id: supplierId } }),
    ]);

    if (!shop) {
      return NextResponse.json({ code: 400, msg: '店铺不存在' }, { status: 400 });
    }

    if (!supplier) {
      return NextResponse.json({ code: 400, msg: '供应商不存在' }, { status: 400 });
    }

    // 验证所有产品是否存在
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.productInfo.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ code: 400, msg: '部分产品不存在' }, { status: 400 });
    }

    // 计算明细金额
    const calculatedItems = items.map((item: any) => {
      const amount = item.quantity * item.unitPrice;
      const taxAmount = amount * (item.taxRate / 100);
      const totalAmount = amount + taxAmount;

      return {
        productId: item.productId,
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        amount: parseFloat(amount.toFixed(2)),
        taxRate: parseFloat(item.taxRate),
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        remark: item.remark || null,
      };
    });

    // 计算订单总金额
    const { totalAmount, finalAmount, discountAmount } = calculateOrderTotal(calculatedItems);

    // 生成订单号
    const orderNumber = await generateOrderNumber();

    // 创建采购订单及明细（使用事务）
    const purchaseOrder = await prisma.$transaction(async (tx) => {
      // 创建采购订单
      const order = await tx.purchaseOrder.create({
        data: {
          orderNumber,
          shopId,
          supplierId,
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          discountRate: discountRate ? parseFloat(discountRate) : null,
          discountAmount: discountAmount ? parseFloat(discountAmount.toFixed(2)) : null,
          finalAmount: parseFloat(finalAmount.toFixed(2)),
          urgent: Boolean(urgent),
          remark: remark || null,
          operatorId: user.id,
          status: 'CREATED',
        },
      });

      // 创建订单明细
      await tx.purchaseOrderItem.createMany({
        data: calculatedItems.map((item) => ({
          ...item,
          purchaseOrderId: order.id,
        })),
      });

      return order;
    });

    // 获取完整的订单信息（包含明细）
    const fullOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrder.id },
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
        items: {
          include: {
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
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    // 记录操作日志
    await prisma.log.create({
      data: {
        category: 'PURCHASE',
        module: 'PURCHASE_ORDER',
        operation: 'CREATE',
        operatorAccountId: user.id,
        status: 'SUCCESS',
        details: {
          purchaseOrderId: purchaseOrder.id,
          shopId,
          supplierId,
          itemsCount: items.length,
          totalAmount,
          urgent,
        },
      },
    });

    return NextResponse.json({
      code: 0,
      msg: '创建成功',
      data: fullOrder,
    });
  } catch (error) {
    console.error('创建采购订单失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
}
