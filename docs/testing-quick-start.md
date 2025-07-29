# Easy ERP 前端测试快速开始指南

## 🚀 快速开始

### 1. 安装测试工具

```bash
# 安装Cypress（推荐）
npm install --save-dev cypress

# 或者安装Playwright
npm install --save-dev @playwright/test
```

### 2. 配置测试环境

#### Cypress配置 (cypress.config.js)
```javascript
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1920,
    viewportHeight: 1080,
    video: false,
    screenshot: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      adminUser: 'admin@easyerp.com',
      adminPassword: 'Admin@123456',
      testUser: 'test@easyerp.com',
      testPassword: 'Test@123456'
    }
  }
});
```

#### Playwright配置 (playwright.config.js)
```javascript
module.exports = {
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
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
  ]
};
```

### 3. 运行测试

#### Cypress运行方式
```bash
# 打开Cypress测试界面
npx cypress open

# 运行所有测试
npx cypress run

# 运行特定测试文件
npx cypress run --spec "cypress/e2e/product-management.cy.js"

# 运行特定浏览器
npx cypress run --browser chrome
```

#### Playwright运行方式
```bash
# 运行所有测试
npx playwright test

# 运行特定测试文件
npx playwright test product-management.spec.js

# 运行特定浏览器
npx playwright test --project=chromium

# 打开测试报告
npx playwright show-report
```

## 📁 测试文件结构

```
easy-erp-web/
├── docs/
│   ├── e2e-testing-cases.md      # 完整测试用例文档
│   ├── cypress-e2e-tests.js      # Cypress测试脚本
│   ├── testing-quick-start.md    # 快速开始指南
│   └── test-users-guide.md       # 测试数据指南
├── cypress/
│   ├── e2e/
│   │   ├── auth.cy.js           # 认证测试
│   │   ├── products.cy.js       # 产品管理测试
│   │   ├── inventory.cy.js      # 库存管理测试
│   │   ├── purchase.cy.js       # 采购管理测试
│   │   ├── packaging.cy.js      # 包装任务测试
│   │   ├── delivery.cy.js       # 运输管理测试
│   │   ├── finance.cy.js        # 财务管理测试
│   │   └── system.cy.js         # 系统管理测试
│   ├── fixtures/
│   │   ├── test-product.jpg
│   │   └── test-data.json
│   └── support/
│       ├── commands.js
│       └── e2e.js
└── tests/ (Playwright)
    ├── auth.spec.js
    ├── products.spec.js
    └── ...
```

## 🔧 环境变量配置

创建 `.env.test` 文件：

```bash
# 测试环境配置
VITE_API_BASE_URL=http://localhost:3000
VITE_TEST_USERNAME=admin@easyerp.com
VITE_TEST_PASSWORD=Admin@123456
VITE_TEST_TIMEOUT=10000
```

## 🎯 核心测试场景

### 优先执行的测试场景

| 优先级 | 测试场景 | 测试文件 | 预计时间 |
|--------|----------|----------|----------|
| P0 | 用户登录和认证 | auth.cy.js | 2分钟 |
| P0 | 产品创建流程 | products.cy.js | 5分钟 |
| P0 | 库存录入流程 | inventory.cy.js | 3分钟 |
| P0 | 采购订单创建 | purchase.cy.js | 5分钟 |
| P1 | 包装任务管理 | packaging.cy.js | 3分钟 |
| P1 | 运输记录管理 | delivery.cy.js | 4分钟 |

### 测试数据准备脚本

#### 创建测试基础数据
```javascript
// cypress/support/test-data.js
export const testData = {
  admin: {
    username: 'admin@easyerp.com',
    password: 'Admin@123456'
  },
  products: [
    {
      name: 'iPhone 15 Pro Max 测试机',
      code: 'TEST-IP15PM-001',
      sku: 'TEST-SKU-001',
      category: '智能手机'
    },
    {
      name: '小米14 Ultra 测试机',
      code: 'TEST-MI14U-001',
      sku: 'TEST-SKU-002',
      category: '智能手机'
    }
  ],
  suppliers: [
    {
      name: '深圳华强北电子测试',
      contact: '张经理',
      phone: '138-0013-8000'
    }
  ]
};
```

## 🚀 一键运行测试

### 完整测试套件
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 在另一个终端运行测试
npm run test:e2e
```

### package.json配置
```json
{
  "scripts": {
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "test:e2e:headed": "cypress run --headed",
    "test:e2e:chrome": "cypress run --browser chrome",
    "test:e2e:firefox": "cypress run --browser firefox",
    "test:e2e:record": "cypress run --record"
  }
}
```

## 📊 测试报告

### 生成测试报告
```bash
# 生成HTML报告
npx cypress run --reporter mochawesome

# 查看报告
open mochawesome-report/mochawesome.html
```

### 集成CI/CD
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e:ci
```

## 🔍 调试技巧

### 常用调试命令
```javascript
// 在测试中使用
it('调试示例', () => {
  cy.visit('/products/products');
  cy.pause(); // 暂停执行
  cy.debug(); // 调试信息
  cy.log('当前URL:', cy.url());
});
```

### 常用选择器
```javascript
// 数据属性选择器
cy.get('[data-cy="product-name"]')
cy.get('[data-testid="inventory-table"]')

// 文本内容选择器
cy.contains('iPhone 15 Pro Max')
cy.contains('button', '新建产品')

// 层级选择器
cy.get('.product-list').find('.product-item').first()
cy.get('.modal').within(() => {
  cy.get('button').contains('保存')
})
```

## 🚨 常见问题解决

### 1. 元素定位失败
```javascript
// 添加等待
it('等待元素加载', () => {
  cy.get('.loading-spinner').should('not.exist');
  cy.get('.product-item').should('be.visible');
});
```

### 2. 网络请求超时
```javascript
// 增加超时时间
cy.intercept('/api/v1/products').as('getProducts');
cy.wait('@getProducts', { timeout: 30000 });
```

### 3. 动态内容处理
```javascript
// 处理动态内容
cy.get('.dynamic-content').should('contain.text', '加载完成');
cy.get('.loading').should('not.exist');
```

## 📞 技术支持

### 获取帮助
- 查看完整测试文档: `docs/e2e-testing-cases.md`
- 运行示例测试: `npx cypress open`
- 查看测试报告: `mochawesome-report/mochawesome.html`

### 测试环境
- 测试服务器: `http://localhost:3000`
- 测试用户: `admin@easyerp.com` / `Admin@123456`
- 测试数据: 自动生成，不影响生产数据