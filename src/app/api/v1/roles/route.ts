// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/v1/roles - 获取角色列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const name = searchParams.get('name');

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    if (status !== null && status !== undefined && status !== '') {
      where.status = status === '1' ? 'ACTIVE' : 'INACTIVE';
    }

    // 添加名称搜索
    if (name) {
      where.name = {
        contains: name,
      };
    }

    // 获取角色列表
    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.role.count({ where }),
    ]);

    // 格式化数据
    const formattedRoles = roles.map((role: any) => ({
      id: role.id,
      name: role.name,
      status: role.status === 'ACTIVE' ? 1 : 0,
      permissions: role.permissions.map((rp: any) => rp.permission.code),
      operator: role.operator,
      created_at: role.createdAt.toISOString(),
      updated_at: role.updatedAt.toISOString(),
      deleted_at: null,
    }));

    return NextResponse.json({
      code: 0,
      msg: '获取成功',
      data: {
        list: formattedRoles,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取角色列表失败:', error);
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

// POST /api/v1/roles - 创建角色
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, status = 1, operator, permissions = [] } = body;

    // 验证必填字段
    if (!name || !operator) {
      return NextResponse.json(
        {
          code: 1,
          msg: '缺少必填字段',
          data: null,
        },
        { status: 400 }
      );
    }

    // 检查角色名是否已存在
    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      return NextResponse.json(
        {
          code: 1,
          msg: '角色名已存在',
          data: null,
        },
        { status: 400 }
      );
    }

    // 创建角色
    const role = await prisma.role.create({
      data: {
        name,
        status: status === 1 ? 'ACTIVE' : 'INACTIVE',
        operator,
      },
    });

    // 如果提供了权限列表，创建权限关联
    if (permissions.length > 0) {
      // 获取权限ID
      const permissionRecords = await prisma.permission.findMany({
        where: {
          code: { in: permissions },
        },
      });

      // 创建权限关联
      if (permissionRecords.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionRecords.map((permission) => ({
            roleId: role.id,
            permissionId: permission.id,
          })),
        });
      }
    }

    const formattedRole = {
      id: role.id,
      name: role.name,
      status: role.status === 'ACTIVE' ? 1 : 0,
      permissions,
      operator: role.operator,
      created_at: role.createdAt.toISOString(),
      updated_at: role.updatedAt.toISOString(),
      deleted_at: null,
    };

    return NextResponse.json({
      code: 0,
      msg: '创建成功',
      data: formattedRole,
    });
  } catch (error) {
    console.error('创建角色失败:', error);
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
