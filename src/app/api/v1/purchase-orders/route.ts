// 标记为动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

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

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};
    if (shopId) where.shopId = shopId;
    if (supplierId) where.supplierId = supplierId;
    if (productId) where.productId = productId;
    if (status) where.status = status;
    if (urgent !== null && urgent !== undefined) {
      where.urgent = urgent === 'true';
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
      orderBy: [{ urgent: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: pageSize,
    });

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: {
        list,
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
    const { shopId, supplierId, productId, quantity, totalAmount, urgent = false, remark } = body;

    // 验证必填字段
    if (!shopId || !supplierId || !productId || !quantity || !totalAmount) {
      return NextResponse.json({ code: 400, msg: '缺少必要参数' }, { status: 400 });
    }

    // 验证数量和金额
    if (quantity <= 0 || totalAmount <= 0) {
      return NextResponse.json({ code: 400, msg: '数量和金额必须大于0' }, { status: 400 });
    }

    // 验证关联数据是否存在
    const [shop, supplier, product] = await Promise.all([
      prisma.shop.findUnique({ where: { id: shopId } }),
      prisma.supplier.findUnique({ where: { id: supplierId } }),
      prisma.productInfo.findUnique({ where: { id: productId } }),
    ]);

    if (!shop) {
      return NextResponse.json({ code: 400, msg: '店铺不存在' }, { status: 400 });
    }

    if (!supplier) {
      return NextResponse.json({ code: 400, msg: '供应商不存在' }, { status: 400 });
    }

    if (!product) {
      return NextResponse.json({ code: 400, msg: '产品不存在' }, { status: 400 });
    }

    // 创建采购订单
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        shopId,
        supplierId,
        productId,
        quantity: parseInt(quantity),
        totalAmount: parseFloat(totalAmount),
        urgent: Boolean(urgent),
        remark: remark || null,
        operatorId: user.id,
      },
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
        operation: 'CREATE',
        operatorAccountId: user.id,
        status: 'SUCCESS',
        details: {
          purchaseOrderId: purchaseOrder.id,
          shopId,
          supplierId,
          productId,
          quantity,
          totalAmount,
          urgent,
        },
      },
    });

    return NextResponse.json({
      code: 200,
      msg: '创建成功',
      data: purchaseOrder,
    });
  } catch (error) {
    console.error('创建采购订单失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
}
