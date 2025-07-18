/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as meHandler } from '@/app/api/v1/me/route';
import { GET as rolesHandler } from '@/app/api/v1/roles/route';
import { GET as shopsHandler } from '@/app/api/v1/shops/route';
import { GET as suppliersHandler } from '@/app/api/v1/suppliers/route';
import { GET as productsHandler } from '@/app/api/v1/products/route';
import { GET as finishedInventoryHandler } from '@/app/api/v1/finished-inventory/route';
import { GET as purchaseOrdersHandler } from '@/app/api/v1/purchase-orders/route';
import { GET as warehouseTasksHandler } from '@/app/api/v1/warehouse-tasks/route';
import { GET as deliveryRecordsHandler } from '@/app/api/v1/delivery-records/route';
import { GET as logsHandler } from '@/app/api/v1/logs/route';
import { getAuthToken } from '../utils/test-helpers';

// Mock auth functions
jest.mock('../../src/lib/auth', () => ({
  getCurrentUser: jest.fn(),
  verifyRequestToken: jest.fn(),
  verifyPassword: jest.fn(),
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
}));

// Mock Redis
jest.mock('../../src/lib/redis', () => ({
  redisService: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
}));

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
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    shop: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    supplier: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    productInfo: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    finishedInventory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    purchaseOrder: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    warehouseTask: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    deliveryRecord: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    shipmentRecord: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    systemLog: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    log: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    productCategory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
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
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockAuth = require('../../src/lib/auth');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockRedis = require('../../src/lib/redis');

// Mock bcrypt for password validation
jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

describe('API 集成测试', () => {
  beforeEach(() => {
    // 重置所有mock
    jest.clearAllMocks();

    // 设置认证中间件需要的用户mock
    mockPrisma.account.findUnique.mockResolvedValue({
      id: 1,
      username: 'admin',
      name: 'admin',
      password: 'hashedPassword',
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

    // 设置默认的count返回值
    mockPrisma.role.count.mockResolvedValue(0);
    mockPrisma.shop.count.mockResolvedValue(0);
    mockPrisma.supplier.count.mockResolvedValue(0);
    mockPrisma.product.count.mockResolvedValue(0);
    mockPrisma.productInfo.count.mockResolvedValue(0);
    mockPrisma.finishedInventory.count.mockResolvedValue(0);
    mockPrisma.purchaseOrder.count.mockResolvedValue(0);
    mockPrisma.warehouseTask.count.mockResolvedValue(0);
    mockPrisma.shipmentRecord.count.mockResolvedValue(0);
    mockPrisma.systemLog.count.mockResolvedValue(0);
    mockPrisma.log.count.mockResolvedValue(0);
    mockPrisma.productCategory.count.mockResolvedValue(0);

    // 设置 auth mock
    mockAuth.verifyPassword.mockResolvedValue(true);
    mockAuth.generateAccessToken.mockReturnValue('mock-access-token');
    mockAuth.generateRefreshToken.mockReturnValue('mock-refresh-token');
    mockAuth.getCurrentUser.mockResolvedValue({
      id: 1,
      name: 'admin',
      status: 'ACTIVE',
    });
    mockAuth.verifyRequestToken.mockReturnValue({
      id: 1,
      name: 'admin',
    });

    // 设置 Redis mock
    mockRedis.redisService.set.mockResolvedValue(true);
    mockRedis.redisService.get.mockResolvedValue(null);
    mockRedis.redisService.del.mockResolvedValue(true);
  });

  describe('认证流程', () => {
    it('应该获取当前用户信息', async () => {
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
    });
  });

  describe('基础数据管理', () => {
    it('应该获取角色列表', async () => {
      mockPrisma.role.findMany.mockResolvedValue([]);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/roles', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await rolesHandler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
    });

    it('应该获取店铺列表', async () => {
      mockPrisma.shop.findMany.mockResolvedValue([]);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/shops', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await shopsHandler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
    });

    it('应该获取供应商列表', async () => {
      mockPrisma.supplier.findMany.mockResolvedValue([]);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/suppliers', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await suppliersHandler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
    });
  });

  describe('产品管理', () => {
    it('应该获取产品列表', async () => {
      mockPrisma.productInfo.findMany.mockResolvedValue([]);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/products', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await productsHandler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
    });
  });

  describe('库存管理', () => {
    it('应该获取成品库存列表', async () => {
      mockPrisma.finishedInventory.findMany.mockResolvedValue([]);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/finished-inventory', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await finishedInventoryHandler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
    });
  });

  describe('业务流程', () => {
    it('应该获取采购订单列表', async () => {
      mockPrisma.purchaseOrder.findMany.mockResolvedValue([]);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/purchase-orders', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await purchaseOrdersHandler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
    });

    it('应该获取仓库任务列表', async () => {
      mockPrisma.warehouseTask.findMany.mockResolvedValue([]);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/warehouse-tasks', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await warehouseTasksHandler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
    });

    it('应该获取发货记录列表', async () => {
      mockPrisma.shipmentRecord.findMany.mockResolvedValue([]);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/delivery-records', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await deliveryRecordsHandler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
    });
  });

  describe('系统管理', () => {
    it('应该获取系统日志', async () => {
      mockPrisma.log.findMany.mockResolvedValue([]);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/logs', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await logsHandler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
    });
  });
});
