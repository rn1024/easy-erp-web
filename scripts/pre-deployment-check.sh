#!/bin/bash

# 生产环境部署前预检脚本
# 用于在部署前验证迁移的安全性和兼容性
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
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

# 全局变量
CHECK_PASSED=0
CHECK_FAILED=0
CHECK_WARNINGS=0

# 记录检查结果
record_result() {
    local status="$1"
    local message="$2"
    
    case "$status" in
        "PASS")
            success "$message"
            ((CHECK_PASSED++))
            ;;
        "FAIL")
            error "$message"
            ((CHECK_FAILED++))
            ;;
        "WARN")
            warn "$message"
            ((CHECK_WARNINGS++))
            ;;
    esac
}

# 检查环境配置
check_environment() {
    log "🔍 检查环境配置..."
    
    # 检查 .env 文件
    if [ -f ".env" ]; then
        record_result "PASS" ".env 文件存在"
        
        source .env
        
        # 检查关键环境变量
        if [ -n "${NODE_ENV:-}" ] && [ "$NODE_ENV" = "production" ]; then
            record_result "PASS" "NODE_ENV 设置为 production"
        else
            record_result "FAIL" "NODE_ENV 未设置为 production (当前: ${NODE_ENV:-未设置})"
        fi
        
        if [ -n "${DATABASE_URL:-}" ]; then
            record_result "PASS" "DATABASE_URL 已配置"
        else
            record_result "FAIL" "DATABASE_URL 未配置"
        fi
        
        if [ -n "${JWT_SECRET:-}" ]; then
            record_result "PASS" "JWT_SECRET 已配置"
        else
            record_result "FAIL" "JWT_SECRET 未配置"
        fi
    else
        record_result "FAIL" ".env 文件不存在"
    fi
}

# 检查数据库连接
check_database_connection() {
    log "🔍 检查数据库连接..."
    
    if [ -z "${DATABASE_URL:-}" ]; then
        record_result "FAIL" "DATABASE_URL 未配置，跳过数据库连接检查"
        return
    fi
    
    # 使用 Prisma 检查数据库连接
    if timeout 30 npx prisma db pull --print > /dev/null 2>&1; then
        record_result "PASS" "数据库连接正常"
    else
        record_result "FAIL" "数据库连接失败或超时"
    fi
}

# 检查迁移状态
check_migration_status() {
    log "🔍 检查迁移状态..."
    
    if [ -z "${DATABASE_URL:-}" ]; then
        record_result "FAIL" "DATABASE_URL 未配置，跳过迁移状态检查"
        return
    fi
    
    # 检查是否有待应用的迁移
    local migration_output
    if migration_output=$(timeout 30 npx prisma migrate status 2>&1); then
        if echo "$migration_output" | grep -q "Database schema is up to date"; then
            record_result "PASS" "数据库迁移状态正常"
        elif echo "$migration_output" | grep -q "Following migration have not been applied yet"; then
            record_result "WARN" "存在未应用的迁移"
            info "待应用的迁移:"
            echo "$migration_output" | grep -A 10 "Following migration have not been applied yet" || true
        else
            record_result "WARN" "迁移状态未知"
            info "迁移状态输出:"
            echo "$migration_output"
        fi
    else
        record_result "FAIL" "无法获取迁移状态"
        info "错误输出:"
        echo "$migration_output"
    fi
}

# 检查特定的问题迁移
check_problematic_migrations() {
    log "🔍 检查问题迁移..."
    
    local problematic_migration="20250821015630_add_shipment_file_field"
    local migration_file="prisma/migrations/$problematic_migration/migration.sql"
    
    if [ -f "$migration_file" ]; then
        record_result "PASS" "问题迁移文件存在: $problematic_migration"
        
        # 检查迁移内容
        if grep -q "ADD COLUMN.*shipmentFile" "$migration_file"; then
            record_result "WARN" "迁移包含 shipmentFile 字段添加，可能导致重复列错误"
            
            # 检查是否使用了 IF NOT EXISTS
            if grep -q "IF NOT EXISTS" "$migration_file"; then
                record_result "PASS" "迁移使用了 IF NOT EXISTS 条件"
            else
                record_result "FAIL" "迁移未使用 IF NOT EXISTS 条件，可能导致部署失败"
            fi
        fi
    else
        record_result "PASS" "问题迁移文件不存在，无需担心"
    fi
}

