/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as getProducts, POST as createProduct } from '../../src/app/api/v1/products/route';
import {
  GET as getProduct,
  PUT as updateProduct,
  DELETE as deleteProduct,
} from '../../src/app/api/v1/products/[id]/route';
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
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
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
    productCategory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    shop: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    supplier: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    finishedInventory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    spareInventory: {
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
    productItem: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
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

// 获取mock对象用于测试
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { prisma: mockPrisma } = require('../../src/lib/db');

describe('/api/v1/products', () => {
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
              { permission: { code: 'products.read' } },
              { permission: { code: 'products.write' } },
              { permission: { code: 'products.delete' } },
            ],
          },
        },
      ],
    });

    // 设置products相关的默认mock
    mockPrisma.productInfo.count.mockResolvedValue(0);
    mockPrisma.productInfo.findFirst.mockResolvedValue(null);

    // 设置删除产品时需要检查的关联表
    mockPrisma.finishedInventory.count.mockResolvedValue(0);
    mockPrisma.spareInventory.count.mockResolvedValue(0);
    mockPrisma.productItem.count.mockResolvedValue(0);
  });

  describe('GET /api/v1/products', () => {
    it('应该返回产品列表', async () => {
      const mockProducts = [
        {
          id: 1,
          name: '测试产品1',
          code: 'PROD001',
          specification: '规格1',
          unit: '个',
          purchasePrice: 100.0,
          salePrice: 150.0,
          category: { id: 1, name: '分类1' },
          supplier: { id: 1, name: '供应商1' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.productInfo.findMany.mockResolvedValue(mockProducts);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/products', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await getProducts(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
      expect(data.data.list).toHaveLength(1);
      expect(data.data.list[0].name).toBe('测试产品1');
      expect(mockPrisma.productInfo.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
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
          operator: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('应该支持产品搜索', async () => {
      mockPrisma.productInfo.findMany.mockResolvedValue([]);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/products?code=PROD001', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await getProducts(req);

      expect(mockPrisma.productInfo.findMany).toHaveBeenCalledWith({
        where: {
          code: {
            contains: 'PROD001',
          },
        },
        include: {
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
          operator: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('应该支持按分类筛选', async () => {
      mockPrisma.productInfo.findMany.mockResolvedValue([]);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/products?categoryId=1', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await getProducts(req);

      expect(mockPrisma.productInfo.findMany).toHaveBeenCalledWith({
        where: {
          categoryId: '1',
        },
        include: {
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
          operator: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('POST /api/v1/products', () => {
    it('应该成功创建产品', async () => {
      const productData = {
        shopId: 'shop-1',
        categoryId: 'cat-1',
        code: 'PROD001',
        sku: 'SKU001',
        specification: '测试规格',
        color: '红色',
        setQuantity: 1,
      };

      const mockProduct = {
        id: 'prod-1',
        ...productData,
        shop: { id: 'shop-1', nickname: '测试店铺' },
        category: { id: 'cat-1', name: '测试分类' },
        operator: { id: 1, name: 'Admin User' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock关联数据验证
      mockPrisma.shop.findUnique.mockResolvedValue({ id: 'shop-1', nickname: '测试店铺' });
      mockPrisma.productCategory.findUnique.mockResolvedValue({ id: 'cat-1', name: '测试分类' });
      mockPrisma.productInfo.findUnique.mockResolvedValue(null); // SKU不存在
      mockPrisma.productInfo.create.mockResolvedValue(mockProduct);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const response = await createProduct(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(0);
      expect(data.data.code).toBe(productData.code);
      expect(mockPrisma.productInfo.create).toHaveBeenCalledWith({
        data: {
          shopId: 'shop-1',
          categoryId: 'cat-1',
          code: 'PROD001',
          specification: '测试规格',
          color: '红色',
          setQuantity: 1,
          internalSize: null,
          externalSize: null,
          weight: null,
          sku: 'SKU001',
          label: null,
          codeFileUrl: null,
          styleInfo: null,
          accessoryInfo: null,
          remark: null,
          operatorId: 1,
        },
        include: {
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
          operator: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
      });
    });

    it('应该验证SKU唯一性', async () => {
      const productData = {
        shopId: 'shop-1',
        categoryId: 'cat-1',
        code: 'PROD001',
        sku: 'SKU001',
      };

      // Mock关联数据存在
      mockPrisma.shop.findUnique.mockResolvedValue({ id: 'shop-1', nickname: '测试店铺' });
      mockPrisma.productCategory.findUnique.mockResolvedValue({ id: 'cat-1', name: '测试分类' });

      // Mock SKU已存在
      mockPrisma.productInfo.findUnique.mockResolvedValue({
        id: 'existing-prod',
        sku: 'SKU001',
      });

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const response = await createProduct(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe(400);
      expect(data.msg).toContain('SKU已存在');
    });

    it('应该验证必填字段', async () => {
      const productData = {
        shopId: 'shop-1',
        // 缺少 categoryId (code和sku现在是可选的)
      };

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const response = await createProduct(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe(400);
      expect(data.msg).toContain('缺少必要参数');
    });
  });

  describe('GET /api/v1/products/[id]', () => {
    it('应该返回指定的产品', async () => {
      const mockProduct = {
        id: 1,
        name: '测试产品',
        code: 'PROD001',
        specification: '测试规格',
        unit: '个',
        purchasePrice: 100.0,
        salePrice: 150.0,
        category: { id: 1, name: '测试分类' },
        supplier: { id: 1, name: '测试供应商' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.productInfo.findUnique.mockResolvedValue(mockProduct);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/products/1', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await getProduct(req, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(200);
      expect(data.data.name).toBe('测试产品');
      expect(mockPrisma.productInfo.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
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
          operator: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
      });
    });

    it('应该处理产品不存在的情况', async () => {
      mockPrisma.productInfo.findUnique.mockResolvedValue(null);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/products/999', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await getProduct(req, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe(404);
      expect(data.msg).toContain('产品信息不存在');
    });
  });

  describe('PUT /api/v1/products/[id]', () => {
    it('应该成功更新产品', async () => {
      const updateData = {
        code: 'PROD002',
        specification: '更新规格',
        categoryId: 2,
      };

      const mockUpdatedProduct = {
        id: '1',
        ...updateData,
        category: { id: 2, name: '新分类' },
        shop: { id: 'shop-1', nickname: '测试店铺' },
        operator: { id: 1, name: 'Admin User' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.productInfo.findUnique.mockResolvedValue({ id: '1', code: 'PROD001' });
      mockPrisma.productInfo.update.mockResolvedValue(mockUpdatedProduct);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/products/1', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const response = await updateProduct(req, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(200);
      expect(data.data.code).toBe('PROD002');
      expect(mockPrisma.productInfo.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          categoryId: 2,
          code: 'PROD002',
          specification: '更新规格',
        },
        include: {
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
          operator: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
      });
    });
  });

  describe('DELETE /api/v1/products/[id]', () => {
    it('应该成功删除产品', async () => {
      mockPrisma.productInfo.findUnique.mockResolvedValue({ id: 1, name: '测试产品' });
      mockPrisma.productInfo.delete.mockResolvedValue({ id: 1, name: '测试产品' });

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/products/1', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await deleteProduct(req, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(200);
      expect(mockPrisma.productInfo.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('应该处理删除不存在的产品', async () => {
      mockPrisma.productInfo.findUnique.mockResolvedValue(null);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/products/999', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await deleteProduct(req, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe(404);
      expect(data.msg).toContain('产品信息不存在');
    });

    it('应该检查产品是否被库存使用', async () => {
      mockPrisma.productInfo.findUnique.mockResolvedValue({ id: '1', name: '测试产品' });

      // Mock存在相关业务数据
      mockPrisma.finishedInventory.count.mockResolvedValue(1); // 有成品库存
      mockPrisma.spareInventory.count.mockResolvedValue(0);
      mockPrisma.productItem.count.mockResolvedValue(0);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/products/1', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await deleteProduct(req, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe(400);
      expect(data.msg).toContain('该产品存在相关业务数据，无法删除');
    });
  });
});
