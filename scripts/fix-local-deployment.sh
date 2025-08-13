#!/bin/bash
set -e

echo "🔧 修复本地部署环境问题..."
echo "📅 修复时间: $(date)"

# 检查当前目录
if [ ! -f "package.json" ]; then
  echo "❌ 请在项目根目录执行此脚本"
  exit 1
fi

# 检查Docker服务
echo "🐳 检查Docker服务状态..."
if ! docker ps >/dev/null 2>&1; then
  echo "❌ Docker服务未运行，请先启动Docker"
  echo "💡 提示: 可以运行 'open -a Docker' 启动Docker"
  exit 1
fi

# 检查数据库容器
echo "🗄️  检查数据库容器状态..."
if ! docker ps | grep -q "easy-erp-mysql"; then
  echo "🚀 启动数据库服务..."
  docker-compose up -d mysql redis
  echo "⏳ 等待数据库启动..."
  sleep 10
else
  echo "✅ 数据库容器已运行"
fi

# 检查环境变量文件
echo "⚙️  检查环境配置..."
if [ ! -f ".env" ]; then
  echo "❌ .env文件不存在"
  if [ -f ".env.example" ]; then
    echo "📋 从.env.example创建.env文件..."
    cp .env.example .env
    echo "✅ .env文件已创建，请检查并修改配置"
  else
    echo "❌ .env.example文件也不存在，请手动创建.env文件"
    exit 1
  fi
fi

# 加载环境变量
echo "📥 加载环境变量..."
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
  echo "✅ 环境变量已加载"
fi

# 验证关键环境变量
echo "🔍 验证关键环境变量..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL未设置"
  echo "💡 请在.env文件中设置: DATABASE_URL=\"mysql://erp_user:erp_password@localhost:3306/easy_erp_db\""
  exit 1
fi

echo "✅ DATABASE_URL: $DATABASE_URL"

# 测试数据库连接
echo "🔗 测试数据库连接..."
if node scripts/check-db.js; then
  echo "✅ 数据库连接正常"
else
  echo "❌ 数据库连接失败"
  echo "💡 请检查:"
  echo "   1. Docker容器是否正常运行: docker ps"
  echo "   2. 数据库配置是否正确: .env文件中的DATABASE_URL"
  echo "   3. 数据库是否已初始化: npm run db:migrate"
  exit 1
fi

# 检查Prisma状态
echo "🔍 检查Prisma迁移状态..."
if npx prisma migrate status; then
  echo "✅ Prisma迁移状态正常"
else
  echo "⚠️  Prisma迁移可能需要处理"
  echo "💡 可以尝试运行: npm run db:migrate"
fi

echo "🎉 本地部署环境检查完成！"
echo "📝 如果仍有问题，请检查:"
echo "   1. .env文件配置是否正确"
echo "   2. Docker服务是否正常"
echo "   3. 数据库迁移是否完成"
echo "   4. 不要在本地运行deploy-to-ecs.sh脚本（该脚本仅用于服务器部署）"