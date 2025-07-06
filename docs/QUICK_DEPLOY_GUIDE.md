# Easy ERP Web 快速部署指南

## 🚀 快速开始

### 1. 准备工作

#### 服务器要求

- **系统**: CentOS 7+ / Ubuntu 18.04+
- **配置**: 最低 2核4GB，推荐 4核8GB
- **宝塔面板**: 已安装并配置

#### 必要软件（在宝塔面板中安装）

- [x] **MySQL 8.0+**
- [x] **Redis 7.0+**
- [x] **Node.js 18.x**
- [x] **Nginx 1.20+**
- [x] **PM2 管理器**

### 2. 数据库准备

在宝塔面板中创建数据库：

1. **创建数据库**

   - 数据库名: `easy_erp_web`
   - 用户名: `easy_erp_user`
   - 密码: `your_strong_password`

2. **启动服务**

   ```bash
   # 启动 MySQL
   systemctl start mysqld

   # 启动 Redis
   systemctl start redis
   ```

### 3. GitHub 配置

#### 3.1 Fork 项目

1. 前往 [GitHub 仓库](https://github.com/your-username/easy-erp-web)
2. 点击 "Fork" 按钮
3. 克隆到您的账户

#### 3.2 配置 GitHub Secrets

在您的 GitHub 仓库设置中添加以下 Secrets：

| Secret 名称             | 值                                                                | 说明                 |
| ----------------------- | ----------------------------------------------------------------- | -------------------- |
| `HOST`                  | `your-server-ip`                                                  | 服务器IP地址         |
| `USERNAME`              | `root`                                                            | SSH用户名            |
| `SSH_KEY`               | `your-private-key`                                                | SSH私钥              |
| `PORT`                  | `22`                                                              | SSH端口              |
| `DATABASE_URL`          | `mysql://easy_erp_user:your_password@localhost:3306/easy_erp_web` | 数据库连接字符串     |
| `REDIS_URL`             | `redis://localhost:6379`                                          | Redis连接字符串      |
| `JWT_SECRET`            | `your-super-secret-key`                                           | JWT密钥（至少32位）  |
| `OSS_ACCESS_KEY_ID`     | `your-access-key-id`                                              | 阿里云OSS Access Key |
| `OSS_ACCESS_KEY_SECRET` | `your-access-key-secret`                                          | 阿里云OSS Secret Key |
| `OSS_BUCKET`            | `your-bucket-name`                                                | OSS存储桶名称        |
| `OSS_REGION`            | `oss-cn-hangzhou`                                                 | OSS区域              |
| `OSS_ENDPOINT`          | `oss-cn-hangzhou.aliyuncs.com`                                    | OSS终端点            |

### 4. 手动部署（首次）

如果您希望手动部署，请按以下步骤操作：

#### 4.1 服务器准备

```bash
# 1. 连接到服务器
ssh root@your-server-ip

# 2. 运行部署脚本
wget -O deploy.sh https://raw.githubusercontent.com/your-username/easy-erp-web/main/scripts/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

#### 4.2 环境变量配置

```bash
# 编辑环境变量文件
nano /www/wwwroot/easy-erp-web/.env

# 内容示例：
DATABASE_URL="mysql://easy_erp_user:your_password@localhost:3306/easy_erp_web"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-key-with-256-bits"
OSS_ACCESS_KEY_ID="your-access-key-id"
OSS_ACCESS_KEY_SECRET="your-access-key-secret"
OSS_BUCKET="your-bucket-name"
OSS_REGION="oss-cn-hangzhou"
OSS_ENDPOINT="oss-cn-hangzhou.aliyuncs.com"
NODE_ENV=production
PORT=3000
```

#### 4.3 宝塔面板配置

1. **添加网站**

   - 域名: `your-domain.com`
   - 根目录: `/www/wwwroot/easy-erp-web`
   - 不选择PHP版本

2. **配置 Nginx**
   在网站设置中，点击 "配置文件"，添加以下内容：

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **配置 SSL**
   - 点击 "SSL" → "Let's Encrypt"
   - 申请免费证书
   - 开启 "强制HTTPS"

### 5. 自动化部署

配置完成后，每次推送代码到 `main` 分支时会自动部署。

#### 5.1 推送代码触发部署

```bash
git add .
git commit -m "feat: 部署到生产环境"
git push origin main
```

#### 5.2 查看部署状态

1. 访问 GitHub 仓库
2. 点击 "Actions" 标签
3. 查看最新的工作流运行状态

### 6. 验证部署

#### 6.1 检查服务状态

```bash
# 检查 PM2 状态
pm2 status

# 检查应用日志
pm2 logs easy-erp-web

# 检查端口监听
netstat -tlnp | grep 3000
```

#### 6.2 访问应用

1. 打开浏览器访问 `https://your-domain.com`
2. 使用默认管理员账户登录:
   - 用户名: `admin`
   - 密码: `admin123`

## 📋 重要文件和路径

### 项目文件

- **项目目录**: `/www/wwwroot/easy-erp-web`
- **环境配置**: `/www/wwwroot/easy-erp-web/.env`
- **PM2配置**: `/www/wwwroot/easy-erp-web/ecosystem.config.js`
- **应用日志**: `/www/wwwroot/easy-erp-web/logs/`

### 系统文件

- **Nginx配置**: `/www/server/nginx/conf/vhost/your-domain.com.conf`
- **Nginx日志**: `/www/wwwlogs/`
- **MySQL数据**: `/www/server/data/`
- **Redis配置**: `/www/server/redis/redis.conf`

### 常用命令

```bash
# 重启应用
pm2 restart easy-erp-web

# 查看日志
pm2 logs easy-erp-web

# 更新代码
cd /www/wwwroot/easy-erp-web
git pull origin main
npm install --production
npm run build
pm2 reload easy-erp-web

# 数据库操作
npx prisma studio  # 数据库可视化管理
npx prisma db push # 同步数据库结构
```

## 🔧 故障排查

### 常见问题

#### 1. 应用无法启动

```bash
# 检查错误日志
pm2 logs easy-erp-web --err

# 检查端口占用
netstat -tlnp | grep 3000

# 手动启动测试
cd /www/wwwroot/easy-erp-web
NODE_ENV=production pnpm start
```

#### 2. 数据库连接失败

```bash
# 检查 MySQL 服务
systemctl status mysqld

# 测试数据库连接
mysql -u easy_erp_user -p -h localhost easy_erp_web

# 检查环境变量
cat /www/wwwroot/easy-erp-web/.env | grep DATABASE_URL
```

#### 3. 页面无法访问

```bash
# 检查 Nginx 配置
nginx -t

# 重启 Nginx
systemctl restart nginx

# 检查防火墙
firewall-cmd --list-ports
```

### 日志查看

#### 应用日志

```bash
# 实时查看应用日志
pm2 logs easy-erp-web --lines 100

# 查看错误日志
pm2 logs easy-erp-web --err

# 查看特定时间段的日志
pm2 logs easy-erp-web --timestamp
```

#### 系统日志

```bash
# Nginx 访问日志
tail -f /www/wwwlogs/your-domain.com.log

# Nginx 错误日志
tail -f /www/wwwlogs/your-domain.com.error.log

# 系统日志
journalctl -u nginx -f
journalctl -u mysqld -f
```

## 🚨 安全建议

1. **定期更新密码**
2. **配置防火墙规则**
3. **定期备份数据库**
4. **监控系统资源**
5. **定期更新依赖**

## 📞 获取帮助

如果在部署过程中遇到问题：

1. 查看 [完整部署文档](./DEPLOYMENT_GUIDE.md)
2. 检查 [GitHub Actions 日志](https://github.com/your-username/easy-erp-web/actions)
3. 查看项目 [Issues](https://github.com/your-username/easy-erp-web/issues)

---

**部署完成后，请及时修改默认密码并配置系统设置！**
