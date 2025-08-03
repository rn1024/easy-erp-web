# 生产环境部署问题修复指南

## 问题描述

线上部署时出现以下错误：
```
Raw query failed. Code: `1146`. Message: `Table 'easy_erp_db._prisma_migrations' doesn't exist`
```

## 问题原因

1. 线上数据库缺少 `_prisma_migrations` 表
2. 原有的同步脚本在检查表存在性时就失败了
3. 数据库迁移记录不完整

## 解决方案

### 方案一：使用新的生产部署脚本（推荐）

我们创建了一个更安全的生产部署脚本 `scripts/production-deploy.js`，它会：

1. **测试数据库连接**
2. **确保迁移表存在** - 如果不存在会自动创建
3. **安全地同步迁移记录** - 处理各种错误情况
4. **执行标准迁移** - 包含基线处理
5. **验证最终状态**

#### 使用方法：

```bash
# 在生产服务器上执行
node scripts/production-deploy.js
```

### 方案二：手动修复（备选）

如果自动脚本仍有问题，可以手动执行以下步骤：

#### 1. 创建迁移表

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

#### 2. 同步迁移记录

```bash
# 执行同步SQL文件
mysql -h [host] -u [username] -p [database] < deployment/migration-sync.sql
```

#### 3. 执行标准迁移

```bash
npx prisma generate
npx prisma migrate deploy
```

## 脚本改进说明

### 原脚本问题
- 在表不存在时查询就失败
- 错误处理不够完善
- 缺少数据库连接测试

### 新脚本改进
- **安全的表检查**：使用 `information_schema` 检查表存在性
- **渐进式错误处理**：每个步骤都有独立的错误处理
- **详细的日志输出**：便于调试和监控
- **连接测试**：部署前先测试数据库连接
- **容错机制**：对于可接受的错误（如重复记录）进行忽略

## 部署流程建议

### 生产环境部署步骤

1. **备份数据库**（重要！）
```bash
mysqldump -h [host] -u [username] -p [database] > backup_$(date +%Y%m%d_%H%M%S).sql
```

2. **执行新的部署脚本**
```bash
node scripts/production-deploy.js
```

3. **验证部署结果**
```bash
npx prisma migrate status
```

4. **启动应用服务**
```bash
npm run build
npm start
```

### 监控和验证

- 检查迁移状态：`npx prisma migrate status`
- 验证表结构：查看关键表是否存在
- 测试应用功能：确保核心功能正常

## 预防措施

1. **定期备份迁移记录**
2. **在测试环境先验证部署脚本**
3. **保持迁移文件的完整性**
4. **监控数据库迁移状态**

## 故障排除

### 如果新脚本仍然失败

1. 检查数据库连接配置
2. 确认数据库用户权限
3. 查看详细错误日志
4. 考虑手动执行各个步骤

### 常见错误处理

- **连接超时**：检查网络和数据库服务状态
- **权限不足**：确认数据库用户有 CREATE、INSERT 权限
- **表已存在**：正常情况，脚本会自动处理
- **重复记录**：使用 INSERT IGNORE，会自动跳过

## 联系支持

如果遇到无法解决的问题，请提供：
1. 完整的错误日志
2. 数据库配置信息（隐藏敏感信息）
3. 执行的具体步骤
4. 环境信息（Node.js版本、数据库版本等）