#!/bin/bash
set -e

# 数据库回滚脚本
# 用于在部署失败时快速回滚到之前的数据库状态

echo "🔄 开始数据库回滚流程..."
echo "📅 回滚时间: $(date)"

# 检查参数
if [ $# -eq 0 ]; then
    echo "❌ 请提供备份文件路径"
    echo "用法: $0 <backup_file.sql.gz>"
    echo "示例: $0 ./backups/backup_easy_erp_db_20250821_120000.sql.gz"
    
    # 列出可用的备份文件
    echo ""
    echo "📋 可用的备份文件:"
    if [ -d "./backups" ]; then
        ls -la ./backups/backup_*.sql.gz 2>/dev/null || echo "   未找到备份文件"
    else
        echo "   备份目录不存在"
    fi
    exit 1
fi

BACKUP_FILE="$1"

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

echo "📦 使用备份文件: $BACKUP_FILE"

# 从环境变量读取数据库连接信息
if [ -f ".env" ]; then
    source .env
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ 未找到DATABASE_URL环境变量"
    exit 1
fi

# 解析DATABASE_URL - 支持PostgreSQL和MySQL（包含查询参数）
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?\&]+) ]]; then
    # PostgreSQL格式（支持查询参数）
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
    DB_TYPE="postgresql"
elif [[ $DATABASE_URL =~ mysql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?\&]+) ]]; then
    # MySQL格式（支持查询参数）
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
    DB_TYPE="mysql"
else
    echo "❌ 无法解析DATABASE_URL格式: ***"
    echo "❌ 支持格式: postgresql://user:password@host:port/database 或 mysql://user:password@host:port/database"
    echo "❌ 注意：支持包含查询参数的URL格式（如 ?sslmode=require）"
    exit 1
fi

# 确认回滚操作
echo "⚠️  警告: 此操作将完全替换当前数据库内容！"
echo "📊 目标数据库: $DB_NAME"
echo "📦 备份文件: $BACKUP_FILE"
echo ""
read -p "确认执行回滚操作？(输入 'YES' 确认): " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
    echo "❌ 回滚操作已取消"
    exit 1
fi

echo "🔄 开始执行回滚..."

# 1. 停止应用服务
echo "⏹️  停止应用服务..."
pm2 stop easy-erp-web || true

# 2. 创建当前状态的紧急备份
echo "💾 创建当前状态的紧急备份..."
EMERGENCY_BACKUP="./backups/emergency_backup_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    "$DB_NAME" > "$EMERGENCY_BACKUP"

if [ $? -eq 0 ]; then
    gzip "$EMERGENCY_BACKUP"
    echo "✅ 紧急备份完成: ${EMERGENCY_BACKUP}.gz"
else
    echo "❌ 紧急备份失败，回滚操作终止"
    exit 1
fi

# 3. 解压备份文件
echo "📂 解压备份文件..."
TEMP_SQL_FILE="/tmp/rollback_$(date +%Y%m%d_%H%M%S).sql"
gunzip -c "$BACKUP_FILE" > "$TEMP_SQL_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 备份文件解压完成"
else
    echo "❌ 备份文件解压失败"
    exit 1
fi

# 4. 执行数据库回滚
echo "🔄 执行数据库回滚..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$TEMP_SQL_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 数据库回滚完成"
else
    echo "❌ 数据库回滚失败"
    echo "💡 可以使用紧急备份恢复: ${EMERGENCY_BACKUP}.gz"
    exit 1
fi

# 5. 清理临时文件
echo "🧹 清理临时文件..."
rm -f "$TEMP_SQL_FILE"

# 6. 重新生成Prisma客户端
echo "🔧 重新生成Prisma客户端..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma客户端生成完成"
else
    echo "⚠️  Prisma客户端生成失败，但数据库回滚已完成"
fi

# 7. 重启应用服务
echo "🚀 重启应用服务..."
pm2 start easy-erp-web || echo "⚠️  应用服务启动失败，请手动启动"

# 8. 记录回滚信息
echo "📝 记录回滚信息..."
echo "$(date): 回滚完成 - 使用备份: $BACKUP_FILE" >> "./backups/rollback.log"

echo "🎉 数据库回滚流程完成！"
echo "📋 回滚摘要:"
echo "   - 使用备份: $BACKUP_FILE"
echo "   - 紧急备份: ${EMERGENCY_BACKUP}.gz"
echo "   - 回滚时间: $(date)"
echo ""
echo "💡 提示: 如果应用出现问题，请检查日志并重新部署"