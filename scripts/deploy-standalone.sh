#!/bin/bash

echo "🚀 开始standalone模式部署..."

# 设置错误时退出
set -e

# 1. 构建应用
echo "📦 构建应用..."
pnpm build

# 2. 复制静态资源到standalone目录
echo "📁 复制静态资源..."
if [ -d ".next/static" ]; then
    cp -r .next/static .next/standalone/.next/
    echo "✅ 静态资源复制完成"
else
    echo "❌ 错误：.next/static 目录不存在"
    exit 1
fi

# 3. 复制public目录（如果需要）
if [ -d "public" ] && [ ! -d ".next/standalone/public" ]; then
    echo "📁 复制public目录..."
    cp -r public .next/standalone/
    echo "✅ public目录复制完成"
fi

# 4. 验证关键文件存在
echo "🔍 验证构建产物..."
if [ -f ".next/standalone/server.js" ]; then
    echo "✅ server.js 存在"
else
    echo "❌ 错误：server.js 不存在"
    exit 1
fi

if [ -d ".next/standalone/.next/static" ]; then
    echo "✅ 静态资源目录存在"
else
    echo "❌ 错误：静态资源目录不存在"
    exit 1
fi

echo "🎉 standalone模式部署完成！"
echo "📝 可以使用以下命令启动："
echo "   node .next/standalone/server.js"
echo "   或使用PM2: pm2 start ecosystem.config.js"
