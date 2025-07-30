# ERP系统E2E测试开发计划

## 项目概述

本文档制定了Easy ERP系统的端到端(E2E)测试开发计划，旨在确保所有核心业务功能的前后端集成正常工作。测试将覆盖完整的CRUD操作和关键业务流程。

## 测试架构设计

### 1. 登录依赖解决方案

**问题分析：**
- 所有功能模块都需要用户登录后才能访问
- 当前登录存在验证码验证，增加了测试复杂度
- 需要确保测试数据的一致性和隔离性

**解决方案：**
1. **Session管理**：使用Cypress的`cy.session()`确保登录状态在测试间复用
2. **API登录**：通过API直接登录，绕过UI验证码限制
3. **Mock登录**：在测试环境中mock登录响应
4. **测试用户**：使用专门的测试账户，避免影响生产数据

### 2. 测试数据管理

**策略：**
- 使用fixtures文件管理测试数据
- 每个测试模块独立的测试数据集
- 测试前清理，测试后恢复
- 使用唯一标识符避免数据冲突

### 3. 测试分层架构

```
├── Unit Tests (单元测试)
├── Integration Tests (集成测试)
└── E2E Tests (端到端测试)
    ├── Auth Module (认证模块)
    ├── Core Business Modules (核心业务模块)
    ├── System Management (系统管理)
    └── End-to-End Workflows (端到端业务流程)
```

## 核心功能测试计划

### Phase 1: 基础模块测试 (已完成)

#### ✅ 1.1 认证模块 (Auth)
- [x] 用户登录功能
- [x] 登录表单验证
- [x] 登录成功跳转
- [x] 登录失败处理

### Phase 2: 核心业务模块测试 (进行中)

#### 🔄 2.1 产品管理模块 (Products)
**测试范围：**
- [x] 产品列表查看
- [x] 创建新产品
- [x] 编辑产品信息
- [x] 产品详情查看
- [ ] 产品删除功能
- [ ] 产品搜索和筛选
- [ ] 产品分类管理
- [ ] 批量操作

**待完善测试用例：**
```javascript
// 产品删除
it('删除产品', () => {
  // 测试删除确认对话框
  // 测试删除成功
  // 测试删除后列表更新
})

// 产品搜索
it('产品搜索功能', () => {
  // 按名称搜索
  // 按编码搜索
  // 按分类筛选
})
```

#### 🔄 2.2 库存管理模块 (Inventory)
**测试范围：**
- [x] 库存列表显示
- [x] 库存状态标识
- [x] 库存筛选功能
- [x] 库存入库操作
- [x] 库存出库操作
- [ ] 库存盘点功能
- [ ] 库存预警设置
- [ ] 库存报表查看

**待完善测试用例：**
```javascript
// 库存盘点
it('库存盘点功能', () => {
  // 创建盘点任务
  // 录入盘点数据
  // 生成盘点差异报告
})
```

#### 🔄 2.3 采购管理模块 (Purchase)
**测试范围：**
- [x] 采购订单列表
- [x] 创建采购订单
- [x] 采购订单审批
- [ ] 采购订单修改
- [ ] 采购订单取消
- [ ] 供应商管理
- [ ] 采购收货确认
- [ ] 采购付款记录

**待完善测试用例：**
```javascript
// 采购收货
it('采购收货确认', () => {
  // 选择待收货订单
  // 录入实际收货数量
  // 确认收货并更新库存
})
```

### Phase 3: 扩展业务模块测试 (待开始)

#### 📋 3.1 基础数据管理
**模块：**
- 供应商管理 (`/basic-data/suppliers`)
- 门店管理 (`/basic-data/shops`)
- 货代管理 (`/basic-data/forwarders`)

**测试重点：**
- CRUD操作完整性
- 数据验证规则
- 关联数据处理

#### 📋 3.2 仓储管理
**模块：**
- 包装任务 (`/warehouse/packaging-tasks`)
- 成品库存 (`/inventory/finished-inventory`)
- 备件库存 (`/inventory/spare-inventory`)

#### 📋 3.3 配送管理
**模块：**
- 配送记录 (`/delivery/delivery-records`)

#### 📋 3.4 财务管理
**模块：**
- 财务报表 (`/finance/financial-reports`)

#### 📋 3.5 系统管理
**模块：**
- 账户管理 (`/system/accounts`)
- 角色管理 (`/system/roles`)
- 系统日志 (`/system/logs`)

### Phase 4: 端到端业务流程测试 (部分完成)

#### 🔄 4.1 采购到付款流程 (P2P)
- [x] 基础流程框架
- [ ] 完整业务验证
- [ ] 异常情况处理

#### 📋 4.2 订单到收款流程 (O2C)
- [ ] 销售订单创建
- [ ] 库存分配
- [ ] 发货配送
- [ ] 收款确认

#### 📋 4.3 库存补货流程
- [ ] 库存预警触发
- [ ] 自动补货建议
- [ ] 采购申请创建
- [ ] 入库更新库存

## 测试实施计划

### 第一周：完善核心模块测试

**Day 1-2: 产品管理模块完善**
- [ ] 添加产品删除测试
- [ ] 添加产品搜索筛选测试
- [ ] 添加产品分类管理测试
- [ ] 添加批量操作测试

