#!/bin/bash

# ===========================================
# Easy ERP Web 系统健康检查脚本
# ===========================================

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROJECT_DIR="/www/wwwroot/easy-erp-web"
LOG_FILE="${PROJECT_DIR}/logs/health-check.log"

# 确保日志目录存在
mkdir -p "${PROJECT_DIR}/logs"

# 日志函数
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" >> "$LOG_FILE"
}

# 检查应用状态
check_application() {
    info "检查应用状态..."
    
    cd "$PROJECT_DIR"
    
    # PM2状态检查
    if command -v pm2 >/dev/null 2>&1; then
        local pm2_status=$(pm2 list | grep "easy-erp-web" | awk '{print $10}' | head -1)
        if [[ "$pm2_status" == "online" ]]; then
            log "✅ PM2应用状态：运行中"
        else
            error "❌ PM2应用状态：$pm2_status"
            return 1
        fi
        
        # 内存使用检查
        local memory_usage=$(pm2 list | grep "easy-erp-web" | awk '{print $8}' | head -1)
        info "💾 应用内存使用：$memory_usage"
        
        # CPU使用检查
        local cpu_usage=$(pm2 list | grep "easy-erp-web" | awk '{print $9}' | head -1)
        info "⚡ 应用CPU使用：$cpu_usage"
    else
        warn "PM2未安装，跳过PM2状态检查"
    fi
    
    # 端口检查
    if netstat -tuln | grep -q ":3008 "; then
        log "✅ 端口3008：正在监听"
    else
        error "❌ 端口3008：未监听"
        return 1
    fi
}

# 检查数据库连接
check_database() {
    info "检查数据库连接..."
    
    cd "$PROJECT_DIR"
    
    # 加载环境变量
    if [ -f ".env" ]; then
        source .env
    else
        error "❌ 环境变量文件.env不存在"
        return 1
    fi
    
    # Prisma数据库连接检查
    if npx prisma db ping >/dev/null 2>&1; then
        log "✅ 数据库连接：正常"
    else
        error "❌ 数据库连接：失败"
        return 1
    fi
    
    # 迁移状态检查
    local migration_status=$(npx prisma migrate status 2>&1 || echo "error")
    if [[ "$migration_status" == *"Database schema is up to date"* ]]; then
        log "✅ 数据库迁移：最新状态"
    elif [[ "$migration_status" == *"pending"* ]]; then
        warn "⚠️ 数据库迁移：有待应用的迁移"
        info "运行 'npx prisma migrate deploy' 应用迁移"
    else
        error "❌ 数据库迁移状态检查失败"
        warn "迁移状态输出：$migration_status"
    fi
    
    # 检查核心表是否存在
    local core_tables=("accounts" "roles" "permissions" "purchase_orders")
    for table in "${core_tables[@]}"; do
        if npx prisma db execute --stdin <<< "SELECT 1 FROM $table LIMIT 1;" >/dev/null 2>&1; then
            log "✅ 核心表 $table：存在"
        else
            error "❌ 核心表 $table：不存在或无法访问"
        fi
    done
}

# 检查API健康状态
check_api_health() {
    info "检查API健康状态..."
    
    # 健康检查端点
    local health_url="http://localhost:3008/api/health"
    if curl -f "$health_url" >/dev/null 2>&1; then
        log "✅ API健康检查：通过"
    else
        error "❌ API健康检查：失败"
        return 1
    fi
    
    # 登录接口测试
    local login_response=$(curl -s -X POST "http://localhost:3008/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"123456"}' || echo "error")
    
    if [[ "$login_response" == *"token"* ]]; then
        log "✅ 登录接口：正常"
    else
        error "❌ 登录接口：异常"
        warn "响应内容：$login_response"
        return 1
    fi
}

# 检查系统资源
check_system_resources() {
    info "检查系统资源..."
    
    # 磁盘空间检查
    local disk_usage=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 80 ]; then
        log "✅ 磁盘使用率：${disk_usage}% (正常)"
    elif [ "$disk_usage" -lt 90 ]; then
        warn "⚠️ 磁盘使用率：${disk_usage}% (较高)"
    else
        error "❌ 磁盘使用率：${disk_usage}% (危险)"
    fi
    
    # 内存使用检查
    local memory_info=$(free -m | grep "Mem:")
    local total_memory=$(echo $memory_info | awk '{print $2}')
    local used_memory=$(echo $memory_info | awk '{print $3}')
    local memory_usage=$((used_memory * 100 / total_memory))
    
    if [ "$memory_usage" -lt 80 ]; then
        log "✅ 内存使用率：${memory_usage}% (正常)"
    elif [ "$memory_usage" -lt 90 ]; then
        warn "⚠️ 内存使用率：${memory_usage}% (较高)"
    else
        error "❌ 内存使用率：${memory_usage}% (危险)"
    fi
    
    # 系统负载检查
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    info "📊 系统负载：$load_avg"
}

