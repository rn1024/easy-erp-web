// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRequestToken } from '@/lib/auth';

// GET /api/v1/roles/name/{name} - 根据角色名称查询角色
export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
  try {
    // 认证检查
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
      return NextResponse.json(
        {
          code: 1,
          msg: '未授权访问',
          data: null,
        },
        { status: 401 }
      );
    }

    const { name } = params;

    if (!name) {
      return NextResponse.json(
        {
          code: 1,
          msg: '缺少角色名称参数',
          data: null,
        },
        { status: 400 }
      );
    }

    // 根据名称查询角色
    const role = await prisma.role.findUnique({
      where: { name: decodeURIComponent(name) },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        {
          code: 1,
          msg: '角色不存在',
          data: null,
        },
        { status: 404 }
      );
    }

    // 格式化数据
    const formattedRole = {
      id: role.id,
      name: role.name,
      status: role.status === 'ACTIVE' ? 1 : 0,
      permissions: role.permissions.map((rp: any) => rp.permission.code),
      operator: role.operator,
      created_at: role.createdAt.toISOString(),
      updated_at: role.updatedAt.toISOString(),
      deleted_at: null,
    };

    return NextResponse.json({
      code: 0,
      msg: '获取成功',
      data: formattedRole,
    });
  } catch (error) {
    console.error('根据名称查询角色失败:', error);
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