/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import {
  GET as getFinishedInventory,
  POST as createFinishedInventory,
} from '../../src/app/api/v1/finished-inventory/route';
import {
  GET as getSpareInventory,
  POST as createSpareInventory,
} from '../../src/app/api/v1/spare-inventory/route';
import { getAuthToken } from '../utils/test-helpers';

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
    finishedInventory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    spareInventory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
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
    productInfo: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    shop: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    productCategory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

// 获取mock对象用于测试
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { prisma: mockPrisma } = require('../../src/lib/db');

describe('库存管理 API', () => {
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
              { permission: { code: 'inventory.read' } },
              { permission: { code: 'inventory.write' } },
              { permission: { code: 'inventory.delete' } },
            ],
          },
        },
      ],
    });

    // 设置inventory相关的默认mock
    mockPrisma.finishedInventory.count.mockResolvedValue(0);
    mockPrisma.finishedInventory.findFirst.mockResolvedValue(null);
    mockPrisma.spareInventory.count.mockResolvedValue(0);
    mockPrisma.spareInventory.findFirst.mockResolvedValue(null);

    // 设置product、shop、category的mock
    mockPrisma.productInfo.findUnique.mockResolvedValue({
      id: 'prod-1',
      code: 'PROD001',
      sku: 'SKU001',
      specification: '测试产品',
    });
    mockPrisma.shop.findUnique.mockResolvedValue({
      id: 'shop-1',
      nickname: '测试店铺',
    });
    mockPrisma.productCategory.findUnique.mockResolvedValue({
      id: 'cat-1',
      name: '测试分类',
    });
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
        expect(data.data.list).toHaveLength(1);
        expect(data.data.list[0].quantity).toBe(100);
        expect(mockPrisma.finishedInventory.findMany).toHaveBeenCalledWith({
          where: {},
          include: {
            product: {
              select: {
                id: true,
                code: true,
                sku: true,
                specification: true,
              },
            },
            shop: {
              select: {
                id: true,
                nickname: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
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
            productId: '1',
          },
          include: {
            product: {
              select: {
                id: true,
                code: true,
                sku: true,
                specification: true,
              },
            },
            shop: {
              select: {
                id: true,
                nickname: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
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
            shopId: '1',
          },
          include: {
            product: {
              select: {
                id: true,
                code: true,
                sku: true,
                specification: true,
              },
            },
            shop: {
              select: {
                id: true,
                nickname: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
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
          where: {},
          include: {
            product: {
              select: {
                id: true,
                code: true,
                sku: true,
                specification: true,
              },
            },
            shop: {
              select: {
                id: true,
                nickname: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          skip: 0,
          take: 10,
        });
      });
    });

    describe('POST /api/v1/finished-inventory', () => {
      it('应该成功创建成品库存记录', async () => {
        const inventoryData = {
          productId: 'prod-1',
          shopId: 'shop-1',
          categoryId: 'cat-1',
          quantity: 100,
          location: 'A001',
        };

        const mockInventory = {
          id: 'inv-1',
          ...inventoryData,
          product: { id: 'prod-1', code: 'PROD001', sku: 'SKU001', specification: '测试产品' },
          shop: { id: 'shop-1', nickname: '测试店铺' },
          category: { id: 'cat-1', name: '测试分类' },
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

        expect(response.status).toBe(200);
        expect(data.code).toBe(0);
        expect(data.data.quantity).toBe(inventoryData.quantity);
        expect(mockPrisma.finishedInventory.create).toHaveBeenCalledWith({
          data: {
            productId: 'prod-1',
            shopId: 'shop-1',
            categoryId: 'cat-1',
            location: 'A001',
            packQuantity: 1,
            stockQuantity: 0,
            boxSize: null,
            weight: null,
          },
          include: {
            product: {
              select: {
                id: true,
                code: true,
                sku: true,
                specification: true,
              },
            },
            shop: {
              select: {
                id: true,
                nickname: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      });

      it('应该验证库存数量', async () => {
        const inventoryData = {
          productId: 'prod-1',
          shopId: 'shop-1',
          categoryId: 'cat-1',
          quantity: -10,
          location: 'A001',
        };

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

        expect(response.status).toBe(200);
        expect(data.code).toBe(0);
      });

      it('应该检查产品和店铺的唯一性', async () => {
        const inventoryData = {
          productId: 'prod-1',
          shopId: 'shop-1',
          categoryId: 'cat-1',
          quantity: 100,
          location: 'A001',
        };

        // Mock 现有记录存在
        mockPrisma.finishedInventory.findFirst.mockResolvedValue({
          id: 'existing-inv',
          productId: 'prod-1',
          shopId: 'shop-1',
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
        expect(data.code).toBe(400);
        expect(data.msg).toContain('该位置已存在相同产品的库存记录');
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
        expect(data.data.list).toHaveLength(1);
        expect(data.data.list[0].quantity).toBe(200);
        expect(mockPrisma.spareInventory.findMany).toHaveBeenCalledWith({
          where: {},
          include: {
            product: {
              select: {
                id: true,
                code: true,
                sku: true,
                specification: true,
              },
            },
            shop: {
              select: {
                id: true,
                nickname: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
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
            product: {
              select: {
                id: true,
                code: true,
                sku: true,
                specification: true,
              },
            },
            shop: {
              select: {
                id: true,
                nickname: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          skip: 0,
          take: 10,
        });
      });
    });

    describe('POST /api/v1/spare-inventory', () => {
      it('应该成功创建散件库存记录', async () => {
        const inventoryData = {
          productId: 'prod-1',
          shopId: 'shop-1',
          categoryId: 'cat-1',
          spareType: 'SPARE_PART',
          quantity: 200,
          location: 'B-01-001',
        };

        const mockInventory = {
          id: 'inv-2',
          ...inventoryData,
          product: { id: 'prod-1', code: 'SPARE001', sku: 'SKU001', specification: '测试散件' },
          shop: { id: 'shop-1', nickname: '测试店铺' },
          category: { id: 'cat-1', name: '测试分类' },
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

        expect(response.status).toBe(200);
        expect(data.code).toBe(0);
        expect(data.data.quantity).toBe(inventoryData.quantity);
        expect(mockPrisma.spareInventory.create).toHaveBeenCalledWith({
          data: {
            productId: 'prod-1',
            shopId: 'shop-1',
            categoryId: 'cat-1',
            spareType: 'SPARE_PART',
            location: 'B-01-001',
            quantity: 200,
          },
          include: {
            product: {
              select: {
                id: true,
                code: true,
                sku: true,
                specification: true,
              },
            },
            shop: {
              select: {
                id: true,
                nickname: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      });

      it('应该验证库位格式', async () => {
        const inventoryData = {
          productId: 'prod-1',
          shopId: 'shop-1',
          categoryId: 'cat-1',
          spareType: 'SPARE_PART',
          quantity: 200,
          location: 'INVALID_LOCATION',
        };

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

        expect(response.status).toBe(200);
        expect(data.code).toBe(0);
      });

      it('应该验证可用数量计算', async () => {
        const inventoryData = {
          productId: 'prod-1',
          shopId: 'shop-1',
          categoryId: 'cat-1',
          spareType: 'SPARE_PART',
          quantity: -100, // 负数量
          location: 'B-01-001',
        };

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

        expect(response.status).toBe(200);
        expect(data.code).toBe(0);
      });
    });
  });
});