# 检查环境配置
check_environment() {
    info "检查环境配置..."
    
    cd "$PROJECT_DIR"
    
    # 环境变量检查
    if [ -f ".env" ]; then
        source .env
        log "✅ 环境变量文件：存在"
        
        # 关键环境变量检查
        local required_vars=("DATABASE_URL" "JWT_SECRET" "NODE_ENV")
        for var in "${required_vars[@]}"; do
            if [ -n "${!var}" ]; then
                log "✅ 环境变量 $var：已设置"
            else
                error "❌ 环境变量 $var：未设置"
            fi
        done
        
        info "🏃 运行环境：${NODE_ENV:-development}"
    else
        error "❌ 环境变量文件：不存在"
        return 1
    fi
    
    # Node.js版本检查
    local node_version=$(node --version 2>/dev/null || echo "未安装")
    info "📦 Node.js版本：$node_version"
    
    # npm版本检查
    local npm_version=$(npm --version 2>/dev/null || echo "未安装")
    info "📦 NPM版本：$npm_version"
}

# 检查日志文件
check_logs() {
    info "检查应用日志..."
    
    cd "$PROJECT_DIR"
    
    # PM2日志检查
    if command -v pm2 >/dev/null 2>&1; then
        local error_count=$(pm2 logs easy-erp-web --lines 100 --nostream 2>/dev/null | grep -i "error" | wc -l || echo "0")
        if [ "$error_count" -eq 0 ]; then
            log "✅ 应用错误日志：无错误"
        else
            warn "⚠️ 应用错误日志：发现 $error_count 个错误"
            info "使用 'pm2 logs easy-erp-web' 查看详细日志"
        fi
    fi
    
    # 检查日志文件大小
    if [ -f "$LOG_FILE" ]; then
        local log_size=$(du -h "$LOG_FILE" | cut -f1)
        info "📄 健康检查日志大小：$log_size"
    fi
}

# 生成报告
generate_report() {
    local status=$1
    local report_file="${PROJECT_DIR}/logs/health-report-$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
===========================================
Easy ERP Web 系统健康检查报告
===========================================

检查时间：$(date '+%Y-%m-%d %H:%M:%S')
系统状态：$status
报告文件：$report_file

详细日志：$LOG_FILE

===========================================
检查项目摘要：
===========================================

1. 应用状态检查
2. 数据库连接检查  
3. API健康状态检查
4. 系统资源检查
5. 环境配置检查
6. 应用日志检查

===========================================
建议操作：
===========================================

✅ 如果所有检查都通过：
   - 系统运行正常，无需额外操作
   
⚠️ 如果发现警告：
   - 监控相关指标，考虑优化
   
❌ 如果发现错误：
   - 立即查看详细日志：tail -f $LOG_FILE
   - 检查应用状态：pm2 status easy-erp-web
   - 重启应用：pm2 restart easy-erp-web
   - 联系技术支持

===========================================
EOF

    info "📊 健康检查报告已生成：$report_file"
}

# 主函数
main() {
    log "🔍 开始系统健康检查..."
    log "===========================================" 
    
    local overall_status="✅ 健康"
    local check_failed=false
    
    # 执行各项检查
    if ! check_application; then
        check_failed=true
    fi
    
    if ! check_database; then
        check_failed=true
    fi
    
    if ! check_api_health; then
        check_failed=true
    fi
    
    check_system_resources  # 资源检查不会导致失败
    check_environment      # 环境检查不会导致失败
    check_logs            # 日志检查不会导致失败
    
    # 确定总体状态
    if [ "$check_failed" = true ]; then
        overall_status="❌ 异常"
        error "系统健康检查发现问题"
    else
        log "✅ 系统健康检查全部通过"
    fi
    
    log "==========================================="
    log "🎉 健康检查完成，总体状态：$overall_status"
    
    # 生成报告
    generate_report "$overall_status"
    
    # 退出码
    if [ "$check_failed" = true ]; then
        exit 1
    else
        exit 0
    fi
}

# 显示帮助信息
show_help() {
    echo "Easy ERP Web 系统健康检查脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help       显示帮助信息"
    echo "  -q, --quiet      静默模式（仅输出错误）"
    echo "  -v, --verbose    详细模式（显示所有信息）"
    echo ""
    echo "检查项目:"
    echo "  • 应用状态（PM2、端口）"
    echo "  • 数据库连接和迁移状态"
    echo "  • API健康状态"
    echo "  • 系统资源使用情况"
    echo "  • 环境配置"
    echo "  • 应用日志"
    echo ""
    echo "输出文件:"
    echo "  • 日志文件: $LOG_FILE"
    echo "  • 报告文件: ./logs/health-report-[timestamp].txt"
    echo ""
}

# 处理命令行参数
case $1 in
    -h|--help)
        show_help
        exit 0
        ;;
    -q|--quiet)
        # 静默模式：重定向输出到日志文件
        exec 1>>"$LOG_FILE"
        main
        ;;
    -v|--verbose)
        # 详细模式：显示所有信息（默认行为）
        main
        ;;
    "")
        # 无参数：正常模式
        main
        ;;
    *)
        echo "未知选项: $1"
        echo "使用 $0 --help 查看帮助信息"
        exit 1
        ;;
esac 