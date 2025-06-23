import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRequestToken } from '@/lib/auth';

// 标记为动态路由
export const dynamic = 'force-dynamic';

// GET /api/v1/logs - 获取系统日志列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户权限
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const category = searchParams.get('category');
    const module = searchParams.get('module');
    const operation = searchParams.get('operation');
    const status = searchParams.get('status');
    const operatorAccountId = searchParams.get('operatorAccountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (module) {
      where.module = {
        contains: module,
      };
    }

    if (operation) {
      where.operation = {
        contains: operation,
      };
    }

    if (status) {
      where.status = status;
    }

    if (operatorAccountId) {
      where.operatorAccountId = operatorAccountId;
    }

    // 时间范围过滤
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDateTime;
      }
    }

    // 获取日志列表和总数
    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        include: {
          operator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.log.count({ where }),
    ]);

    // 格式化数据
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      category: log.category,
      module: log.module,
      operation: log.operation,
      status: log.status,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
      operator: {
        id: log.operator.id,
        name: log.operator.name,
      },
      operatorAccountId: log.operatorAccountId,
    }));

    return NextResponse.json({
      code: 200,
      msg: '获取日志列表成功',
      data: {
        list: formattedLogs,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取日志列表失败:', error);
    return NextResponse.json(
      {
        code: 500,
        msg: '服务器内部错误',
        data: null,
      },
      { status: 500 }
    );
  }
}
