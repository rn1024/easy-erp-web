# Easy-ERP 前端端到端 (E2E) 测试方案

## 文档信息

- **项目名称**: Easy-ERP Web
- **文档类型**: E2E 测试方案
- **版本**: 1.0
- **创建日期**: 2025-07-29
- **适用环境**: Next.js 14 + TypeScript + Ant Design

## 1. 概述

### 1.1 测试目标

本 E2E 测试方案旨在验证 Easy-ERP 系统的前端功能完整性、用户工作流程正确性以及跨模块业务流程的端到端测试。

### 1.2 测试范围

- **核心业务模块**: 产品管理、采购管理、库存管理、财务管理等
- **用户交互**: 登录认证、数据操作、状态流转
- **跨模块流程**: 完整业务流程的端到端验证
- **响应式设计**: 不同设备尺寸的兼容性测试

### 1.3 测试原则

1. **用户视角**: 模拟真实用户操作路径
2. **业务驱动**: 基于实际业务流程设计测试用例
3. **数据完整性**: 确保数据在整个流程中的准确性
4. **性能考虑**: 验证关键操作的性能指标

## 2. 测试环境与工具

### 2.1 测试工具栈

#### 推荐工具组合
```json
{
  "e2e-framework": "Playwright",
  "test-runner": "@playwright/test",
  "reporter": "allure-playwright",
  "mock-server": "msw",
  "visual-testing": "argos-ci",
  "performance": "lighthouse"
}
```

#### 工具选择理由
- **Playwright**: 支持多浏览器、自动等待、强大的调试能力
- **MSW**: API 拦截和模拟，减少对后端依赖
- **Allure**: 详细的测试报告和趋势分析
- **Argos**: 视觉回归测试，确保 UI 一致性

### 2.2 测试环境配置

#### 测试环境分层
```yaml
environments:
  development:
    url: "http://localhost:3008"
    database: "test_db"
    api_mock: true
    
  staging:
    url: "https://staging.easy-erp.com"
    database: "staging_db"
    api_mock: false
    
  production:
    url: "https://app.easy-erp.com"
    database: "production_db_readonly"
    api_mock: false
```

#### 测试数据管理
```typescript
// 测试数据工厂
export class TestDataFactory {
  static createTestUser(): User {
    return {
      username: 'test_user_' + Date.now(),
      email: 'test@example.com',
      role: 'admin',
      password: 'Test123!@#'
    };
  }
  
  static createTestProduct(): Product {
    return {
      name: 'Test Product ' + Date.now(),
      sku: 'TEST-' + Date.now(),
      category: 'Electronics',
      price: 99.99,
      stock: 100
    };
  }
}
```

## 3. 测试架构设计

### 3.1 测试文件结构

```
e2e/
├── config/
│   ├── playwright.config.ts
│   ├── fixtures.ts
│   └── setup.ts
├── pages/
│   ├── login.spec.ts
│   ├── dashboard.spec.ts
│   └── auth.setup.ts
├── features/
│   ├── product-management/
│   │   ├── create-product.spec.ts
│   │   ├── edit-product.spec.ts
│   │   └── product-list.spec.ts
│   ├── purchase-management/
│   │   ├── create-order.spec.ts
│   │   ├── approval-workflow.spec.ts
│   │   └── supplier-portal.spec.ts
│   ├── inventory-management/
│   │   ├── stock-in.spec.ts
│   │   ├── inventory-check.spec.ts
│   │   └── packaging-tasks.spec.ts
│   └── financial-management/
│       ├── monthly-reports.spec.ts
│       └── data-accuracy.spec.ts
├── workflows/
│   ├── purchase-to-stock.spec.ts
│   ├── order-to-delivery.spec.ts
│   └── financial-integration.spec.ts
├── utils/
│   ├── api-helpers.ts
│   ├── ui-helpers.ts
│   └── data-helpers.ts
└── reports/
    └── allure-results/
```

### 3.2 Page Object 模式

```typescript
// pages/login-page.ts
export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.ant-form-item-explain-error');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent();
  }
}
```

### 3.3 自定义 Hooks 和 Fixtures

```typescript
// fixtures.ts
import { test as base } from '@playwright/test';

export const test = base.extend<{
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  apiHelper: ApiHelper;
}>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  
  apiHelper: async ({ request }, use) => {
    await use(new ApiHelper(request));
  },
  
  // 全局 setup
  storageState: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.login('test_user', 'password');
    
    await use(context.storageState());
    await context.close();
  }
});
```

