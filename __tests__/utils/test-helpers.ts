import request from 'supertest';
import { createServer } from 'http';
import { NextApiHandler } from 'next';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// 测试用的JWT密钥 - 与实际应用保持一致
const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only';

// 生成测试用的JWT token
export const generateTestToken = (payload: any) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

// 测试用户数据
export const testUsers = {
  admin: {
    id: 1,
    username: 'admin',
    name: 'Admin User',
    email: 'admin@test.com',
    role: 'ADMIN',
    permissions: ['READ_USER', 'WRITE_USER', 'DELETE_USER', 'ADMIN_ACCESS'],
  },
  user: {
    id: 2,
    username: 'user',
    name: 'Test User',
    email: 'user@test.com',
    role: 'USER',
    permissions: ['READ_USER'],
  },
};

// 生成测试用的认证token
export const getAuthToken = (userType: 'admin' | 'user' = 'admin') => {
  const user = testUsers[userType];
  // 使用与实际应用一致的token格式
  const payload = {
    id: user.id.toString(),
    name: user.username,
    roles: [user.role],
    permissions: user.permissions,
    nonce: Math.random().toString(36).substring(2, 15),
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
};

// 创建测试请求客户端
export const createTestRequest = (handler: NextApiHandler) => {
  const server = createServer((req, res) => {
    return handler(req as any, res as any);
  });
  return request(server);
};

// 测试数据工厂
export class TestDataFactory {
  static role(overrides = {}) {
    return {
      name: '测试角色',
      description: '测试角色描述',
      operator: 'admin',
      permissions: ['READ_USER', 'WRITE_USER'],
      ...overrides,
    };
  }

  static shop(overrides = {}) {
    return {
      name: '测试店铺',
      description: '测试店铺描述',
      address: '测试地址',
      contactPhone: '13800138000',
      ...overrides,
    };
  }

  static supplier(overrides = {}) {
    return {
      name: '测试供应商',
      contactPerson: '张三',
      phone: '13800138001',
      email: 'supplier@test.com',
      address: '供应商地址',
      ...overrides,
    };
  }

  static forwarding(overrides = {}) {
    return {
      name: '测试货代',
      contactPerson: '李四',
      phone: '13800138002',
      email: 'forwarding@test.com',
      address: '货代地址',
      ...overrides,
    };
  }

  static productCategory(overrides = {}) {
    return {
      name: '测试产品分类',
      code: 'CAT001',
      ...overrides,
    };
  }

  static product(overrides = {}) {
    return {
      name: '测试产品',
      code: 'PROD001',
      specification: '测试规格',
      unit: '个',
      purchasePrice: 100.0,
      salePrice: 150.0,
      categoryId: 1,
      supplierId: 1,
      ...overrides,
    };
  }

  static finishedInventory(overrides = {}) {
    return {
      productId: 1,
      shopId: 1,
      quantity: 100,
      reservedQuantity: 10,
      availableQuantity: 90,
      location: 'A-01-001',
      ...overrides,
    };
  }

  static spareInventory(overrides = {}) {
    return {
      productId: 1,
      shopId: 1,
      quantity: 200,
      reservedQuantity: 20,
      availableQuantity: 180,
      location: 'B-01-001',
      ...overrides,
    };
  }

  static purchaseOrder(overrides = {}) {
    return {
      orderNumber: 'PO' + Date.now(),
      supplierId: 1,
      status: 'PENDING',
      totalAmount: 1000.0,
      orderDate: new Date(),
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
      notes: '测试采购订单',
      operatorId: 1,
      ...overrides,
    };
  }

  static deliveryRecord(overrides = {}) {
    return {
      shopId: 1,
      trackingNumber: 'TN' + Date.now(),
      courier: 'DHL',
      totalBoxes: 5,
      fbaShipmentCode: 'FBA' + Date.now(),
      fbaWarehouseCode: 'WH001',
      country: 'US',
      channel: 'FBA',
      status: 'PENDING',
      shipmentDate: new Date(),
      operatorId: 1,
      ...overrides,
    };
  }

  // warehouseTask 已被移除，包装任务现在作为独立功能存在

  static financialReport(overrides = {}) {
    return {
      title: '测试财务报表',
      type: 'MONTHLY',
      period: '2024-01',
      revenue: 10000.0,
      costs: 7000.0,
      profit: 3000.0,
      createdById: 1,
      ...overrides,
    };
  }

  static user(overrides = {}) {
    return {
      username: 'testuser',
      name: '测试用户',
      email: 'test@example.com',
      password: 'hashedPassword123',
      roleId: 1,
      ...overrides,
    };
  }
}

// Mock Prisma 客户端
export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
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
  product: {
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
  },
  spareInventory: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  productCategory: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  purchaseOrder: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  deliveryRecord: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  // warehouseTask mock 已被移除
  financialReport: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  log: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  permission: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  forwardingAgent: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

// Mock 用户数据
export const mockUser = {
  id: 1,
  username: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  role: 'USER',
  permissions: ['read', 'write'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock 管理员用户
export const mockAdminUser = {
  id: 1,
  username: 'admin',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'ADMIN',
  permissions: ['read', 'write', 'admin'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock JWT Token
export const mockJwtToken = 'mock-jwt-token-for-testing';

// Mock NextRequest 工厂
export const createMockRequest = (
  options: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
) => {
  const { method = 'GET', url = 'http://localhost:3000/api/test', headers = {}, body } = options;

  return {
    method,
    url,
    headers: {
      get: jest.fn((key: string) => headers[key] || null),
      ...headers,
    },
    nextUrl: { pathname: new URL(url).pathname },
    json: jest.fn().mockResolvedValue(body || {}),
    body: body ? JSON.stringify(body) : undefined,
  } as unknown;
};

// 清理所有 mock
export const clearAllMocks = () => {
  Object.values(mockPrisma).forEach((mockFn) => {
    if (typeof mockFn === 'object' && mockFn !== null) {
      Object.values(mockFn).forEach((fn) => {
        if (jest.isMockFunction(fn)) {
          fn.mockClear();
        }
      });
    } else if (jest.isMockFunction(mockFn)) {
      mockFn.mockClear();
    }
  });
};

// 设置认证mock
export const setupAuthMocks = () => {
  // Mock bcrypt - 默认验证成功
  (bcrypt.compare as jest.Mock) = jest.fn().mockResolvedValue(true);
  (bcrypt.hash as jest.Mock) = jest.fn().mockResolvedValue('hashedPassword');

  // Mock JWT
  (jwt.sign as jest.Mock) = jest.fn().mockReturnValue(mockJwtToken);
  (jwt.verify as jest.Mock) = jest.fn().mockReturnValue({
    id: mockUser.id.toString(),
    name: mockUser.username,
    roles: [mockUser.role],
    permissions: mockUser.permissions,
  });

  return { bcrypt, jwt };
};

// 重置所有Mock
export const resetMocks = () => {
  Object.values(mockPrisma).forEach((table) => {
    if (typeof table === 'object' && table !== null) {
      Object.values(table).forEach((method) => {
        if (typeof method === 'function' && 'mockReset' in method) {
          method.mockReset();
        }
      });
    }
  });
};

// API 响应验证器
export class ApiResponseValidator {
  static validateSuccessResponse(response: any, expectedCode = 0) {
    expect(response).toHaveProperty('code', expectedCode);
    expect(response).toHaveProperty('msg');
    if (expectedCode === 0) {
      expect(response).toHaveProperty('data');
    }
  }

  static validateErrorResponse(response: any, expectedCode = 1) {
    expect(response).toHaveProperty('code', expectedCode);
    expect(response).toHaveProperty('msg');
    expect(response.msg).not.toBe('');
  }

  static validatePaginationResponse(response: any) {
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('pagination');
    expect(response.pagination).toHaveProperty('page');
    expect(response.pagination).toHaveProperty('pageSize');
    expect(response.pagination).toHaveProperty('total');
  }

  static validateListResponse(response: any, expectedLength?: number) {
    expect(response).toHaveProperty('data');
    expect(Array.isArray(response.data)).toBe(true);
    if (expectedLength !== undefined) {
      expect(response.data).toHaveLength(expectedLength);
    }
  }
}

// 测试数据库状态验证器
export class DatabaseValidator {
  static validateCreateCall(mockMethod: jest.Mock, expectedData: any) {
    expect(mockMethod).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining(expectedData),
      })
    );
  }

  static validateUpdateCall(mockMethod: jest.Mock, id: number, expectedData: any) {
    expect(mockMethod).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id },
        data: expect.objectContaining(expectedData),
      })
    );
  }

  static validateDeleteCall(mockMethod: jest.Mock, id: number) {
    expect(mockMethod).toHaveBeenCalledWith({
      where: { id },
    });
  }

  static validateFindManyCall(mockMethod: jest.Mock, expectedWhere?: any) {
    if (expectedWhere) {
      expect(mockMethod).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        })
      );
    } else {
      expect(mockMethod).toHaveBeenCalled();
    }
  }
}

// 权限测试工具
export class PermissionTestHelper {
  static async testUnauthorizedAccess(
    handler: (...args: unknown[]) => Promise<Response>,
    req: unknown
  ) {
    const response = await handler(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe(1);
    expect(data.msg).toContain('令牌无效');
  }

  static async testForbiddenAccess(
    handler: (...args: unknown[]) => Promise<Response>,
    req: unknown
  ) {
    const response = await handler(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.code).toBe(1);
    expect(data.msg).toContain('权限不足');
  }
}

// 错误模拟工具
export class ErrorSimulator {
  static simulateDatabaseError(mockMethod: jest.Mock, errorMessage: string) {
    mockMethod.mockRejectedValue(new Error(errorMessage));
  }

  static simulateUniqueConstraintError(mockMethod: jest.Mock, field: string) {
    mockMethod.mockRejectedValue(
      new Error(`Unique constraint failed on the fields: (\`${field}\`)`)
    );
  }

  static simulateForeignKeyError(mockMethod: jest.Mock) {
    mockMethod.mockRejectedValue(new Error('Foreign key constraint fails'));
  }

  static simulateNotFoundError(mockMethod: jest.Mock) {
    mockMethod.mockResolvedValue(null);
  }
}
