#!/bin/bash
set -e

# 数据库备份脚本
# 用于在部署前创建数据库备份，支持快速回滚

echo "📦 开始数据库备份流程..."
echo "📅 备份时间: $(date)"

# 从环境变量或配置文件读取数据库连接信息
if [ -f ".env" ]; then
    source .env
fi

# 解析DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 未找到DATABASE_URL环境变量"
    exit 1
fi

# 提取数据库连接信息
DB_URL_REGEX="mysql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?]+)"
if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    echo "❌ 无法解析DATABASE_URL格式"
    exit 1
fi

# 创建备份目录
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# 生成备份文件名
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql"
SCHEMA_FILE="${BACKUP_DIR}/schema_${DB_NAME}_${TIMESTAMP}.sql"

echo "📊 备份数据库: $DB_NAME"
echo "📁 备份文件: $BACKUP_FILE"

# 1. 备份完整数据库
echo "💾 创建完整数据库备份..."
mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --add-drop-table \
    "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 数据库备份完成: $BACKUP_FILE"
else
    echo "❌ 数据库备份失败"
    exit 1
fi

# 2. 备份仅结构（用于快速对比）
echo "🏗️  创建数据库结构备份..."
mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" \
    --no-data \
    --routines \
    --triggers \
    --events \
    "$DB_NAME" > "$SCHEMA_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 数据库结构备份完成: $SCHEMA_FILE"
else
    echo "❌ 数据库结构备份失败"
    exit 1
fi

# 3. 压缩备份文件
echo "🗜️  压缩备份文件..."
gzip "$BACKUP_FILE"
gzip "$SCHEMA_FILE"

echo "✅ 备份文件已压缩"
echo "📦 完整备份: ${BACKUP_FILE}.gz"
echo "🏗️  结构备份: ${SCHEMA_FILE}.gz"

# 4. 清理旧备份（保留最近7天）
echo "🧹 清理旧备份文件..."
find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.sql.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "schema_${DB_NAME}_*.sql.gz" -mtime +7 -delete
echo "✅ 旧备份文件清理完成"

# 5. 记录备份信息
echo "📝 记录备份信息..."
echo "$(date): 备份完成 - ${BACKUP_FILE}.gz" >> "${BACKUP_DIR}/backup.log"

echo "🎉 数据库备份流程完成！"
echo "📋 备份摘要:"
echo "   - 完整备份: ${BACKUP_FILE}.gz"
echo "   - 结构备份: ${SCHEMA_FILE}.gz"
echo "   - 备份大小: $(du -h "${BACKUP_FILE}.gz" | cut -f1)"
