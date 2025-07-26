import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 模拟包装任务数据存储（与主路由共享）
const packagingTasks: any[] = [];

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
    const task = packagingTasks.find(t => t.id === id);

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
      code: 200,
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
    const taskIndex = packagingTasks.findIndex(t => t.id === id);

    if (taskIndex === -1) {
      return NextResponse.json(
        {
          code: 404,
          msg: '包装任务不存在',
        },
        { status: 404 }
      );
    }

    // 更新任务
    const updatedTask = {
      ...packagingTasks[taskIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    packagingTasks[taskIndex] = updatedTask;

    return NextResponse.json({
      code: 200,
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
    const taskIndex = packagingTasks.findIndex(t => t.id === id);

    if (taskIndex === -1) {
      return NextResponse.json(
        {
          code: 404,
          msg: '包装任务不存在',
        },
        { status: 404 }
      );
    }

    // 删除任务
    packagingTasks.splice(taskIndex, 1);

    return NextResponse.json({
      code: 200,
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