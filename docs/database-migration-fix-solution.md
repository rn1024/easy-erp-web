# 数据库迁移失败问题分析与解决方案

## 问题概述

当前 easy-erp-web 项目在执行数据库迁移时失败，错误信息显示 MySQL 语法错误（错误代码 1064），具体发生在 `20250115_add_purchase_statistics_indexes` 迁移文件中。

## 问题分析

### 1. 根本原因

迁移文件 `20250115_add_purchase_statistics_indexes/migration.sql` 中使用了不兼容的语法 `CREATE INDEX IF NOT EXISTS`，但项目配置的数据库是 **MySQL**。

### 2. 技术细节

- **数据库类型**: MySQL (从 `.env` 和 `schema.prisma` 确认)
- **问题语法**: `CREATE INDEX IF NOT EXISTS` (MySQL 不支持的语法)
- **MySQL 支持**: MySQL 不支持 `IF NOT EXISTS` 子句用于索引创建
- **影响范围**: 22 个索引创建语句全部失败

### 3. 当前迁移状态

```bash
4 migrations found in prisma/migrations
Following migrations have not yet been applied:
- 20250115_add_purchase_statistics_indexes  # ❌ 语法错误
- 20250821015630_add_shipment_file_field    # ✅ 语法正确
```

## 解决方案对比

### 方案一：修复迁移文件 + 重新应用（推荐）

**优点**:
- 保持迁移历史完整性
- 符合 Prisma 最佳实践
- 便于团队协作和生产环境部署
- 可重复执行

**缺点**:
- 需要修改迁移文件
- 需要标记失败迁移为已回滚

**执行步骤**:
1. 标记失败迁移为已回滚
2. 修复迁移文件语法
3. 重新生成和应用迁移

### 方案二：手动执行 + 标记已应用

**优点**:
- 快速解决问题
- 不需要修改迁移文件

**缺点**:
- 破坏迁移历史一致性
- 团队其他成员可能遇到同样问题
- 生产环境部署时需要特殊处理

### 方案三：删除迁移 + 重新生成

**优点**:
- 彻底解决语法问题

**缺点**:
- 丢失迁移历史
- 如果已有团队成员应用了部分迁移，会造成不一致

## 推荐解决方案详细步骤

### 第一步：标记失败迁移为已回滚

```bash
npx prisma migrate resolve --rolled-back 20250115_add_purchase_statistics_indexes
```

### 第二步：修复迁移文件语法

将所有 `CREATE INDEX IF NOT EXISTS` 替换为 `CREATE INDEX`，并添加错误处理：

```sql
-- 原始语法（不兼容）
CREATE INDEX IF NOT EXISTS "idx_purchase_orders_shop_status" 
ON "PurchaseOrder" ("shopId", "status");

-- 修复后语法（MySQL 兼容）
CREATE INDEX `idx_purchase_orders_shop_status` 
ON `PurchaseOrder` (`shopId`, `status`);
```

### 第三步：处理条件索引

对于包含 `WHERE` 子句的条件索引，MySQL 5.7+ 支持，但语法略有不同：

```sql
-- 原始语法
CREATE INDEX IF NOT EXISTS "idx_purchase_orders_active_only" 
ON "PurchaseOrder" ("shopId", "supplierId", "createdAt") 
WHERE "status" != 'CANCELLED';

-- MySQL 语法
CREATE INDEX `idx_purchase_orders_active_only` 
ON `PurchaseOrder` (`shopId`, `supplierId`, `createdAt`) 
WHERE `status` != 'CANCELLED';
```

### 第四步：重新应用迁移

```bash
npx prisma migrate dev
```

### 第五步：验证迁移结果

```bash
npx prisma migrate status
```

## 预防措施

### 1. 开发流程改进

- **迁移前测试**: 在本地 MySQL 环境测试所有迁移
- **语法检查**: 使用 MySQL 特定的语法
- **代码审查**: 迁移文件必须经过代码审查

### 2. 工具配置

在 `package.json` 中添加迁移验证脚本：

```json
{
  "scripts": {
    "db:migrate:check": "npx prisma migrate status",
    "db:migrate:dev": "npx prisma migrate dev",
    "db:migrate:deploy": "npx prisma migrate deploy"
  }
}
```

### 3. 环境一致性

确保开发、测试、生产环境都使用相同的数据库类型和版本。

## 风险评估

### 低风险
- 本地开发环境修复
- 迁移文件语法修正

### 中等风险
- 生产环境应用（需要备份）
- 大量索引创建可能影响性能

### 高风险
- 直接修改生产数据库结构
- 跳过迁移历史记录

## 总结

推荐使用 **方案一**（修复迁移文件 + 重新应用），因为：

1. **技术正确性**: 保持 Prisma 迁移系统的完整性
2. **团队协作**: 确保所有开发者环境一致
3. **生产安全**: 遵循标准的数据库变更流程
4. **可维护性**: 便于后续的数据库结构管理

执行此方案预计耗时：**15-30 分钟**，主要时间用于索引创建。