/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST as loginHandler } from '@/app/api/v1/auth/login/route';
import { GET as meHandler } from '@/app/api/v1/me/route';
import { getAuthToken, testUsers, mockPrisma, resetMocks } from '../utils/test-helpers';
import bcrypt from 'bcryptjs';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: mockPrisma,
}));

// Mock bcrypt
jest.mock('bcryptjs');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('/api/v1/auth', () => {
  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('应该成功登录有效用户', async () => {
      // 模拟数据库返回用户
      const mockUser = {
        id: 1,
        username: 'admin',
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'hashedPassword',
        role: {
          name: 'ADMIN',
          permissions: [{ name: 'READ_USER' }, { name: 'WRITE_USER' }, { name: 'ADMIN_ACCESS' }],
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123',
        }),
      });

      const response = await loginHandler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
      expect(data.data.token).toBeDefined();
      expect(data.data.user.username).toBe('admin');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'admin' },
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      });
    });

    it('应该拒绝无效的用户名', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'nonexistent',
          password: 'password',
        }),
      });

      const response = await loginHandler(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe(1);
      expect(data.msg).toContain('用户名或密码错误');
    });

    it('应该拒绝无效的密码', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        password: 'hashedPassword',
        role: { name: 'ADMIN', permissions: [] },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'wrongpassword',
        }),
      });

      const response = await loginHandler(req);
      const data = await response.json();

      expect(response.status).toBe(401);
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

      expect(response.status).toBe(400);
      expect(data.code).toBe(1);
      expect(data.msg).toContain('用户名和密码不能为空');
    });
  });

  describe('GET /api/v1/me', () => {
    it('应该返回当前用户信息', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        name: 'Admin User',
        email: 'admin@test.com',
        role: {
          name: 'ADMIN',
          permissions: [{ name: 'READ_USER' }, { name: 'WRITE_USER' }, { name: 'ADMIN_ACCESS' }],
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

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
      mockPrisma.user.findUnique.mockResolvedValue(null);

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
