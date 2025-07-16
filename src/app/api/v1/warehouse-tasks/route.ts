import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 获取仓库任务列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const categoryId = searchParams.get('categoryId');
    const productId = searchParams.get('productId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // 构建查询条件
    const where: any = {};

    if (shopId) {
      where.shopId = shopId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (productId) {
      where.productId = productId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // 执行查询
    const [tasks, total] = await Promise.all([
      prisma.warehouseTask.findMany({
        where,
        include: {
          shop: {
            select: { id: true, nickname: true },
          },
          operator: {
            select: { id: true, name: true },
          },
          // 产品明细通过独立API查询：GET /api/v1/product-items?relatedType=WAREHOUSE_TASK&relatedId=taskId
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.warehouseTask.count({ where }),
    ]);

    return NextResponse.json({
      code: 0,
      msg: '获取仓库任务列表成功',
      data: {
        list: tasks,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get warehouse tasks error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// 创建仓库任务
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        {
          code: 401,
          msg: '未授权访问',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { shopId, type, items } = body;

    // 数据验证
    if (!shopId || !type || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          code: 400,
          msg: '缺少必要参数或产品明细为空',
        },
        { status: 400 }
      );
    }

    // 验证任务类型
    if (!['PACKAGING', 'SHIPPING'].includes(type)) {
      return NextResponse.json(
        {
          code: 400,
          msg: '无效的任务类型',
        },
        { status: 400 }
      );
    }

    // 验证产品明细
    for (const item of items) {
      if (!item.productId || !item.quantity) {
        return NextResponse.json(
          {
            code: 400,
            msg: '产品明细信息不完整',
          },
          { status: 400 }
        );
      }
      if (item.quantity <= 0) {
        return NextResponse.json(
          {
            code: 400,
            msg: '产品数量必须大于0',
          },
          { status: 400 }
        );
      }
      // 包装任务验证完成数量
      if (type === 'PACKAGING' && item.completedQuantity !== undefined) {
        if (item.completedQuantity < 0 || item.completedQuantity > item.quantity) {
          return NextResponse.json(
            {
              code: 400,
              msg: '完成数量不能小于0或大于总数量',
            },
            { status: 400 }
          );
        }
      }
    }

    // 验证店铺是否存在
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      return NextResponse.json(
        {
          code: 404,
          msg: '店铺不存在',
        },
        { status: 404 }
      );
    }

    // 验证所有产品是否存在
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.productInfo.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        {
          code: 400,
          msg: '部分产品不存在',
        },
        { status: 400 }
      );
    }

    // 创建仓库任务及产品明细（使用事务）
    const task = await prisma.$transaction(async (tx) => {
      // 创建仓库任务
      const createdTask = await tx.warehouseTask.create({
        data: {
          shopId,
          type,
          status: 'PENDING',
          operatorId: user.id,
          // 仅包装任务设置初始进度
          progress: type === 'PACKAGING' ? 0 : null,
        },
      });

      // 创建产品明细
      await tx.productItem.createMany({
        data: items.map((item: any) => ({
          relatedType: 'WAREHOUSE_TASK',
          relatedId: createdTask.id,
          productId: item.productId,
          quantity: item.quantity,
          completedQuantity: item.completedQuantity || null,
          remark: item.remark || null,
        })),
      });

      return createdTask;
    });

    // 获取完整的任务信息
    const fullTask = await prisma.warehouseTask.findUnique({
      where: { id: task.id },
      include: {
        shop: {
          select: { id: true, nickname: true },
        },
        operator: {
          select: { id: true, name: true },
        },
        // 产品明细通过独立API查询：GET /api/v1/product-items?relatedType=WAREHOUSE_TASK&relatedId=taskId
      },
    });

    return NextResponse.json({
      code: 200,
      msg: '创建仓库任务成功',
      data: fullTask,
    });
  } catch (error) {
    console.error('Create warehouse task error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
