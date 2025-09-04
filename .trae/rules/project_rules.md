# Easy ERP 项目规范文档

## 项目概述

Easy ERP 是一个基于 Next.js 14 + React 18 + TypeScript + Prisma + MySQL 的现代化企业资源规划系统，专注于提供高效、可扩展的业务管理解决方案。

## 核心理念

### 文档先行

- **不写文档不准写代码**
- 所有功能开发前必须先完成需求文档、技术设计文档
- API 接口必须先定义 OpenAPI 规范
- 数据库变更必须先编写迁移计划

### 任务递归

- **复杂任务层层分解**
- 大任务拆分为可独立验证的小任务
- 每个子任务都有明确的输入、处理、输出定义
- 任务完成标准必须可量化

### 范围收敛

- **明确边界，防止 AI 发散**
- 每个任务都有明确的范围和边界
- 禁止在任务执行过程中随意扩展需求
- 变更需求必须重新走需求评审流程

## 六阶段工作流程

### 1. Align（对齐）- 需求澄清

**核心原则：绝不允许"我觉得你想要..."**

#### 必须完成的工作：

- [ ] 需求方提供完整的需求文档（PRD）
- [ ] 技术团队提出至少 3-5 个澄清问题
- [ ] 需求方逐一回答所有澄清问题
- [ ] 双方确认需求理解一致性
- [ ] 签署需求确认书

#### 输出物：

- 需求确认书（包含功能清单、验收标准、时间节点）
- 风险评估报告
- 资源需求清单

### 2. Architect（架构）- 先设计后编码

**核心原则：告别"边写边想"**

#### 必须完成的工作：

- [ ] 系统架构设计（技术选型、模块划分）
- [ ] 数据库设计（ER图、索引策略、迁移计划）
- [ ] API 接口设计（OpenAPI 规范）
- [ ] 前端组件设计（组件树、状态管理）
- [ ] 部署架构设计（环境规划、CI/CD 流程）

#### 输出物：

- 技术架构文档
- 数据库设计文档
- API 接口文档
- 前端设计文档
- 部署方案文档

### 3. Atomize（原子化）- 大任务拆小

**核心原则：AI 再笨也能做对**

#### 任务拆分标准：

- 每个任务不超过 4 小时工作量
- 每个任务有明确的输入、处理、输出
- 每个任务可以独立测试和验证
- 任务之间的依赖关系清晰明确

#### 输出物：

- 详细任务清单（包含优先级、依赖关系）
- 任务执行计划（时间线、里程碑）
- 风险缓解措施

### 4. Approve（审批）- 人工检查

**核心原则：AI 想偷懒？门都没有**

#### 审批检查点：

- [ ] 代码质量审查（ESLint、Prettier、TypeScript 检查）
- [ ] 安全性审查（依赖漏洞、权限控制、数据验证）
- [ ] 性能审查（查询优化、缓存策略、资源使用）
- [ ] 业务逻辑审查（需求符合性、边界条件处理）
- [ ] 测试覆盖率审查（单元测试、集成测试、E2E 测试）

#### 审批标准：

- 代码覆盖率 ≥ 80%
- 性能测试通过
- 安全扫描无高危漏洞
- 业务逻辑验证通过

### 5. Automate（执行）- 按文档执行

**核心原则：有据可查**

#### 自动化要求：

- [ ] 代码提交自动触发 CI/CD 流程
- [ ] 自动运行所有测试用例
- [ ] 自动进行代码质量检查
- [ ] 自动部署到测试环境
- [ ] 自动生成部署报告

#### 执行标准：

- 所有操作都有日志记录
- 失败时自动回滚
- 关键操作需要人工确认

### 6. Assess（评估）- 质量验收

**核心原则：不合格就重来**

#### 验收标准：

- [ ] 功能测试 100% 通过
- [ ] 性能指标达到预期
- [ ] 用户体验符合设计要求
- [ ] 安全性测试通过
- [ ] 文档完整且准确

#### 评估维度：

- 功能完整性（是否实现所有需求）
- 质量稳定性（是否存在 Bug）
- 性能表现（响应时间、吞吐量）
- 用户体验（易用性、美观度）
- 可维护性（代码质量、文档完整性）

## 技术栈偏好

- JS 项目在创建阶段需要自动加入保存格式化的需求
- **JS 项目默认使用 pnpm** - 所有依赖管理、脚本执行都使用 pnpm
- 用户偏好删除根.git 历史，将每个子文件夹作为独立的 git 仓库管理

## 服务器信息

- **生产服务器**: root@121.41.237.2
- 部署方式: PM2 + Standalone 模式
- 数据库: MySQL

## 项目规范

### 代码规范

#### TypeScript 规范

```typescript
// 使用严格的 TypeScript 配置
// 所有函数必须有明确的返回类型
// 禁止使用 any 类型
// 优先使用 interface 而不是 type

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

type UserRole = 'admin' | 'manager' | 'employee';
```

