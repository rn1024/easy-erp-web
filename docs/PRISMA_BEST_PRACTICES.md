# Prisma 生产环境最佳实践

## 🤔 常见问题：是否需要全局安装 Prisma？

**简答：不需要，不推荐全局安装 Prisma。**

## ✅ 推荐方案：使用项目本地 Prisma

### 为什么不推荐全局安装？

| 问题           | 说明                                 |
| -------------- | ------------------------------------ |
| **版本冲突**   | 全局版本可能与项目要求的版本不匹配   |
| **环境不一致** | 开发、测试、生产环境可能使用不同版本 |
| **权限问题**   | 全局安装需要管理员权限               |
| **项目隔离**   | 多个项目可能需要不同的 Prisma 版本   |

### ✅ 推荐的最佳实践

#### 1. 使用项目本地 Prisma（当前配置）

```json
// package.json
{
  "dependencies": {
    "@prisma/client": "^6.10.1",
    "prisma": "^6.10.1"
  },
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset --force"
  }
}
```

#### 2. 在部署脚本中使用的正确方式

**方式一：使用 npx（推荐）**

```bash
# 使用项目本地的 Prisma
npx prisma generate
npx prisma db push
```

**方式二：使用 pnpm scripts（最推荐）**

```bash
# 使用预定义的脚本
pnpm db:generate
pnpm db:push
```

## 🚀 在我们的部署方案中

### GitHub Actions 工作流

```yaml
# .github/workflows/deploy.yml
- name: Deploy to ECS
  script: |
    # 数据库迁移
    pnpm db:generate
    pnpm db:push
```

### 部署脚本

```bash
# scripts/deploy.sh
init_database() {
    cd "$PROJECT_DIR"

    # 使用项目本地的 Prisma（推荐）
    npx prisma generate
    npx prisma db push

    # 或者使用 pnpm scripts（更推荐）
    # pnpm db:generate
    # pnpm db:push
}
```

### PM2 配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      post_update: [
        'pnpm install --frozen-lockfile',
        'pnpm build',
        'npx prisma generate', // 使用项目本地版本
        'npx prisma db push',
      ],
    },
  ],
};
```

## 🔧 Prisma 命令对比

| 场景           | 全局安装                | 项目本地（推荐）                            |
| -------------- | ----------------------- | ------------------------------------------- |
| **开发环境**   | `prisma generate`       | `npx prisma generate` 或 `pnpm db:generate` |
| **生产部署**   | `prisma db push`        | `npx prisma db push` 或 `pnpm db:push`      |
| **数据库迁移** | `prisma migrate deploy` | `npx prisma migrate deploy`                 |
| **数据库重置** | `prisma db reset`       | `npx prisma db reset` 或 `pnpm db:reset`    |

## 🛡️ 生产环境注意事项

### 1. 版本锁定

```json
// package.json - 使用精确版本
{
  "dependencies": {
    "@prisma/client": "6.10.1", // 不使用 ^
    "prisma": "6.10.1" // 锁定版本
  }
}
```

### 2. 环境变量安全

```bash
# .env
DATABASE_URL="mysql://user:password@localhost:3306/db"

# 不要在代码中硬编码数据库连接
```

### 3. 数据库迁移策略

```bash
# 生产环境使用 migrate deploy 而不是 db push
npx prisma migrate deploy

# db push 仅用于开发和原型环境
npx prisma db push  # 仅在开发环境使用
```

### 4. 生成 Prisma Client

```bash
# 在构建过程中生成
npm run build  # 包含 prisma generate

# 或者明确生成
npx prisma generate
```

## 🏗️ 在宝塔面板环境中的配置

### 1. Node.js 版本确认

```bash
# 确保 Node.js 版本支持项目的 Prisma 版本
node --version  # 应该是 18+
```

### 2. 项目部署流程

```bash
# 1. 进入项目目录
cd /www/wwwroot/easy-erp-web

# 2. 安装依赖（包含 Prisma）
pnpm install --frozen-lockfile

# 3. 生成 Prisma Client
pnpm db:generate

# 4. 同步数据库结构
pnpm db:push

# 5. 构建应用
pnpm build

# 6. 启动应用
pm2 start ecosystem.config.js --env production
```

## 🚨 常见错误及解决方案

### 1. Prisma Client 未生成

```bash
# 错误：Cannot find module '.prisma/client'
# 解决：
npx prisma generate
```

### 2. 数据库连接失败

```bash
# 错误：Can't reach database server
# 检查：
echo $DATABASE_URL
mysql -u username -p -h localhost dbname
```

### 3. 版本不匹配

```bash
# 错误：Prisma schema file changed
# 解决：
rm -rf node_modules/.prisma
pnpm install
npx prisma generate
```

### 4. 权限问题

```bash
# 错误：Permission denied
# 解决：确保应用有读写数据库的权限
GRANT ALL PRIVILEGES ON dbname.* TO 'username'@'localhost';
```

## 📊 性能优化建议

### 1. 连接池配置

```javascript
// lib/db.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

### 2. 查询优化

```javascript
// 使用 include 而不是多次查询
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: { posts: true },
});
```

### 3. 事务使用

```javascript
// 使用事务确保数据一致性
await prisma.$transaction([
  prisma.user.create({ data: userData }),
  prisma.profile.create({ data: profileData }),
]);
```

## 📝 总结

1. **✅ 使用项目本地 Prisma** - 版本一致、环境隔离
2. **✅ 通过 npx 或 pnpm scripts 运行** - 确保使用正确版本
3. **✅ 在部署脚本中明确调用** - 自动化流程
4. **❌ 避免全局安装** - 防止版本冲突
5. **🔒 生产环境使用 migrate deploy** - 更安全的数据库变更

---

**您当前的配置是正确的，无需额外安装全局 Prisma！**
