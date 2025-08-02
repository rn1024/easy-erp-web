import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 标记为动态路由
export const dynamic = 'force-dynamic';

// GET /api/v1/logs/stats - 获取日志统计信息
export async function GET(request: NextRequest) {
  try {
    // 验证用户权限
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 获取统计数据
    const [totalLogs, successLogs, failureLogs, categoryStats, moduleStats] = await Promise.all([
      // 总日志数
      prisma.log.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      // 成功操作数
      prisma.log.count({
        where: {
          status: 'SUCCESS',
          createdAt: {
            gte: startDate,
          },
        },
      }),
      // 失败操作数
      prisma.log.count({
        where: {
          status: 'FAILURE',
          createdAt: {
            gte: startDate,
          },
        },
      }),
      // 分类统计
      prisma.log.groupBy({
        by: ['category'],
        _count: {
          id: true,
        },
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      }),
      // 模块统计
      prisma.log.groupBy({
        by: ['module'],
        _count: {
          id: true,
        },
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // 计算每日日志统计
    const dailyStats = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayCount = await prisma.log.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        count: dayCount,
      });
    }

    // 格式化分类统计
    const formattedCategoryStats = categoryStats.map((stat) => ({
      category: stat.category,
      count: stat._count.id,
    }));

    // 格式化模块统计
    const formattedModuleStats = moduleStats.map((stat) => ({
      module: stat.module,
      count: stat._count.id,
    }));

    const successRate = totalLogs > 0 ? ((successLogs / totalLogs) * 100).toFixed(2) : '0.00';

    return NextResponse.json({
      code: 0,
      msg: '获取日志统计成功',
      data: {
        total: totalLogs,
        success: successLogs,
        failure: failureLogs,
        successRate: parseFloat(successRate),
        dailyStats,
        categoryStats: formattedCategoryStats,
        moduleStats: formattedModuleStats,
        period: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          days,
        },
      },
    });
  } catch (error) {
    console.error('获取日志统计失败:', error);
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
