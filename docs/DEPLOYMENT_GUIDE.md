# Easy ERP Web 部署方案

## 目录

- [部署架构](#部署架构)
- [环境准备](#环境准备)
- [GitHub Actions 自动化部署](#github-actions-自动化部署)
- [宝塔面板配置](#宝塔面板配置)
- [数据库和Redis配置](#数据库和redis配置)
- [环境变量管理](#环境变量管理)
- [部署流程](#部署流程)
- [日志查看](#日志查看)
- [故障排查](#故障排查)
- [监控和维护](#监控和维护)

## 部署架构

```
GitHub Repository
       ↓
GitHub Actions (CI/CD)
       ↓
ECS 服务器 (宝塔面板)
       ↓
├── Nginx (反向代理)
├── Node.js (应用服务)
├── MySQL (数据库)
├── Redis (缓存)
└── PM2 (进程管理)
```

## 环境准备

### 1. ECS 服务器要求

**最低配置：**

- CPU: 2核
- 内存: 4GB
- 存储: 40GB SSD
- 带宽: 5Mbps

**推荐配置：**

- CPU: 4核
- 内存: 8GB
- 存储: 100GB SSD
- 带宽: 10Mbps

### 2. 宝塔面板安装

```bash
# CentOS/RHEL
yum install -y wget && wget -O install.sh https://download.bt.cn/install/install_6.0.sh && sh install.sh

# Ubuntu/Debian
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh
```

### 3. 必要软件安装

在宝塔面板中安装以下软件：

- **Nginx**: 1.22+
- **MySQL**: 8.0+
- **Redis**: 7.0+
- **Node.js**: 18.x+
- **PM2**: 最新版本

## GitHub Actions 自动化部署

### 1. 创建 GitHub Actions 工作流

创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy to ECS

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build application
        run: pnpm build

      - name: Generate environment file
        run: |
          echo "DATABASE_URL=${{ secrets.DATABASE_URL }}" > .env.production
          echo "REDIS_URL=${{ secrets.REDIS_URL }}" >> .env.production
          echo "JWT_SECRET=${{ secrets.JWT_SECRET }}" >> .env.production
          echo "OSS_ACCESS_KEY_ID=${{ secrets.OSS_ACCESS_KEY_ID }}" >> .env.production
          echo "OSS_ACCESS_KEY_SECRET=${{ secrets.OSS_ACCESS_KEY_SECRET }}" >> .env.production
          echo "OSS_BUCKET=${{ secrets.OSS_BUCKET }}" >> .env.production
          echo "OSS_REGION=${{ secrets.OSS_REGION }}" >> .env.production
          echo "OSS_ENDPOINT=${{ secrets.OSS_ENDPOINT }}" >> .env.production
          echo "NODE_ENV=production" >> .env.production
          echo "PORT=3000" >> .env.production

      - name: Deploy to ECS
        uses: appleboy/ssh-action@v0.1.7
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          port: ${{ secrets.PORT }}
          script: |
            # 进入项目目录
            cd /www/wwwroot/easy-erp-web

            # 停止应用
            pm2 stop easy-erp-web || true

            # 拉取最新代码
            git pull origin main

            # 安装依赖
            pnpm install --frozen-lockfile

            # 构建应用
            pnpm build

            # 数据库迁移
            npx prisma generate
            npx prisma db push

            # 复制环境文件
            cp .env.production .env

            # 启动应用
            pm2 start ecosystem.config.js --env production

            # 重载nginx
            nginx -s reload
```

### 2. 创建 PM2 配置文件

创建 `ecosystem.config.js` 文件：

```javascript
module.exports = {
  apps: [
    {
      name: 'easy-erp-web',
      script: './node_modules/.bin/next',
      args: 'start',
      cwd: '/www/wwwroot/easy-erp-web',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/www/wwwroot/easy-erp-web/logs/err.log',
      out_file: '/www/wwwroot/easy-erp-web/logs/out.log',
      log_file: '/www/wwwroot/easy-erp-web/logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
    },
  ],
};
```

## 宝塔面板配置

### 1. 创建网站

1. 登录宝塔面板
2. 点击 "网站" → "添加站点"
3. 输入域名：`your-domain.com`
4. 选择PHP版本：不需要（Node.js项目）
5. 创建数据库：`easy_erp_web`

### 2. 配置 Nginx

在宝塔面板中，编辑网站的 Nginx 配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 日志文件
    access_log /www/wwwlogs/easy-erp-web.log;
    error_log /www/wwwlogs/easy-erp-web.error.log;

    # 反向代理到Node.js应用
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 30;
        proxy_send_timeout 30;
        proxy_read_timeout 30;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://127.0.0.1:3000;
    }

    # API 接口
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. SSL 证书配置

1. 在宝塔面板中点击 "SSL"
2. 选择 "Let's Encrypt" 或上传证书
3. 开启 "强制HTTPS"

## 数据库和Redis配置

### 1. MySQL 配置

在宝塔面板中：

1. 点击 "数据库" → "MySQL"
2. 创建数据库：`easy_erp_web`
3. 创建用户：`easy_erp_user`
4. 设置密码并授权

**连接参数：**

```env
DATABASE_URL="mysql://easy_erp_user:password@localhost:3306/easy_erp_web"
```

### 2. Redis 配置

在宝塔面板中：

1. 点击 "软件商店" → 安装 Redis
2. 启动 Redis 服务
3. 设置密码（可选）

**连接参数：**

```env
REDIS_URL="redis://localhost:6379"
# 或带密码
REDIS_URL="redis://:password@localhost:6379"
```

## 环境变量管理

### 1. GitHub Secrets 配置

在 GitHub 仓库设置中添加以下 Secrets：

```
# 服务器连接
HOST=your-server-ip
USERNAME=root
SSH_KEY=your-private-key
PORT=22

# 数据库连接
DATABASE_URL=mysql://easy_erp_user:password@localhost:3306/easy_erp_web

# Redis连接
REDIS_URL=redis://localhost:6379

# JWT密钥
JWT_SECRET=your-super-secret-key-with-256-bits

# 阿里云OSS配置
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_BUCKET=your-bucket-name
OSS_REGION=oss-cn-hangzhou
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
```

### 2. 服务器环境变量

在服务器上创建环境变量文件：

```bash
# 在项目根目录创建 .env 文件
cd /www/wwwroot/easy-erp-web
nano .env
```

内容：

```env
# 数据库配置
DATABASE_URL="mysql://easy_erp_user:password@localhost:3306/easy_erp_web"

# Redis配置
REDIS_URL="redis://localhost:6379"

# JWT配置
JWT_SECRET="your-super-secret-key-with-256-bits"

# 阿里云OSS配置
OSS_ACCESS_KEY_ID="your-access-key-id"
OSS_ACCESS_KEY_SECRET="your-access-key-secret"
OSS_BUCKET="your-bucket-name"
OSS_REGION="oss-cn-hangzhou"
OSS_ENDPOINT="oss-cn-hangzhou.aliyuncs.com"

# 应用配置
NODE_ENV=production
PORT=3000
```

## 部署流程

### 1. 初次部署

```bash
# 1. 克隆项目
cd /www/wwwroot
git clone https://github.com/your-username/easy-erp-web.git
cd easy-erp-web

# 2. 安装Node.js依赖
# 安装依赖（生产环境）
npm install --production

# 3. 配置环境变量
cp .env.example .env
nano .env  # 编辑环境变量

# 4. 数据库初始化
npx prisma generate
npx prisma db push
npx prisma db seed

# 5. 构建应用
npm run build

# 6. 启动应用
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 2. 自动化部署

每次推送代码到 `main` 分支时，GitHub Actions 会自动：

1. 构建项目
2. 生成环境变量文件
3. 连接到服务器
4. 更新代码
5. 重新构建
6. 重启应用

## 日志查看

### 1. 应用日志

```bash
# PM2 日志
pm2 logs easy-erp-web

# 实时日志
pm2 logs easy-erp-web --lines 100

# 错误日志
pm2 logs easy-erp-web --err

# 输出日志
pm2 logs easy-erp-web --out
```

### 2. Nginx 日志

```bash
# 访问日志
tail -f /www/wwwlogs/easy-erp-web.log

# 错误日志
tail -f /www/wwwlogs/easy-erp-web.error.log
```

### 3. 宝塔面板日志

在宝塔面板中：

1. 点击 "日志" → "系统日志"
2. 查看 "网站日志"
3. 查看 "数据库日志"

### 4. GitHub Actions 日志

在 GitHub 仓库中：

1. 点击 "Actions" 标签
2. 点击具体的工作流运行
3. 查看每个步骤的详细日志

## 故障排查

### 1. 应用无法启动

```bash
# 检查应用状态
pm2 status

# 查看错误日志
pm2 logs easy-erp-web --err

# 检查端口占用
netstat -tlnp | grep 3000

# 手动启动调试
cd /www/wwwroot/easy-erp-web
NODE_ENV=production pnpm start
```

### 2. 数据库连接失败

```bash
# 检查MySQL状态
systemctl status mysql

# 检查数据库连接
mysql -u easy_erp_user -p -h localhost easy_erp_web

# 测试连接
npx prisma db push
```

### 3. Prisma 相关问题

**🚨 重要：不需要全局安装 Prisma！**

```bash
# Prisma Client 未生成错误
# 错误：Cannot find module '.prisma/client'
npx prisma generate  # 或 pnpm db:generate

# 数据库结构不同步
# 错误：Prisma schema file changed
npx prisma db push   # 或 pnpm db:push

# 版本不匹配问题
rm -rf node_modules/.prisma
pnpm install
npx prisma generate

# 检查 Prisma 配置
cat prisma/schema.prisma
echo $DATABASE_URL
```

**参考文档：** [Prisma 最佳实践](./PRISMA_BEST_PRACTICES.md)

### 4. 部署失败

1. 检查 GitHub Actions 日志
2. 检查 SSH 连接
3. 检查服务器磁盘空间
4. 检查环境变量配置

### 5. 性能问题

```bash
# 检查资源使用
top
htop
pm2 monit

# 检查内存使用
free -h

# 检查磁盘使用
df -h
```

## 监控和维护

### 1. 应用监控

```bash
# PM2 监控
pm2 monit

# 查看应用状态
pm2 status

# 重启应用
pm2 restart easy-erp-web

# 重载应用（无停机）
pm2 reload easy-erp-web
```

### 2. 数据库维护

```bash
# 数据库备份
mysqldump -u root -p easy_erp_web > backup_$(date +%Y%m%d).sql

# 定期清理日志
mysql -u root -p -e "DELETE FROM logs WHERE createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY);"
```

### 3. 日志清理

```bash
# 清理PM2日志
pm2 flush

# 清理Nginx日志
echo > /www/wwwlogs/easy-erp-web.log
echo > /www/wwwlogs/easy-erp-web.error.log
```

### 4. 定期任务

创建 cron 任务：

```bash
# 编辑crontab
crontab -e

# 添加任务
# 每天凌晨2点备份数据库
0 2 * * * mysqldump -u root -p easy_erp_web > /backup/easy_erp_web_$(date +\%Y\%m\%d).sql

# 每周清理旧日志
0 0 * * 0 find /www/wwwlogs -name "*.log" -mtime +7 -exec rm {} \;

# 每月清理旧备份
0 0 1 * * find /backup -name "*.sql" -mtime +30 -exec rm {} \;
```

## 安全建议

1. **定期更新系统和软件**
2. **配置防火墙规则**
3. **使用强密码**
4. **定期备份数据**
5. **监控系统日志**
6. **限制SSH访问**
7. **使用HTTPS**
8. **定期检查依赖漏洞**

## 性能优化

1. **启用Gzip压缩**
2. **配置CDN**
3. **优化数据库查询**
4. **使用Redis缓存**
5. **图片压缩**
6. **代码分割**

---

## 快速参考

### 常用命令

```bash
# 应用管理
pm2 start ecosystem.config.js --env production
pm2 restart easy-erp-web
pm2 stop easy-erp-web
pm2 logs easy-erp-web

# 数据库管理
npx prisma generate
npx prisma db push
npx prisma studio

# 依赖管理
npm install
npm run build
npm start
```

### 重要文件路径

- 项目目录：`/www/wwwroot/easy-erp-web`
- 环境变量：`/www/wwwroot/easy-erp-web/.env`
- Nginx配置：`/www/server/nginx/conf/vhost/your-domain.com.conf`
- 应用日志：`/www/wwwroot/easy-erp-web/logs/`
- Nginx日志：`/www/wwwlogs/`

### 重要端口

- 应用端口：3000
- HTTP端口：80
- HTTPS端口：443
- MySQL端口：3306
- Redis端口：6379

---

**最后更新时间**：2024年12月24日  
**文档版本**：1.0.0  
**适用环境**：生产环境