#### React 组件规范

```typescript
// 使用函数组件 + Hooks
// 组件名使用 PascalCase
// Props 接口以 Props 结尾
// 使用 React.FC 类型

interface UserCardProps {
  user: UserProfile;
  onEdit?: (user: UserProfile) => void;
  className?: string;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit, className }) => {
  // 组件实现
};
```

#### API 路由规范

```typescript
// 使用 RESTful API 设计
// 统一错误处理
// 使用 Zod 进行参数验证
// 返回标准化的响应格式

import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'employee']),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = CreateUserSchema.parse(body);

    // 业务逻辑处理

    return Response.json({
      success: true,
      data: result,
      message: '用户创建成功',
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 400 }
    );
  }
}
```

### 文件组织规范

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── (dashboard)/       # 路由组
│   └── globals.css        # 全局样式
├── components/            # 可复用组件
│   ├── ui/               # 基础 UI 组件
│   └── business/         # 业务组件
├── lib/                  # 工具库
├── hooks/                # 自定义 Hooks
├── store/                # 状态管理
├── types/                # 类型定义
├── utils/                # 工具函数
└── constants/            # 常量定义
```

### Git 工作流规范

#### 分支命名规范

- `main` - 主分支，用于生产环境
- `develop` - 开发分支，用于集成测试
- `feature/功能名称` - 功能分支
- `bugfix/问题描述` - 修复分支
- `hotfix/紧急修复` - 热修复分支

#### 提交信息规范

```
type(scope): subject

body

footer
```

**Type 类型：**

- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例：**

```
feat(auth): 添加用户登录功能

- 实现用户名密码登录
- 添加 JWT Token 验证
- 集成验证码功能

Closes #123
```

## 业务规范

### 权限管理规范

#### 角色定义

- **系统管理员（Admin）**: 拥有所有权限
- **业务管理员（Manager）**: 拥有业务模块的管理权限
- **普通员工（Employee）**: 拥有基础操作权限
- **访客（Guest）**: 只读权限

#### 权限控制策略

- 基于角色的访问控制（RBAC）
- 最小权限原则
- 权限继承机制
- 动态权限验证

### 数据安全规范

#### 敏感数据处理

- 密码必须使用 bcrypt 加密
- 个人信息需要脱敏处理
- 财务数据需要加密存储
- 操作日志完整记录

#### 数据备份策略

- 每日自动备份
- 异地备份存储
- 备份数据加密
- 定期恢复测试

### 业务流程规范

#### 审批流程

- 采购申请 → 部门审批 → 财务审批 → 执行
- 请假申请 → 直属领导审批 → HR 确认
- 费用报销 → 部门审批 → 财务审批 → 出纳付款

#### 数据一致性

- 关键业务操作使用事务
- 分布式事务使用 Saga 模式
- 数据同步使用事件驱动

## UI 规范

### 设计系统

#### 色彩规范

```css
:root {
  /* 主色调 */
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-900: #1e3a8a;

  /* 辅助色 */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #06b6d4;

  /* 中性色 */
  --gray-50: #f9fafb;
  --gray-500: #6b7280;
  --gray-900: #111827;
}
```

#### 字体规范

```css
:root {
  /* 字体家族 */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', Consolas, monospace;

  /* 字体大小 */
  --text-xs: 0.75rem; /* 12px */
  --text-sm: 0.875rem; /* 14px */
  --text-base: 1rem; /* 16px */
  --text-lg: 1.125rem; /* 18px */
  --text-xl: 1.25rem; /* 20px */
  --text-2xl: 1.5rem; /* 24px */
  --text-3xl: 1.875rem; /* 30px */
}
```

#### 间距规范

```css
:root {
  --spacing-1: 0.25rem; /* 4px */
  --spacing-2: 0.5rem; /* 8px */
  --spacing-3: 0.75rem; /* 12px */
  --spacing-4: 1rem; /* 16px */
  --spacing-6: 1.5rem; /* 24px */
  --spacing-8: 2rem; /* 32px */
  --spacing-12: 3rem; /* 48px */
  --spacing-16: 4rem; /* 64px */
}
```

### 组件规范

#### 按钮组件

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}
```

#### 表单组件

```typescript
interface FormFieldProps {
  label: string;
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
}
```

#### 表格组件

```typescript
interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: PaginationConfig;
  selection?: SelectionConfig<T>;
  sorting?: SortingConfig;
  filtering?: FilteringConfig;
}
```

### 响应式设计规范

#### 断点定义

```css
/* 移动端 */
@media (max-width: 640px) {
  /* sm */
}

/* 平板端 */
@media (min-width: 641px) and (max-width: 1024px) {
  /* md */
}

/* 桌面端 */
@media (min-width: 1025px) {
  /* lg */
}

/* 大屏幕 */
@media (min-width: 1280px) {
  /* xl */
}
```

