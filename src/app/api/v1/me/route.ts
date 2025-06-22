import { NextRequest } from 'next/server';
import { ApiResponse, withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/db';

// GET /api/v1/me - 获取当前用户信息
async function getMeHandler(request: NextRequest) {
  try {
    // 从中间件获取用户信息
    const user = (request as any).user;

    // 从数据库获取最新的账户信息
    const account = await prisma.account.findUnique({
      where: { id: user.accountId },
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
      return ApiResponse.unauthorized('用户不存在');
    }

    // 收集角色和权限信息
    const roles = account.roles.map((accountRole: any) => accountRole.role.name);
    const permissions = account.roles
      .flatMap((accountRole: any) => accountRole.role.permissions)
      .map((rolePermission: any) => rolePermission.permission.code);

    // 去重权限
    const uniquePermissions = [...new Set(permissions)] as string[];

    // 构建用户信息
    const userInfo = {
      id: account.id,
      username: account.name,
      operator: account.operator,
      status: account.status,
      roles,
      permissions: uniquePermissions,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };

    return ApiResponse.success(userInfo, '获取用户信息成功');
  } catch (error) {
    console.error('Get user info error:', error);
    return ApiResponse.serverError('获取用户信息失败');
  }
}

// 使用认证中间件包装处理器
export const GET = withAuth(getMeHandler);
