import { PrismaClient } from '@prisma/client';
import { PurchaseOrderStatisticsCalculator } from '../purchase-order-statistics-calculator';
import {
  StatisticsFilters,
  StatisticsCalculationError,
  StatisticsErrorCode,
} from '@/types/purchase-order-statistics';

// Mock Prisma Client
const mockPrisma = {
  purchaseOrder: {
    count: jest.fn(),
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  productItem: {
    findMany: jest.fn(),
  },
  supplyRecord: {
    findMany: jest.fn(),
  },
  supplyRecordItem: {
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

describe('PurchaseOrderStatisticsCalculator', () => {
  let calculator: PurchaseOrderStatisticsCalculator;

  beforeEach(() => {
    calculator = new PurchaseOrderStatisticsCalculator(mockPrisma);
    jest.clearAllMocks();
  });

  describe('calculateStatistics', () => {
    it('应该成功计算基础统计信息', async () => {
      // Mock 数据
      (mockPrisma.purchaseOrder.count as jest.Mock)
        .mockResolvedValueOnce(100) // totalRecords
        .mockResolvedValueOnce(85); // activeRecords

      (mockPrisma.purchaseOrder.aggregate as jest.Mock).mockResolvedValue({
        _sum: { finalAmount: 50000 },
      });

      (mockPrisma.productItem.findMany as jest.Mock).mockResolvedValue([
        {
          productId: 'prod1',
          quantity: 20,
          product: { name: '产品A', sku: 'SKU001' },
        },
        {
          productId: 'prod2',
          quantity: 10,
          product: { name: '产品B', sku: 'SKU002' },
        },
      ]);

      (mockPrisma.supplyRecord.findMany as jest.Mock).mockResolvedValue([
          { id: 'supply1' },
          { id: 'supply2' },
          { id: 'supply3' },
        ]);
       (mockPrisma.supplyRecord.findMany as jest.Mock).mockResolvedValue([
          { id: 'supply1' },
          { id: 'supply2' },
        ]);
        (mockPrisma.supplyRecordItem.findMany as jest.Mock).mockResolvedValue([
          { productId: 'prod1', quantity: 5 },
          { productId: 'prod2', quantity: 15 },
        ]);

      (mockPrisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue([
        { id: 'order1' },
        { id: 'order2' },
      ]);

      const filters: StatisticsFilters = {
        shopId: 'shop1',
        status: 'APPROVED',
      };

      const result = await calculator.calculateStatistics(filters);

      expect(result.totalRecords).toBe(100);
      expect(result.activeRecords).toBe(85);
      expect(result.totalAmount).toBe(50000);
      expect(result.productStatuses).toHaveLength(2);
      expect(result.productStatuses[0]).toMatchObject({
        productId: 'prod1',
        productName: '产品A',
        productSku: 'SKU001',
        purchaseQuantity: 20,
        suppliedQuantity: 5,
        availableQuantity: 15,
        supplyProgress: 25,
      });
    });

    it('应该处理空数据情况', async () => {
      (mockPrisma.purchaseOrder.count as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      (mockPrisma.purchaseOrder.aggregate as jest.Mock).mockResolvedValue({
        _sum: { finalAmount: null },
      });

      (mockPrisma.productItem.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.supplyRecord.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.supplyRecordItem.findMany as jest.Mock).mockResolvedValue([
        {
          productId: 'product1',
          quantity: 100,
          product: {
            name: '产品A',
            sku: 'SKU001'
          }
        },
        {
          productId: 'product2',
          quantity: 50,
          product: {
            name: '产品B',
            sku: 'SKU002'
          }
        },
        {
          productId: 'product3',
          quantity: 200,
          product: {
            name: '产品C',
            sku: 'SKU003'
          }
        }
      ]);
      (mockPrisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue([
        { id: 'order1' },
        { id: 'order2' },
        { id: 'order3' },
      ]);

      const result = await calculator.calculateStatistics({});

      expect(result.totalRecords).toBe(0);
      expect(result.activeRecords).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.productStatuses).toHaveLength(0);
    });

    it('应该处理数据库查询错误', async () => {
      (mockPrisma.purchaseOrder.count as jest.Mock).mockRejectedValue(
        new Error('数据库连接失败')
      );

      const filters: StatisticsFilters = { shopId: 'shop1' };

      await expect(calculator.calculateStatistics(filters)).rejects.toThrow(
        StatisticsCalculationError
      );
    });

    it('应该验证筛选条件', async () => {
      const invalidFilters = {
        createdAtStart: new Date('2024-01-01'),
        createdAtEnd: new Date('2023-01-01'), // 结束日期早于开始日期
      } as StatisticsFilters;

      await expect(calculator.calculateStatistics(invalidFilters)).rejects.toThrow(
        StatisticsCalculationError
      );
    });

    it('应该限制产品状态数量', async () => {
      const calculator = new PurchaseOrderStatisticsCalculator(mockPrisma, {
        maxProductStatuses: 2,
      });

      (mockPrisma.purchaseOrder.count as jest.Mock)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(10);

      (mockPrisma.purchaseOrder.aggregate as jest.Mock).mockResolvedValue({
        _sum: { finalAmount: 1000 },
      });

      // 模拟返回3个产品
      (mockPrisma.productItem.findMany as jest.Mock).mockResolvedValue([
        {
          productId: 'prod1',
          quantity: 10,
          product: { name: '产品A', sku: 'SKU001' },
        },
        {
          productId: 'prod2',
          quantity: 20,
          product: { name: '产品B', sku: 'SKU002' },
        },
        {
          productId: 'prod3',
          quantity: 30,
          product: { name: '产品C', sku: 'SKU003' },
        },
      ]);

      (mockPrisma.supplyRecord.findMany as jest.Mock).mockResolvedValue([
        { id: 'supply1' },
        { id: 'supply2' },
      ]);
      (mockPrisma.supplyRecordItem.findMany as jest.Mock).mockResolvedValue([]);

      const result = await calculator.calculateStatistics({});

      // 应该只返回前2个产品（按采购数量降序）
      expect(result.productStatuses).toHaveLength(2);
      expect(result.productStatuses[0].productId).toBe('prod3'); // 数量最多的
      expect(result.productStatuses[1].productId).toBe('prod2');
    });
  });

  describe('配置管理', () => {
    it('应该正确设置默认配置', () => {
      const options = calculator.getOptions();

      expect(options.maxProductStatuses).toBe(100);
      expect(options.enableCache).toBe(false);
      expect(options.enableParallelQueries).toBe(true);
    });

    it('应该允许更新配置', () => {
      calculator.updateOptions({
        maxProductStatuses: 100,
        enableCache: true,
      });

      const options = calculator.getOptions();
      expect(options.maxProductStatuses).toBe(100);
      expect(options.enableCache).toBe(true);
      expect(options.enableParallelQueries).toBe(true); // 保持原值
    });
  });
});

describe('工厂函数', () => {
  it('createPurchaseOrderStatisticsCalculator 应该创建新实例', async () => {
    const { createPurchaseOrderStatisticsCalculator } = await import('../purchase-order-statistics-calculator');
    
    const calculator = createPurchaseOrderStatisticsCalculator(mockPrisma, {
      maxProductStatuses: 25,
    });

    expect(calculator).toBeInstanceOf(PurchaseOrderStatisticsCalculator);
    expect(calculator.getOptions().maxProductStatuses).toBe(25);
  });

  it('getDefaultStatisticsCalculator 应该返回单例实例', async () => {
    const { getDefaultStatisticsCalculator } = await import('../purchase-order-statistics-calculator');
    
    const calculator1 = getDefaultStatisticsCalculator(mockPrisma);
    const calculator2 = getDefaultStatisticsCalculator(mockPrisma);

    expect(calculator1).toBe(calculator2); // 应该是同一个实例
  });
});