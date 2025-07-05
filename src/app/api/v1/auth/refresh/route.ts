import { NextRequest, NextResponse } from 'next/server';
import { generateAccessToken, generateRefreshToken, verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redisService } from '@/lib/redis';

interface RefreshRequest {
  refreshToken: string;
}

export async function POST(request: NextRequest) {
  try {
    // 验证请求体
    const body = await request.json();
    const { refreshToken } = body as RefreshRequest;

    if (!refreshToken) {
      return NextResponse.json(
        {
          code: 1,
          msg: 'Refresh token is required',
          data: null,
        },
        { status: 400 }
      );
    }

    // 验证refresh token
    const payload = verifyToken(refreshToken);
    if (!payload || !payload.id) {
      return NextResponse.json(
        {
          code: 1,
          msg: 'Invalid refresh token',
          data: null,
        },
        { status: 401 }
      );
    }

    // 检查refresh token是否存在于Redis中
    const storedRefreshToken = await redisService.get<string>(`refresh_token:${payload.id}`);
    if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
      return NextResponse.json(
        {
          code: 1,
          msg: 'Refresh token not found or expired',
          data: null,
        },
        { status: 401 }
      );
    }

    // 查找用户信息
    const account = await prisma.account.findUnique({
      where: { id: payload.id },
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

    if (!account || account.status !== 'ACTIVE') {
      // 如果用户不存在或被禁用，清除refresh token
      await redisService.del(`refresh_token:${payload.id}`);
      return NextResponse.json(
        {
          code: 1,
          msg: 'User not found or disabled',
          data: null,
        },
        { status: 401 }
      );
    }

    // 提取角色和权限
    const roles = account.roles.map((ar) => ar.role);
    const permissions = roles.flatMap((role) => role.permissions.map((rp) => rp.permission.code));

    // 生成新的access token
    const newAccessToken = generateAccessToken({
      id: account.id,
      name: account.name,
      roles: roles.map((r) => r.name),
      permissions,
    });

    // 生成新的refresh token
    const newRefreshToken = generateRefreshToken({ id: account.id });

    // 更新Redis中的refresh token
    await redisService.set(`refresh_token:${account.id}`, newRefreshToken, 30 * 24 * 3600); // 30天

    // 返回新的tokens
    return NextResponse.json({
      code: 0,
      msg: 'Token refreshed successfully',
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
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
    console.error('Token refresh error:', error);
    return NextResponse.json(
      {
        code: 1,
        msg: 'Token refresh failed',
        data: null,
      },
      { status: 500 }
    );
  }
}
