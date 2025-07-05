/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as getProducts, POST as createProduct } from '@/app/api/v1/products/route';
import {
  GET as getProduct,
  PUT as updateProduct,
  DELETE as deleteProduct,
} from '@/app/api/v1/products/[id]/route';
import { getAuthToken, TestDataFactory, mockPrisma, resetMocks } from '../utils/test-helpers';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: mockPrisma,
}));

describe('/api/v1/products', () => {
  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
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

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

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
      expect(data.data).toHaveLength(1);
      expect(data.data[0].name).toBe('测试产品1');
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        include: {
          category: true,
          supplier: true,
        },
        skip: 0,
        take: 10,
      });
    });

    it('应该支持产品搜索', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/products?search=手机', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await getProducts(req);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: '手机' } },
            { code: { contains: '手机' } },
            { specification: { contains: '手机' } },
          ],
        },
        include: {
          category: true,
          supplier: true,
        },
        skip: 0,
        take: 10,
      });
    });

    it('应该支持按分类筛选', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/products?categoryId=1', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await getProducts(req);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          categoryId: 1,
        },
        include: {
          category: true,
          supplier: true,
        },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('POST /api/v1/products', () => {
    it('应该成功创建产品', async () => {
      const productData = TestDataFactory.product();
      const mockProduct = {
        id: 1,
        ...productData,
        category: { id: 1, name: '测试分类' },
        supplier: { id: 1, name: '测试供应商' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.product.create.mockResolvedValue(mockProduct);

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

      expect(response.status).toBe(201);
      expect(data.code).toBe(0);
      expect(data.data.name).toBe(productData.name);
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: productData,
        include: {
          category: true,
          supplier: true,
        },
      });
    });

    it('应该验证产品代码唯一性', async () => {
      const productData = TestDataFactory.product();

      mockPrisma.product.create.mockRejectedValue(
        new Error('Unique constraint failed on the fields: (`code`)')
      );

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
      expect(data.code).toBe(1);
      expect(data.msg).toContain('产品编码已存在');
    });

    it('应该验证价格字段', async () => {
      const productData = TestDataFactory.product({
        purchasePrice: -10,
        salePrice: 0,
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
      expect(data.code).toBe(1);
      expect(data.msg).toContain('价格必须大于0');
    });

    it('应该验证必填字段', async () => {
      const token = getAuthToken('admin');
      const req = new NextRequest('http://localhost:3000/api/v1/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: '',
          code: '',
          categoryId: null,
          supplierId: null,
        }),
      });

      const response = await createProduct(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe(1);
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

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

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
      expect(data.code).toBe(0);
      expect(data.data.name).toBe('测试产品');
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          category: true,
          supplier: true,
        },
      });
    });

    it('应该处理产品不存在的情况', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

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
      expect(data.code).toBe(1);
      expect(data.msg).toContain('产品不存在');
    });
  });

  describe('PUT /api/v1/products/[id]', () => {
    it('应该成功更新产品', async () => {
      const updateData = {
        name: '更新后的产品',
        code: 'PROD002',
        specification: '更新规格',
        unit: '件',
        purchasePrice: 120.0,
        salePrice: 180.0,
        categoryId: 2,
        supplierId: 2,
      };

      const mockUpdatedProduct = {
        id: 1,
        ...updateData,
        category: { id: 2, name: '新分类' },
        supplier: { id: 2, name: '新供应商' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.product.findUnique.mockResolvedValue({ id: 1, name: '原产品' });
      mockPrisma.product.update.mockResolvedValue(mockUpdatedProduct);

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
      expect(data.code).toBe(0);
      expect(data.data.name).toBe('更新后的产品');
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
        include: {
          category: true,
          supplier: true,
        },
      });
    });
  });

  describe('DELETE /api/v1/products/[id]', () => {
    it('应该成功删除产品', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 1, name: '测试产品' });
      mockPrisma.product.delete.mockResolvedValue({ id: 1, name: '测试产品' });

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
      expect(data.code).toBe(0);
      expect(mockPrisma.product.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('应该处理删除不存在的产品', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

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
      expect(data.code).toBe(1);
      expect(data.msg).toContain('产品不存在');
    });

    it('应该检查产品是否被库存使用', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 1, name: '测试产品' });
      mockPrisma.product.delete.mockRejectedValue(new Error('Foreign key constraint fails'));

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
      expect(data.code).toBe(1);
      expect(data.msg).toContain('该产品已被使用，无法删除');
    });
  });
});