# 检查数据库字段状态
check_database_schema() {
    log "🔍 检查数据库模式..."
    
    if [ -z "${DATABASE_URL:-}" ]; then
        record_result "FAIL" "DATABASE_URL 未配置，跳过数据库模式检查"
        return
    fi
    
    # 使用 Prisma 内省检查字段
    local temp_schema="temp_schema_$(date +%s).prisma"
    
    if timeout 30 npx prisma db pull --print > "$temp_schema" 2>/dev/null; then
        if grep -q "shipmentFile" "$temp_schema"; then
            record_result "WARN" "数据库中已存在 shipmentFile 字段"
            info "建议使用 'prisma migrate resolve --applied' 标记迁移为已应用"
        else
            record_result "PASS" "数据库中不存在 shipmentFile 字段，可以正常迁移"
        fi
        rm -f "$temp_schema"
    else
        record_result "FAIL" "无法检查数据库模式"
        rm -f "$temp_schema"
    fi
}

# 检查项目依赖
check_dependencies() {
    log "🔍 检查项目依赖..."
    
    # 检查 package.json
    if [ -f "package.json" ]; then
        record_result "PASS" "package.json 文件存在"
    else
        record_result "FAIL" "package.json 文件不存在"
    fi
    
    # 检查 node_modules
    if [ -d "node_modules" ]; then
        record_result "PASS" "node_modules 目录存在"
    else
        record_result "WARN" "node_modules 目录不存在，需要运行 npm install"
    fi
    
    # 检查 Prisma 客户端
    if [ -d "node_modules/.prisma" ]; then
        record_result "PASS" "Prisma 客户端已生成"
    else
        record_result "WARN" "Prisma 客户端未生成，需要运行 npx prisma generate"
    fi
}

# 检查构建状态
check_build_status() {
    log "🔍 检查构建状态..."
    
    # 检查 Next.js 构建输出
    if [ -d ".next" ]; then
        record_result "PASS" "Next.js 构建输出存在"
    else
        record_result "WARN" "Next.js 构建输出不存在，需要运行 npm run build"
    fi
    
    # 检查 TypeScript 配置
    if [ -f "tsconfig.json" ]; then
        record_result "PASS" "TypeScript 配置文件存在"
    else
        record_result "WARN" "TypeScript 配置文件不存在"
    fi
}

# 生成修复建议
generate_fix_suggestions() {
    log "📋 生成修复建议..."
    
    if [ $CHECK_FAILED -gt 0 ]; then
        echo ""
        error "发现 $CHECK_FAILED 个严重问题，建议修复后再部署:"
        echo ""
        
        if [ -z "${DATABASE_URL:-}" ]; then
            echo "  1. 配置 DATABASE_URL 环境变量"
        fi
        
        if [ -z "${JWT_SECRET:-}" ]; then
            echo "  2. 配置 JWT_SECRET 环境变量"
        fi
        
        echo "  3. 如果存在 shipmentFile 字段冲突，运行:"
        echo "     ./scripts/production-migration-fix.sh -c  # 检查状态"
        echo "     ./scripts/production-migration-fix.sh -1  # 标记迁移为已应用"
        echo ""
    fi
    
    if [ $CHECK_WARNINGS -gt 0 ]; then
        echo ""
        warn "发现 $CHECK_WARNINGS 个警告，建议关注:"
        echo ""
        
        echo "  1. 如果数据库中已存在 shipmentFile 字段:"
        echo "     npx prisma migrate resolve --applied 20250821015630_add_shipment_file_field"
        echo ""
        
        echo "  2. 如果需要重新构建:"
        echo "     npm install"
        echo "     npx prisma generate"
        echo "     npm run build"
        echo ""
    fi
}

