# 双场景数据库迁移方案

## 📖 方案概述

本方案旨在解决当前ERP系统数据库管理混乱问题，建立标准化、安全化的双场景迁移体系。

### 核心问题

- 危险的`smart-db-sync.ts`脚本绕过Prisma标准迁移流程
- `prisma db push`命令存在数据丢失风险
- 缺乏统一的环境管理策略
- CI/CD流程使用不安全的数据库操作

### 解决方案

建立**双场景智能迁移系统**：

- **场景1（全量同步）**：环境初始化、测试重置、首次部署
- **场景2（增量更新）**：日常开发、生产环境安全更新

## 🎯 技术架构

### 场景分类矩阵

| 环境类型 | 数据库状态 | 推荐场景 | 执行策略       |
| -------- | ---------- | -------- | -------------- |
| 开发环境 | 空数据库   | 场景1    | 快速全量初始化 |
| 开发环境 | 有数据     | 场景2    | 增量迁移       |
| 测试环境 | CI重置     | 场景1    | 自动化全量同步 |
| 测试环境 | 持续集成   | 场景2    | 标准迁移流程   |
| 生产环境 | 首次部署   | 场景1    | 安全全量部署   |
| 生产环境 | 日常更新   | 场景2    | 零停机增量更新 |

### 智能检测逻辑

```typescript
// 环境检测
function detectEnvironment(): 'development' | 'testing' | 'production' {
  return process.env.NODE_ENV || 'development';
}

// 数据库状态分析
function analyzeDatabaseState(): 'empty' | 'has_data' | 'needs_migration' {
  // 检查表数量、迁移状态、数据记录
}

// 场景推荐
function recommendScenario(): 'full_sync' | 'incremental' {
  const env = detectEnvironment();
  const state = analyzeDatabaseState();

  if (state === 'empty' || env === 'testing') return 'full_sync';
  return 'incremental';
}
```

## 🔧 实施计划

### 阶段1：风险评估与备份

#### 1.1 危险组件识别

- ❌ `scripts/smart-db-sync.ts` (14KB) - 绕过迁移系统
- ❌ `scripts/feature-iteration-sync.ts` (16KB) - 过度工程化
- ❌ `scripts/optimize-database.js` (8.8KB) - 潜在风险
- ❌ `package.json` 危险命令：`db:smart-sync`, `feature:apply`
- ❌ `.github/workflows/deploy.yml` 第370行：`prisma db push`

#### 1.2 当前状态

- 待应用迁移：`20250718030000_add_finalamount_safely`, `20250718031500_complete_schema_sync`
- 环境同步状态：本地Docker MySQL ↔ 服务器RDS
- Admin账户：正常（admin/123456）

#### 1.3 备份策略

```bash
# 本地备份
docker exec mysql_container mysqldump -u root -p easy_erp > backup_$(date +%Y%m%d_%H%M%S).sql

# 生产备份
aws rds create-db-snapshot --db-instance-identifier prod-db --db-snapshot-identifier migration-backup-$(date +%Y%m%d)
```

### 阶段2：核心系统开发

#### 2.1 统一迁移管理器

**文件**: `scripts/unified-migration-manager.ts`

```typescript
export class UnifiedMigrationManager {
  // 场景1：全量同步
  async executeFullSync(options: FullSyncOptions) {
    await this.createBackup();
    await this.resetDatabase();
    await this.applyAllMigrations();
    await this.seedData();
    await this.validateResult();
  }

  // 场景2：增量更新
  async executeIncrementalMigration(options: IncrementalOptions) {
    await this.createBackup();
    await this.validatePendingMigrations();
    await this.applyNewMigrations();
    await this.validateResult();
  }

  // 智能检测
  async autoDetectAndExecute() {
    const scenario = this.recommendScenario();
    return scenario === 'full_sync' ? this.executeFullSync() : this.executeIncrementalMigration();
  }
}
```

#### 2.2 安全保障机制

- **备份恢复**: 自动备份 + 一键回滚
- **迁移验证**: Schema校验 + 数据完整性检查
- **环境隔离**: 开发环境先验证
- **人工确认**: 生产环境需要显式确认

