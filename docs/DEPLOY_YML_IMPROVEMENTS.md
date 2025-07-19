# GitHub Actions 部署流程改进建议

**基于问题排查记录**: [TROUBLESHOOTING_CACHE_ISSUE_20250719.md](./TROUBLESHOOTING_CACHE_ISSUE_20250719.md)

## 关键改进点

### 1. 构建命令改进
```yaml
# 当前 (第139行)
npm run build

# 建议改为
npm run build:standalone
```

### 2. 配置文件验证 (在第138行之前添加)
```yaml
# 8.5. 验证关键配置文件
echo "🔧 验证配置文件..."
if [ ! -f "ecosystem.config.js" ]; then
  echo "❌ ecosystem.config.js 缺失"
  exit 1
fi

# 检查PM2配置是否使用standalone模式
if grep -q "\.next/standalone/server\.js" ecosystem.config.js; then
  echo "✅ PM2配置使用standalone模式"
else
  echo "❌ PM2配置未使用standalone模式"
  exit 1
fi
echo "✅ 配置文件验证完成"
```

### 3. 增强构建验证 (替换第140-165行)
```yaml
# 10. 验证构建产物（增强版）
echo "✅ 验证构建产物..."
if [ ! -d ".next" ]; then
  echo "❌ .next目录不存在，构建失败"
  exit 1
fi

if [ ! -f ".next/BUILD_ID" ]; then
  echo "❌ BUILD_ID文件不存在，构建失败"
  exit 1
fi

# Standalone模式特有验证
if [ ! -f ".next/standalone/server.js" ]; then
  echo "❌ standalone/server.js不存在，构建失败"
  exit 1
fi

if [ ! -d ".next/standalone/.next/static" ]; then
  echo "❌ standalone静态资源目录不存在，构建失败"
  exit 1
fi

if [ ! -d ".next/standalone/public" ]; then
  echo "❌ standalone public目录不存在，构建失败"
  exit 1
fi

if [ ! -f ".next/standalone/public/favicon.ico" ]; then
  echo "❌ favicon.ico不存在，构建失败"
  exit 1
fi

BUILD_SIZE=$(du -sh .next | cut -f1)
STANDALONE_SIZE=$(du -sh .next/standalone | cut -f1)
echo "✅ 构建产物大小: $BUILD_SIZE"
echo "✅ Standalone大小: $STANDALONE_SIZE"
echo "✅ Standalone模式构建验证通过"
```

### 4. Nginx配置自动修复 (在第175行nginx部分之后添加)
```yaml
# 12.5. 修复nginx代理缓存问题
echo "🔧 检查nginx代理缓存配置..."
PROXY_CONF_DIR="/www/server/panel/vhost/nginx/proxy/erp.samuelcn.com"
if [ -d "$PROXY_CONF_DIR" ]; then
  for conf_file in "$PROXY_CONF_DIR"/*.conf; do
    if [ -f "$conf_file" ]; then
      if ! grep -q "proxy_cache off" "$conf_file"; then
        echo "🔧 添加nginx代理缓存禁用配置到 $conf_file..."
        sed -i '/proxy_http_version 1.1;/a\    proxy_cache off;' "$conf_file"
        echo "✅ nginx代理缓存配置已更新"
      else
        echo "✅ nginx代理缓存配置已存在"
      fi
    fi
  done
  
  # 清理现有代理缓存
  if [ -d "/www/server/nginx/proxy_cache_dir" ]; then
    echo "🗑️  清理nginx代理缓存..."
    rm -rf /www/server/nginx/proxy_cache_dir/*
    echo "✅ nginx代理缓存已清理"
  fi
else
  echo "⚠️  nginx代理配置目录不存在，跳过配置"
fi
```

### 5. 启动前检查 (在第190行PM2启动之前添加)
```yaml
# 12.8. 启动前最终检查
echo "🔍 启动前最终检查..."
if [ ! -f ".next/standalone/server.js" ]; then
  echo "❌ standalone/server.js缺失，无法启动"
  exit 1
fi

if [ ! -d ".next/standalone/.next/static" ]; then
  echo "❌ 静态资源缺失，无法启动"
  exit 1
fi

echo "✅ 启动前检查通过"
```

## 为什么需要这些改进

### 问题1: 构建产物不完整
- **原因**: 当前只执行`npm run build`，不处理standalone静态资源复制
- **影响**: 导致502错误，静态资源404
- **解决**: 使用`npm run build:standalone`脚本

### 问题2: 配置文件不同步  
- **原因**: 本地修改的ecosystem.config.js和nginx配置未同步到服务器
- **影响**: PM2启动失败，缓存问题复现
- **解决**: 添加配置验证和自动修复

### 问题3: 验证不充分
- **原因**: 现有验证只检查基本文件，未验证standalone完整性
- **影响**: 部署成功但运行时失败
- **解决**: 增强验证覆盖standalone模式所有关键文件

## 实施优先级

1. **P0**: 修改构建命令 (`npm run build:standalone`)
2. **P0**: 增强构建验证 (检查standalone文件)  
3. **P1**: 添加nginx配置修复
4. **P2**: 配置文件验证
5. **P2**: 启动前检查

## 测试建议

1. 在测试分支先验证改进的deploy.yml
2. 确保所有检查点都能正确执行
3. 验证失败场景的错误处理
4. 确认部署后功能完整性 
