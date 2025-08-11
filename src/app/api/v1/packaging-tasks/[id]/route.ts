import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ProductItemRelatedType } from '@/services/product-items';

export const dynamic = 'force-dynamic';

// 获取包装任务详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        {
          code: 400,
          msg: '包装任务ID不能为空',
        },
        { status: 400 }
      );
    }

    // 查询包装任务详情
    const task = await prisma.packagingTask.findUnique({
      where: { id },
      include: {
        shop: {
          select: { id: true, nickname: true },
        },
        operator: {
          select: { id: true, name: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        {
          code: 404,
          msg: '包装任务不存在',
        },
        { status: 404 }
      );
    }

    // 查询关联的产品明细
    const productItems = await prisma.productItem.findMany({
      where: {
        relatedType: ProductItemRelatedType.PACKAGING_TASK,
        relatedId: id,
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

    return NextResponse.json({
      code: 0,
      data: {
        ...task,
        items: productItems,
      },
      msg: '获取包装任务详情成功',
    });
  } catch (error) {
    console.error('获取包装任务详情失败:', error);
    return NextResponse.json(
      {
        code: 500,
        msg: '获取包装任务详情失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

// 更新包装任务
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { items, ...taskData } = await request.json();
    
    // 检查任务是否存在
    const existingTask = await prisma.packagingTask.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json(
        {
          code: 404,
          msg: '包装任务不存在',
        },
        { status: 404 }
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

    // 使用事务更新包装任务和产品明细
    const result = await prisma.$transaction(async (tx) => {
      // 更新任务
      const updatedTask = await tx.packagingTask.update({
        where: { id },
        data: {
          ...taskData,
          updatedAt: new Date(),
        },
        include: {
          shop: true,
          operator: true,
        },
      });

      // 如果提供了产品明细，更新产品明细
      if (items !== undefined) {
        // 删除原有明细
        await tx.productItem.deleteMany({
          where: {
            relatedType: ProductItemRelatedType.PACKAGING_TASK,
            relatedId: id,
          },
        });

        // 创建新明细
        if (items.length > 0) {
          await Promise.all(
            items.map((item: any) =>
              tx.productItem.create({
                data: {
                  relatedType: ProductItemRelatedType.PACKAGING_TASK,
                  relatedId: id,
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
      }

      return updatedTask;
    });

    return NextResponse.json({
      code: 0,
      data: result,
      msg: '更新包装任务成功',
    });
  } catch (error) {
    console.error('更新包装任务失败:', error);
    return NextResponse.json(
      {
        code: 500,
        msg: '更新包装任务失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

// 删除包装任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    // 检查任务是否存在
    const existingTask = await prisma.packagingTask.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json(
        {
          code: 404,
          msg: '包装任务不存在',
        },
        { status: 404 }
      );
    }

    // 删除任务
    await prisma.packagingTask.delete({
      where: { id },
    });

    return NextResponse.json({
      code: 0,
      data: { message: '删除成功' },
      msg: '删除包装任务成功',
    });
  } catch (error) {
    console.error('删除包装任务失败:', error);
    return NextResponse.json(
      {
        code: 500,
        msg: '删除包装任务失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}