## 4. 核心测试用例设计

### 4.1 认证和授权测试

#### 4.1.1 用户登录流程
```typescript
test.describe('用户认证', () => {
  test('成功登录 - 有效凭据', async ({ loginPage, dashboardPage }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'password');
    
    await expect(dashboardPage.page).toHaveURL('/dashboard');
    await expect(dashboardPage.welcomeMessage).toBeVisible();
  });

  test('登录失败 - 无效凭据', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('invalid', 'credentials');
    
    await expect(loginPage.errorMessage).toContainText('用户名或密码错误');
  });

  test('密码重置流程', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=忘记密码');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });
});
```

#### 4.1.2 权限控制测试
```typescript
test.describe('权限控制', () => {
  test('不同角色访问权限', async ({ page }) => {
    const roles = ['admin', 'manager', 'operator'];
    
    for (const role of roles) {
      const context = await browser.newContext({
        storageState: `auth-states/${role}.json`
      });
      const rolePage = await context.newPage();
      
      await rolePage.goto('/dashboard');
      
      // 验证角色可见的菜单项
      const visibleMenus = await rolePage.locator('.ant-menu-item').count();
      console.log(`${role} role can see ${visibleMenus} menu items`);
      
      await context.close();
    }
  });
});
```

### 4.2 产品管理测试

#### 4.2.1 产品创建流程
```typescript
test.describe('产品管理', () => {
  test('创建完整产品信息', async ({ page }) => {
    await page.goto('/products/products');
    await page.click('button:has-text("新建产品")');
    
    // 填写基本信息
    await page.fill('input[name="name"]', '测试产品 ' + Date.now());
    await page.fill('input[name="sku"]', 'TEST-' + Date.now());
    await page.selectOption('select[name="category"]', 'Electronics');
    
    // 设置规格参数
    await page.fill('input[name="weight"]', '1.5');
    await page.fill('input[name="length"]', '10');
    await page.fill('input[name="width"]', '5');
    await page.fill('input[name="height"]', '2');
    
    // 上传图片
    await page.setInputFiles('input[type="file"]', './test-data/product-image.jpg');
    
    // 保存产品
    await page.click('button:has-text("保存")');
    
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });
});
```

#### 4.2.2 产品列表和搜索
```typescript
test('产品搜索和筛选', async ({ page }) => {
  await page.goto('/products/products');
  
  // 按名称搜索
  await page.fill('input[placeholder="搜索产品"]', '电子产品');
  await page.press('input[placeholder="搜索产品"]', 'Enter');
  
  // 验证搜索结果
  const searchResults = await page.locator('.ant-table-tbody tr').count();
  expect(searchResults).toBeGreaterThan(0);
  
  // 按分类筛选
  await page.click('button:has-text("分类")');
  await page.click('text="Electronics"');
  
  // 验证筛选结果
  const filteredResults = await page.locator('.ant-table-tbody tr').count();
  expect(filteredResults).toBeLessThanOrEqual(searchResults);
});
```

### 4.3 采购管理测试

#### 4.3.1 采购订单创建和审批
```typescript
test.describe('采购管理', () => {
  test('完整采购订单流程', async ({ page }) => {
    await page.goto('/purchase/purchase-orders');
    await page.click('button:has-text("新建采购订单")');
    
    // 选择供应商
    await page.click('.ant-select-selector');
    await page.click('text="测试供应商"');
    
    // 添加产品
    await page.click('button:has-text("添加产品")');
    await page.fill('input[name="quantity"]', '100');
    await page.fill('input[name="price"]', '50.00');
    
    // 提交审批
    await page.click('button:has-text("提交审批")');
    
    // 验证订单状态
    await expect(page.locator('text="待确认"')).toBeVisible();
    
    // 模拟审批流程
    await page.click('button:has-text("审批")');
    await page.click('button:has-text("确认")');
    
    // 验证状态更新
    await expect(page.locator('text="已确认"')).toBeVisible();
  });
});
```

