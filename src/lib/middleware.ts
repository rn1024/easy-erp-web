import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestToken } from './auth';
import { prisma } from './db';

// API响应格式
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

// 分页响应格式
export interface PageResponse<T = any> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

// API响应工具类
export class ApiResponseHelper {
  static success<T>(data: T, msg: string = '操作成功'): NextResponse {
    return NextResponse.json({
      code: 0,
      msg,
      data,
    });
  }

  static error(msg: string = '操作失败', code: number = 1): NextResponse {
    return NextResponse.json(
      {
        code,
        msg,
        data: null,
      },
      { status: 400 }
    );
  }

  static serverError(msg: string = '服务器内部错误'): NextResponse {
    return NextResponse.json(
      {
        code: 1,
        msg,
        data: null,
      },
      { status: 500 }
    );
  }

  static unauthorized(msg: string = '未授权访问'): NextResponse {
    return NextResponse.json(
      {
        code: 1,
        msg,
        data: null,
      },
      { status: 401 }
    );
  }

  static forbidden(msg: string = '权限不足'): NextResponse {
    return NextResponse.json(
      {
        code: 1,
        msg,
        data: null,
      },
      { status: 403 }
    );
  }

  static notFound(msg: string = '资源不存在'): NextResponse {
    return NextResponse.json(
      {
        code: 1,
        msg,
        data: null,
      },
      { status: 404 }
    );
  }

  static validationError(errors: any, msg: string = '参数验证失败'): NextResponse {
    return NextResponse.json(
      {
        code: 1,
        msg,
        data: { errors },
      },
      { status: 400 }
    );
  }
}

// 验证必需参数
export class ValidationMiddleware {
  static validateRequired(requiredFields: string[], body: any): void {
    for (const field of requiredFields) {
      if (!body[field]) {
        throw new Error(`缺少必需参数: ${field}`);
      }
    }
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: '密码长度至少8位' };
    }
    return { valid: true };
  }
}

// 认证中间件
export const withAuth = (handler: (request: NextRequest, user: any) => Promise<NextResponse>) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 验证令牌
      const tokenPayload = verifyRequestToken(request);
      if (!tokenPayload) {
        return ApiResponseHelper.unauthorized('令牌无效或已过期');
      }

      // 查询用户信息
      const user = await prisma.account.findUnique({
        where: { id: tokenPayload.id },
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

      if (!user || user.status !== 'ACTIVE') {
        return ApiResponseHelper.unauthorized('用户不存在或已被禁用');
      }

      // 构建用户权限信息
      const roles = user.roles.map((ar) => ar.role);
      const permissions = roles.flatMap((role) => role.permissions.map((rp) => rp.permission.code));

      const userWithPermissions = {
        ...user,
        roles: roles.map((r) => r.name),
        permissions,
      };

      return handler(request, userWithPermissions);
    } catch (error: any) {
      console.error('Auth middleware error:', error);
      return ApiResponseHelper.serverError('认证失败');
    }
  };
};

// 权限检查中间件
export const withPermission = (requiredPermissions: string[]) => {
  return (handler: (request: NextRequest, user: any) => Promise<NextResponse>) => {
    return withAuth(async (request: NextRequest, user: any) => {
      // 检查权限
      const hasPermission = requiredPermissions.every((permission) =>
        user.permissions.includes(permission)
      );

      if (!hasPermission) {
        return ApiResponseHelper.forbidden('权限不足');
      }

      return handler(request, user);
    });
  };
};

// 兼容性导出
export const ApiResponse = ApiResponseHelper;
