import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
    const task = await prisma.packagingTask.findUnique({
      where: { id },
      include: {
        shop: true,
        operator: true,
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

    return NextResponse.json({
      code: 0,
      data: task,
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
    const data = await request.json();
    
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

    // 更新任务
    const updatedTask = await prisma.packagingTask.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        shop: true,
        operator: true,
      },
    });

    return NextResponse.json({
      code: 0,
      data: updatedTask,
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