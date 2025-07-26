import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PackagingTaskStatus, PackagingTaskType } from '@/services/packaging';

export const dynamic = 'force-dynamic';

// 模拟包装任务数据存储
const packagingTasks: any[] = [];
let nextId = 1;

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

    // 过滤数据
    let filteredTasks = packagingTasks;
    if (shopId) {
      filteredTasks = filteredTasks.filter(task => task.shopId === shopId);
    }
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    if (type) {
      filteredTasks = filteredTasks.filter(task => task.type === type);
    }

    // 分页
    const total = filteredTasks.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const list = filteredTasks.slice(startIndex, endIndex);

    return NextResponse.json({
      code: 200,
      data: {
        list,
        total,
        page,
        pageSize,
        totalPages,
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

    const data = await request.json();
    const { shopId, type, progress = 0 } = data;

    if (!shopId || !type) {
      return NextResponse.json(
        {
          code: 400,
          msg: '缺少必要参数',
        },
        { status: 400 }
      );
    }

    const newTask = {
      id: nextId.toString(),
      shopId,
      type,
      progress,
      status: PackagingTaskStatus.PENDING,
      operatorId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      shop: {
        id: shopId,
        nickname: `店铺${shopId}`,
      },
      operator: {
        id: user.id,
        name: user.name,
      },
    };

    packagingTasks.push(newTask);
    nextId++;

    return NextResponse.json({
      code: 200,
      data: newTask,
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