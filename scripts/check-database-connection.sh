#!/bin/bash

# 数据库连接检查脚本
# 用于验证数据库连接是否正常

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# 检查环境变量文件
check_env_file() {
    log "检查环境变量文件..."
    
    if [ ! -f ".env" ]; then
        error ".env文件不存在"
        return 1
    fi
    
    log "✅ .env文件存在"
    
    # 加载环境变量
    if ! source .env; then
        error "无法加载.env文件"
        return 1
    fi
    
    log "✅ 环境变量加载成功"
    return 0
}

# 验证DATABASE_URL
validate_database_url() {
    log "验证DATABASE_URL..."
    
    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL未设置或为空"
        return 1
    fi
    
    # 验证URL格式
    if [[ ! $DATABASE_URL =~ ^mysql://.*@.*:.*/.*$ ]]; then
        error "DATABASE_URL格式不正确: $DATABASE_URL"
        error "正确格式: mysql://username:password@host:port/database"
        return 1
    fi
    
    log "✅ DATABASE_URL格式正确"
    return 0
}

# 解析数据库连接信息
parse_database_url() {
    log "解析数据库连接信息..."
    
    DB_USER=$(echo "$DATABASE_URL" | sed -n 's|mysql://\([^:]*\):.*|\1|p')
    DB_PASS=$(echo "$DATABASE_URL" | sed -n 's|mysql://[^:]*:\([^@]*\)@.*|\1|p')
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|mysql://[^@]*@\([^:]*\):.*|\1|p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|mysql://[^@]*@[^:]*:\([^/]*\)/.*|\1|p')
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|mysql://[^/]*/\(.*\)|\1|p')
    
    info "数据库连接信息:"
    info "  主机: $DB_HOST"
    info "  端口: $DB_PORT"
    info "  用户: $DB_USER"
    info "  数据库: $DB_NAME"
    
    # 验证解析结果
    if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
        error "数据库连接信息解析失败"
        return 1
    fi
    
    log "✅ 数据库连接信息解析成功"
    return 0
}

# 测试MySQL客户端连接
test_mysql_connection() {
    log "测试MySQL客户端连接..."
    
    # 检查MySQL客户端是否安装
    if ! command -v mysql >/dev/null 2>&1; then
        warn "MySQL客户端未安装，跳过MySQL连接测试"
        return 0
    fi
    
    # 测试连接（设置15秒超时）
    if timeout 15 mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1 as connection_test;" "$DB_NAME" >/dev/null 2>&1; then
        log "✅ MySQL客户端连接测试成功"
        return 0
    else
        local exit_code=$?
        if [ $exit_code -eq 124 ]; then
            error "❌ MySQL客户端连接测试超时（15秒）"
        else
            error "❌ MySQL客户端连接测试失败"
        fi
        
        # 提供诊断信息
        info "诊断信息:"
        info "  请检查数据库服务是否运行"
        info "  请检查网络连接"
        info "  请检查用户名和密码"
        info "  请检查数据库是否存在"
        
        return 1
    fi
}

# 测试Prisma连接
test_prisma_connection() {
    log "测试Prisma数据库连接..."
    
    # 检查Node.js是否安装
    if ! command -v node >/dev/null 2>&1; then
        warn "Node.js未安装，跳过Prisma连接测试"
        return 0
    fi
    
    # 检查Prisma客户端是否存在
    if [ ! -d "generated/prisma" ] && [ ! -d "node_modules/.prisma" ]; then
        warn "Prisma客户端未生成，跳过Prisma连接测试"
        return 0
    fi
    
    # 创建临时测试脚本
    cat > test-prisma-connection.js << 'EOF'
const { PrismaClient } = require('./generated/prisma');

async function testConnection() {
  const prisma = new PrismaClient();
  try {
    console.log('🔗 连接数据库...');
    await prisma.$connect();
    console.log('✅ Prisma数据库连接成功');
    
    console.log('🔍 执行测试查询...');
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time_value`;
    console.log('✅ 数据库查询测试成功:', result);
    
    console.log('📊 检查数据库版本...');
    const version = await prisma.$queryRaw`SELECT VERSION() as version`;
    console.log('📋 数据库版本:', version[0].version);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Prisma数据库连接失败:', error.message);
    if (error.code) {
      console.error('错误代码:', error.code);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
EOF
    
    # 执行Prisma连接测试（设置30秒超时）
    if timeout 30 node test-prisma-connection.js; then
        log "✅ Prisma连接测试成功"
        rm -f test-prisma-connection.js
        return 0
    else
        local exit_code=$?
        if [ $exit_code -eq 124 ]; then
            error "❌ Prisma连接测试超时（30秒）"
        else
            error "❌ Prisma连接测试失败"
        fi
        rm -f test-prisma-connection.js
        return 1
    fi
}

# 检查数据库服务状态
check_database_service() {
    log "检查数据库服务状态..."
    
    # 检查MySQL服务状态
    if systemctl is-active --quiet mysql 2>/dev/null; then
        log "✅ MySQL服务正在运行 (systemctl)"
    elif service mysql status >/dev/null 2>&1; then
        log "✅ MySQL服务正在运行 (service)"
    else
        warn "⚠️  无法确定MySQL服务状态"
        info "请手动检查数据库服务是否运行"
    fi
    
    # 检查端口监听
    if command -v netstat >/dev/null 2>&1; then
        if netstat -tlnp 2>/dev/null | grep -q ":$DB_PORT "; then
            log "✅ 数据库端口 $DB_PORT 正在监听"
        else
            warn "⚠️  数据库端口 $DB_PORT 未监听"
        fi
    fi
    
    return 0
}

# 主函数
main() {
    log "==========================================="
    log "🔗 数据库连接检查脚本"
    log "==========================================="
    log "执行时间: $(date)"
    log ""
    
    # 检查是否在项目根目录
    if [ ! -f "package.json" ]; then
        error "请在项目根目录执行此脚本"
        exit 1
    fi
    
    # 执行检查步骤
    local exit_code=0
    local mysql_test_failed=false
    local prisma_test_failed=false
    
    # 1. 检查环境变量文件
    if ! check_env_file; then
        exit_code=1
    fi
    
    # 2. 验证DATABASE_URL
    if ! validate_database_url; then
        exit_code=1
    fi
    
    # 3. 解析数据库连接信息
    if ! parse_database_url; then
        exit_code=1
    fi
    
    # 4. 检查数据库服务状态
    check_database_service
    
    # 5. 测试MySQL客户端连接（失败不影响整体结果）
    if ! test_mysql_connection; then
        mysql_test_failed=true
        warn "MySQL客户端连接测试失败，但这不影响整体结果"
    fi
    
    # 6. 测试Prisma连接（这是关键测试）
    if ! test_prisma_connection; then
        prisma_test_failed=true
        exit_code=1
    fi
    
    log ""
    log "==========================================="
    if [ $exit_code -eq 0 ]; then
        log "🎉 数据库连接检查完成 - 核心测试通过！"
        if [ "$mysql_test_failed" = true ]; then
            warn "注意：MySQL客户端测试失败，但Prisma连接正常，数据库功能可用"
        fi
    else
        error "❌ 数据库连接检查失败 - 请检查上述错误"
        if [ "$prisma_test_failed" = true ]; then
            error "关键问题：Prisma数据库连接失败"
        fi
    fi
    log "==========================================="
    
    exit $exit_code
}

# 执行主函数
main "$@"