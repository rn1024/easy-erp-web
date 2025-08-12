#!/bin/bash
set -e

echo "🚀 开始ECS本地构建部署流程..."
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

# 4. 清理旧文件
echo "🗑️  清理旧的依赖和构建产物..."
rm -rf node_modules
rm -rf .next
rm -f package-lock.json
npm cache clean --force
echo "✅ 清理完成"

# 5. 设置环境变量
echo "⚙️  配置生产环境变量..."
cat > .env << EOF
DATABASE_URL=${DATABASE_URL}
REDIS_URL=${REDIS_URL}
JWT_SECRET=${JWT_SECRET}
OSS_ACCESS_KEY_ID=${OSS_ACCESS_KEY_ID}
OSS_ACCESS_KEY_SECRET=${OSS_ACCESS_KEY_SECRET}
OSS_BUCKET=${OSS_BUCKET}
OSS_REGION=${OSS_REGION}
OSS_ENDPOINT=easy-erp-web.oss-cn-hangzhou.aliyuncs.com
NEXT_PUBLIC_APP_URL=https://erp.samuelcn.com
OSS_PATH_PREFIX=template
NODE_ENV=production
PORT=3008
EOF
echo "✅ 环境变量配置完成"

# 6. 安装依赖
echo "📦 开始安装项目依赖..."
npm install --production=false

# 验证关键依赖
if [ ! -f "node_modules/.bin/next" ]; then
  echo "❌ Next.js 未正确安装"
  exit 1
fi
echo "✅ 依赖安装完成"

# 7. 生成Prisma客户端
echo "🗄️  生成Prisma客户端..."
npm run db:generate
echo "✅ Prisma客户端生成完成"

# 7.5. 检查并初始化数据库
echo "🗄️  检查数据库初始化状态..."

# 检查数据库连接
echo "🔍 测试数据库连接..."
if ! node -e "const { PrismaClient } = require('./generated/prisma'); const prisma = new PrismaClient(); prisma.\$queryRaw\`SELECT 1\`.then(() => { console.log('数据库连接成功'); process.exit(0); }).catch(err => { console.error('数据库连接失败:', err.message); process.exit(1); }).finally(() => prisma.\$disconnect());"; then
  echo "❌ 数据库连接失败，终止部署"
  exit 1
fi

# 检查数据库表结构
echo "🔍 检查数据库表结构..."
TABLE_COUNT=$(node -e "const { PrismaClient } = require('./generated/prisma'); const prisma = new PrismaClient(); prisma.\$queryRaw\`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'\`.then(result => { console.log(result[0].count); process.exit(0); }).catch(err => { console.log('0'); process.exit(0); }).finally(() => prisma.\$disconnect());")
echo "📊 数据库中共有 $TABLE_COUNT 个表"

