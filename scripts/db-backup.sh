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

# 提取数据库连接信息 - 支持PostgreSQL和MySQL（包含查询参数）
# 使用更安全的方式解析URL，支持密码中包含特殊字符
if [[ $DATABASE_URL =~ ^postgresql:// ]]; then
    # PostgreSQL格式
    DB_TYPE="postgresql"
    # 移除协议前缀
    url_without_protocol="${DATABASE_URL#postgresql://}"
    # 提取用户名和密码部分（在最后一个@之前）
    credentials_and_rest="$url_without_protocol"
    # 找到最后一个@的位置，分离认证信息和主机信息
    host_part="${credentials_and_rest##*@}"
    credentials_part="${credentials_and_rest%@*}"
    # 解析用户名和密码
    DB_USER="${credentials_part%%:*}"
    DB_PASS="${credentials_part#*:}"
    # 解析主机、端口和数据库
    DB_HOST="${host_part%%:*}"
    port_and_db="${host_part#*:}"
    DB_PORT="${port_and_db%%/*}"
    DB_NAME="${port_and_db#*/}"
elif [[ $DATABASE_URL =~ ^mysql:// ]]; then
    # MySQL格式
    DB_TYPE="mysql"
    # 移除协议前缀
    url_without_protocol="${DATABASE_URL#mysql://}"
    # 提取用户名和密码部分（在最后一个@之前）
    credentials_and_rest="$url_without_protocol"
    # 找到最后一个@的位置，分离认证信息和主机信息
    host_part="${credentials_and_rest##*@}"
    credentials_part="${credentials_and_rest%@*}"
    # 解析用户名和密码
    DB_USER="${credentials_part%%:*}"
    DB_PASS="${credentials_part#*:}"
    # 解析主机、端口和数据库
    DB_HOST="${host_part%%:*}"
    port_and_db="${host_part#*:}"
    DB_PORT="${port_and_db%%/*}"
    DB_NAME="${port_and_db#*/}"
else
    echo "❌ 无法解析DATABASE_URL格式: $DATABASE_URL"
    echo "❌ 支持格式: postgresql://user:password@host:port/database 或 mysql://user:password@host:port/database"
    echo "❌ 注意：支持包含查询参数的URL格式（如 ?sslmode=require）"
    echo "❌ 当前URL格式: $(echo $DATABASE_URL | sed 's/:.*@/:***@/g')"
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
if [ "$DB_TYPE" = "postgresql" ]; then
    # PostgreSQL备份
    export PGPASSWORD="$DB_PASS"
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=plain \
        --no-owner \
        --no-privileges > "$BACKUP_FILE"
    backup_result=$?
    unset PGPASSWORD
elif [ "$DB_TYPE" = "mysql" ]; then
    # MySQL备份
    mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --add-drop-table \
        "$DB_NAME" > "$BACKUP_FILE"
    backup_result=$?
else
    echo "❌ 不支持的数据库类型: $DB_TYPE"
    exit 1
fi

if [ $backup_result -eq 0 ]; then
    echo "✅ 数据库备份完成: $BACKUP_FILE"
else
    echo "❌ 数据库备份失败"
    exit 1
fi

# 2. 备份仅结构（用于快速对比）
echo "🏗️  创建数据库结构备份..."
if [ "$DB_TYPE" = "postgresql" ]; then
    # PostgreSQL结构备份
    export PGPASSWORD="$DB_PASS"
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --schema-only \
        --verbose \
        --no-password \
        --format=plain \
        --no-owner \
        --no-privileges > "$SCHEMA_FILE"
    schema_result=$?
    unset PGPASSWORD
elif [ "$DB_TYPE" = "mysql" ]; then
    # MySQL结构备份
    mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" \
        --no-data \
        --routines \
        --triggers \
        --events \
        "$DB_NAME" > "$SCHEMA_FILE"
    schema_result=$?
fi

if [ $schema_result -eq 0 ]; then
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
