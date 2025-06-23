// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET /api/v1/accounts - 获取账户列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const name = searchParams.get('name');
    const withRole = searchParams.get('withRole') === 'true';

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    if (status !== null && status !== undefined && status !== '') {
      where.status = status === '1' ? 'ACTIVE' : 'INACTIVE';
    }
    if (name) {
      where.name = {
        contains: name,
      };
    }

    // 构建include条件
    const include: any = {};
    if (withRole) {
      include.roles = {
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
      };
    }

    // 获取账户列表
    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where,
        include,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.account.count({ where }),
    ]);

    // 格式化数据
    const formattedAccounts = accounts.map((account: any) => {
      const result: any = {
        id: account.id,
        name: account.name,
        operator: account.operator,
        status: account.status === 'ACTIVE' ? 1 : 0,
        created_at: account.createdAt.toISOString(),
        updated_at: account.updatedAt.toISOString(),
        deleted_at: null,
      };

      if (withRole && account.roles) {
        result.roles = account.roles.map((ar: any) => ({
          id: ar.role.id,
          name: ar.role.name,
          status: ar.role.status === 'ACTIVE' ? 1 : 0,
          permissions: ar.role.permissions.map((rp: any) => rp.permission.code),
        }));
      }

      return result;
    });

    return NextResponse.json({
      code: 0,
      msg: '获取成功',
      data: {
        list: formattedAccounts,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取账户列表失败:', error);
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

// POST /api/v1/accounts - 创建账户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, password, status = 1, operator, roleIds = [] } = body;

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

    // 检查账户名是否已存在
    const existingAccount = await prisma.account.findUnique({
      where: { name },
    });

    if (existingAccount) {
      return NextResponse.json(
        {
          code: 1,
          msg: '账户名已存在',
          data: null,
        },
        { status: 400 }
      );
    }

    // 生成默认密码或使用提供的密码
    const defaultPassword = password || '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // 创建账户
    const account = await prisma.account.create({
      data: {
        name,
        operator,
        password: hashedPassword,
        status: status === 1 ? 'ACTIVE' : 'INACTIVE',
      },
    });

    // 如果提供了角色ID，建立关联关系
    if (roleIds.length > 0) {
      await prisma.accountRole.createMany({
        data: roleIds.map((roleId: string) => ({
          accountId: account.id,
          roleId,
        })),
      });
    }

    const formattedAccount = {
      id: account.id,
      name: account.name,
      operator: account.operator,
      status: account.status === 'ACTIVE' ? 1 : 0,
      created_at: account.createdAt.toISOString(),
      updated_at: account.updatedAt.toISOString(),
      deleted_at: null,
    };

    return NextResponse.json({
      code: 0,
      msg: '创建成功',
      data: formattedAccount,
    });
  } catch (error) {
    console.error('创建账户失败:', error);
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