# 动态获取Schema中定义的所有表
get_schema_tables() {
  echo "🔍 从Prisma Schema中提取表名..."
  local schema_tables=()
  
  # 解析schema.prisma文件，提取所有model定义的表名
  if [ -f "prisma/schema.prisma" ]; then
    # 提取model定义并转换为表名（支持@@map映射）
    while IFS= read -r line; do
      # 匹配 model 定义行
      if [[ $line =~ ^[[:space:]]*model[[:space:]]+([A-Za-z0-9_]+) ]]; then
        model_name="${BASH_REMATCH[1]}"
        # 默认表名为model名的小写+复数形式，但需要检查是否有@@map
        table_name=$(echo "$model_name" | sed 's/\([A-Z]\)/_\L\1/g' | sed 's/^_//' | tr '[:upper:]' '[:lower:]')
        
        # 读取model内容直到遇到下一个model或文件结束
        model_content=""
        while IFS= read -r model_line && [[ ! $model_line =~ ^[[:space:]]*model[[:space:]] ]] && [[ ! $model_line =~ ^[[:space:]]*enum[[:space:]] ]]; do
          model_content+="$model_line\n"
          if [[ $model_line =~ @@map\(\"([^\"]+)\"\) ]]; then
            table_name="${BASH_REMATCH[1]}"
          fi
        done
        
        schema_tables+=("$table_name")
        echo "  📋 发现表: $table_name (来自模型: $model_name)"
      fi
    done < "prisma/schema.prisma"
  else
    echo "❌ 未找到prisma/schema.prisma文件"
    return 1
  fi
  
  # 返回表名数组
  printf '%s\n' "${schema_tables[@]}"
}

# 获取数据库中当前存在的表
get_current_tables() {
  echo "🔍 获取数据库中当前存在的表..."
  node -e "
    const { PrismaClient } = require('./generated/prisma');
    const prisma = new PrismaClient();
    prisma.\$queryRaw\`SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE_TABLE'\`
      .then(result => {
        const tables = result.map(row => row.table_name || row.TABLE_NAME);
        console.log(tables.join('\n'));
        process.exit(0);
      })
      .catch(err => {
        console.error('获取表列表失败:', err.message);
        process.exit(1);
      })
      .finally(() => prisma.\$disconnect());
  "
}

# 动态获取所有应该存在的表
echo "📋 动态检测数据库表结构..."
SCHEMA_TABLES=($(get_schema_tables))
CURRENT_TABLES=($(get_current_tables))

echo "📊 Schema中定义的表数量: ${#SCHEMA_TABLES[@]}"
echo "📊 数据库中现有表数量: ${#CURRENT_TABLES[@]}"

# 数据库表检测和创建函数（使用动态检测）
check_and_create_missing_tables() {
  echo "🔍 检查数据库表完整性..."
  
  local missing_tables=()
  local existing_count=0
  local total_count=${#SCHEMA_TABLES[@]}
  
  # 将当前表转换为关联数组以便快速查找
  declare -A current_table_map
  for table in "${CURRENT_TABLES[@]}"; do
    current_table_map["$table"]=1
  done
  
  # 检查每个Schema定义的表
  for table in "${SCHEMA_TABLES[@]}"; do
    if [[ -n "${current_table_map[$table]}" ]]; then
      echo "✅ 表存在: $table"
      existing_count=$((existing_count + 1))
    else
      echo "❌ 缺失表: $table"
      missing_tables+=("$table")
    fi
  done
  
  echo "📊 表状态统计: $existing_count/$total_count 个Schema表存在"
  
  # 如果有缺失表，执行创建
  if [ ${#missing_tables[@]} -gt 0 ]; then
    echo "🔧 发现缺失表，开始创建: ${missing_tables[*]}"
    create_missing_tables "${missing_tables[@]}"
  else
    echo "✅ 所有Schema定义的表都已存在"
  fi
}

# 简化的备份函数
create_backup() {
  echo "💾 创建数据库备份..."
  local backup_file="/tmp/erp_backup_$(date +%Y%m%d_%H%M%S).sql"
  
  # 从DATABASE_URL提取连接信息
  if [[ $DATABASE_URL =~ mysql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
    
    if mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$backup_file" 2>/dev/null; then
      echo "$backup_file" > "/tmp/latest_backup_path"
      echo "✅ 数据库备份完成: $backup_file"
      return 0
    else
      echo "❌ 数据库备份失败"
      return 1
    fi
  else
    echo "❌ 无法解析DATABASE_URL"
    return 1
  fi
}

# 简化的回滚函数
rollback_deployment() {
  echo "🔄 开始回滚部署..."
  
  # 停止应用
  pm2 stop easy-erp-web 2>/dev/null || true
  
  # 恢复数据库（如果有备份）
  if [ -f "/tmp/latest_backup_path" ]; then
    local backup_file=$(cat "/tmp/latest_backup_path")
    if [ -f "$backup_file" ]; then
      echo "🔄 恢复数据库备份..."
      if [[ $DATABASE_URL =~ mysql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
        
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$backup_file" 2>/dev/null || {
          echo "❌ 数据库恢复失败"
        }
      fi
    fi
  fi
  
  echo "✅ 回滚完成"
}

# 安全的迁移函数
safe_migrate() {
  echo "🔒 执行安全迁移..."
  
  # 创建备份
  create_backup
  
  # 检查迁移状态
  echo "🔍 检查迁移状态..."
  if npx prisma migrate status; then
    echo "📋 迁移状态检查完成"
  else
    echo "⚠️  迁移状态检查失败，但继续执行"
  fi
  
  # 执行迁移
  echo "🚀 执行数据库迁移..."
  if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    echo "📁 发现迁移文件，执行migrate deploy..."
    if npx prisma migrate deploy; then
      echo "✅ 迁移执行成功"
      return 0
    else
      echo "❌ 迁移执行失败，尝试回滚..."
      rollback_deployment
      return 1
    fi
  else
    echo "📝 未发现迁移文件，使用 db push 同步..."
    if npx prisma db push; then
      echo "✅ Schema同步成功"
      return 0
    else
      echo "❌ Schema同步失败，尝试回滚..."
      rollback_deployment
      return 1
    fi
  fi
}

# 创建缺失表函数（使用安全迁移）
create_missing_tables() {
  local missing=("$@")
  echo "🔄 开始安全创建缺失的数据库表..."
  
  # 使用安全迁移
  if safe_migrate; then
    echo "✅ 安全迁移完成"
  else
    echo "❌ 安全迁移失败，终止部署"
    exit 1
  fi
  
  # 验证表创建结果
  verify_table_creation "${missing[@]}"
}

# 验证表创建函数
verify_table_creation() {
  local expected_tables=("$@")
  echo "🔍 验证表创建结果..."
  
  # 重新获取当前表列表
  local current_tables_after=($(get_current_tables))
  declare -A current_table_map_after
  for table in "${current_tables_after[@]}"; do
    current_table_map_after["$table"]=1
  done
  
  local verification_failed=false
  local failed_tables=()
  
  for table in "${expected_tables[@]}"; do
    if [[ -n "${current_table_map_after[$table]}" ]]; then
      echo "✅ 表创建成功: $table"
    else
      echo "❌ 表创建失败: $table"
      verification_failed=true
      failed_tables+=("$table")
    fi
  done
  
  if [ "$verification_failed" = true ]; then
    echo "❌ 部分表创建失败: ${failed_tables[*]}"
    echo "🔄 尝试强制重置并重新创建..."
    
    # 创建备份（如果还没有）
    if [ ! -f "/tmp/latest_backup_path" ]; then
      create_backup
    fi
    
    # 强制重置
    if npx prisma db push --force-reset; then
      echo "✅ 强制重置成功"
      
      # 再次验证
      echo "🔍 重新验证表创建..."
      local final_tables=($(get_current_tables))
      declare -A final_table_map
      for table in "${final_tables[@]}"; do
        final_table_map["$table"]=1
      done
      
      local final_failed=false
      for table in "${expected_tables[@]}"; do
        if [[ -n "${final_table_map[$table]}" ]]; then
          echo "✅ 表最终创建成功: $table"
        else
          echo "❌ 表最终创建失败: $table"
          final_failed=true
        fi
      done
      
      if [ "$final_failed" = true ]; then
        echo "❌ 强制重置后仍有表创建失败，开始回滚..."
        rollback_deployment
        exit 1
      fi
    else
      echo "❌ 强制重置失败，开始回滚..."
      rollback_deployment
      exit 1
    fi
  fi
}

# 执行数据库表检测和创建
echo "🔍 开始数据库表完整性检查..."
check_and_create_missing_tables
echo "✅ 数据库结构初始化完成"

# 检查是否需要种子数据
echo "🔍 检查是否需要种子数据..."
if node -e "const { PrismaClient } = require('./generated/prisma'); const prisma = new PrismaClient(); prisma.role.count().then(count => { if(count === 0) { console.log('NEED_SEED'); process.exit(1); } else { console.log('DATA_EXISTS'); } }).catch(() => { console.log('NEED_SEED'); process.exit(1); }).finally(() => prisma.\$disconnect());"; then
  echo "✅ 数据库已有基础数据"
else
  echo "🌱 数据库需要初始化种子数据..."
  if npm run db:seed:production; then
    echo "✅ 数据库种子数据初始化完成"
  else
    echo "❌ 数据库种子数据初始化失败，开始回滚..."
    rollback_deployment
    exit 1
  fi
fi

# 最终验证数据库状态
echo "🔍 最终验证数据库状态..."
FINAL_TABLE_COUNT=$(node -e "const { PrismaClient } = require('./generated/prisma'); const prisma = new PrismaClient(); prisma.\$queryRaw\`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'\`.then(result => { console.log(result[0].count); process.exit(0); }).catch(err => { console.log('0'); process.exit(0); }).finally(() => prisma.\$disconnect());")
ROLE_COUNT=$(node -e "const { PrismaClient } = require('./generated/prisma'); const prisma = new PrismaClient(); prisma.role.count().then(count => { console.log(count); process.exit(0); }).catch(err => { console.log('0'); process.exit(0); }).finally(() => prisma.\$disconnect());")
ACCOUNT_COUNT=$(node -e "const { PrismaClient } = require('./generated/prisma'); const prisma = new PrismaClient(); prisma.account.count().then(count => { console.log(count); process.exit(0); }).catch(err => { console.log('0'); process.exit(0); }).finally(() => prisma.\$disconnect());")

# 验证关键表是否存在
PRODUCT_COSTS_EXISTS=$(node -e "const { PrismaClient } = require('./generated/prisma'); const prisma = new PrismaClient(); prisma.\$queryRaw\`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'product_costs'\`.then(result => { console.log(result[0].count > 0 ? 'YES' : 'NO'); process.exit(0); }).catch(err => { console.log('NO'); process.exit(0); }).finally(() => prisma.\$disconnect());")

echo "📊 数据库最终状态:"
echo "  - 表数量: $FINAL_TABLE_COUNT"
echo "  - 角色数量: $ROLE_COUNT"
echo "  - 账户数量: $ACCOUNT_COUNT"
echo "  - product_costs表: $PRODUCT_COSTS_EXISTS"

if [ "$FINAL_TABLE_COUNT" -lt "29" ] || [ "$ROLE_COUNT" -eq "0" ] || [ "$PRODUCT_COSTS_EXISTS" = "NO" ]; then
  echo "❌ 数据库状态验证失败"
  if [ "$PRODUCT_COSTS_EXISTS" = "NO" ]; then
    echo "❌ product_costs 表缺失"
  fi
  exit 1
fi

# 8. 数据库准备完成
echo "✅ 数据库准备完成"

# 8.5. 创建upload目录结构
echo "📁 创建upload目录结构..."
mkdir -p upload/{images,videos,documents,avatars,accessories,labels,shipments}
echo "✅ upload目录结构创建完成"

# 9. 构建应用（使用standalone模式）
echo "🔨 开始构建应用..."
if npm run build:standalone; then
  echo "✅ 应用构建完成"
else
  echo "❌ 应用构建失败，开始回滚..."
  rollback_deployment
  exit 1
fi

# 10. 验证构建产物（增强standalone验证）
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

# 11. 检查端口并释放
echo "🔍 检查端口3008状态..."
if netstat -tlnp | grep :3008; then
  echo "⚠️  端口3008被占用，正在释放..."
  lsof -ti:3008 | xargs kill -9 2>/dev/null || true
  sleep 3
  echo "✅ 端口已释放"
else
  echo "✅ 端口3008空闲"
fi

# 12. 配置Nginx（如果配置文件存在）
if [ -f "nginx/erp.samuelcn.com.conf" ]; then
  echo "🌐 配置Nginx..."
  mkdir -p /etc/nginx/sites-available
  mkdir -p /etc/nginx/sites-enabled
  cp nginx/erp.samuelcn.com.conf /etc/nginx/sites-available/
  ln -sf /etc/nginx/sites-available/erp.samuelcn.com.conf /etc/nginx/sites-enabled/

  # 测试nginx配置
  if nginx -t; then
    nginx -s reload
    echo "✅ Nginx配置更新成功"
  else
    echo "⚠️  Nginx配置测试失败，跳过重载"
  fi
else
  echo "ℹ️  未找到Nginx配置文件，跳过配置"
fi

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

  # 重载nginx配置以应用更改
  if nginx -t; then
    nginx -s reload
    echo "✅ nginx代理配置已重载"
  fi
else
  echo "⚠️  nginx代理配置目录不存在，跳过配置"
fi

# 12.8. 验证PM2配置
echo "🔧 验证PM2配置..."
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

# 12.9. 启动前最终检查
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

# 13. 启动应用
echo "🚀 启动应用..."
if pm2 start ecosystem.config.js --env production; then
  pm2 save
  echo "✅ PM2启动命令执行完成"
else
  echo "❌ PM2启动失败，开始回滚..."
  rollback_deployment
  exit 1
fi

# 14. 等待应用完全启动
echo "⏳ 等待应用完全启动（15秒）..."
sleep 15

# 15. 验证应用状态
echo "🔍 验证应用状态..."
pm2 status

if pm2 status | grep easy-erp-web | grep -q online; then
  echo "✅ 应用启动成功"
else
  echo "❌ 应用启动失败，查看日志："
  pm2 logs easy-erp-web --lines 20
  echo "🔄 开始回滚..."
  rollback_deployment
  exit 1
fi

# 16. 本地健康检查
echo "🏥 执行本地健康检查..."
health_check_success=false
for i in {1..6}; do
  echo "🔍 健康检查尝试 $i/6..."
  if curl -f -s --max-time 10 "http://localhost:3008/api/health" > /dev/null; then
    echo "✅ 本地健康检查通过"
    health_check_success=true
    break
  else
    if [ $i -eq 6 ]; then
      echo "❌ 本地健康检查失败"
      echo "📝 应用日志："
      pm2 logs easy-erp-web --lines 30
      echo "🔄 开始回滚..."
      rollback_deployment
      exit 1
    else
      echo "⏳ 健康检查失败，等待5秒后重试..."
      sleep 5
    fi
  fi
done

# 17. 检查关键接口
echo "🧪 检查关键接口..."
if curl -f -s --max-time 10 "http://localhost:3008/api/v1/auth/verifycode" > /dev/null; then
  echo "✅ 验证码接口正常"
else
  echo "⚠️  验证码接口异常，但继续部署"
fi

echo ""
echo "🎉 ECS本地构建部署完成！"
echo "==============================================="
echo "📊 部署结果："
echo "  📅 部署时间: $(date)"
echo "  🏗️  构建大小: $BUILD_SIZE"
echo "  🌐 应用地址: https://erp.samuelcn.com"
echo "  📝 Git版本: $(git log --oneline -1)"
echo "==============================================="