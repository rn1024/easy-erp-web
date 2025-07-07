/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 设置环境变量
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';

// Mock Redis service
jest.mock('../../src/lib/redis', () => ({
  redisService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

// Mock Prisma首先定义
jest.mock('../../src/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

// Mock bcrypt
jest.mock('bcryptjs');

// 动态导入API处理器
import { POST as loginHandler } from '../../src/app/api/v1/auth/login/route';
import { GET as meHandler } from '../../src/app/api/v1/me/route';

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// 测试用户数据
const testUsers = {
  admin: {
    id: 1,
    username: 'admin',
    name: 'admin',
    email: 'admin@test.com',
    role: 'ADMIN',
    permissions: ['READ_USER', 'WRITE_USER', 'DELETE_USER', 'ADMIN_ACCESS'],
  },
  user: {
    id: 2,
    username: 'user',
    name: 'user',
    email: 'user@test.com',
    role: 'USER',
    permissions: ['READ_USER'],
  },
};

// 生成测试用的认证token
const getAuthToken = (userType: 'admin' | 'user' = 'admin') => {
  return jwt.sign(testUsers[userType], process.env.JWT_SECRET!, { expiresIn: '1h' });
};

describe('/api/v1/auth', () => {
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(async () => {
    // 动态获取mocked dependencies
    const { prisma } = await import('../../src/lib/db');
    const { redisService } = await import('../../src/lib/redis');
    mockPrisma = prisma;
    mockRedis = redisService;

    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.user.findMany.mockReset();
    mockPrisma.user.create.mockReset();
    mockPrisma.user.update.mockReset();
    mockPrisma.user.delete.mockReset();
    mockPrisma.account.findUnique.mockReset();
    mockPrisma.account.findMany.mockReset();
    mockPrisma.account.create.mockReset();
    mockPrisma.account.update.mockReset();
    mockPrisma.account.delete.mockReset();
    mockRedis.get.mockReset();
    mockRedis.set.mockReset();
    mockRedis.del.mockReset();
  });

  describe('POST /api/v1/auth/login', () => {
    it('应该成功登录有效用户', async () => {
      // 模拟Redis验证码验证
      mockRedis.get.mockResolvedValue({ code: 'abcd' });
      mockRedis.del.mockResolvedValue(true);
      mockRedis.set.mockResolvedValue(true);

      // 模拟数据库返回账户
      const mockAccount = {
        id: 1,
        name: 'admin',
        password: 'hashedPassword',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [
          {
            role: {
              id: 1,
              name: 'ADMIN',
              status: 'ACTIVE',
              permissions: [
                { permission: { code: 'READ_USER' } },
                { permission: { code: 'WRITE_USER' } },
                { permission: { code: 'ADMIN_ACCESS' } },
              ],
            },
          },
        ],
      };

      mockPrisma.account.findUnique.mockResolvedValue(mockAccount);
      mockPrisma.account.update.mockResolvedValue(mockAccount);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123',
          captcha: 'abcd',
          key: 'test-key',
        }),
      });

      const response = await loginHandler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
      expect(data.data.token).toBeDefined();
      expect(data.data.user.name).toBe('admin');
      expect(mockPrisma.account.findUnique).toHaveBeenCalledWith({
        where: { name: 'admin' },
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
    });

    it('应该拒绝无效的用户名', async () => {
      mockRedis.get.mockResolvedValue({ code: 'abcd' });
      mockPrisma.account.findUnique.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'nonexistent',
          password: 'password',
          captcha: 'abcd',
          key: 'test-key',
        }),
      });

      const response = await loginHandler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(1);
      expect(data.msg).toContain('用户名或密码错误');
    });

    it('应该拒绝无效的密码', async () => {
      mockRedis.get.mockResolvedValue({ code: 'abcd' });

      const mockAccount = {
        id: 1,
        name: 'admin',
        password: 'hashedPassword',
        status: 'ACTIVE',
        roles: [],
      };

      mockPrisma.account.findUnique.mockResolvedValue(mockAccount);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'wrongpassword',
          captcha: 'abcd',
          key: 'test-key',
        }),
      });

      const response = await loginHandler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(1);
      expect(data.msg).toContain('用户名或密码错误');
    });

    it('应该验证必填字段', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: '',
          password: '',
        }),
      });

      const response = await loginHandler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(1);
      expect(data.msg).toContain('参数不完整');
    });

    it('应该验证验证码', async () => {
      mockRedis.get.mockResolvedValue({ code: 'wrong-code' });

      const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123',
          captcha: 'abcd',
          key: 'test-key',
        }),
      });

      const response = await loginHandler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(1);
      expect(data.msg).toContain('验证码错误');
    });
  });

  describe('GET /api/v1/me', () => {
    it('应该返回当前用户信息', async () => {
      const mockAccount = {
        id: 1,
        name: 'admin',
        operator: 'admin',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [
          {
            role: {
              name: 'ADMIN',
              permissions: [
                { permission: { code: 'READ_USER' } },
                { permission: { code: 'WRITE_USER' } },
                { permission: { code: 'ADMIN_ACCESS' } },
              ],
            },
          },
        ],
      };

      mockPrisma.account.findUnique.mockResolvedValue(mockAccount);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await meHandler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
      expect(data.data.username).toBe('admin');
      expect(data.data.permissions).toEqual(['READ_USER', 'WRITE_USER', 'ADMIN_ACCESS']);
    });

    it('应该拒绝无效的token', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/me', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      const response = await meHandler(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe(1);
      expect(data.msg).toContain('令牌无效');
    });

    it('应该拒绝缺少token的请求', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/me', {
        method: 'GET',
      });

      const response = await meHandler(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe(1);
      expect(data.msg).toContain('令牌无效');
    });

    it('应该拒绝用户不存在的情况', async () => {
      mockPrisma.account.findUnique.mockResolvedValue(null);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await meHandler(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe(1);
      expect(data.msg).toContain('用户不存在');
    });
  });
});