#### 4.3.2 供应商门户测试
```typescript
test('供应商订单共享和报价', async ({ page, context }) => {
  // 创建采购订单
  await page.goto('/purchase/purchase-orders');
  await page.click('button:has-text("新建采购订单")');
  
  // 完成订单创建...
  
  // 生成共享链接
  await page.click('button:has-text("生成共享链接")');
  const shareLink = await page.locator('.ant-input').inputValue();
  
  // 新建上下文模拟供应商访问
  const supplierContext = await context.browser.newContext();
  const supplierPage = await supplierContext.newPage();
  
  await supplierPage.goto(shareLink);
  await expect(supplierPage.locator('text="采购订单详情"')).toBeVisible();
  
  // 提交报价
  await supplierPage.fill('input[name="quotePrice"]', '45.00');
  await supplierPage.fill('input[name="deliveryTime"]', '7');
  await supplierPage.click('button:has-text("提交报价")');
  
  await expect(supplierPage.locator('.ant-message-success')).toBeVisible();
});
```

### 4.4 库存管理测试

#### 4.4.1 库存入库流程
```typescript
test.describe('库存管理', () => {
  test('采购订单入库流程', async ({ page }) => {
    // 创建采购订单并审批通过
    // ... 前置步骤
    
    await page.goto('/inventory/finished-inventory');
    await page.click('button:has-text("入库")');
    
    // 扫描或选择产品
    await page.fill('input[name="productSku"]', 'TEST-001');
    await page.press('input[name="productSku"]', 'Enter');
    
    // 输入库存数量
    await page.fill('input[name="quantity"]', '100');
    await page.selectOption('select[name="location"]', 'A-01-01');
    
    // 确认入库
    await page.click('button:has-text("确认入库")');
    
    // 验证库存更新
    await expect(page.locator('text="入库成功"')).toBeVisible();
    
    // 验证库存数量
    await page.goto('/inventory/finished-inventory');
    const stockQuantity = await page.locator('text="TEST-001"')
      .locator('..')
      .locator('.ant-table-cell')
      .nth(3)
      .textContent();
    
    expect(parseInt(stockQuantity)).toBe(100);
  });
});
```

#### 4.4.2 库存盘点测试
```typescript
test('库存盘点流程', async ({ page }) => {
  await page.goto('/inventory/finished-inventory');
  await page.click('button:has-text("开始盘点")');
  
  // 创建盘点任务
  await page.fill('input[name="taskName"]', '月度盘点 ' + new Date().toLocaleDateString());
  await page.click('button:has-text("创建任务")');
  
  // 逐个盘点产品
  const products = await page.locator('.ant-table-tbody tr').all();
  for (const product of products) {
    const sku = await product.locator('.ant-table-cell').nth(0).textContent();
    const systemQuantity = await product.locator('.ant-table-cell').nth(3).textContent();
    
    // 输入实际数量
    await product.locator('input[name="actualQuantity"]').fill(systemQuantity);
    
    // 验证无差异
    const difference = await product.locator('.ant-table-cell').nth(5).textContent();
    expect(difference).toBe('0');
  }
  
  // 完成盘点
  await page.click('button:has-text("完成盘点")');
  await expect(page.locator('text="盘点完成"')).toBeVisible();
});
```

### 4.5 端到端业务流程测试

#### 4.5.1 采购到库存完整流程
```typescript
test.describe('端到端业务流程', () => {
  test('采购到库存完整流程', async ({ page }) => {
    // 1. 创建产品
    await page.goto('/products/products');
    await page.click('button:has-text("新建产品")');
    const productName = 'E2E测试产品 ' + Date.now();
    const productSku = 'E2E-' + Date.now();
    
    await page.fill('input[name="name"]', productName);
    await page.fill('input[name="sku"]', productSku);
    await page.click('button:has-text("保存")');
    
    // 2. 创建采购订单
    await page.goto('/purchase/purchase-orders');
    await page.click('button:has-text("新建采购订单")');
    
    await page.click('.ant-select-selector');
    await page.click('text="测试供应商"');
    
    await page.click('button:has-text("添加产品")');
    await page.fill('input[name="search"]', productSku);
    await page.click('text="' + productSku + '"');
    await page.fill('input[name="quantity"]', '50');
    await page.fill('input[name="price"]', '100.00');
    
    await page.click('button:has-text("提交审批")');
    
    // 3. 审批订单
    await page.click('button:has-text("审批")');
    await page.click('button:has-text("确认")');
    
    // 4. 模拟收货入库
    await page.goto('/inventory/finished-inventory');
    await page.click('button:has-text("入库")');
    
    await page.fill('input[name="productSku"]', productSku);
    await page.press('input[name="productSku"]', 'Enter');
    await page.fill('input[name="quantity"]', '50');
    await page.click('button:has-text("确认入库")');
    
    // 5. 验证库存
    await page.goto('/inventory/finished-inventory');
    await page.fill('input[placeholder="搜索产品"]', productSku);
    await page.press('input[placeholder="搜索产品"]', 'Enter');
    
    const stockQuantity = await page.locator('.ant-table-tbody tr')
      .first()
      .locator('.ant-table-cell')
      .nth(3)
      .textContent();
    
    expect(parseInt(stockQuantity)).toBe(50);
    
    // 6. 验证财务数据
    await page.goto('/finance/financial-reports');
    await page.click('button:has-text("生成报告")');
    
    // 等待报告生成
    await page.waitForSelector('text="采购成本"');
    const purchaseCost = await page.locator('text="采购成本"')
      .locator('..')
      .locator('.ant-statistic-content')
      .textContent();
    
    expect(parseFloat(purchaseCost.replace(/[^0-9.-]+/g, ''))).toBe(5000);
  });
});
```

