# 标准Prisma迁移操作指南

## 📖 概述

本指南规范了ERP系统的数据库迁移流程，确保从本地开发到生产部署的标准化操作。

**核心原则**：完全使用Prisma官方迁移工具，禁止绕过标准流程的自定义脚本。

## 🏗️ 标准流程

### 本地开发环境

#### 1. 修改数据库Schema

```bash
# 编辑 prisma/schema.prisma
# 添加新表、字段或修改现有结构
```

#### 2. 生成迁移脚本

```bash
# 为变更创建迁移文件
npx prisma migrate dev --name descriptive_migration_name

# 示例
npx prisma migrate dev --name add_user_profile_table
npx prisma migrate dev --name add_product_category_field
```

#### 3. 验证迁移结果

```bash
# 检查迁移状态
npm run db:status

# 验证schema
npm run db:validate

# 测试应用功能
npm run test:api
```

#### 4. 提交代码

```bash
# 迁移文件会自动包含在git中
git add .
git commit -m "feat: add user profile table migration"
git push
```

### 生产部署环境

#### 1. GitHub Actions自动执行

```yaml
# 在.github/workflows/deploy.yml中
- name: Generate Prisma Client
  run: npx prisma generate

- name: Deploy Migrations
  run: npx prisma migrate deploy
```

#### 2. ECS服务器执行

```bash
# 通过ecosystem.config.js post_update钩子自动执行：
npm install --production
npm run db:generate
npm run db:migrate:deploy
```

## 📋 可用命令

### 开发命令

```bash
# 创建新迁移（开发环境专用）
npm run db:migrate:dev

# 检查迁移状态
npm run db:status

# 验证schema
npm run db:validate

# 生成Prisma客户端
npm run db:generate

# 重置数据库（开发环境专用）
npm run db:reset
```

### 生产命令

```bash
# 应用迁移（生产环境）
npm run db:migrate:deploy

# 生产环境种子数据
npm run db:migrate:production
```

## ⚠️ 重要规则

### ✅ 允许的操作

1. **开发环境**：

   - `npx prisma migrate dev` - 创建迁移
   - `npx prisma migrate reset` - 重置开发数据库
   - `npx prisma studio` - 数据库GUI工具

2. **生产环境**：
   - `npx prisma migrate deploy` - 应用迁移
   - `npx prisma generate` - 生成客户端

### ❌ 禁止的操作

1. **任何环境**：

   - ~~`npx prisma db push`~~ - 绕过迁移历史
   - ~~自定义同步脚本~~ - 不可预测的风险

2. **生产环境**：
   - ~~`npx prisma migrate dev`~~ - 会重置数据库
   - ~~`npx prisma migrate reset`~~ - 会丢失数据

## 🚨 故障排查

### 常见问题

#### 1. 迁移失败：表已存在

```bash
# 错误：Table 'xxx' already exists
# 解决：标记迁移为已应用
npx prisma migrate resolve --applied migration_name
```

#### 2. 迁移历史不同步

```bash
# 检查当前状态
npx prisma migrate status

# 开发环境：重置并重新迁移
npx prisma migrate reset --force
npx prisma migrate dev

# 生产环境：联系运维处理
```

#### 3. Schema验证失败

```bash
# 检查语法错误
npx prisma validate

# 格式化schema文件
npx prisma format
```

### 紧急回滚

#### 开发环境

```bash
# 回滚到上一个迁移
git revert HEAD
npx prisma migrate reset --force
```

#### 生产环境

```bash
# 1. 停止应用服务
# 2. 从数据库备份恢复
# 3. 回滚代码到稳定版本
# 4. 重新部署
```

## 📈 最佳实践

### 迁移命名规范

```bash
# 好的命名
npx prisma migrate dev --name add_product_images_table
npx prisma migrate dev --name update_user_email_unique_constraint
npx prisma migrate dev --name remove_deprecated_status_field

# 避免的命名
npx prisma migrate dev --name update
npx prisma migrate dev --name fix
npx prisma migrate dev --name temp
```

### 数据迁移策略

```sql
-- 安全的字段添加
ALTER TABLE products ADD COLUMN new_field VARCHAR(255) NULL;

-- 安全的数据更新
UPDATE products SET new_field = 'default_value' WHERE new_field IS NULL;

-- 安全的约束添加
ALTER TABLE products MODIFY COLUMN new_field VARCHAR(255) NOT NULL;
```

### 测试验证

```bash
# 迁移后必须验证
1. npm run db:status      # 确认迁移状态
2. npm run db:validate    # 验证schema
3. npm run test:api       # 测试API功能
4. npm run admin:verify   # 验证管理员功能
```

## 🔄 团队协作

### 冲突解决

1. **迁移文件冲突**：

   - 协调团队，确定迁移顺序
   - 重新生成冲突的迁移文件

2. **Schema冲突**：
   - 使用git merge工具解决
   - 测试合并后的schema

### 发布流程

1. **功能开发**：在feature分支创建迁移
2. **代码审查**：检查迁移文件的安全性
3. **测试验证**：在测试环境验证迁移
4. **生产部署**：通过CI/CD自动应用迁移

---

**遵循这个标准流程，确保数据库迁移的安全性和可维护性！**
