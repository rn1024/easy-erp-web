# Next.js CMS 管理系统

基于 Next.js 14 + TypeScript + Ant Design 的现代化企业级 CMS 管理系统，专注于后台管理功能。

## ✨ 特性

- 🚀 **Next.js 14** - 使用 App Router 的现代 React 框架
- 🎯 **TypeScript** - 完整的类型安全支持
- 🎨 **Ant Design** - 企业级 UI 设计语言
- 🌍 **国际化** - 支持中英文切换
- 🔐 **安全认证** - JWT + Redis 的安全认证系统
- 👥 **权限管理** - 基于角色的权限控制系统 (RBAC)
- 📱 **响应式设计** - 适配移动端和桌面端
- 🛡️ **安全加固** - 多层安全防护机制
- 📊 **日志审计** - 完整的操作日志记录
- ☁️ **文件存储** - 阿里云 OSS 文件管理
- 🔧 **现代工具链** - pnpm + Prisma + Redis

## 📁 项目结构

```
nextjs-cms-template/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/v1/               # API 路由
│   │   │   ├── auth/             # 认证相关接口
│   │   │   ├── accounts/         # 账户管理接口
│   │   │   ├── roles/            # 角色管理接口
│   │   │   ├── logs/             # 日志查询接口
│   │   │   └── upload/           # 文件上传接口
│   │   ├── dashboard/            # 仪表板页面
│   │   ├── login/                # 登录页面
│   │   ├── system/               # 系统管理
│   │   │   ├── accounts/         # 账户管理
│   │   │   └── roles/            # 角色管理
│   │   └── files/                # 文件管理
│   ├── components/               # 共享组件
│   │   ├── admin-layout.tsx      # 管理后台布局
│   │   ├── permission.tsx        # 权限控制组件
│   │   ├── search-user.tsx       # 用户搜索组件

│   │   └── table-cell/           # 表格单元格组件
│   ├── lib/                      # 核心库
│   │   ├── auth.ts               # JWT 认证工具
│   │   ├── db.ts                 # 数据库连接
│   │   ├── redis.ts              # Redis 连接
│   │   ├── oss.ts                # 阿里云 OSS 配置
│   │   ├── security.ts           # 安全工具库
│   │   └── middleware.ts         # 中间件工具
│   ├── services/                 # API 服务层
│   │   ├── auth.ts               # 认证服务
│   │   ├── account.ts            # 账户管理服务
│   │   ├── roles.ts              # 角色管理服务
│   │   ├── logs.ts               # 日志管理服务
│   │   └── common.ts             # 通用服务
│   ├── types/                    # TypeScript 类型定义
│   │   └── api.ts                # API 类型定义
│   ├── locales/                  # 国际化文件
│   │   ├── zh-CN/                # 中文语言包
│   │   └── en-US/                # 英文语言包
│   ├── store/                    # Zustand 状态管理
│   └── const/                    # 常量定义
├── prisma/                       # 数据库相关
│   ├── schema.prisma             # 数据库模型定义
│   └── seed.ts                   # 数据库种子数据
├── docs/                         # 项目文档
│   ├── API_INTERFACES.md         # API 接口文档
│   ├── SECURITY_HARDENING.md     # 安全加固指南
│   └── DEPLOYMENT_SECURITY_CHECKLIST.md # 部署安全检查清单
├── middleware.ts                 # Next.js 中间件
├── next.config.js                # Next.js 配置
└── package.json                  # 项目配置
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+
- MySQL 8.0+
- Redis 6.0+

### 安装依赖

```bash
pnpm install
```

### 环境配置

复制环境变量文件：

```bash
cp .env.example .env.local
```

配置必要的环境变量：

```bash
# 数据库配置
DATABASE_URL="mysql://username:password@localhost:3306/nextjs_cms"

# JWT 配置
JWT_SECRET="your-super-secret-jwt-key-256-bits-long"

# Redis 配置
REDIS_HOST="localhost"
REDIS_PORT="6379"

# 阿里云 OSS 配置
OSS_ACCESS_KEY_ID="your-access-key-id"
OSS_ACCESS_KEY_SECRET="your-access-key-secret"
OSS_BUCKET="your-bucket-name"
```

### 数据库初始化

```bash
# 生成 Prisma 客户端
npx prisma generate

# 推送数据库结构
npx prisma db push

