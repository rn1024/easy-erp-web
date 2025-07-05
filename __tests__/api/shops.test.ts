/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as getShops, POST as createShop } from '@/app/api/v1/shops/route';
import {
  GET as getShop,
  PUT as updateShop,
  DELETE as deleteShop,
} from '@/app/api/v1/shops/[id]/route';
import { getAuthToken, TestDataFactory, mockPrisma, resetMocks } from '../utils/test-helpers';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: mockPrisma,
}));

describe('/api/v1/shops', () => {
  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
  });

  describe('GET /api/v1/shops', () => {
    it('应该返回店铺列表', async () => {
      const mockShops = [
        {
          id: 1,
          name: '测试店铺1',
          description: '店铺描述1',
          address: '店铺地址1',
          contactPhone: '13800138001',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: '测试店铺2',
          description: '店铺描述2',
          address: '店铺地址2',
          contactPhone: '13800138002',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.shop.findMany.mockResolvedValue(mockShops);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/shops', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await getShops(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe('测试店铺1');
    });

    it('应该支持搜索功能', async () => {
      mockPrisma.shop.findMany.mockResolvedValue([]);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/shops?search=测试', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await getShops(req);

      expect(mockPrisma.shop.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: '测试' } },
            { description: { contains: '测试' } },
            { address: { contains: '测试' } },
          ],
        },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('POST /api/v1/shops', () => {
    it('应该成功创建店铺', async () => {
      const shopData = TestDataFactory.shop();
      const mockShop = {
        id: 1,
        ...shopData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.shop.create.mockResolvedValue(mockShop);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/shops', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shopData),
      });

      const response = await createShop(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.code).toBe(0);
      expect(data.data.name).toBe(shopData.name);
      expect(mockPrisma.shop.create).toHaveBeenCalledWith({
        data: shopData,
      });
    });

    it('应该验证必填字段', async () => {
      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/shops', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: '',
          contactPhone: '',
        }),
      });

      const response = await createShop(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe(1);
    });

    it('应该验证手机号码格式', async () => {
      const shopData = TestDataFactory.shop({
        contactPhone: '123', // 无效的手机号
      });

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/shops', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shopData),
      });

      const response = await createShop(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe(1);
      expect(data.msg).toContain('手机号码格式不正确');
    });
  });

  describe('GET /api/v1/shops/[id]', () => {
    it('应该返回指定的店铺', async () => {
      const mockShop = {
        id: 1,
        name: '测试店铺',
        description: '测试描述',
        address: '测试地址',
        contactPhone: '13800138000',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.shop.findUnique.mockResolvedValue(mockShop);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/shops/1', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await getShop(req, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
      expect(data.data.name).toBe('测试店铺');
      expect(mockPrisma.shop.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('应该处理店铺不存在的情况', async () => {
      mockPrisma.shop.findUnique.mockResolvedValue(null);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/shops/999', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await getShop(req, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe(1);
      expect(data.msg).toContain('店铺不存在');
    });
  });

  describe('PUT /api/v1/shops/[id]', () => {
    it('应该成功更新店铺', async () => {
      const updateData = {
        name: '更新后的店铺',
        description: '更新后的描述',
        address: '更新后的地址',
        contactPhone: '13900139000',
      };

      const mockUpdatedShop = {
        id: 1,
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.shop.findUnique.mockResolvedValue({ id: 1, name: '原店铺' });
      mockPrisma.shop.update.mockResolvedValue(mockUpdatedShop);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/shops/1', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const response = await updateShop(req, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
      expect(data.data.name).toBe('更新后的店铺');
      expect(mockPrisma.shop.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
    });
  });

  describe('DELETE /api/v1/shops/[id]', () => {
    it('应该成功删除店铺', async () => {
      mockPrisma.shop.findUnique.mockResolvedValue({ id: 1, name: '测试店铺' });
      mockPrisma.shop.delete.mockResolvedValue({ id: 1, name: '测试店铺' });

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/shops/1', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await deleteShop(req, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
      expect(mockPrisma.shop.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('应该处理删除不存在的店铺', async () => {
      mockPrisma.shop.findUnique.mockResolvedValue(null);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/shops/999', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await deleteShop(req, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe(1);
      expect(data.msg).toContain('店铺不存在');
    });

    it('应该检查店铺是否被关联使用', async () => {
      mockPrisma.shop.findUnique.mockResolvedValue({ id: 1, name: '测试店铺' });
      mockPrisma.shop.delete.mockRejectedValue(new Error('Foreign key constraint fails'));

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/shops/1', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await deleteShop(req, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe(1);
      expect(data.msg).toContain('该店铺已被使用，无法删除');
    });
  });
});
