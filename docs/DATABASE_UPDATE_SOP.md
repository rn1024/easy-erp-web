# 数据库更新标准操作程序 (SOP)

## 📋 概述

本文档定义了Easy ERP Web项目数据库更新的标准操作程序，确保生产环境数据安全和系统稳定性。

## 🎯 适用场景

- 新增数据库表或字段
- 修改现有表结构
- 添加/删除索引
- 数据类型变更
- 新增种子数据
- 修复数据不一致

## 🚦 风险等级分类

### 🟢 低风险操作

- 新增表（不影响现有数据）
- 新增可空字段
- 新增索引（非唯一）
- 新增种子数据

### 🟡 中风险操作

- 修改字段类型（兼容转换）
- 新增非空字段（有默认值）
- 删除未使用的表或字段
- 修改索引

### 🔴 高风险操作

- 删除包含数据的表或字段
- 不兼容的字段类型转换
- 修改主键或外键约束
- 大批量数据迁移

## 📝 操作前检查清单

### 1. 环境确认

- [ ] 确认当前环境（开发/测试/生产）
- [ ] 检查数据库连接状态
- [ ] 验证当前schema版本
- [ ] 确认有足够的磁盘空间

### 2. 权限确认

- [ ] 确认数据库操作权限
- [ ] 确认文件系统写入权限
- [ ] 确认备份目录访问权限

### 3. 数据安全

- [ ] 完整数据库备份已创建
- [ ] 备份文件完整性验证
- [ ] 回滚脚本已准备

## 🔄 标准操作流程

### 阶段1：开发环境准备

#### 1.1 本地开发

```bash
# 1. 更新Prisma Schema
vim prisma/schema.prisma

# 2. 生成迁移文件
npx prisma migrate dev --name describe_your_changes

# 3. 本地测试
npm run test
npm run type-check
```

#### 1.2 验证迁移

```bash
# 1. 检查迁移文件
cat prisma/migrations/[timestamp]_[name]/migration.sql

# 2. 测试回滚（如果需要）
npx prisma migrate reset --force
npx prisma migrate deploy

# 3. 验证数据完整性
npm run db:seed
```

### 阶段2：测试环境验证

#### 2.1 部署到测试环境

```bash
# 1. 推送代码到测试分支
git checkout test
git merge develop
git push origin test

# 2. 在测试环境运行
./scripts/deploy.sh --db-only
```

#### 2.2 测试验证

```bash
# 1. 功能测试
npm run test:integration

# 2. API测试
npm run test:api

# 3. 性能测试
npm run test:performance
```

### 阶段3：生产环境部署

#### 3.1 预部署检查

```bash
# 1. 备份验证
./scripts/backup-database.sh --verify

# 2. 迁移预检
npx prisma migrate status
npx prisma validate

# 3. 依赖检查
npm audit
```

#### 3.2 生产部署

```bash
# 方法1：自动部署（推荐）
git checkout main
git merge test
git push origin main  # 触发GitHub Actions

# 方法2：手动部署
./scripts/deploy.sh --production
```

#### 3.3 部署后验证

```bash
# 1. 服务状态检查
pm2 status easy-erp-web
curl -f http://localhost:3008/api/health

# 2. 数据库状态验证
npx prisma migrate status
node fix-admin-password.js --verify

# 3. 关键功能测试
curl -X POST http://localhost:3008/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

## 🛠 具体操作命令

### 常用数据库操作

#### 1. 创建新迁移

```bash
# 开发环境
npx prisma migrate dev --name add_new_feature

# 生产环境（部署时自动执行）
npx prisma migrate deploy
```

#### 2. 数据库备份

```bash
# 手动备份
./scripts/deploy.sh --db-backup-only

# 自动备份（部署脚本中包含）
mysqldump -h$DB_HOST -u$DB_USER -p$DB_PASS \
  --single-transaction --routines --triggers \
  $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 3. 种子数据更新

