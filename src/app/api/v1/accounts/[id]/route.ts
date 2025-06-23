import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET /api/v1/accounts/[id] - 获取账户详情
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        {
          code: 1,
          message: '账户不存在',
          data: null,
        },
        { status: 404 }
      );
    }

    // 收集所有权限
    const allPermissions = new Set<string>();
    account.roles.forEach((ar: any) => {
      ar.role.permissions.forEach((rp: any) => {
        allPermissions.add(rp.permission.code);
      });
    });

    const formattedAccount = {
      id: account.id,
      name: account.name,
      operator: account.operator,
      status: account.status === 'ACTIVE' ? 1 : 0,
      permissions: Array.from(allPermissions),
      roles: account.roles.map((ar: any) => ({
        id: ar.role.id,
        name: ar.role.name,
        status: ar.role.status === 'ACTIVE' ? 1 : 0,
      })),
      created_at: account.createdAt.toISOString(),
      updated_at: account.updatedAt.toISOString(),
      deleted_at: null,
    };

    return NextResponse.json({
      code: 0,
      msg: '获取成功',
      data: formattedAccount,
    });
  } catch (error) {
    console.error('获取账户详情失败:', error);
    return NextResponse.json(
      {
        code: 1,
        message: '服务器内部错误',
        data: null,
      },
      { status: 500 }
    );
  }
}

// PUT /api/v1/accounts/[id] - 更新账户
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, status, operator, roleIds = [] } = body;

    // 验证必填字段
    if (!name || !operator) {
      return NextResponse.json(
        {
          code: 1,
          message: '缺少必填字段',
          data: null,
        },
        { status: 400 }
      );
    }

    // 检查账户是否存在
    const existingAccount = await prisma.account.findUnique({
      where: { id },
    });

    if (!existingAccount) {
      return NextResponse.json(
        {
          code: 1,
          message: '账户不存在',
          data: null,
        },
        { status: 404 }
      );
    }

    // 检查账户名是否被其他账户使用
    if (name !== existingAccount.name) {
      const duplicateAccount = await prisma.account.findUnique({
        where: { name },
      });

      if (duplicateAccount) {
        return NextResponse.json(
          {
            code: 1,
            message: '账户名已存在',
            data: null,
          },
          { status: 400 }
        );
      }
    }

    // 更新账户基本信息
    const updatedAccount = await prisma.account.update({
      where: { id },
      data: {
        name,
        status: status === 1 ? 'ACTIVE' : 'INACTIVE',
        operator,
      },
    });

    // 更新角色关联
    if (roleIds.length >= 0) {
      // 删除现有角色关联
      await prisma.accountRole.deleteMany({
        where: { accountId: id },
      });

      // 创建新的角色关联
      if (roleIds.length > 0) {
        await prisma.accountRole.createMany({
          data: roleIds.map((roleId: string) => ({
            accountId: id,
            roleId,
          })),
        });
      }
    }

    const formattedAccount = {
      id: updatedAccount.id,
      name: updatedAccount.name,
      operator: updatedAccount.operator,
      status: updatedAccount.status === 'ACTIVE' ? 1 : 0,
      created_at: updatedAccount.createdAt.toISOString(),
      updated_at: updatedAccount.updatedAt.toISOString(),
      deleted_at: null,
    };

    return NextResponse.json({
      code: 0,
      message: '更新成功',
      data: formattedAccount,
    });
  } catch (error) {
    console.error('更新账户失败:', error);
    return NextResponse.json(
      {
        code: 1,
        message: '服务器内部错误',
        data: null,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/accounts/[id] - 删除账户
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // 检查账户是否存在
    const existingAccount = await prisma.account.findUnique({
      where: { id },
    });

    if (!existingAccount) {
      return NextResponse.json(
        {
          code: 1,
          message: '账户不存在',
          data: null,
        },
        { status: 404 }
      );
    }

    // 删除账户角色关联
    await prisma.accountRole.deleteMany({
      where: { accountId: id },
    });

    // 删除账户
    await prisma.account.delete({
      where: { id },
    });

    return NextResponse.json({
      code: 0,
      message: '删除成功',
      data: null,
    });
  } catch (error) {
    console.error('删除账户失败:', error);
    return NextResponse.json(
      {
        code: 1,
        message: '服务器内部错误',
        data: null,
      },
      { status: 500 }
    );
  }
}
