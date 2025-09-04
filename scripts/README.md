# 测试脚本使用指南

## 📁 脚本目录清理说明

经过清理后，删除了以下重复功能的脚本：

- ~~`test-api-manually.js`~~ - 功能已被 `api-test.js` 包含
- ~~`comprehensive-test.js`~~ - 功能已被 `api-test.js` 包含
- ~~`prepare-test-env.js`~~ - 功能已被 `run-tests.js` 包含

## 🛠️ 当前可用脚本

### 1. 🔄 `run-tests.js` - 测试运行器

**用途**: 自动化测试运行器，可启动开发服务器并运行指定的测试类型

**使用方法**:

```bash
# 运行Token测试（默认）
node scripts/run-tests.js
node scripts/run-tests.js token

# 运行API测试
node scripts/run-tests.js api

# 运行集成测试
node scripts/run-tests.js integration

# 通过pnpm脚本运行
pnpm test:auto:token
pnpm test:auto:api
pnpm test:auto:integration
```

**功能特性**:

- 自动检查并启动开发服务器
- 等待服务器就绪后运行测试
- 测试完成后自动清理

### 2. 🔐 `test-token-refresh.js` - JWT令牌刷新测试

**用途**: 专门测试JWT访问令牌和刷新令牌的自动刷新机制

**使用方法**:

```bash
node scripts/test-token-refresh.js

# 或通过pnpm脚本
pnpm test:token
```

**测试内容**:

- 用户登录获取令牌
- 验证令牌格式和内容
- 访问受保护的API
- 使用刷新令牌更新访问令牌
- 验证新令牌可用性
- 测试无效令牌处理

### 3. 📡 `api-test.js` - 完整API测试套件

**用途**: 最全面的API接口测试，涵盖所有业务模块的增删改查操作

**使用方法**:

```bash
node scripts/api-test.js

# 或通过pnpm脚本
pnpm test:api
```

**测试模块**:

- 身份验证
- 角色管理
- 店铺管理
- 供应商管理
- 货代管理
- 产品分类管理
- 产品管理
- 采购订单管理
- 仓库任务管理
- 发货记录管理
- 库存管理
- 财务报表管理
- 系统日志管理

### 4. ⚡ `performance-test.js` - 性能测试

**用途**: 测试API接口的响应时间、并发处理能力和系统性能

**使用方法**:

```bash
node scripts/performance-test.js
```

**测试特性**:

- 并发请求测试
- 响应时间统计
- 百分位数分析（P50, P95, P99）
- 数据密集型查询测试
- 性能瓶颈识别

### 5. 🗄️ `optimize-database.js` - 数据库优化

**用途**: 自动优化数据库索引，提升查询性能

**使用方法**:

```bash
node scripts/optimize-database.js
```

**优化内容**:

- 系统日志表索引优化
- 财务报表索引优化
- 库存表索引优化
- 采购订单索引优化
- 发货记录索引优化
- 仓库任务索引优化
- 产品相关索引优化

### 6. 🔍 `check-db.js` - 数据库连接检查

**用途**: 快速检查数据库连接状态和基本信息

**使用方法**:

```bash
node scripts/check-db.js
```

**检查内容**:

- 数据库连接状态
- 表数量统计
- 管理员账户状态

### 7. 🔗 `check-database-connection.sh` - 全面数据库连接检查

**用途**: 全面的数据库连接检查脚本，用于部署过程中的数据库连接验证

**使用方法**:

```bash
# 在项目根目录执行
./scripts/check-database-connection.sh
```

**检查项目**:

1. ✅ 检查 `.env` 文件是否存在
2. ✅ 验证 `DATABASE_URL` 环境变量格式
3. ✅ 解析数据库连接信息
4. ✅ 检查数据库服务状态
5. ✅ 测试 MySQL 客户端连接
6. ✅ 测试 Prisma 数据库连接

**特性**:

- 彩色输出和详细日志
- 自动诊断和错误提示
- 支持 MySQL 客户端和 Prisma 连接测试
- 集成到 GitHub Actions 部署流程
- 失败时提供详细的故障排除信息

**在部署中的使用**:

该脚本已集成到 `.github/workflows/deploy.yml` 中：
- **部署阶段**: 部署前验证数据库连接
- **验证阶段**: 部署后确认数据库连接正常
- **故障排除**: 部署失败时自动执行数据库诊断

## 🚀 快速开始

### 运行完整测试套件

```bash
# 1. 启动开发服务器（如果未启动）
pnpm dev

# 2. 运行API功能测试
pnpm test:api

# 3. 运行令牌刷新测试
pnpm test:token

# 4. 运行性能测试
node scripts/performance-test.js
```

### 数据库维护

```bash
# 快速检查数据库状态
node scripts/check-db.js

# 全面数据库连接检查（推荐用于部署前检查）
./scripts/check-database-connection.sh

# 优化数据库索引
node scripts/optimize-database.js
```

## 📋 注意事项

1. **环境要求**: 确保开发服务器运行在 `http://localhost:3000`
2. **测试数据**: 需要存在用户名为 `admin`，密码为 `admin123456` 的测试账户
3. **数据库**: 确保MySQL服务正常运行
4. **依赖**: 所有脚本使用Node.js原生模块，无需额外安装依赖

## 🔧 故障排除

如果测试失败，请检查：

1. 开发服务器是否启动 (`pnpm dev`)
2. 数据库连接是否正常：
   - 快速检查：`node scripts/check-db.js`
   - 全面检查：`./scripts/check-database-connection.sh`
3. 测试账户是否存在
4. 环境变量配置是否正确
5. 如果是部署相关问题，查看 GitHub Actions 日志中的数据库连接检查结果