#### 布局规范

- 移动端：单列布局，侧边栏折叠
- 平板端：两列布局，侧边栏可收起
- 桌面端：多列布局，侧边栏固定

## 数据库变更规范

### 迁移策略

#### 安全变更（可直接执行）

- 添加新表
- 添加新字段（可为空）
- 添加索引
- 添加约束（不影响现有数据）

#### 谨慎变更（需要备份）

- 修改字段类型
- 添加非空约束
- 删除索引
- 重命名字段

#### 危险变更（需要维护窗口）

- 删除表
- 删除字段
- 修改主键
- 大量数据迁移

### 变更流程

1. **变更前准备**

   ```bash
   # 创建数据库备份
   ./scripts/db-backup.sh

   # 验证迁移文件
   npx prisma validate

   # 检查迁移状态
   npx prisma migrate status
   ```

2. **执行变更**

   ```bash
   # 开发环境
   npx prisma db push

   # 生产环境
   npx prisma migrate deploy
   ```

3. **变更后验证**

   ```bash
   # 验证数据完整性
   ./scripts/validate-data.sh

   # 运行健康检查
   ./scripts/health-check.sh
   ```

4. **回滚准备**
   ```bash
   # 如果出现问题，执行回滚
   ./scripts/db-rollback.sh [backup-file]
   ```

### 部署保护措施

#### 自动化检查

- 迁移文件语法检查
- 数据库连接测试
- 备份完整性验证
- 回滚脚本测试

#### 监控告警

- 数据库性能监控
- 错误日志监控
- 业务指标监控
- 用户行为监控

#### 应急预案

- 快速回滚机制
- 数据恢复流程
- 服务降级策略
- 用户通知机制

## 质量保证

### 测试策略

#### 单元测试

- 覆盖率要求：≥ 80%
- 测试框架：Jest + Testing Library
- 测试文件命名：`*.test.ts` 或 `*.spec.ts`

#### 集成测试

- API 接口测试
- 数据库操作测试
- 第三方服务集成测试

#### E2E 测试

- 关键业务流程测试
- 跨浏览器兼容性测试
- 性能测试

### 代码质量

#### 静态分析

- ESLint 规则检查
- TypeScript 类型检查
- Prettier 代码格式化
- SonarQube 代码质量分析

#### 安全检查

- 依赖漏洞扫描
- 代码安全审计
- 权限控制验证
- 数据加密检查

### 性能优化

#### 前端优化

- 代码分割（Code Splitting）
- 懒加载（Lazy Loading）
- 图片优化（WebP、压缩）
- CDN 加速

#### 后端优化

- 数据库查询优化
- 缓存策略（Redis）
- API 响应压缩
- 连接池管理

## 部署运维

### 环境管理

#### 环境分类

- **开发环境（Development）**: 本地开发使用
- **测试环境（Testing）**: 功能测试使用
- **预发环境（Staging）**: 生产前验证
- **生产环境（Production）**: 正式服务

#### 配置管理

```bash
# 环境变量配置
NODE_ENV=production
DATABASE_URL=mysql://...
REDIS_URL=redis://...
JWT_SECRET=...
UPLOAD_PATH=/app/uploads
```

### CI/CD 流程

#### 持续集成

1. 代码提交触发构建
2. 运行代码质量检查
3. 执行自动化测试
4. 构建 Docker 镜像
5. 推送到镜像仓库

#### 持续部署

1. 从镜像仓库拉取最新镜像
2. 执行数据库备份
3. 运行数据库迁移
4. 部署新版本服务
5. 执行健康检查
6. 发送部署通知

### 监控告警

#### 系统监控

- CPU、内存、磁盘使用率
- 网络流量监控
- 数据库性能监控
- 应用程序日志监控

#### 业务监控

- 用户访问量统计
- 接口响应时间
- 错误率统计
- 业务指标监控

## 文档规范

### 文档类型

#### 技术文档

- API 接口文档（OpenAPI）
- 数据库设计文档
- 架构设计文档
- 部署运维文档

#### 业务文档

- 产品需求文档（PRD）
- 用户操作手册
- 业务流程文档
- 培训材料

### 文档维护

#### 更新策略

- 代码变更时同步更新文档
- 定期审查文档准确性
- 版本控制管理
- 文档评审流程

#### 文档质量

- 内容准确完整
- 结构清晰合理
- 示例代码可运行
- 定期更新维护

---

**文档版本**: v1.0.0  
**最后更新**: 2024-01-21  
**维护人员**: 技术团队  
**审核状态**: 已审核通过

> 本文档是 Easy ERP 项目的核心规范，所有团队成员必须严格遵守。如有疑问或建议，请联系技术负责人。