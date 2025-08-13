# 服务器DATABASE_URL解析失败问题修复指南

## 问题描述

在服务器 `121.41.237.2` 上部署 Easy ERP 项目时，遇到以下错误：

```
❌ 无法解析DATABASE_URL
❌ 表创建失败: 从Prisma Schema中提取表名...
❌ 部分表创建失败
```

## 问题根因分析

### 1. 环境变量缺失
- 服务器上未正确设置 `DATABASE_URL` 环境变量
- `deploy-to-ecs.sh` 脚本依赖预设的环境变量 `${DATABASE_URL}`
- 当环境变量为空时，生成的 `.env` 文件中 `DATABASE_URL=` 为空值

### 2. 数据库连接问题
- MySQL 服务可能未启动
- 数据库用户权限不足
- 数据库不存在或连接参数错误

### 3. 脚本执行环境
- `deploy-to-ecs.sh` 设计用于已配置环境变量的服务器
- 缺少环境变量检查和设置机制

## 解决方案

### 方案一：使用自动修复脚本（推荐）

我们创建了专门的修复脚本 `scripts/fix-server-database-url.sh`，该脚本会：

1. **检查MySQL服务状态**
   - 验证MySQL是否运行
   - 自动启动MySQL服务（如需要）
   - 检查端口监听状态

2. **交互式配置数据库连接**
   - 引导输入数据库用户名、密码、主机、端口
   - 自动构建正确的 `DATABASE_URL`
   - 测试数据库连接有效性

3. **设置系统环境变量**
   - 更新 `/etc/environment` 文件
   - 生成 JWT_SECRET 和其他必要变量
   - 备份现有配置

4. **创建项目环境文件**
   - 在项目目录生成 `.env` 文件
   - 设置正确的文件权限
   - 包含所有必要的生产环境配置

#### 使用步骤：

```bash
# 1. 登录服务器
ssh root@121.41.237.2

# 2. 进入项目目录
cd /www/wwwroot/easy-erp-web

# 3. 运行修复脚本
sudo ./scripts/fix-server-database-url.sh

# 4. 按提示输入数据库配置信息
# 建议配置：
# - 用户名: easy_erp_user 或 root
# - 密码: [您的MySQL密码]
# - 主机: localhost
# - 端口: 3306
# - 数据库: easy_erp_db

# 5. 重新加载环境变量
source /etc/environment

# 6. 重新执行部署
./scripts/deploy-to-ecs.sh
```

### 方案二：手动配置

如果自动脚本无法使用，可以手动配置：

#### 1. 检查MySQL服务
```bash
# 检查MySQL状态
systemctl status mysql

# 启动MySQL（如需要）
systemctl start mysql

# 检查端口监听
netstat -tlnp | grep :3306
```

#### 2. 测试数据库连接
```bash
# 测试连接
mysql -u root -p -e "SELECT 1;"

# 创建数据库（如不存在）
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS easy_erp_db;"

# 创建用户（如需要）
mysql -u root -p -e "CREATE USER 'easy_erp_user'@'localhost' IDENTIFIED BY 'your_password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON easy_erp_db.* TO 'easy_erp_user'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

#### 3. 设置环境变量
```bash
# 编辑系统环境变量
vim /etc/environment

# 添加以下内容：
DATABASE_URL=mysql://easy_erp_user:your_password@localhost:3306/easy_erp_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
PORT=3008
```

#### 4. 创建项目.env文件
```bash
# 进入项目目录
cd /www/wwwroot/easy-erp-web

# 创建.env文件
cat > .env << EOF
DATABASE_URL=mysql://easy_erp_user:your_password@localhost:3306/easy_erp_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here
OSS_ACCESS_KEY_ID=your_oss_access_key_id
OSS_ACCESS_KEY_SECRET=your_oss_access_key_secret
OSS_BUCKET=easy-erp-web
OSS_REGION=cn-hangzhou
OSS_ENDPOINT=easy-erp-web.oss-cn-hangzhou.aliyuncs.com
NEXT_PUBLIC_APP_URL=https://erp.samuelcn.com
OSS_PATH_PREFIX=template
NODE_ENV=production
PORT=3008
EOF

# 设置文件权限
chmod 600 .env
```

## 验证修复结果

### 1. 检查环境变量
```bash
echo $DATABASE_URL
echo $REDIS_URL
echo $JWT_SECRET
```

### 2. 测试数据库连接
```bash
# 使用Node.js测试
node -e "const { PrismaClient } = require('./generated/prisma'); const prisma = new PrismaClient(); prisma.\$queryRaw\`SELECT 1\`.then(() => console.log('✅ 数据库连接成功')).catch(err => console.error('❌ 连接失败:', err.message)).finally(() => prisma.\$disconnect());"
```

### 3. 运行Prisma迁移
```bash
npx prisma migrate deploy
```

### 4. 重新部署
```bash
./scripts/deploy-to-ecs.sh
```

## 预防措施

### 1. 环境变量检查
在 `deploy-to-ecs.sh` 脚本中添加环境变量检查：

```bash
# 检查必要的环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL 环境变量未设置"
    echo "请先运行: ./scripts/fix-server-database-url.sh"
    exit 1
fi
```

### 2. 配置模板
创建 `.env.production.template` 文件作为配置模板：

```bash
# 生产环境配置模板
DATABASE_URL=mysql://username:password@host:port/database
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here
# ... 其他配置
```

### 3. 部署前检查清单
- [ ] MySQL服务运行正常
- [ ] 数据库和用户已创建
- [ ] 环境变量已设置
- [ ] .env文件已创建
- [ ] 网络连接正常
- [ ] 磁盘空间充足

## 常见问题排查

### Q1: MySQL连接被拒绝
**原因**: MySQL服务未启动或配置错误
**解决**: 
```bash
systemctl start mysql
systemctl enable mysql
```

### Q2: 用户权限不足
**原因**: 数据库用户没有足够权限
**解决**:
```bash
mysql -u root -p -e "GRANT ALL PRIVILEGES ON easy_erp_db.* TO 'easy_erp_user'@'localhost';"
```

### Q3: 数据库不存在
**原因**: 目标数据库未创建
**解决**:
```bash
mysql -u root -p -e "CREATE DATABASE easy_erp_db;"
```

### Q4: 环境变量不生效
**原因**: 环境变量未正确加载
**解决**:
```bash
source /etc/environment
# 或重新登录SSH会话
```

## 相关文件

- `scripts/fix-server-database-url.sh` - 自动修复脚本
- `scripts/deploy-to-ecs.sh` - 部署脚本
- `scripts/generate-env.sh` - 环境变量生成脚本
- `docs/deployment-issue-fix.md` - 部署问题修复文档

## 联系支持

如果问题仍然存在，请提供以下信息：
- 错误日志完整内容
- MySQL错误日志 (`/var/log/mysql/error.log`)
- 系统环境信息 (`uname -a`, `cat /etc/os-release`)
- 网络连接状态 (`netstat -tlnp | grep 3306`)

---

**最后更新**: 2024年1月13日  
**版本**: 1.0  
**适用于**: Easy ERP Web v1.0+