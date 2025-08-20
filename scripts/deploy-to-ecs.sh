#!/bin/bash
set -e

echo "🚀 开始ECS安全部署流程..."
echo "📅 部署时间: $(date)"

# 定义变量
PROJECT_DIR="/www/wwwroot/easy-erp-web"

# 1. 停止当前应用
echo "⏹️  停止当前应用..."
pm2 stop easy-erp-web || true
pm2 delete easy-erp-web || true

# 创建和进入项目目录
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR" || exit 1

# 2. 拉取最新代码
echo "📥 拉取最新代码..."
if [ ! -d ".git" ]; then
  echo "🔗 初始化Git仓库..."
  git clone git@github.com:rn1024/easy-erp-web.git .
else
  echo "🔄 更新现有仓库..."

  # 确保使用SSH远程URL
  current_url=$(git remote get-url origin)
  if [[ "$current_url" == https://github.com/* ]]; then
    echo "🔧 更改远程URL为SSH方式..."
    git remote set-url origin git@github.com:rn1024/easy-erp-web.git
    echo "✅ 远程URL已更新为SSH"
  fi

  git fetch origin
  git reset --hard origin/main

  # 处理.user.ini文件权限问题
  if [ -f ".user.ini" ]; then
    echo "🔧 处理.user.ini文件权限..."
    chattr -i .user.ini 2>/dev/null || true
    echo "✅ .user.ini权限已处理"
  fi

  git clean -fd
fi

echo "✅ 当前代码版本: $(git log --oneline -1)"

# 3. 设置npm源
echo "🔧 配置npm源..."
npm config set registry https://registry.npmmirror.com
echo "✅ npm源配置完成"

# 4. 清理旧依赖
echo "🧹 清理旧依赖..."
rm -rf node_modules package-lock.json pnpm-lock.yaml
echo "✅ 旧依赖清理完成"

# 5. 配置生产环境变量
echo "⚙️  配置生产环境变量..."
if [ ! -f ".env" ]; then
  echo "❌ .env文件不存在，请先配置环境变量"
  exit 1
fi

# 检查关键环境变量
if ! grep -q "DATABASE_URL=" .env || [ -z "$(grep "DATABASE_URL=" .env | cut -d'=' -f2)" ]; then
  echo "❌ DATABASE_URL未配置或为空"
  exit 1
fi

echo "✅ 环境变量配置完成"

# 6. 安装项目依赖
echo "📦 安装项目依赖..."
if npm install; then
  echo "✅ 依赖安装完成"
else
  echo "❌ 依赖安装失败"
  exit 1
fi

# 7. 生成Prisma客户端
echo "🔧 生成Prisma客户端..."
if npx prisma generate; then
  echo "✅ Prisma客户端生成完成"
else
  echo "❌ Prisma客户端生成失败"
  exit 1
fi

# 8. 数据库连接测试
echo "🔍 测试数据库连接..."
if node -e "const { PrismaClient } = require('./generated/prisma'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ 数据库连接成功'); process.exit(0); }).catch(err => { console.log('❌ 数据库连接失败:', err.message); process.exit(1); }).finally(() => prisma.\$disconnect());"; then
  echo "✅ 数据库连接验证通过"
else
  echo "❌ 数据库连接失败，请检查DATABASE_URL配置"
  exit 1
fi

# 9. 数据库备份和迁移
echo "💾 创建部署前数据库备份..."
if bash scripts/db-backup.sh; then
  echo "✅ 数据库备份完成"
else
  echo "⚠️  数据库备份失败，但继续部署"
fi

echo "🔄 开始数据库迁移..."

# 检查迁移状态
echo "📊 检查数据库迁移状态..."
if npx prisma migrate status; then
  echo "✅ 迁移状态检查完成"
else
  echo "⚠️  迁移状态检查失败，但继续执行迁移"
fi

# 执行数据库迁移
echo "📁 执行数据库迁移..."
if npx prisma migrate deploy; then
  echo "✅ 数据库迁移完成"
else
  echo "❌ 数据库迁移失败"
  echo "📋 迁移失败详情:"
  npx prisma migrate status || true
  exit 1
fi

# 验证数据库结构
echo "🔍 验证数据库结构..."
if npx prisma validate; then
  echo "✅ 数据库结构验证通过"
else
  echo "⚠️  数据库结构验证失败，但继续部署"
fi

# 10. 检查并初始化种子数据
echo "🌱 检查种子数据..."
if node -e "const { PrismaClient } = require('./generated/prisma'); const prisma = new PrismaClient(); prisma.role.count().then(count => { if(count === 0) { console.log('需要初始化种子数据'); process.exit(1); } else { console.log('✅ 基础数据已存在'); process.exit(0); } }).catch(() => { console.log('需要初始化种子数据'); process.exit(1); }).finally(() => prisma.\$disconnect());"; then
  echo "✅ 数据库已有基础数据"
else
  echo "🌱 初始化种子数据..."
  if npm run db:seed:production; then
    echo "✅ 种子数据初始化完成"
  else
    echo "❌ 种子数据初始化失败"
    exit 1
  fi
fi

# 11. 创建upload目录结构
echo "📁 创建upload目录结构..."
mkdir -p upload/{images,videos,documents,avatars,accessories,labels,shipments}
echo "✅ upload目录结构创建完成"

# 12. 构建应用
echo "🔨 开始构建应用..."
if npm run build:standalone; then
  echo "✅ 应用构建完成"
else
  echo "❌ 应用构建失败"
  exit 1
fi

# 13. 验证构建产物
echo "🔍 验证构建产物..."
if [ ! -d ".next" ]; then
  echo "❌ .next目录不存在，构建失败"
  exit 1
fi

if [ ! -f ".next/BUILD_ID" ]; then
  echo "❌ BUILD_ID文件不存在，构建失败"
  exit 1
fi

if [ ! -f ".next/standalone/server.js" ]; then
  echo "❌ standalone server.js不存在，构建失败"
  exit 1
fi

echo "✅ 构建产物验证通过"

# 14. 启动应用
echo "🚀 启动应用..."
if pm2 start ecosystem.config.js --env production; then
  echo "✅ 应用启动成功"
else
  echo "❌ 应用启动失败"
  exit 1
fi

# 15. 健康检查
echo "🏥 执行健康检查..."
sleep 5

if pm2 list | grep -q "easy-erp-web.*online"; then
  echo "✅ 应用运行状态正常"
else
  echo "❌ 应用运行状态异常"
  pm2 logs easy-erp-web --lines 20
  exit 1
fi

# 16. 最终验证
echo "🔍 最终验证..."
if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
  echo "✅ 健康检查接口响应正常"
else
  echo "⚠️  健康检查接口无响应，但应用已启动"
fi

echo "🎉 部署完成！"
echo "📊 部署摘要:"
echo "  - 代码版本: $(git log --oneline -1)"
echo "  - 构建时间: $(date)"
echo "  - 应用状态: $(pm2 list | grep easy-erp-web | awk '{print $10}')"
echo "  - 进程ID: $(pm2 list | grep easy-erp-web | awk '{print $2}')"

echo "✅ ECS部署流程完成"