### 阶段3：脚本重构

#### 3.1 Package.json优化

```json
{
  "scripts": {
    // ❌ 删除危险命令
    // "db:smart-sync": "tsx scripts/smart-db-sync.ts",
    // "feature:apply": "tsx scripts/feature-iteration-sync.ts",
    // "db:push": "prisma db push",

    // ✅ 新增安全命令
    "db:migrate": "tsx scripts/unified-migration-manager.ts",
    "db:full-sync": "tsx scripts/unified-migration-manager.ts --scenario=full",
    "db:incremental": "tsx scripts/unified-migration-manager.ts --scenario=incremental",
    "db:auto": "tsx scripts/unified-migration-manager.ts --auto-detect",
    "db:backup": "tsx scripts/unified-migration-manager.ts --backup-only",
    "db:rollback": "tsx scripts/unified-migration-manager.ts --rollback",

    // 保留标准命令
    "db:migrate:dev": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:status": "prisma migrate status"
  }
}
```

#### 3.2 Deploy.sh重构

```bash
# ❌ 危险操作
# npx prisma db push

# ✅ 安全替换
echo "=== 数据库迁移开始 ==="
npm run db:status
npm run db:auto
npm run db:validate
echo "=== 数据库迁移完成 ==="
```

### 阶段4：CI/CD优化

#### 4.1 GitHub Actions重构

```yaml
# .github/workflows/deploy.yml
- name: Database Migration
  run: |
    echo "检查迁移状态..."
    npm run db:status

    echo "执行智能迁移..."
    npm run db:auto

    echo "验证迁移结果..."
    npm run db:validate

- name: Rollback on Failure
  if: failure()
  run: |
    echo "迁移失败，执行回滚..."
    npm run db:rollback
```

## 📊 使用指南

### 开发环境操作

```bash
# 新项目初始化
npm run db:full-sync

# 日常开发迁移
npm run db:incremental

# 智能自动检测
npm run db:auto

# 快速重置（开发测试）
npm run db:reset && npm run db:full-sync
```

### 生产环境操作

```bash
# 首次部署
npm run db:backup
npm run db:full-sync --confirm

# 日常更新
npm run db:backup
npm run db:incremental --confirm

# 紧急回滚
npm run db:rollback --to-backup=backup_20250101_120000
```

### 故障排查

| 问题现象 | 可能原因    | 解决方案              |
| -------- | ----------- | --------------------- |
| 迁移失败 | Schema冲突  | `npm run db:rollback` |
| 数据丢失 | 误用db:push | 从备份恢复            |
| 连接超时 | 网络问题    | 检查数据库连接        |
| 权限错误 | 账户配置    | `npm run admin:fix`   |

## ⚠️ 风险控制

### 高风险操作清单

1. ❌ 直接使用 `prisma db push`
2. ❌ 跳过备份直接迁移
3. ❌ 生产环境使用开发工具
4. ❌ 手动修改迁移文件

### 安全检查清单

- [ ] 迁移前备份已创建
- [ ] 迁移文件已验证
- [ ] 测试环境已验证
- [ ] 回滚计划已准备
- [ ] 监控告警已配置

## 📈 预期收益

- **安全性**: 消除数据丢失风险，所有操作可回滚
- **效率**: 自动化检测和执行，减少人工错误
- **标准化**: 统一的操作流程和最佳实践
- **可维护性**: 清晰的文档和故障排查指南

## 🚀 迁移时间表

### 第一周：基础建设

- [x] 方案设计和文档
- [ ] 统一迁移管理器开发
- [ ] 危险脚本替换
- [ ] Package.json清理

### 第二周：系统集成

- [ ] CI/CD流程优化
- [ ] 部署脚本重构
- [ ] 安全机制完善
- [ ] 测试环境验证

### 第三周：生产部署

- [ ] 生产环境迁移
- [ ] 监控系统集成
- [ ] 文档完善
- [ ] 团队培训

---

**创建时间**: 2024年12月24日  
**文档版本**: 1.0.0  
**负责人**: AI助手  
**状态**: 设计完成，开始实施
