import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ProductItemRelatedType } from '@/services/product-items';

export const dynamic = 'force-dynamic';

// 获取产品明细列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const relatedType = searchParams.get('relatedType') as ProductItemRelatedType;
    const relatedId = searchParams.get('relatedId');

    if (!relatedType || !relatedId) {
      return NextResponse.json(
        {
          code: 400,
          msg: '缺少必要参数 relatedType 或 relatedId',
        },
        { status: 400 }
      );
    }

    const items = await prisma.productItem.findMany({
      where: {
        relatedType,
        relatedId,
      },
      include: {
        product: {
          include: {
            shop: {
              select: { id: true, nickname: true },
            },
            category: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      code: 200,
      data: items,
      msg: '获取产品明细列表成功',
    });
  } catch (error) {
    console.error('获取产品明细列表失败:', error);
    return NextResponse.json(
      {
        code: 500,
        msg: '获取产品明细列表失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

// 批量创建/更新产品明细
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { relatedType, relatedId, items } = await request.json();

    if (!relatedType || !relatedId || !Array.isArray(items)) {
      return NextResponse.json(
        {
          code: 400,
          msg: '请求参数格式错误',
        },
        { status: 400 }
      );
    }

    // 验证关联业务单据是否存在
    if (relatedType === ProductItemRelatedType.PURCHASE_ORDER) {
      const order = await prisma.purchaseOrder.findUnique({
        where: { id: relatedId },
      });
      if (!order) {
        return NextResponse.json(
          {
            code: 404,
            msg: '采购订单不存在',
          },
          { status: 404 }
        );
      }
    } else if (relatedType === ProductItemRelatedType.WAREHOUSE_TASK) {
      const task = await prisma.warehouseTask.findUnique({
        where: { id: relatedId },
      });
      if (!task) {
        return NextResponse.json(
          {
            code: 404,
            msg: '仓库任务不存在',
          },
          { status: 404 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 删除原有明细
      await tx.productItem.deleteMany({
        where: {
          relatedType,
          relatedId,
        },
      });

      // 创建新明细
      const createdItems = await Promise.all(
        items.map((item: any) =>
          tx.productItem.create({
            data: {
              relatedType,
              relatedId,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice || null,
              amount: item.amount || null,
              taxRate: item.taxRate || null,
              taxAmount: item.taxAmount || null,
              totalAmount: item.totalAmount || null,
              completedQuantity: item.completedQuantity || null,
              remark: item.remark || null,
            },
            include: {
              product: {
                include: {
                  shop: { select: { id: true, nickname: true } },
                  category: { select: { id: true, name: true } },
                },
              },
            },
          })
        )
      );

      return createdItems;
    });

    return NextResponse.json({
      code: 200,
      data: result,
      msg: '产品明细保存成功',
    });
  } catch (error) {
    console.error('保存产品明细失败:', error);
    return NextResponse.json(
      {
        code: 500,
        msg: '保存产品明细失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
