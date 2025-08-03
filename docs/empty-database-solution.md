# 空数据库初始化解决方案

## 问题描述

在线上部署时，如果数据库是完全空的（没有任何表），使用原有的 `sync-and-migrate.js` 脚本会出现问题：

1. 脚本假设数据库已有基本结构，只是缺少迁移记录
2. 对于空数据库，应该直接使用 `prisma migrate deploy` 创建所有表结构
3. 执行 seed 脚本时会因为表不存在而失败

## 错误示例

```
❌ 数据库初始化失败: PrismaClientKnownRequestError: 
Invalid `prisma.permission.upsert()` invocation: 
The table `permissions` does not exist in the current database.
```

## 解决方案

### 1. 新增空数据库初始化脚本

创建了 `scripts/init-empty-database.js` 脚本，专门处理空数据库的初始化：

**功能特点：**
- 自动检测数据库是否为空
- 空数据库：直接使用 `prisma migrate deploy` 创建表结构
- 非空数据库：调用现有的 `sync-and-migrate.js` 脚本
- 验证关键表是否正确创建
- 验证迁移状态

### 2. 更新部署流程

修改了 `.github/workflows/deploy.yml` 中的数据库初始化逻辑：

**原流程：**
```bash
# 复杂的条件判断和多种情况处理
if npm run db:sync-migrate 2>&1 | grep -q "No pending migrations"; then
  # 处理已有迁移记录的情况
else
  # 处理需要迁移的情况
fi
```

**新流程：**
```bash
# 统一使用新的初始化脚本
npm run db:init-empty
# 然后检查是否需要种子数据
```

## 使用方法

### 本地测试

```bash
# 使用新的空数据库初始化脚本
npm run db:init-empty

# 如果需要种子数据
npm run db:seed
```

### 线上部署

部署脚本会自动使用新的初始化流程，无需手动干预。

### 手动执行（如果需要）

```bash
# 进入项目目录
cd /www/wwwroot/easy-erp-web

# 执行数据库初始化
node scripts/init-empty-database.js

# 执行种子数据（如果需要）
npx tsx prisma/seed.ts
```

## 脚本逻辑说明

### init-empty-database.js 执行流程

1. **测试数据库连接**
   - 确保数据库可访问

2. **检查数据库状态**
   - 查询 `information_schema.tables` 统计表数量
   - 如果表数量为 0，判定为空数据库

3. **空数据库处理**
   - 生成 Prisma 客户端
   - 执行 `prisma migrate deploy` 创建所有表结构
   - 验证关键表创建成功

4. **非空数据库处理**
   - 调用现有的 `sync-and-migrate.js` 脚本
   - 处理迁移记录同步等复杂情况

5. **验证和确认**
   - 检查关键表是否存在
   - 验证迁移状态

## 关键表验证

脚本会验证以下关键表是否正确创建：
- `accounts` - 账户表
- `roles` - 角色表
- `permissions` - 权限表
- `shops` - 店铺表
- `suppliers` - 供应商表

## 错误处理

- **数据库连接失败**：立即退出并报告错误
- **表创建失败**：验证关键表时会详细报告哪个表创建失败
- **迁移状态异常**：会显示详细的状态信息

## 与原有脚本的兼容性

- `sync-and-migrate.js` 保持不变，仍可用于已有数据库的迁移
- `production-deploy.js` 仍可作为备选方案
- 新脚本会在检测到非空数据库时自动调用原有脚本

## 优势

1. **自动化程度高**：无需手动判断数据库状态
2. **错误处理完善**：详细的验证和错误报告
3. **向后兼容**：不影响现有的部署流程
4. **适用性广**：同时支持空数据库和已有数据库
5. **安全性好**：多重验证确保数据库状态正确

## 注意事项

1. 确保 `DATABASE_URL` 环境变量正确配置
2. 确保数据库用户有创建表的权限
3. 如果是 MySQL，确保字符集为 `utf8mb4`
4. 建议在执行前备份重要数据（虽然脚本只创建表结构）

## 故障排除

### 如果脚本执行失败

1. **检查数据库连接**
   ```bash
   # 测试数据库连接
   npx prisma db pull
   ```

2. **检查迁移文件**
   ```bash
   # 查看迁移状态
   npx prisma migrate status
   ```

3. **手动创建表结构**
   ```bash
   # 如果自动化失败，可以手动执行
   npx prisma migrate deploy
   ```

4. **查看详细日志**
   ```bash
   # 执行脚本时会显示详细的执行步骤
   node scripts/init-empty-database.js
   ```