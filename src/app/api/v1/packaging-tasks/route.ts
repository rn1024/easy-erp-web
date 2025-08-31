import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PackagingTaskStatus, PackagingTaskType } from '@/services/packaging';
import { ProductItemRelatedType } from '@/services/product-items';

export const dynamic = 'force-dynamic';

// 获取包装任务列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // 构建查询条件
    const where: any = {};
    if (shopId) {
      where.shopId = shopId;
    }
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }

    // 查询总数
    const total = await prisma.packagingTask.count({ where });

    // 查询数据
    const tasks = await prisma.packagingTask.findMany({
      where,
      include: {
        shop: {
          select: { id: true, nickname: true },
        },
        operator: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 为每个任务查询关联的产品明细
    const tasksWithItems = await Promise.all(
      tasks.map(async (task) => {
        const productItems = await prisma.productItem.findMany({
          where: {
            relatedType: ProductItemRelatedType.PACKAGING_TASK,
            relatedId: task.id,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        });

        return {
          ...task,
          items: productItems,
        };
      })
    );

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      code: 0,
      data: {
        list: tasksWithItems,
        meta: {
          total,
          page,
          limit: pageSize,
          totalPages,
        },
      },
      msg: '获取包装任务列表成功',
    });
  } catch (error) {
    console.error('获取包装任务列表失败:', error);
    return NextResponse.json(
      {
        code: 500,
        msg: '获取包装任务列表失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

// 创建包装任务
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { shopId, type = PackagingTaskType.PACKAGING, progress = 0, items } = body;

    if (!shopId) {
      return NextResponse.json(
        {
          code: 400,
          msg: '店铺ID不能为空',
        },
        { status: 400 }
      );
    }

    // 如果提供了产品明细，进行校验
    if (items && !Array.isArray(items)) {
      return NextResponse.json(
        {
          code: 400,
          msg: '产品明细格式错误，必须是数组',
        },
        { status: 400 }
      );
    }

    // 校验产品明细中的必填字段
    if (items && items.length > 0) {
      for (const item of items) {
        if (!item.productId || !item.quantity) {
          return NextResponse.json(
            {
              code: 400,
              msg: '产品明细中缺少必填字段：productId 和 quantity',
            },
            { status: 400 }
          );
        }
        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          return NextResponse.json(
            {
              code: 400,
              msg: '产品数量必须是大于0的数字',
            },
            { status: 400 }
          );
        }
      }
    }

    // 使用事务创建包装任务和产品明细
    const result = await prisma.$transaction(async (tx) => {
      // 创建包装任务
      const newTask = await tx.packagingTask.create({
        data: {
          shopId,
          type,
          progress,
          status: PackagingTaskStatus.PENDING,
          operatorId: user.id,
        },
        include: {
          shop: {
            select: { id: true, nickname: true },
          },
          operator: {
            select: { id: true, name: true },
          },
        },
      });

      // 如果有产品明细，创建产品明细记录
      if (items && items.length > 0) {
        await Promise.all(
          items.map((item: any) =>
            tx.productItem.create({
              data: {
                relatedType: ProductItemRelatedType.PACKAGING_TASK,
                relatedId: newTask.id,
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
            })
          )
        );
      }

      return newTask;
    });

    return NextResponse.json({
      code: 0,
      data: result,
      msg: '创建包装任务成功',
    });
  } catch (error) {
    console.error('创建包装任务失败:', error);
    return NextResponse.json(
      {
        code: 500,
        msg: '创建包装任务失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
