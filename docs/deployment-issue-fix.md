# 部署问题修复说明

## 问题描述

用户遇到了数据库表创建失败的错误，错误信息显示：
```
❌ 表创建失败: 从Prisma Schema中提取表名...
❌ 无法解析DATABASE_URL
```

## 问题根本原因

**核心问题：用户在本地环境中错误地执行了 `deploy-to-ecs.sh` 脚本**

### 详细分析

1. **脚本用途混淆**：
   - `deploy-to-ecs.sh` 是专门为ECS服务器部署设计的脚本
   - 该脚本期望在服务器环境中运行，通过GitHub Actions传入环境变量
   - 脚本中的 `DATABASE_URL` 等环境变量是从GitHub Secrets中获取的

2. **环境变量缺失**：
   - 在本地环境中，`DATABASE_URL` 等环境变量没有被正确设置
   - 脚本尝试解析空的 `DATABASE_URL`，导致解析失败

3. **执行环境不匹配**：
   - 脚本中包含服务器特定的路径和操作（如 `/www/wwwroot/easy-erp-web`）
   - 本地环境无法满足这些服务器环境的要求

## 解决方案

### 1. 立即修复

已创建 `scripts/fix-local-deployment.sh` 脚本来诊断和修复本地环境问题：

```bash
# 运行修复脚本
./scripts/fix-local-deployment.sh
```

### 2. 正确的本地开发流程

**本地开发应该使用以下命令：**

```bash
# 1. 启动数据库服务
docker-compose up -d mysql redis

# 2. 安装依赖
npm install

# 3. 运行数据库迁移
npm run db:migrate

# 4. 启动开发服务器
npm run dev
```

### 3. 脚本使用指南

| 脚本名称 | 用途 | 执行环境 |
|---------|------|----------|
| `deploy-to-ecs.sh` | ECS服务器部署 | 仅限服务器环境（通过GitHub Actions） |
| `deploy.sh` | 通用部署脚本 | 本地或服务器 |
| `fix-local-deployment.sh` | 本地环境修复 | 本地开发环境 |
| `check-db.js` | 数据库连接检查 | 本地或服务器 |

## 预防措施

### 1. 脚本命名优化

建议在脚本文件中添加更明确的说明注释：

```bash
#!/bin/bash
# 警告：此脚本仅用于ECS服务器部署
# 本地开发请使用: npm run dev
# 本地部署请使用: ./scripts/deploy.sh
```

### 2. 环境检查

在关键脚本开头添加环境检查：

```bash
# 检查是否在正确的环境中运行
if [ "$NODE_ENV" != "production" ] && [ "$CI" != "true" ]; then
  echo "⚠️  警告：此脚本仅用于生产环境部署"
  echo "💡 本地开发请使用: npm run dev"
  read -p "确定要继续吗？(y/N): " confirm
  if [ "$confirm" != "y" ]; then
    exit 1
  fi
fi
```

### 3. 文档完善

在 `scripts/README.md` 中添加详细的脚本使用说明，避免用户误用。

## 总结

这次问题的核心是**脚本使用环境不匹配**，而不是代码本身的问题。通过：

1. ✅ 创建了诊断和修复脚本
2. ✅ 验证了本地环境的正常状态
3. ✅ 提供了正确的开发流程指导
4. ✅ 建立了预防措施

项目现在已经恢复正常，用户可以继续进行本地开发工作。

**重要提醒：`deploy-to-ecs.sh` 脚本仅用于服务器部署，本地开发请使用标准的 npm 命令。**