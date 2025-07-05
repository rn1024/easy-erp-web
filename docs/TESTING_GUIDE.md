# Easy ERP Web 测试指南

## 概述

本文档提供了Easy ERP Web项目的完整测试指南，包括单元测试、集成测试和API接口测试的使用方法。

## 测试框架和工具

### 核心测试框架

- **Jest**: JavaScript测试框架
- **Supertest**: HTTP断言库
- **Node-mocks-http**: HTTP请求/响应模拟
- **Axios**: HTTP客户端

### 测试环境配置

- **TypeScript**: 支持TS测试文件
- **Next.js**: 内置测试支持
- **Prisma**: 数据库测试支持

## 测试分类

### 1. 单元测试 (Unit Tests)

测试独立的函数和组件，确保基本功能正确。

**测试目录**: `__tests__/api/`
**文件模式**: `*.test.ts`

### 2. 集成测试 (Integration Tests)

测试组件间的交互和API端点的完整流程。

**测试文件**: `__tests__/api/integration.test.ts`
**覆盖范围**: 完整的API调用链路

### 3. 手动API测试

自动化的API接口功能测试脚本。

**测试脚本**: `scripts/test-api-manually.js`
**功能**: 端到端API测试

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置测试环境

```bash
# 设置环境变量
export DATABASE_URL="mysql://root:123456@localhost:3306/easy_erp_db"

# 初始化数据库
pnpm run db:push
pnpm run db:seed
```

### 3. 启动开发服务器

```bash
pnpm dev
```

### 4. 运行测试

#### 自动化测试（推荐）

```bash
# 自动运行Token测试（包含环境检查和服务器启动）
pnpm test:auto:token

# 自动运行API测试
pnpm test:auto:api

# 自动运行集成测试
pnpm test:auto:integration

# 手动准备测试环境
pnpm test:prepare
```

#### 手动测试

```bash
# 运行所有Jest测试
pnpm test

# 运行API手动测试
pnpm run test:api

# 运行Token刷新测试
pnpm run test:token

# 运行集成测试
pnpm run test:integration
```

#### 运行测试覆盖率

```bash
pnpm run test:coverage
```

#### 监视模式

```bash
pnpm run test:watch
```

## 测试脚本详解

### Jest配置 (`jest.config.js`)

```javascript
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'node',
  testTimeout: 30000,
  verbose: true,
};
```

### 测试工具类 (`__tests__/utils/test-helpers.ts`)

提供测试中常用的工具函数：

- JWT token生成
- 测试数据工厂
- Mock服务配置

### 手动API测试 (`scripts/test-api-manually.js`)

自动化测试所有API端点：

- 自动登录获取token
- 覆盖12个核心测试用例
- 详细的测试结果报告

## API测试用例

### 认证模块测试

```javascript
// 登录测试
it('应该成功登录', async () => {
  const response = await httpClient.post('/auth/login-simple', {
    username: 'admin',
    password: 'admin123456',
  });

  expect(response.status).toBe(200);
  expect(response.data.code).toBe(0);
  expect(response.data.data.token).toBeDefined();
});
```

### 业务模块测试

```javascript
// 角色管理测试
it('应该获取角色列表', async () => {
  const response = await httpClient.get('/roles');

  expect(response.status).toBe(200);
  expect(response.data.code).toBe(0);
});
```

## 测试数据管理

### 种子数据

使用 `prisma/seed.ts` 创建测试数据：

```bash
pnpm run db:seed
```

包含内容：

- 默认管理员账户 (admin/admin123456)
- 系统角色和权限
- 基础业务测试数据

### Mock数据

在测试中使用Mock数据工厂：

```javascript
import { TestDataFactory } from '../utils/test-helpers';

const mockUser = TestDataFactory.user({
  name: 'Test User',
  role: 'admin',
});
```

## 测试最佳实践

### 1. 测试命名

- 使用描述性的测试名称
- 遵循 "应该做什么" 的格式
- 中文描述便于理解

### 2. 测试结构

遵循 AAA 模式：

- **Arrange**: 准备测试数据
- **Act**: 执行测试操作
- **Assert**: 验证测试结果

### 3. 异步测试

```javascript
it('应该处理异步操作', async () => {
  // 使用 async/await 处理异步操作
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### 4. 错误处理测试

```javascript
it('应该处理错误情况', async () => {
  try {
    await errorFunction();
    fail('应该抛出错误');
  } catch (error) {
    expect(error.message).toContain('期望的错误');
  }
});
```

## 持续集成 (CI/CD)

### GitHub Actions配置

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm run test:ci
```

### 测试报告

- 生成详细的测试覆盖率报告
- 自动化测试结果通知
- 失败测试的详细日志

## 调试测试

### 调试模式

```bash
pnpm run test:debug
```

### 单个测试文件

```bash
pnpm test __tests__/api/auth.test.ts
```

### 特定测试用例

```bash
pnpm test --testNamePattern="登录"
```

## 性能测试

### 响应时间测试

```javascript
it('API响应时间应该合理', async () => {
  const start = Date.now();
  await httpClient.get('/api/endpoint');
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(1000); // 1秒内
});
```

### 并发测试

```javascript
it('应该处理并发请求', async () => {
  const promises = Array(10)
    .fill()
    .map(() => httpClient.get('/api/endpoint'));

  const results = await Promise.all(promises);
  results.forEach((result) => {
    expect(result.status).toBe(200);
  });
});
```

## 测试覆盖率

### 生成覆盖率报告

```bash
pnpm run test:coverage
```

### 覆盖率目标

- **函数覆盖率**: > 80%
- **分支覆盖率**: > 70%
- **语句覆盖率**: > 85%

## 常见问题

### Q: 测试数据库连接失败

A: 确保MySQL服务运行，环境变量配置正确

### Q: 认证测试失败

A: 检查JWT密钥配置，确认用户账户存在

### Q: API测试超时

A: 增加测试超时时间，检查服务器启动状态

## 测试清单

在提交代码前，确保：

- [ ] 所有单元测试通过
- [ ] API集成测试通过
- [ ] 新功能有对应测试用例
- [ ] 测试覆盖率达到要求
- [ ] 无明显性能问题

## 相关文档

- [API测试报告](./API_TEST_REPORT.md)
- [开发规范](../.cursor/rules/development-workflow.mdc)
- [安全测试指南](../.cursor/rules/security-guidelines.mdc)

---

**更新时间**: 2024年12月24日  
**文档版本**: 1.0  
**维护人**: 开发团队
