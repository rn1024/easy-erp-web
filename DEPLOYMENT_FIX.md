# 线上部署问题修复指南

## 问题
线上部署时出现错误：`Table 'easy_erp_db._prisma_migrations' doesn't exist`

## 解决方案

### 方法一：使用修复后的脚本（推荐）

我们已经修复了 `scripts/sync-and-migrate.js` 脚本，现在它会：
1. 自动检查 `_prisma_migrations` 表是否存在
2. 如果不存在，会自动创建该表
3. 然后继续正常的迁移流程

**在线上服务器执行：**
```bash
node scripts/sync-and-migrate.js
```

### 方法二：手动创建表

如果脚本仍有问题，可以手动创建表：

```sql
CREATE TABLE IF NOT EXISTS _prisma_migrations (
  id VARCHAR(36) NOT NULL,
  checksum VARCHAR(64) NOT NULL,
  finished_at DATETIME(3) NULL,
  migration_name VARCHAR(255) NOT NULL,
  logs TEXT NULL,
  rolled_back_at DATETIME(3) NULL,
  started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  applied_steps_count INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

然后执行：
```bash
npx prisma generate
npx prisma migrate deploy
```

## 修复说明

修复后的脚本增加了以下功能：
- 使用 `information_schema` 安全检查表存在性
- 自动创建 `_prisma_migrations` 表
- 更好的错误处理和日志输出
- 容错机制处理重复记录等常见错误

## 验证

部署成功后，可以通过以下命令验证：
```bash
npx prisma migrate status
```

应该看到 "Database schema is up to date" 的消息。