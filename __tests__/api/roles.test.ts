/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as getRoles, POST as createRole } from '@/app/api/v1/roles/route';
import {
  GET as getRole,
  PUT as updateRole,
  DELETE as deleteRole,
} from '@/app/api/v1/roles/[id]/route';
import { getAuthToken, TestDataFactory, mockPrisma, resetMocks } from '../utils/test-helpers';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: mockPrisma,
}));

describe('/api/v1/roles', () => {
  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
  });

  describe('GET /api/v1/roles', () => {
    it('应该返回角色列表', async () => {
      const mockRoles = [
        {
          id: 1,
          name: '管理员',
          description: '系统管理员',
          permissions: [{ name: 'READ_USER' }, { name: 'WRITE_USER' }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: '普通用户',
          description: '普通用户',
          permissions: [{ name: 'READ_USER' }],
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
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe('管理员');
      expect(mockPrisma.role.findMany).toHaveBeenCalledWith({
        include: {
          permissions: true,
        },
        skip: 0,
        take: 10,
      });
    });

    it('应该支持分页查询', async () => {
      mockPrisma.role.findMany.mockResolvedValue([]);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/roles?page=2&pageSize=5', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await getRoles(req);

      expect(mockPrisma.role.findMany).toHaveBeenCalledWith({
        include: {
          permissions: true,
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

      expect(response.status).toBe(201);
      expect(data.code).toBe(0);
      expect(data.data.name).toBe(roleData.name);
      expect(mockPrisma.role.create).toHaveBeenCalledWith({
        data: {
          name: roleData.name,
          description: roleData.description,
          permissions: {
            connect: roleData.permissions.map((permission) => ({ name: permission })),
          },
        },
        include: {
          permissions: true,
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
          permissions: [],
        }),
      });

      const response = await createRole(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe(1);
    });

    it('应该处理重复的角色名称', async () => {
      const roleData = TestDataFactory.role();

      mockPrisma.role.create.mockRejectedValue(
        new Error('Unique constraint failed on the fields: (`name`)')
      );

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
      expect(data.msg).toContain('角色名称已存在');
    });
  });

  describe('GET /api/v1/roles/[id]', () => {
    it('应该返回指定的角色', async () => {
      const mockRole = {
        id: 1,
        name: '管理员',
        description: '系统管理员',
        permissions: [{ name: 'READ_USER' }, { name: 'WRITE_USER' }],
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
        where: { id: 1 },
        include: {
          permissions: true,
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
        permissions: ['READ_USER', 'WRITE_USER', 'DELETE_USER'],
      };

      const mockUpdatedRole = {
        id: 1,
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.role.findUnique.mockResolvedValue({ id: 1, name: '原角色' });
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
        where: { id: 1 },
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
