import { NextRequest, NextResponse } from 'next/server';

import { generateAccessToken, generateRefreshToken, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redisService } from '@/lib/redis';

interface LoginRequest {
  username: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    // 验证请求体
    const body = await request.json();
    const { username, password } = body as LoginRequest;

    // 基本参数验证
    if (!username || !password) {
      return NextResponse.json(
        { code: 1, msg: '用户名和密码不能为空', data: null },
        { status: 400 }
      );
    }

    // 查找用户
    const account = await prisma.account.findUnique({
      where: { name: username },
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
      return NextResponse.json({ code: 1, msg: '用户名或密码错误', data: null }, { status: 401 });
    }

    // 检查账户状态
    if (account.status !== 'ACTIVE') {
      return NextResponse.json({ code: 1, msg: '账户已被禁用', data: null }, { status: 401 });
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, account.password);
    if (!isPasswordValid) {
      return NextResponse.json({ code: 1, msg: '用户名或密码错误', data: null }, { status: 401 });
    }

    // 提取角色和权限
    const roles = account.roles.map((ar) => ar.role);
    const permissions = roles.flatMap((role) => role.permissions.map((rp) => rp.permission.code));

    // 生成JWT令牌
    const token = generateAccessToken({
      id: account.id,
      name: account.name,
      roles: roles.map((r) => r.name),
      permissions,
    });

    // 生成刷新令牌
    const refreshToken = generateRefreshToken({ id: account.id });

    // 存储刷新令牌到Redis（30天过期）
    await redisService.set(`refresh_token:${account.id}`, refreshToken, 30 * 24 * 3600);

    // 更新最后登录时间
    await prisma.account.update({
      where: { id: account.id },
      data: { updatedAt: new Date() },
    });

    // 返回成功响应
    return NextResponse.json({
      code: 0,
      msg: '登录成功',
      data: {
        token,
        refreshToken,
        user: {
          id: account.id,
          name: account.name,
          status: account.status,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
        },
        roles: roles.map((role) => ({
          id: role.id,
          name: role.name,
          status: role.status,
        })),
        permissions,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ code: 1, msg: '登录失败，请稍后重试', data: null }, { status: 500 });
  }
}