# 初始化种子数据
npx prisma db seed
```

### 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

**默认管理员账户：**

- 用户名：`admin`
- 密码：`admin123456`

### 构建生产版本

```bash
pnpm build
pnpm start
```

## 🏗️ 核心功能

### 1. 安全认证系统

- **多因素认证** - 用户名+密码+验证码
- **JWT 令牌** - 安全的身份验证机制
- **登录限制** - IP 和用户级别的登录尝试限制
- **会话管理** - 基于 Redis 的会话存储
- **安全日志** - 完整的认证事件记录

### 2. 权限管理系统

- **角色管理** - 灵活的角色定义和分配
- **权限控制** - 细粒度的权限管理
- **RBAC 模型** - 基于角色的访问控制
- **权限验证** - 组件级和路由级权限控制

### 3. 账户管理

- **账户 CRUD** - 完整的账户生命周期管理
- **状态控制** - 账户启用/禁用功能
- **密码策略** - 强密码要求和定期更换
- **批量操作** - 高效的批量管理功能

### 4. 文件管理

- **安全上传** - 文件类型和大小验证
- **云存储** - 阿里云 OSS 集成
- **访问控制** - 基于权限的文件访问
- **批量处理** - 文件批量上传和管理

### 5. 日志审计

- **操作日志** - 所有用户操作的完整记录
- **安全事件** - 安全相关事件的专门记录
- **日志查询** - 多维度的日志检索功能
- **审计报告** - 定期的安全审计报告

### 6. 系统监控

- **性能监控** - 系统性能指标监控
- **安全监控** - 异常行为检测和告警
- **健康检查** - 系统组件健康状态监控
- **告警机制** - 多渠道的告警通知

## 🛡️ 安全特性

### 认证安全

- ✅ JWT 令牌认证
- ✅ 刷新令牌机制
- ✅ 登录失败次数限制
- ✅ 验证码防暴力破解
- ✅ 会话超时管理

### 数据安全

- ✅ 密码 bcrypt 加密
- ✅ 敏感数据脱敏
- ✅ SQL 注入防护
- ✅ XSS 攻击防护
- ✅ CSRF 攻击防护

### 网络安全

- ✅ HTTPS 强制重定向
- ✅ 安全响应头配置
- ✅ CORS 跨域控制
- ✅ 速率限制
- ✅ IP 白名单

### 文件安全

- ✅ 文件类型白名单
- ✅ 文件大小限制
- ✅ 文件名安全化
- ✅ 病毒扫描集成
- ✅ 访问权限控制

## 🔧 技术架构

### 核心技术栈

| 技术       | 版本    | 说明           |
| ---------- | ------- | -------------- |
| Next.js    | 14.2.15 | React 全栈框架 |
| React      | 18.3.1  | UI 库          |
| TypeScript | 5.x     | 类型系统       |
| Ant Design | 5.x     | UI 组件库      |
| Prisma     | 6.x     | ORM 数据库工具 |
| Redis      | 6.0+    | 缓存和会话存储 |
| MySQL      | 8.0+    | 关系型数据库   |
| JWT        | 9.x     | 身份验证       |
| bcryptjs   | 3.x     | 密码加密       |
| Ali OSS    | 6.x     | 文件存储       |

### 数据库设计

```sql
-- 核心表结构
accounts          -- 管理员账户表
roles             -- 角色表
permissions       -- 权限表
account_roles     -- 账户角色关联表
role_permissions  -- 角色权限关联表
logs              -- 系统日志表
export_records    -- 导出记录表
```

### API 设计规范

- **RESTful API** - 标准的 REST 接口设计
- **统一响应格式** - 标准化的数据返回格式
- **错误处理** - 完善的错误处理机制
- **分页支持** - 标准分页查询
- **版本控制** - API 版本管理

## 📖 开发指南

### 代码规范

- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **TypeScript** - 严格类型检查
- **命名约定** - 统一的命名规范

### 开发流程

1. **需求分析** - 明确功能需求和技术方案
2. **数据库设计** - 设计或更新数据库表结构
3. **API 开发** - 实现后端接口
4. **前端开发** - 实现用户界面
5. **测试验证** - 单元测试和集成测试
6. **安全检查** - 安全漏洞扫描和修复
7. **部署上线** - 生产环境部署

### 安全开发

- 遵循 [安全加固指南](docs/SECURITY_HARDENING.md)
- 使用 [部署安全检查清单](docs/DEPLOYMENT_SECURITY_CHECKLIST.md)
- 定期进行安全审计和漏洞扫描
- 及时更新依赖和安全补丁

## 📚 文档

- [API 接口文档](docs/API_INTERFACES.md)
- [安全加固指南](docs/SECURITY_HARDENING.md)
- [部署安全检查清单](docs/DEPLOYMENT_SECURITY_CHECKLIST.md)
- **📋 部署文档**
  - [🚀 快速部署指南](docs/QUICK_DEPLOY_GUIDE.md) - 快速上手部署
  - [📖 完整部署方案](docs/DEPLOYMENT_GUIDE.md) - 详细部署文档
  - [🔧 自动化脚本](scripts/) - 部署和环境配置脚本
  - [🗄️ Prisma 最佳实践](docs/PRISMA_BEST_PRACTICES.md) - 数据库操作指南

## 🚀 部署

本项目支持多种部署方式，推荐使用宝塔面板 + GitHub Actions 的自动化部署方案。

### 🎯 推荐部署方案：宝塔 + GitHub + ECS

**优势：**

- ✅ 全自动化部署流程
- ✅ 可视化服务器管理
- ✅ 一键 SSL 证书配置
- ✅ 完整的日志监控
- ✅ 零停机部署

**快速开始：**

1. 📋 [快速部署指南](docs/QUICK_DEPLOY_GUIDE.md) - 30分钟快速上手
2. 📖 [完整部署文档](docs/DEPLOYMENT_GUIDE.md) - 详细部署步骤
3. 🔧 使用一键部署脚本：
   ```bash
   # 服务器上运行
   wget -O deploy.sh https://raw.githubusercontent.com/your-username/easy-erp-web/main/scripts/deploy.sh
   chmod +x deploy.sh
   ./deploy.sh
   ```

**部署架构：**

```
GitHub Repository → GitHub Actions → ECS (宝塔面板)
    ↓                    ↓               ↓
  代码推送          自动化CI/CD        Nginx + Node.js
                                      MySQL + Redis
