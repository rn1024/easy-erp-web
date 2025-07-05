import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 获取仓库任务详情
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const task = await prisma.warehouseTask.findUnique({
      where: { id: params.id },
      include: {
        shop: {
          select: { id: true, nickname: true },
        },
        category: {
          select: { id: true, name: true },
        },
        product: {
          select: { id: true, code: true, specification: true, sku: true },
        },
        operator: {
          select: { id: true, name: true, operator: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ message: 'Warehouse task not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Get warehouse task error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// 更新仓库任务
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { totalQuantity, progress, status, type } = body;

    // 检查任务是否存在
    const existingTask = await prisma.warehouseTask.findUnique({
      where: { id: params.id },
    });

    if (!existingTask) {
      return NextResponse.json({ message: 'Warehouse task not found' }, { status: 404 });
    }

    // 构建更新数据
    const updateData: any = {};

    if (totalQuantity !== undefined) {
      if (totalQuantity <= 0) {
        return NextResponse.json(
          { message: 'Total quantity must be greater than 0' },
          { status: 400 }
        );
      }
      updateData.totalQuantity = totalQuantity;
    }

    if (progress !== undefined) {
      if (progress < 0 || progress > 100) {
        return NextResponse.json(
          { message: 'Progress must be between 0 and 100' },
          { status: 400 }
        );
      }
      updateData.progress = progress;

      // 如果进度达到100%，自动更新状态为完成
      if (progress === 100) {
        updateData.status = 'COMPLETED';
      }
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (type !== undefined) {
      updateData.type = type;
    }

    // 更新仓库任务
    const task = await prisma.warehouseTask.update({
      where: { id: params.id },
      data: updateData,
      include: {
        shop: {
          select: { id: true, nickname: true },
        },
        category: {
          select: { id: true, name: true },
        },
        product: {
          select: { id: true, code: true, specification: true, sku: true },
        },
        operator: {
          select: { id: true, name: true, operator: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Update warehouse task error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// 删除仓库任务
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 检查任务是否存在
    const existingTask = await prisma.warehouseTask.findUnique({
      where: { id: params.id },
    });

    if (!existingTask) {
      return NextResponse.json({ message: 'Warehouse task not found' }, { status: 404 });
    }

    // 只允许删除未开始或已取消的任务
    if (existingTask.status === 'IN_PROGRESS' || existingTask.status === 'COMPLETED') {
      return NextResponse.json(
        { message: 'Cannot delete task in progress or completed' },
        { status: 400 }
      );
    }

    // 删除仓库任务
    await prisma.warehouseTask.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Warehouse task deleted successfully',
    });
  } catch (error) {
    console.error('Delete warehouse task error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
