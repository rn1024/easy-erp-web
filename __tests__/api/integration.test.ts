/**
 * @jest-environment node
 */
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { POST as loginHandler } from '@/app/api/v1/auth/login-simple/route';

const BASE_URL = 'http://localhost:3000/api/v1';

// HTTP客户端配置
const httpClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 全局变量存储认证token
let authToken = '';

// 请求拦截器添加认证头
httpClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

describe('API 集成测试', () => {
  beforeAll(async () => {
    // 等待服务器启动
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  describe('认证流程', () => {
    it('应该成功登录', async () => {
      const response = await httpClient.post('/auth/login-simple', {
        username: 'admin',
        password: 'admin123456',
      });

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
      expect(response.data.data.token).toBeDefined();

      authToken = response.data.data.token;
    });

    it('应该获取当前用户信息', async () => {
      const response = await httpClient.get('/me');

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
      expect(response.data.data.name).toBe('admin');
    });
  });

  describe('基础数据管理', () => {
    it('应该获取角色列表', async () => {
      const response = await httpClient.get('/roles');

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
    });

    it('应该获取店铺列表', async () => {
      const response = await httpClient.get('/shops');

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
    });

    it('应该获取供应商列表', async () => {
      const response = await httpClient.get('/suppliers');

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
    });
  });

  describe('产品管理', () => {
    it('应该获取产品列表', async () => {
      const response = await httpClient.get('/products');

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
    });
  });

  describe('库存管理', () => {
    it('应该获取成品库存列表', async () => {
      const response = await httpClient.get('/finished-inventory');

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
    });
  });

  describe('业务流程', () => {
    it('应该获取采购订单列表', async () => {
      const response = await httpClient.get('/purchase-orders');

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
    });

    it('应该获取仓库任务列表', async () => {
      const response = await httpClient.get('/warehouse-tasks');

      expect(response.status).toBe(200);
    });

    it('应该获取发货记录列表', async () => {
      const response = await httpClient.get('/delivery-records');

      expect(response.status).toBe(200);
    });
  });

  describe('系统管理', () => {
    it('应该获取系统日志', async () => {
      const response = await httpClient.get('/logs');

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
    });
  });
});