**Day 3-4: 库存管理模块完善**
- [ ] 添加库存盘点测试
- [ ] 添加库存预警测试
- [ ] 添加库存报表测试

**Day 5: 采购管理模块完善**
- [ ] 添加采购收货测试
- [ ] 添加采购付款测试

### 第二周：基础数据模块测试

**Day 1-2: 供应商管理**
```javascript
describe('供应商管理模块', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.visit('/basic-data/suppliers')
  })
  
  it('供应商CRUD操作', () => {
    // 创建、查看、编辑、删除供应商
  })
})
```

**Day 3: 门店管理**
**Day 4: 货代管理**
**Day 5: 集成测试和修复**

### 第三周：仓储和配送模块

**Day 1-2: 仓储管理测试**
**Day 3-4: 配送管理测试**
**Day 5: 财务模块测试**

### 第四周：系统管理和端到端流程

**Day 1-2: 系统管理模块**
**Day 3-4: 完整业务流程测试**
**Day 5: 测试优化和文档完善**

## 技术实施细节

### 1. 测试环境配置

```javascript
// cypress.config.js
module.exports = {
  e2e: {
    baseUrl: 'http://localhost:3000',
    env: {
      apiBaseUrl: 'http://localhost:3000/api/v1',
      adminUser: 'admin',
      adminPassword: 'admin123',
      testDataCleanup: true
    }
  }
}
```

### 2. 通用测试工具函数

```javascript
// 验证页面标题
Cypress.Commands.add('verifyPageTitle', (title) => {
  cy.contains('h1, .page-title, .ant-page-header-heading-title', title)
    .should('be.visible')
})

// 验证成功消息
Cypress.Commands.add('verifySuccessMessage', (message) => {
  cy.get('.ant-message-success, .ant-notification-notice-success')
    .should('contain', message)
})

// 验证表单验证
Cypress.Commands.add('verifyFormValidation', (fieldName, errorMessage) => {
  cy.get(`[name="${fieldName}"]`)
    .parent()
    .should('contain', errorMessage)
})
```

### 3. 测试数据管理

```javascript
// cypress/fixtures/test-data.json
{
  "products": {
    "testProduct": {
      "name": "测试产品_" + Date.now(),
      "code": "TEST_" + Date.now(),
      "sku": "SKU_" + Date.now(),
      "category": "智能家居"
    }
  },
  "suppliers": {
    "testSupplier": {
      "name": "测试供应商_" + Date.now(),
      "contact": "张三",
      "phone": "13800138000"
    }
  }
}
```

### 4. API拦截和Mock

```javascript
// 拦截API请求进行验证
beforeEach(() => {
  cy.intercept('GET', '/api/v1/products*').as('getProducts')
  cy.intercept('POST', '/api/v1/products').as('createProduct')
  cy.intercept('PUT', '/api/v1/products/*').as('updateProduct')
  cy.intercept('DELETE', '/api/v1/products/*').as('deleteProduct')
})
```

## 质量保证

### 1. 测试覆盖率目标
- **功能覆盖率**: 90%以上
- **页面覆盖率**: 100%
- **API覆盖率**: 85%以上

### 2. 测试稳定性
- 所有测试用例通过率 > 95%
- 测试执行时间 < 30分钟
- 无片状测试(flaky tests)

### 3. 持续集成
- GitHub Actions自动化测试
- 每次PR自动运行测试
- 测试报告自动生成

## 风险和挑战

### 1. 技术风险
- **验证码处理**: 已通过API登录解决
- **异步操作**: 使用适当的等待策略
- **数据依赖**: 通过测试数据隔离解决

### 2. 业务风险
- **数据一致性**: 测试前后数据清理
- **权限控制**: 使用测试专用账户
- **业务逻辑变更**: 及时更新测试用例

### 3. 维护成本
- **测试用例维护**: 建立清晰的测试结构
- **测试数据管理**: 自动化测试数据生成
- **环境依赖**: 容器化测试环境

## 成功指标

### 1. 短期目标 (2周内)
- [ ] 完成所有核心模块的基础CRUD测试
- [ ] 建立稳定的测试登录机制
- [ ] 实现测试数据自动管理

### 2. 中期目标 (1个月内)
- [ ] 完成所有业务模块的测试覆盖
- [ ] 建立端到端业务流程测试
- [ ] 集成CI/CD自动化测试

### 3. 长期目标 (2个月内)
- [ ] 达到90%以上的测试覆盖率
- [ ] 建立完整的测试文档和最佳实践
- [ ] 实现测试驱动的开发流程

## 下一步行动

### 立即执行 (今天)
1. **完善产品管理测试**
   - 添加产品删除功能测试
   - 添加产品搜索筛选测试
   - 验证前后端API集成

2. **优化登录机制**
   - 确保登录状态在所有测试中稳定
   - 添加登录失败的错误处理

3. **建立测试数据管理**
   - 创建独立的测试数据集
   - 实现测试前后数据清理

### 本周计划
- 周一：完善产品管理模块测试
- 周二：完善库存管理模块测试
- 周三：完善采购管理模块测试
- 周四：开始基础数据模块测试
- 周五：测试整合和问题修复

---

**文档维护**: 本计划将根据实际进展持续更新
**最后更新**: 2024年12月19日
**负责人**: AI Assistant
**审核人**: 待定