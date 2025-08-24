#!/bin/bash

# 生产环境迁移修复脚本
# 用于安全地解决 shipmentFile 字段重复添加的迁移冲突
# 作者: AI Assistant
# 日期: $(date +%Y-%m-%d)

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}"
}

# 检查是否为生产环境
check_production_environment() {
    log "🔍 检查生产环境..."
    
    if [ ! -f ".env" ]; then
        error ".env 文件不存在"
    fi
    
    source .env
    
    if [ "$NODE_ENV" != "production" ]; then
        error "当前不是生产环境 (NODE_ENV=$NODE_ENV)"
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL 未配置"
    fi
    
    log "✅ 生产环境验证通过"
}

# 备份当前迁移状态
backup_migration_state() {
    log "💾 备份当前迁移状态..."
    
    local backup_dir="backups/migration-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # 备份 Prisma 迁移历史
    if npx prisma migrate status > "$backup_dir/migration_status.txt" 2>&1; then
        log "✅ 迁移状态已备份到 $backup_dir/migration_status.txt"
    else
        warn "⚠️  无法获取迁移状态，可能存在连接问题"
    fi
    
    # 备份数据库结构
    if command -v mysqldump >/dev/null 2>&1; then
        local db_url="$DATABASE_URL"
        # 从 DATABASE_URL 提取连接信息
        local db_info=$(echo "$db_url" | sed -n 's|mysql://\([^:]*\):\([^@]*\)@\([^:]*\):\([^/]*\)/\(.*\)|\1 \2 \3 \4 \5|p')
        
        if [ -n "$db_info" ]; then
            read -r db_user db_pass db_host db_port db_name <<< "$db_info"
            
            if mysqldump -h"$db_host" -P"$db_port" -u"$db_user" -p"$db_pass" \
                --no-data --routines --triggers "$db_name" > "$backup_dir/schema_backup.sql" 2>/dev/null; then
                log "✅ 数据库结构已备份到 $backup_dir/schema_backup.sql"
            else
                warn "⚠️  无法备份数据库结构"
            fi
        fi
    fi
    
    echo "$backup_dir" > .last_backup_dir
    log "✅ 备份完成，备份目录: $backup_dir"
}

# 检查数据库中 shipmentFile 字段是否存在
check_shipment_file_field() {
    log "🔍 检查数据库中 shipmentFile 字段状态..."
    
    # 使用 Prisma 的内省功能检查字段
    local temp_schema="temp_schema_$(date +%s).prisma"
    
    if npx prisma db pull --print > "$temp_schema" 2>/dev/null; then
        if grep -q "shipmentFile" "$temp_schema"; then
            log "✅ 数据库中已存在 shipmentFile 字段"
            rm -f "$temp_schema"
            return 0
        else
            log "ℹ️  数据库中不存在 shipmentFile 字段"
            rm -f "$temp_schema"
            return 1
        fi
    else
        warn "⚠️  无法检查数据库字段状态"
        rm -f "$temp_schema"
        return 2
    fi
}

# 修复迁移冲突 - 方案1: 标记迁移为已应用
fix_migration_mark_applied() {
    log "🔧 修复方案1: 标记迁移为已应用..."
    
    local migration_name="20250821015630_add_shipment_file_field"
    
    info "将迁移 $migration_name 标记为已应用"
    info "这种方法适用于字段已存在但迁移记录缺失的情况"
    
    if npx prisma migrate resolve --applied "$migration_name"; then
        log "✅ 迁移已标记为已应用"
        return 0
    else
        error "❌ 标记迁移失败"
        return 1
    fi
}

# 修复迁移冲突 - 方案2: 修改迁移文件使用 IF NOT EXISTS
fix_migration_add_if_not_exists() {
    log "🔧 修复方案2: 修改迁移文件添加 IF NOT EXISTS..."
    
    local migration_file="prisma/migrations/20250821015630_add_shipment_file_field/migration.sql"
    
    if [ ! -f "$migration_file" ]; then
        error "迁移文件不存在: $migration_file"
    fi
    
    # 备份原始迁移文件
    cp "$migration_file" "${migration_file}.backup"
    
    # 检查是否为 MySQL
    if echo "$DATABASE_URL" | grep -q "mysql://"; then
        warn "⚠️  MySQL 不支持 ADD COLUMN IF NOT EXISTS 语法"
        warn "建议使用方案1或方案3"
        return 1
    fi
    
    # 修改迁移文件（适用于 PostgreSQL）
    sed -i.bak 's/ADD COLUMN `shipmentFile`/ADD COLUMN IF NOT EXISTS `shipmentFile`/g' "$migration_file"
    
    log "✅ 迁移文件已修改，添加了 IF NOT EXISTS 条件"
    return 0
}

