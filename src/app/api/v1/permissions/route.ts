import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/v1/permissions - 获取权限列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 权限类型筛选

    // 构建查询条件
    const where: any = {};
    if (type) {
      where.code = {
        startsWith: type,
      };
    }

    // 获取权限列表
    const permissions = await prisma.permission.findMany({
      where,
      orderBy: {
        code: 'asc',
      },
    });

    // 按模块分组
    const groupedPermissions = permissions.reduce((acc: any, permission) => {
      const module = permission.code.split('.')[0];
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push({
        code: permission.code,
        name: permission.name,
      });
      return acc;
    }, {});

    return NextResponse.json({
      code: 0,
      msg: '获取成功',
      data: {
        list: permissions.map((p) => ({
          code: p.code,
          name: p.name,
        })),
        grouped: groupedPermissions,
      },
    });
  } catch (error) {
    console.error('获取权限列表失败:', error);
    return NextResponse.json(
      {
        code: 1,
        msg: '服务器内部错误',
        data: null,
      },
      { status: 500 }
    );
  }
}