### 4.6 财务管理测试

#### 4.6.1 月度财务报告
```typescript
test.describe('财务管理', () => {
  test('月度财务报告生成', async ({ page }) => {
    await page.goto('/finance/financial-reports');
    
    // 设置报告参数
    await page.click('input[placeholder="选择月份"]');
    await page.click('text="' + new Date().toLocaleDateString('zh-CN', { month: 'long' }) + '"');
    
    // 选择店铺
    await page.click('.ant-select-selector');
    await page.click('text="测试店铺"');
    
    // 生成报告
    await page.click('button:has-text("生成报告")');
    
    // 等待报告生成完成
    await page.waitForSelector('.ant-spin-nested-loading', { state: 'hidden' });
    
    // 验证报告数据
    await expect(page.locator('text="总收入"')).toBeVisible();
    await expect(page.locator('text="净利润"')).toBeVisible();
    await expect(page.locator('text="库存周转率"')).toBeVisible();
    
    // 导出报告
    await page.click('button:has-text("导出Excel")');
    
    // 验证下载
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('财务报告');
  });
});
```

## 5. 性能和兼容性测试

### 5.1 性能测试

#### 5.1.1 页面加载性能
```typescript
test.describe('性能测试', () => {
  test('关键页面加载性能', async ({ page }) => {
    const pages = [
      '/dashboard',
      '/products/products',
      '/purchase/purchase-orders',
      '/inventory/finished-inventory',
      '/finance/financial-reports'
    ];
    
    for (const pagePath of pages) {
      const startTime = Date.now();
      await page.goto(pagePath);
      
      // 等待页面完全加载
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('.ant-layout-content', { state: 'visible' });
      
      const loadTime = Date.now() - startTime;
      console.log(`${pagePath} 加载时间: ${loadTime}ms`);
      
      // 性能断言
      expect(loadTime).toBeLessThan(3000); // 3秒内加载完成
      
      // 验证关键性能指标
      const metrics = await page.metrics();
      expect(metrics.LayoutDuration).toBeLessThan(100);
      expect(metrics.RecalcStyleDuration).toBeLessThan(50);
    }
  });
});
```

#### 5.1.2 大数据量测试
```typescript
test('大数据量下的性能', async ({ page }) => {
  // 模拟大量数据
  await page.route('**/api/products', async (route) => {
    const mockData = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `产品 ${i + 1}`,
      sku: `SKU${i + 1}`,
      category: 'Electronics',
      price: Math.random() * 1000,
      stock: Math.floor(Math.random() * 1000)
    }));
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: mockData, total: 1000 })
    });
  });
  
  await page.goto('/products/products');
  
  // 测试搜索性能
  const searchStartTime = Date.now();
  await page.fill('input[placeholder="搜索产品"]', '产品');
  await page.press('input[placeholder="搜索产品"]', 'Enter');
  await page.waitForSelector('.ant-table-tbody tr');
  const searchTime = Date.now() - searchStartTime;
  
  console.log(`大数据量搜索时间: ${searchTime}ms`);
  expect(searchTime).toBeLessThan(2000); // 2秒内完成搜索
});
```