# 生成部署报告
generate_deployment_report() {
    local report_file="deployment-check-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# 生产环境部署前检查报告

**检查时间**: $(date '+%Y-%m-%d %H:%M:%S')
**检查结果**: $CHECK_PASSED 通过, $CHECK_FAILED 失败, $CHECK_WARNINGS 警告

## 检查摘要

- ✅ 通过检查: $CHECK_PASSED 项
- ❌ 失败检查: $CHECK_FAILED 项  
- ⚠️  警告检查: $CHECK_WARNINGS 项

## 部署建议

EOF

    if [ $CHECK_FAILED -eq 0 ]; then
        echo "### ✅ 可以部署" >> "$report_file"
        echo "" >> "$report_file"
        echo "所有关键检查都已通过，可以安全部署到生产环境。" >> "$report_file"
        
        if [ $CHECK_WARNINGS -gt 0 ]; then
            echo "" >> "$report_file"
            echo "⚠️  存在 $CHECK_WARNINGS 个警告，建议在部署后关注。" >> "$report_file"
        fi
    else
        echo "### ❌ 不建议部署" >> "$report_file"
        echo "" >> "$report_file"
        echo "发现 $CHECK_FAILED 个严重问题，建议修复后再部署。" >> "$report_file"
        echo "" >> "$report_file"
        echo "### 修复步骤" >> "$report_file"
        echo "" >> "$report_file"
        echo "1. 运行修复脚本: \`./scripts/production-migration-fix.sh -c\`" >> "$report_file"
        echo "2. 根据检查结果选择合适的修复方案" >> "$report_file"
        echo "3. 重新运行此检查脚本验证修复结果" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    echo "## 相关脚本" >> "$report_file"
    echo "" >> "$report_file"
    echo "- 迁移修复: \`./scripts/production-migration-fix.sh\`" >> "$report_file"
    echo "- 数据库检查: \`./scripts/check-database-connection.sh\`" >> "$report_file"
    echo "- 健康检查: \`./scripts/health-check.sh\`" >> "$report_file"
    
    log "📄 部署检查报告已生成: $report_file"
}

# 主函数
main() {
    log "🚀 开始生产环境部署前检查..."
    echo ""
    
    # 执行各项检查
    check_environment
    echo ""
    
    check_database_connection
    echo ""
    
    check_migration_status
    echo ""
    
    check_problematic_migrations
    echo ""
    
    check_database_schema
    echo ""
    
    check_dependencies
    echo ""
    
    check_build_status
    echo ""
    
    # 显示检查结果摘要
    log "📊 检查结果摘要:"
    success "通过: $CHECK_PASSED 项"
    
    if [ $CHECK_FAILED -gt 0 ]; then
        error "失败: $CHECK_FAILED 项"
    fi
    
    if [ $CHECK_WARNINGS -gt 0 ]; then
        warn "警告: $CHECK_WARNINGS 项"
    fi
    
    echo ""
    
    # 生成修复建议
    generate_fix_suggestions
    
    # 生成部署报告
    generate_deployment_report
    
    # 返回适当的退出码
    if [ $CHECK_FAILED -gt 0 ]; then
        error "❌ 检查未通过，不建议部署"
        exit 1
    elif [ $CHECK_WARNINGS -gt 0 ]; then
        warn "⚠️  存在警告，请谨慎部署"
        exit 2
    else
        success "✅ 所有检查通过，可以安全部署"
        exit 0
    fi
}

# 显示帮助信息
show_help() {
    echo "生产环境部署前检查脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  -q, --quiet    静默模式，只显示结果"
    echo "  -v, --verbose  详细模式，显示更多信息"
    echo ""
    echo "退出码:"
    echo "  0  所有检查通过"
    echo "  1  存在严重问题，不建议部署"
    echo "  2  存在警告，请谨慎部署"
}

# 解析命令行参数
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -q|--quiet)
        # 重定向日志输出
        exec 3>&1
        exec 1>/dev/null
        main
        exec 1>&3
        ;;
    -v|--verbose)
        set -x
        main
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