```bash
# 生产环境种子数据
npm run db:seed:production

# 开发环境种子数据
npm run db:seed
```

#### 4. Schema同步

```bash
# 强制同步（谨慎使用）
npx prisma db push --force-reset

# 安全同步（推荐）
npx prisma migrate deploy
```

### 紧急修复操作

#### 1. 快速修复admin用户

```bash
node fix-admin-password.js
```

#### 2. 数据库连接问题

```bash
# 检查连接
npx prisma db check

# 重新生成客户端
npx prisma generate
```

#### 3. 迁移冲突解决

```bash
# 检查迁移状态
npx prisma migrate status

# 手动解决冲突
npx prisma migrate resolve --applied [migration_name]
```

## 🔙 回滚程序

### 1. 代码回滚

```bash
# 回滚到上一个版本
git revert HEAD
git push origin main

# 或使用GitHub Actions回滚
# 在Actions页面重新运行之前的成功部署
```

### 2. 数据库回滚

```bash
# 使用备份恢复
mysql -h$DB_HOST -u$DB_USER -p$DB_PASS \
  $DB_NAME < backup_[timestamp].sql

# 恢复后重启应用
pm2 restart easy-erp-web
```

### 3. 迁移回滚

```bash
# 注意：Prisma不支持自动回滚
# 需要手动创建反向迁移

# 1. 创建回滚迁移
npx prisma migrate dev --name rollback_[feature_name]

# 2. 手动编写回滚SQL
vim prisma/migrations/[timestamp]_rollback_[feature_name]/migration.sql
```

## 📊 监控和验证

### 1. 部署后监控

```bash
# 应用状态
pm2 monit

# 数据库连接
npx prisma db check

# 系统资源
htop
df -h
```

### 2. 健康检查脚本

```bash
#!/bin/bash
# health-check.sh

echo "🔍 系统健康检查..."

# 1. 应用状态
if pm2 list | grep -q "online"; then
    echo "✅ 应用运行正常"
else
    echo "❌ 应用状态异常"
fi

# 2. 数据库连接
if npx prisma db ping; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接异常"
fi

# 3. API可用性
if curl -f http://localhost:3008/api/health > /dev/null 2>&1; then
    echo "✅ API服务正常"
else
    echo "❌ API服务异常"
fi
```

## 📋 变更记录模板

### Pull Request模板

```markdown
## 数据库变更说明

### 变更类型

- [ ] 🟢 低风险：新增表/字段
- [ ] 🟡 中风险：修改字段/索引
- [ ] 🔴 高风险：删除数据/不兼容变更

### 变更内容

- 变更描述：[详细说明]
- 影响范围：[受影响的功能]
- 迁移脚本：[migration文件名]

### 测试确认

- [ ] 本地环境测试通过
- [ ] 测试环境验证通过
- [ ] 迁移脚本已审查
- [ ] 回滚方案已准备

### 部署计划

- 计划部署时间：[时间]
- 预计停机时间：[时长]
- 风险评估：[低/中/高]
```

## 🚨 应急联系

### 关键联系人

- **技术负责人**：[姓名] - [联系方式]
- **运维人员**：[姓名] - [联系方式]
- **数据库管理员**：[姓名] - [联系方式]

### 应急流程

1. **发现问题** → 立即停止部署
2. **评估影响** → 确定影响范围
3. **联系团队** → 通知相关人员
4. **执行回滚** → 使用备份恢复
5. **问题分析** → 查找根本原因
6. **制定修复** → 准备新的解决方案

## 📚 相关文档

- [Prisma Migrate文档](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [项目部署指南](./DEPLOYMENT_GUIDE.md)
- [数据库设计文档](./DATABASE_DESIGN.md)
- [API接口文档](./API_INTERFACES.md)

---

**最后更新时间**：2025年1月17日  
**文档版本**：v1.0  
**维护人员**：项目技术团队
