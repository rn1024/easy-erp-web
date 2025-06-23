import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRequestToken } from '@/lib/auth';

// 标记为动态路由
export const dynamic = 'force-dynamic';

// GET /api/v1/logs/stats - 获取日志统计信息
export async function GET(request: NextRequest) {
  try {
    // 验证用户权限
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
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

    return NextResponse.json({
      code: 200,
      msg: '获取统计信息成功',
      data: {
        summary: {
          total: totalLogs,
          success: successLogs,
          failure: failureLogs,
          successRate: totalLogs > 0 ? ((successLogs / totalLogs) * 100).toFixed(2) : '0',
        },
        categoryStats: categoryStats.map((item) => ({
          category: item.category,
          count: item._count.id,
        })),
        moduleStats: moduleStats.map((item) => ({
          module: item.module,
          count: item._count.id,
        })),
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