### 5.2 浏览器兼容性测试

#### 5.2.1 多浏览器测试配置
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  // 并行测试配置
  workers: process.env.CI ? 2 : 4,
  
  // 重试配置
  retries: process.env.CI ? 2 : 0,
  
  // 超时配置
  timeout: 30000,
  expect: {
    timeout: 5000
  }
});
```

#### 5.2.2 响应式设计测试
```typescript
test.describe('响应式设计', () => {
  const viewports = [
    { width: 1920, height: 1080, name: 'Desktop' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 375, height: 667, name: 'Mobile' }
  ];
  
  for (const viewport of viewports) {
    test(`响应式布局测试 - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/dashboard');
      
      // 验证侧边栏状态
      const sidebar = page.locator('.ant-layout-sider');
      if (viewport.name === 'Mobile') {
        await expect(sidebar).not.toBeVisible();
        // 测试移动端菜单按钮
        await page.click('.ant-btn');
        await expect(sidebar).toBeVisible();
      } else {
        await expect(sidebar).toBeVisible();
      }
      
      // 验证表格布局
      await page.goto('/products/products');
      const table = page.locator('.ant-table');
      await expect(table).toBeVisible();
      
      if (viewport.name === 'Mobile') {
        // 移动端应该有水平滚动
        const tableContainer = page.locator('.ant-table-container');
        const scrollWidth = await tableContainer.evaluate(el => el.scrollWidth);
        const clientWidth = await tableContainer.evaluate(el => el.clientWidth);
        expect(scrollWidth).toBeGreaterThan(clientWidth);
      }
    });
  }
});
```

## 6. 测试数据管理

### 6.1 测试数据策略

#### 6.1.1 数据隔离策略
```typescript
// utils/test-data-manager.ts
export class TestDataManager {
  private static testData = new Map<string, any>();
  
  static async setupTestData(): Promise<void> {
    // 创建测试用户
    const testUser = await this.createTestUser();
    this.testData.set('testUser', testUser);
    
    // 创建测试产品
    const testProducts = await this.createTestProducts(5);
    this.testData.set('testProducts', testProducts);
    
    // 创建测试供应商
    const testSuppliers = await this.createTestSuppliers(3);
    this.testData.set('testSuppliers', testSuppliers);
  }
  
  static async cleanupTestData(): Promise<void> {
    // 清理测试数据
    for (const [key, value] of this.testData) {
      await this.deleteTestData(key, value);
    }
    this.testData.clear();
  }
  
  static getTestData(key: string): any {
    return this.testData.get(key);
  }
}
```

#### 6.1.2 测试数据工厂
```typescript
// factories/product-factory.ts
export class ProductFactory {
  static create(overrides: Partial<Product> = {}): Product {
    return {
      id: Math.floor(Math.random() * 10000),
      name: `测试产品 ${Date.now()}`,
      sku: `TEST-${Date.now()}`,
      category: 'Electronics',
      price: 99.99,
      weight: 1.5,
      dimensions: { length: 10, width: 5, height: 2 },
      stock: 100,
      status: 'active',
      images: [],
      ...overrides
    };
  }
  
  static createMany(count: number, overrides: Partial<Product> = {}): Product[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}
```

### 6.2 Mock 数据配置

#### 6.2.1 API Mock 配置
```typescript
// mocks/api-handlers.ts
import { rest } from 'msw';
import { setupServer } from 'msw/node';

export const server = setupServer(
  // 认证相关
  rest.post('/api/v1/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        code: 200,
        data: {
          token: 'mock-jwt-token',
          user: {
            id: 1,
            username: 'test_user',
            role: 'admin'
          }
        }
      })
    );
  }),
  
  // 产品相关
  rest.get('/api/v1/products', (req, res, ctx) => {
    const mockProducts = ProductFactory.createMany(10);
    return res(
      ctx.status(200),
      ctx.json({
        code: 200,
        data: mockProducts,
        total: 10
      })
    );
  }),
  
  // 采购订单相关
  rest.post('/api/v1/purchase-orders', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        code: 201,
        data: {
          id: Math.floor(Math.random() * 1000),
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      })
    );
  })
);
```

#### 6.2.2 测试间数据隔离
```typescript
// hooks/test-setup.ts
import { test as base } from '@playwright/test';
import { TestDataManager } from '../utils/test-data-manager';

export const test = base.extend({
  // 每个测试前设置数据
  testData: async ({}, use, testInfo) => {
    const testDataId = `test_${testInfo.title.replace(/\s+/g, '_')}_${Date.now()}`;
    await TestDataManager.setupTestData();
    
    await use(testDataId);
    
    // 测试后清理数据
    await TestDataManager.cleanupTestData();
  },
  
  // 每个测试文件前设置
  workerFixture: [async ({}, use) => {
    // Worker 级别的设置
    console.log('Worker started');
    await use();
    console.log('Worker finished');
  }, { scope: 'worker' }]
});
```

## 7. 测试报告和监控

### 7.1 测试报告配置

#### 7.1.1 Allure 报告配置
```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['list'],
    ['allure-playwright', {
      outputDir: 'allure-results',
      detail: true,
      suiteTitle: true,
      categoryTitle: true,
      environmentInfo: {
        Environment: 'Staging',
        Browser: 'Chrome',
        'Node Version': process.version
      }
    }]
  ],
});
```

#### 7.1.2 自定义报告生成
```typescript
// utils/report-generator.ts
export class TestReportGenerator {
  static async generateReport(results: TestResult[]): Promise<void> {
    const report = {
      summary: {
        total: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        duration: results.reduce((acc, r) => acc + r.duration, 0)
      },
      failedTests: results.filter(r => r.status === 'failed').map(r => ({
        title: r.title,
        error: r.error?.message,
        stack: r.error?.stack
      })),
      performance: {
        averageDuration: results.reduce((acc, r) => acc + r.duration, 0) / results.length,
        slowestTests: results.sort((a, b) => b.duration - a.duration).slice(0, 5)
      }
    };
    
    // 生成 HTML 报告
    await this.generateHtmlReport(report);
    
    // 生成 JSON 报告
    await this.generateJsonReport(report);
  }
}
```

### 7.2 持续集成配置

#### 7.2.1 GitHub Actions 配置
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Install Playwright browsers
      run: npx playwright install --with-deps
      
    - name: Run E2E tests
      run: npx playwright test --project=${{ matrix.browser }}
      
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: test-results-${{ matrix.browser }}
        path: test-results/
        
    - name: Upload Allure results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: allure-results-${{ matrix.browser }}
        path: allure-results/
        
    - name: Generate Allure report
      if: always()
      run: |
        npm install -g allure-commandline
        allure generate allure-results/ --clean -o allure-report/
        
    - name: Upload Allure report
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: allure-report
        path: allure-report/
```

#### 7.2.2 测试结果通知
```typescript
// utils/notification-service.ts
export class TestNotificationService {
  static async sendTestReport(results: TestResult[]): Promise<void> {
    const failedTests = results.filter(r => r.status === 'failed');
    
    if (failedTests.length > 0) {
      // 发送 Slack 通知
      await this.sendSlackNotification(failedTests);
      
      // 发送邮件通知
      await this.sendEmailNotification(failedTests);
    }
  }
  
  private static async sendSlackNotification(failedTests: TestResult[]): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    const message = {
      text: '🚨 E2E 测试失败',
      attachments: [
        {
          color: 'danger',
          title: '失败的测试用例',
          fields: failedTests.map(test => ({
            title: test.title,
            value: test.error?.message || '未知错误',
            short: false
          }))
        }
      ]
    };
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  }
}
```

## 8. 测试最佳实践

### 8.1 测试编写最佳实践

#### 8.1.1 测试用例命名规范
```typescript
// 好的命名示例
test('用户登录 - 成功使用有效凭据');
test('用户登录 - 失败使用无效密码');
test('产品创建 - 完整信息验证');
test('采购订单 - 完整审批流程');

// 避免的命名
test('test1');
test('login');
test('product');
```

#### 8.1.2 测试组织结构
```typescript
// 使用 describe 组织相关测试
test.describe('用户认证模块', () => {
  test.describe('登录功能', () => {
    test('成功登录');
    test('失败登录');
    test('记住我功能');
  });
  
  test.describe('密码管理', () => {
    test('密码重置');
    test('密码修改');
    test('密码强度验证');
  });
});
```

### 8.2 测试维护策略

#### 8.2.1 选择器最佳实践
```typescript
// 好的选择器
page.locator('[data-testid="login-button"]');
page.locator('button:has-text("登录")');
page.locator('#username-input');

// 避免的选择器
page.locator('button.btn-primary'); // 容易变化
page.locator('div > div > button'); // 脆弱的选择器
```

#### 8.2.2 等待策略
```typescript
// 好的等待策略
await page.waitForSelector('[data-testid="submit-button"]:enabled');
await page.waitForLoadState('networkidle');
await expect(page.locator('.success-message')).toBeVisible();

// 避免的等待
await page.waitForTimeout(5000); // 硬编码等待
```

### 8.3 测试数据管理最佳实践

#### 8.3.1 数据隔离
```typescript
// 每个测试使用独立数据
test('创建产品', async ({ page }) => {
  const uniqueProduct = {
    name: `产品_${Date.now()}`,
    sku: `SKU_${Date.now()}`
  };
  
  // 使用唯一数据
  await page.fill('input[name="name"]', uniqueProduct.name);
  await page.fill('input[name="sku"]', uniqueProduct.sku);
});
```

#### 8.3.2 数据清理
```typescript
// 测试后清理数据
test.afterEach(async ({ page }) => {
  // 清理测试数据
  await page.request.delete('/api/v1/test-data');
});
```

## 9. 实施计划

### 9.1 阶段性实施计划

#### 第一阶段：基础设施搭建（2周）
- [ ] 安装和配置 Playwright
- [ ] 设置测试环境
- [ ] 创建基础 Page Objects
- [ ] 配置测试报告系统
- [ ] 建立 CI/CD 流程

#### 第二阶段：核心模块测试（3周）
- [ ] 用户认证和授权测试
- [ ] 产品管理测试
- [ ] 采购管理测试
- [ ] 库存管理测试
- [ ] 基础数据管理测试

#### 第三阶段：端到端流程测试（2周）
- [ ] 采购到库存流程
- [ ] 订单到发货流程
- [ ] 财务集成流程
- [ ] 跨模块数据流验证

#### 第四阶段：性能和兼容性测试（1周）
- [ ] 性能基准测试
- [ ] 浏览器兼容性测试
- [ ] 响应式设计测试
- [ ] 大数据量测试

#### 第五阶段：优化和维护（持续）
- [ ] 测试用例优化
- [ ] 测试覆盖率提升
- [ ] 测试数据管理优化
- [ ] 测试报告改进

### 9.2 资源需求

#### 9.2.1 人力资源
- **测试工程师**: 1-2 人，负责测试框架搭建和用例编写
- **前端开发**: 1 人，协助测试环境配置和问题修复
- **后端开发**: 1 人，协助 API Mock 和测试数据准备

#### 9.2.2 技术资源
- **测试服务器**: 至少 2 台，用于不同环境测试
- **CI/CD 服务器**: 1 台，用于自动化测试执行
- **测试数据存储**: 数据库实例，用于测试数据管理

### 9.3 风险评估与应对

#### 9.3.1 主要风险
1. **测试环境不稳定**: 可能导致测试结果不准确
2. **测试数据管理复杂**: 数据依赖关系可能导致测试失败
3. **UI 变更频繁**: 可能导致大量测试用例需要更新
4. **性能瓶颈**: 大量测试执行可能影响开发效率

#### 9.3.2 应对策略
1. **环境稳定性**: 建立环境监控和自动恢复机制
2. **数据管理**: 使用数据工厂和事务管理确保数据一致性
3. **UI 变更**: 使用稳定的测试选择器，建立良好的维护流程
4. **性能优化**: 使用并行测试和智能测试选择

## 10. 总结

本 E2E 测试方案为 Easy-ERP 系统提供了全面的测试框架和实施指南。通过系统化的测试覆盖，可以确保：

1. **功能完整性**: 所有核心业务功能都能正常工作
2. **用户体验**: 用户操作流程顺畅，界面响应及时
3. **数据准确性**: 数据在整个业务流程中保持一致性
4. **系统稳定性**: 在各种情况下系统都能稳定运行
5. **兼容性**: 支持多种浏览器和设备

建议按照实施计划逐步推进，在实施过程中不断优化测试策略，确保测试的有效性和可维护性。

---

**文档维护**: 本文档将根据项目进展和需求变化进行定期更新和优化。

**版本历史**:
- v1.0 (2025-07-29): 初始版本，包含完整的 E2E 测试方案