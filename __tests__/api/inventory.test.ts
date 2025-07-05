/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import {
  GET as getFinishedInventory,
  POST as createFinishedInventory,
} from '@/app/api/v1/finished-inventory/route';
import {
  GET as getSpareInventory,
  POST as createSpareInventory,
} from '@/app/api/v1/spare-inventory/route';
import { getAuthToken, TestDataFactory, mockPrisma, resetMocks } from '../utils/test-helpers';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: mockPrisma,
}));

describe('库存管理 API', () => {
  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
  });

  describe('/api/v1/finished-inventory', () => {
    describe('GET /api/v1/finished-inventory', () => {
      it('应该返回成品库存列表', async () => {
        const mockInventory = [
          {
            id: 1,
            quantity: 100,
            reservedQuantity: 10,
            availableQuantity: 90,
            location: 'A-01-001',
            product: { id: 1, name: '测试产品1', code: 'PROD001' },
            shop: { id: 1, name: '测试店铺' },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        mockPrisma.finishedInventory.findMany.mockResolvedValue(mockInventory);

        const token = getAuthToken('admin');
        const req = new NextRequest('http://localhost:3000/api/v1/finished-inventory', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const response = await getFinishedInventory(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.code).toBe(0);
        expect(data.data).toHaveLength(1);
        expect(data.data[0].quantity).toBe(100);
        expect(mockPrisma.finishedInventory.findMany).toHaveBeenCalledWith({
          include: {
            product: true,
            shop: true,
          },
          skip: 0,
          take: 10,
        });
      });

      it('应该支持按产品筛选', async () => {
        mockPrisma.finishedInventory.findMany.mockResolvedValue([]);

        const token = getAuthToken('admin');
        const req = new NextRequest('http://localhost:3000/api/v1/finished-inventory?productId=1', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        await getFinishedInventory(req);

        expect(mockPrisma.finishedInventory.findMany).toHaveBeenCalledWith({
          where: {
            productId: 1,
          },
          include: {
            product: true,
            shop: true,
          },
          skip: 0,
          take: 10,
        });
      });

      it('应该支持按店铺筛选', async () => {
        mockPrisma.finishedInventory.findMany.mockResolvedValue([]);

        const token = getAuthToken('admin');
        const req = new NextRequest('http://localhost:3000/api/v1/finished-inventory?shopId=1', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        await getFinishedInventory(req);

        expect(mockPrisma.finishedInventory.findMany).toHaveBeenCalledWith({
          where: {
            shopId: 1,
          },
          include: {
            product: true,
            shop: true,
          },
          skip: 0,
          take: 10,
        });
      });

      it('应该支持库存预警查询', async () => {
        mockPrisma.finishedInventory.findMany.mockResolvedValue([]);

        const token = getAuthToken('admin');
        const req = new NextRequest(
          'http://localhost:3000/api/v1/finished-inventory?lowStock=true',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        await getFinishedInventory(req);

        expect(mockPrisma.finishedInventory.findMany).toHaveBeenCalledWith({
          where: {
            availableQuantity: {
              lt: 20, // 假设库存预警阈值为20
            },
          },
          include: {
            product: true,
            shop: true,
          },
          skip: 0,
          take: 10,
        });
      });
    });

    describe('POST /api/v1/finished-inventory', () => {
      it('应该成功创建成品库存记录', async () => {
        const inventoryData = TestDataFactory.finishedInventory();
        const mockInventory = {
          id: 1,
          ...inventoryData,
          product: { id: 1, name: '测试产品' },
          shop: { id: 1, name: '测试店铺' },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.finishedInventory.create.mockResolvedValue(mockInventory);

        const token = getAuthToken('admin');
        const req = new NextRequest('http://localhost:3000/api/v1/finished-inventory', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inventoryData),
        });

        const response = await createFinishedInventory(req);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.code).toBe(0);
        expect(data.data.quantity).toBe(inventoryData.quantity);
        expect(mockPrisma.finishedInventory.create).toHaveBeenCalledWith({
          data: inventoryData,
          include: {
            product: true,
            shop: true,
          },
        });
      });

      it('应该验证库存数量', async () => {
        const inventoryData = TestDataFactory.finishedInventory({
          quantity: -10,
          reservedQuantity: -5,
        });

        const token = getAuthToken('admin');
        const req = new NextRequest('http://localhost:3000/api/v1/finished-inventory', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inventoryData),
        });

        const response = await createFinishedInventory(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe(1);
        expect(data.msg).toContain('库存数量不能为负数');
      });

      it('应该检查产品和店铺的唯一性', async () => {
        const inventoryData = TestDataFactory.finishedInventory();

        mockPrisma.finishedInventory.create.mockRejectedValue(
          new Error('Unique constraint failed on the fields: (`productId`,`shopId`)')
        );

        const token = getAuthToken('admin');
        const req = new NextRequest('http://localhost:3000/api/v1/finished-inventory', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inventoryData),
        });

        const response = await createFinishedInventory(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe(1);
        expect(data.msg).toContain('该产品在此店铺的库存记录已存在');
      });
    });
  });

  describe('/api/v1/spare-inventory', () => {
    describe('GET /api/v1/spare-inventory', () => {
      it('应该返回散件库存列表', async () => {
        const mockInventory = [
          {
            id: 1,
            quantity: 200,
            reservedQuantity: 20,
            availableQuantity: 180,
            location: 'B-01-001',
            product: { id: 1, name: '测试散件1', code: 'SPARE001' },
            shop: { id: 1, name: '测试店铺' },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        mockPrisma.spareInventory.findMany.mockResolvedValue(mockInventory);

        const token = getAuthToken('admin');
        const req = new NextRequest('http://localhost:3000/api/v1/spare-inventory', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const response = await getSpareInventory(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.code).toBe(0);
        expect(data.data).toHaveLength(1);
        expect(data.data[0].quantity).toBe(200);
        expect(mockPrisma.spareInventory.findMany).toHaveBeenCalledWith({
          include: {
            product: true,
            shop: true,
          },
          skip: 0,
          take: 10,
        });
      });

      it('应该支持库位搜索', async () => {
        mockPrisma.spareInventory.findMany.mockResolvedValue([]);

        const token = getAuthToken('admin');
        const req = new NextRequest('http://localhost:3000/api/v1/spare-inventory?location=B-01', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        await getSpareInventory(req);

        expect(mockPrisma.spareInventory.findMany).toHaveBeenCalledWith({
          where: {
            location: {
              contains: 'B-01',
            },
          },
          include: {
            product: true,
            shop: true,
          },
          skip: 0,
          take: 10,
        });
      });
    });

    describe('POST /api/v1/spare-inventory', () => {
      it('应该成功创建散件库存记录', async () => {
        const inventoryData = TestDataFactory.spareInventory();
        const mockInventory = {
          id: 1,
          ...inventoryData,
          product: { id: 1, name: '测试散件' },
          shop: { id: 1, name: '测试店铺' },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.spareInventory.create.mockResolvedValue(mockInventory);

        const token = getAuthToken('admin');
        const req = new NextRequest('http://localhost:3000/api/v1/spare-inventory', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inventoryData),
        });

        const response = await createSpareInventory(req);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.code).toBe(0);
        expect(data.data.quantity).toBe(inventoryData.quantity);
        expect(mockPrisma.spareInventory.create).toHaveBeenCalledWith({
          data: inventoryData,
          include: {
            product: true,
            shop: true,
          },
        });
      });

      it('应该验证库位格式', async () => {
        const inventoryData = TestDataFactory.spareInventory({
          location: 'INVALID_LOCATION',
        });

        const token = getAuthToken('admin');
        const req = new NextRequest('http://localhost:3000/api/v1/spare-inventory', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inventoryData),
        });

        const response = await createSpareInventory(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe(1);
        expect(data.msg).toContain('库位格式不正确');
      });

      it('应该验证可用数量计算', async () => {
        const inventoryData = TestDataFactory.spareInventory({
          quantity: 100,
          reservedQuantity: 120, // 预留数量大于总数量
        });

        const token = getAuthToken('admin');
        const req = new NextRequest('http://localhost:3000/api/v1/spare-inventory', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inventoryData),
        });

        const response = await createSpareInventory(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe(1);
        expect(data.msg).toContain('预留数量不能大于总库存数量');
      });
    });
  });

  describe('库存统计功能', () => {
    it('应该计算库存总价值', async () => {
      const mockInventoryWithPrice = [
        {
          id: 1,
          quantity: 100,
          product: { purchasePrice: 10.0 },
        },
        {
          id: 2,
          quantity: 50,
          product: { purchasePrice: 20.0 },
        },
      ];

      mockPrisma.finishedInventory.findMany.mockResolvedValue(mockInventoryWithPrice);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/finished-inventory?summary=true', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await getFinishedInventory(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
      // 总价值 = 100 * 10.00 + 50 * 20.00 = 2000.00
      expect(data.summary?.totalValue).toBe(2000.0);
      expect(data.summary?.totalQuantity).toBe(150);
    });

    it('应该统计低库存商品数量', async () => {
      const mockLowStockItems = [
        { id: 1, availableQuantity: 5 },
        { id: 2, availableQuantity: 3 },
      ];

      mockPrisma.finishedInventory.findMany.mockResolvedValue(mockLowStockItems);

      const token = getAuthToken('admin');
      const req = new NextRequest(
        'http://localhost:3000/api/v1/finished-inventory?lowStock=true&summary=true',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response = await getFinishedInventory(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
      expect(data.summary?.lowStockCount).toBe(2);
    });
  });
});
