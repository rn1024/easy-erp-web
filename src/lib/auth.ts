import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { prisma } from './db';

// JWT密钥配置
const JWT_SECRET =
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-12345678';
const ACCESS_TOKEN_EXPIRES = '8h'; // 延长到8小时
const REFRESH_TOKEN_EXPIRES = '30d'; // 延长到30天

// Token负载接口
export interface TokenPayload {
  id: string;
  name: string;
  roles?: string[];
  permissions?: string[];
  iat?: number;
  exp?: number;
}

// 用户信息接口
export interface CurrentUser {
  id: string;
  name: string;
  operator: string;
  status: string;
  roles: string[];
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 生成访问令牌
export const generateAccessToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  // 添加随机nonce确保每次生成的token都不同
  const tokenPayload = {
    ...payload,
    nonce: Math.random().toString(36).substring(2, 15),
  };
  return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
};

// 生成刷新令牌
export const generateRefreshToken = (payload: { id: string }): string => {
  // 添加随机nonce确保每次生成的token都不同
  const tokenPayload = {
    ...payload,
    nonce: Math.random().toString(36).substring(2, 15),
  };
  return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });
};

// 验证令牌
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

// 从请求中提取令牌
export const extractTokenFromRequest = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

// 验证请求中的令牌
export const verifyRequestToken = (request: NextRequest): TokenPayload | null => {
  const token = extractTokenFromRequest(request);
  if (!token) {
    return null;
  }
  return verifyToken(token);
};

// 获取当前用户信息
export const getCurrentUser = async (request: NextRequest): Promise<CurrentUser | null> => {
  try {
    // 验证令牌
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
      return null;
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
      return null;
    }

    // 构建用户权限信息
    const roles = user.roles.map((ar) => ar.role);
    const permissions = roles.flatMap((role) => role.permissions.map((rp) => rp.permission.code));

    return {
      id: user.id,
      name: user.name,
      operator: user.operator,
      status: user.status,
      roles: roles.map((r) => r.name),
      permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

// 密码加密
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// 密码验证
export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// 生成随机密码
export const generateRandomPassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// 兼容性函数（保持与现有代码的兼容性）
export const generateToken = generateAccessToken;
