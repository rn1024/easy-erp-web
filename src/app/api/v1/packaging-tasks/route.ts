import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PackagingTaskStatus, PackagingTaskType } from '@/services/packaging';

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

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      code: 200,
      data: {
        list: tasks,
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

    const body = await request.json();
    const { shopId, type = PackagingTaskType.PACKAGING, progress = 0 } = body;

    if (!shopId) {
      return NextResponse.json(
        {
          code: 400,
          msg: '店铺ID不能为空',
        },
        { status: 400 }
      );
    }

    // 创建包装任务
    const newTask = await prisma.packagingTask.create({
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