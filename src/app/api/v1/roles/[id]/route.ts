// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRequestToken } from '@/lib/auth';

// GET /api/v1/roles/[id] - 获取角色详情
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;

    const role = await prisma.role.findUnique({
      where: { id },
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
    console.error('获取角色详情失败:', error);
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

// PUT /api/v1/roles/[id] - 更新角色
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;
    const body = await request.json();
    const { name, status, operator, permissions = [] } = body;

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

    // 检查角色是否存在
    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      return NextResponse.json(
        {
          code: 1,
          msg: '角色不存在',
          data: null,
        },
        { status: 404 }
      );
    }

    // 检查角色名是否被其他角色使用
    if (name !== existingRole.name) {
      const duplicateRole = await prisma.role.findUnique({
        where: { name },
      });

      if (duplicateRole) {
        return NextResponse.json(
          {
            code: 1,
            msg: '角色名已存在',
            data: null,
          },
          { status: 400 }
        );
      }
    }

    // 更新角色
    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name,
        status: status === 1 ? 'ACTIVE' : 'INACTIVE',
        operator,
      },
    });

    // 删除现有权限关联
    await prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // 如果提供了权限列表，更新权限关联
    if (permissions.length > 0) {
      // 获取权限ID
      const permissionRecords = await prisma.permission.findMany({
        where: {
          code: { in: permissions },
        },
      });

      // 创建新的权限关联
      if (permissionRecords.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionRecords.map((permission) => ({
            roleId: id,
            permissionId: permission.id,
          })),
        });
      }
    }

    const formattedRole = {
      id: updatedRole.id,
      name: updatedRole.name,
      status: updatedRole.status === 'ACTIVE' ? 1 : 0,
      permissions,
      operator: updatedRole.operator,
      created_at: updatedRole.createdAt.toISOString(),
      updated_at: updatedRole.updatedAt.toISOString(),
      deleted_at: null,
    };

    return NextResponse.json({
      code: 0,
      msg: '更新成功',
      data: formattedRole,
    });
  } catch (error) {
    console.error('更新角色失败:', error);
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

// DELETE /api/v1/roles/[id] - 删除角色
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;

    // 检查角色是否存在
    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      return NextResponse.json(
        {
          code: 1,
          msg: '角色不存在',
          data: null,
        },
        { status: 404 }
      );
    }

    // 检查是否有账户使用此角色
    const accountRoles = await prisma.accountRole.findMany({
      where: { roleId: id },
    });

    if (accountRoles.length > 0) {
      return NextResponse.json(
        {
          code: 1,
          msg: '该角色正在被使用，无法删除',
          data: null,
        },
        { status: 400 }
      );
    }

    // 删除角色权限关联
    await prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // 删除角色
    await prisma.role.delete({
      where: { id },
    });

    return NextResponse.json({
      code: 0,
      msg: '删除成功',
      data: null,
    });
  } catch (error) {
    console.error('删除角色失败:', error);
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
