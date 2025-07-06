/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as getRoles, POST as createRole } from '../../src/app/api/v1/roles/route';
import {
  GET as getRole,
  PUT as updateRole,
  DELETE as deleteRole,
} from '../../src/app/api/v1/roles/[id]/route';
import { getAuthToken, TestDataFactory } from '../utils/test-helpers';

// Mock Prisma
jest.mock('../../src/lib/db', () => ({
  __esModule: true,
  prisma: {
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
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    permission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    rolePermission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    accountRole: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

// 获取mock对象用于测试
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { prisma: mockPrisma } = require('../../src/lib/db');

describe('/api/v1/roles', () => {
  beforeEach(() => {
    // 重置所有mock
    jest.clearAllMocks();

    // 设置认证中间件需要的用户mock
    mockPrisma.account.findUnique.mockResolvedValue({
      id: 1,
      username: 'admin',
      name: 'Admin User',
      status: 'ACTIVE',
      roles: [
        {
          role: {
            name: 'admin',
            permissions: [
              { permission: { code: 'roles.read' } },
              { permission: { code: 'roles.write' } },
              { permission: { code: 'roles.delete' } },
            ],
          },
        },
      ],
    });

    // 设置roles相关的默认mock
    mockPrisma.role.count.mockResolvedValue(0);
    mockPrisma.role.findFirst.mockResolvedValue(null);

    // 设置accountRole mock用于删除检查
    mockPrisma.accountRole.findMany.mockResolvedValue([]);

    // 设置permission相关mock
    mockPrisma.permission.findMany.mockResolvedValue([
      { id: '1', code: 'READ_USER' },
      { id: '2', code: 'WRITE_USER' },
    ]);
  });

  describe('GET /api/v1/roles', () => {
    it('应该返回角色列表', async () => {
      const mockRoles = [
        {
          id: 1,
          name: '管理员',
          description: '系统管理员',
          status: 'ACTIVE',
          operator: 'admin',
          permissions: [
            { permission: { code: 'READ_USER' } },
            { permission: { code: 'WRITE_USER' } },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: '普通用户',
          description: '普通用户',
          status: 'ACTIVE',
          operator: 'admin',
          permissions: [{ permission: { code: 'READ_USER' } }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.role.findMany.mockResolvedValue(mockRoles);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/roles', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await getRoles(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
      expect(data.data.list).toHaveLength(2);
      expect(data.data.list[0].name).toBe('管理员');
      expect(mockPrisma.role.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 0,
        take: 20,
      });
    });

    it('应该支持分页查询', async () => {
      mockPrisma.role.findMany.mockResolvedValue([]);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/roles?page=2&limit=5', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await getRoles(req);

      expect(mockPrisma.role.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 5,
        take: 5,
      });
    });

    it('应该拒绝未认证的请求', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/roles', {
        method: 'GET',
      });

      const response = await getRoles(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe(1);
    });
  });

  describe('POST /api/v1/roles', () => {
    it('应该成功创建角色', async () => {
      const roleData = TestDataFactory.role();
      const mockRole = {
        id: 1,
        ...roleData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.role.create.mockResolvedValue(mockRole);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/roles', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      });

      const response = await createRole(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
      expect(data.data.name).toBe(roleData.name);
      expect(mockPrisma.role.create).toHaveBeenCalledWith({
        data: {
          name: roleData.name,
          status: 'ACTIVE',
          operator: roleData.operator,
        },
      });
    });

    it('应该验证必填字段', async () => {
      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/roles', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: '',
          operator: '',
        }),
      });

      const response = await createRole(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe(1);
    });

    it('应该处理重复的角色名称', async () => {
      const roleData = TestDataFactory.role();

      // Mock检查重复时返回已存在的角色
      mockPrisma.role.findUnique.mockResolvedValue({
        id: 1,
        name: roleData.name,
      });

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/roles', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      });

      const response = await createRole(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe(1);
      expect(data.msg).toContain('角色名已存在');
    });
  });

  describe('GET /api/v1/roles/[id]', () => {
    it('应该返回指定的角色', async () => {
      const mockRole = {
        id: 1,
        name: '管理员',
        description: '系统管理员',
        status: 'ACTIVE',
        operator: 'admin',
        permissions: [
          { permission: { code: 'READ_USER' } },
          { permission: { code: 'WRITE_USER' } },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.role.findUnique.mockResolvedValue(mockRole);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/roles/1', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await getRole(req, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
      expect(data.data.name).toBe('管理员');
      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });

    it('应该处理角色不存在的情况', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/roles/999', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await getRole(req, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe(1);
      expect(data.msg).toContain('角色不存在');
    });
  });

  describe('PUT /api/v1/roles/[id]', () => {
    it('应该成功更新角色', async () => {
      const updateData = {
        name: '更新后的角色',
        description: '更新后的描述',
        operator: 'admin',
        status: 1,
        permissions: ['READ_USER', 'WRITE_USER', 'DELETE_USER'],
      };

      const mockUpdatedRole = {
        id: 1,
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 第一次调用返回现有角色，第二次调用(检查重复)返回null
      mockPrisma.role.findUnique
        .mockResolvedValueOnce({ id: 1, name: '原角色' })
        .mockResolvedValueOnce(null);
      mockPrisma.role.update.mockResolvedValue(mockUpdatedRole);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/roles/1', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const response = await updateRole(req, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
      expect(data.data.name).toBe('更新后的角色');
    });
  });

  describe('DELETE /api/v1/roles/[id]', () => {
    it('应该成功删除角色', async () => {
      mockPrisma.role.findUnique.mockResolvedValue({ id: 1, name: '测试角色' });
      mockPrisma.role.delete.mockResolvedValue({ id: 1, name: '测试角色' });

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/roles/1', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await deleteRole(req, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
      expect(mockPrisma.role.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('应该处理删除不存在的角色', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/roles/999', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await deleteRole(req, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe(1);
      expect(data.msg).toContain('角色不存在');
    });
  });
});