# 修复迁移冲突 - 方案3: 重置并重新应用迁移
fix_migration_reset_and_reapply() {
    log "🔧 修复方案3: 重置并重新应用迁移..."
    
    warn "⚠️  此方案会重置迁移状态，请确保已备份"
    
    local migration_name="20250821015630_add_shipment_file_field"
    
    # 标记迁移为回滚状态
    if npx prisma migrate resolve --rolled-back "$migration_name"; then
        log "✅ 迁移已标记为回滚状态"
    else
        error "❌ 标记迁移回滚失败"
    fi
    
    # 重新应用迁移
    if npx prisma migrate deploy; then
        log "✅ 迁移重新应用成功"
        return 0
    else
        error "❌ 重新应用迁移失败"
        return 1
    fi
}

# 验证修复结果
verify_fix() {
    log "🔍 验证修复结果..."
    
    # 检查迁移状态
    if npx prisma migrate status; then
        log "✅ 迁移状态正常"
    else
        error "❌ 迁移状态异常"
    fi
    
    # 检查数据库连接
    if npx prisma db pull --print > /dev/null 2>&1; then
        log "✅ 数据库连接正常"
    else
        error "❌ 数据库连接异常"
    fi
    
    log "✅ 修复验证完成"
}

# 主函数
main() {
    log "🚀 开始生产环境迁移修复..."
    
    # 检查生产环境
    check_production_environment
    
    # 备份当前状态
    backup_migration_state
    
    # 检查字段状态
    local field_status
    check_shipment_file_field
    field_status=$?
    
    case $field_status in
        0)
            log "📋 字段已存在，使用方案1: 标记迁移为已应用"
            fix_migration_mark_applied
            ;;
        1)
            log "📋 字段不存在，正常应用迁移"
            if npx prisma migrate deploy; then
                log "✅ 迁移应用成功"
            else
                error "❌ 迁移应用失败"
            fi
            ;;
        2)
            warn "⚠️  无法确定字段状态，使用保守方案"
            log "📋 尝试方案1: 标记迁移为已应用"
            if ! fix_migration_mark_applied; then
                log "📋 方案1失败，尝试方案3: 重置并重新应用"
                fix_migration_reset_and_reapply
            fi
            ;;
    esac
    
    # 验证修复结果
    verify_fix
    
    log "🎉 生产环境迁移修复完成！"
    log "📁 备份目录: $(cat .last_backup_dir 2>/dev/null || echo '未知')"
}

# 显示帮助信息
show_help() {
    echo "生产环境迁移修复脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  -c, --check    仅检查状态，不执行修复"
    echo "  -1, --method1  强制使用方案1 (标记为已应用)"
    echo "  -2, --method2  强制使用方案2 (添加 IF NOT EXISTS)"
    echo "  -3, --method3  强制使用方案3 (重置并重新应用)"
    echo ""
    echo "修复方案说明:"
    echo "  方案1: 适用于字段已存在但迁移记录缺失"
    echo "  方案2: 适用于 PostgreSQL，修改迁移文件添加 IF NOT EXISTS"
    echo "  方案3: 重置迁移状态并重新应用，风险较高"
}

# 仅检查状态
check_only() {
    log "🔍 仅检查模式..."
    
    check_production_environment
    
    log "📊 当前迁移状态:"
    npx prisma migrate status || warn "无法获取迁移状态"
    
    log "📊 数据库字段状态:"
    check_shipment_file_field
    
    log "✅ 检查完成"
}

# 解析命令行参数
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -c|--check)
        check_only
        exit 0
        ;;
    -1|--method1)
        check_production_environment
        backup_migration_state
        fix_migration_mark_applied
        verify_fix
        exit 0
        ;;
    -2|--method2)
        check_production_environment
        backup_migration_state
        fix_migration_add_if_not_exists
        verify_fix
        exit 0
        ;;
    -3|--method3)
        check_production_environment
        backup_migration_state
        fix_migration_reset_and_reapply
        verify_fix
        exit 0
        ;;
    "")
        main
        ;;
    *)
        error "未知选项: $1"
        show_help
        exit 1
        ;;
esac