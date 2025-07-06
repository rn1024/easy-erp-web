/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST as loginHandler } from '@/app/api/v1/auth/login-simple/route';
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

// Mock bcrypt for password validation
jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

// Mock Redis for refresh token storage
jest.mock('../../src/lib/redis', () => ({
  redisService: {
    set: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(true),
  },
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
    mockPrisma.deliveryRecord.count.mockResolvedValue(0);
    mockPrisma.systemLog.count.mockResolvedValue(0);
    mockPrisma.log.count.mockResolvedValue(0);
    mockPrisma.productCategory.count.mockResolvedValue(0);
  });

  describe('认证流程', () => {
    it('应该成功登录', async () => {
      // Mock登录成功 - 第一次调用用于登录验证
      mockPrisma.account.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'admin',
        password: 'hashedPassword',
        status: 'ACTIVE',
        roles: [
          {
            role: {
              name: 'admin',
              permissions: [
                { permission: { code: 'admin.read' } },
                { permission: { code: 'admin.write' } },
              ],
            },
          },
        ],
      });

      // Mock update call
      mockPrisma.account.update.mockResolvedValue({
        id: 1,
        name: 'admin',
        updatedAt: new Date(),
      });

      const req = new NextRequest('http://localhost:3000/api/v1/auth/login-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123456',
        }),
      });

      const response = await loginHandler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
      expect(data.data.token).toBeDefined();
    });

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
      expect(data.code).toBe(0);
    });

    it('应该获取发货记录列表', async () => {
      mockPrisma.deliveryRecord.findMany.mockResolvedValue([]);

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
      expect(data.code).toBe(0);
    });
  });

  describe('系统管理', () => {
    it('应该获取系统日志', async () => {
      mockPrisma.log.findMany.mockResolvedValue([
        {
          id: 1,
          category: 'system',
          module: 'auth',
          operation: 'login',
          status: 'success',
          details: { ip: '127.0.0.1' },
          createdAt: new Date(),
          operatorAccountId: 1,
          operator: {
            id: 1,
            name: 'admin',
          },
        },
      ]);

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