```

### 🛠️ 其他部署方式

#### 1. 手动部署

```bash
# 1. 环境准备
# 安装 Node.js 18+, MySQL 8.0+, Redis 6.0+

# 2. 克隆代码
git clone <repository-url>
cd easy-erp-web

# 3. 配置环境变量
./scripts/generate-env.sh  # 交互式生成环境变量

# 4. 初始化应用
pnpm install
npx prisma generate
npx prisma db push
npx prisma db seed

# 5. 构建和启动
pnpm build
pm2 start ecosystem.config.js --env production
```

#### 2. Docker 部署

```bash
# 使用 Docker Compose
docker-compose up -d

# 或者单独构建
docker build -t easy-erp-web .
docker run -d -p 3000:3000 easy-erp-web
```

### 🔧 部署工具

| 工具                           | 用途           | 文档                                 |
| ------------------------------ | -------------- | ------------------------------------ |
| `scripts/deploy.sh`            | 一键部署脚本   | [部署文档](docs/DEPLOYMENT_GUIDE.md) |
| `scripts/generate-env.sh`      | 环境变量生成   | 交互式配置                           |
| `.github/workflows/deploy.yml` | GitHub Actions | 自动化部署                           |
| `ecosystem.config.js`          | PM2 配置       | 进程管理                             |

### 📊 日志查看

```bash
# 应用日志
pm2 logs easy-erp-web

# GitHub Actions 日志
# 访问 GitHub → Actions → 查看工作流

# 宝塔面板日志
# 登录宝塔面板 → 日志 → 网站日志
```

### 🚨 部署检查清单

- [ ] 服务器配置满足要求 (2核4GB+)
- [ ] 宝塔面板安装并配置
- [ ] GitHub Secrets 配置完成
- [ ] 数据库和 Redis 服务正常
- [ ] 环境变量配置正确
- [ ] SSL 证书配置
- [ ] 防火墙和安全组配置
- [ ] 备份策略制定

### 🔍 故障排查

如遇部署问题，请按以下步骤排查：

1. **检查 GitHub Actions 日志**
2. **查看服务器 PM2 日志**: `pm2 logs easy-erp-web`
3. **检查宝塔面板系统日志**
4. **验证环境变量配置**
5. **查看 [故障排查指南](docs/DEPLOYMENT_GUIDE.md#故障排查)**

### 🔒 安全配置

部署完成后，请务必：

- 参考 [部署安全检查清单](docs/DEPLOYMENT_SECURITY_CHECKLIST.md)
- 配置 HTTPS 证书
- 设置防火墙规则
- 配置监控告警
- 修改默认密码

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果您在使用过程中遇到问题，可以通过以下方式获取帮助：

- 查看项目文档
- 提交 GitHub Issue
- 联系维护团队

---

**最后更新**: 2024年12月24日
