#!/bin/bash

# ===========================================
# Easy ERP Web 自动化部署脚本 v2.0
# ===========================================
# 用于在宝塔面板环境中安全部署 Easy ERP Web 应用
# 
# 特性:
# - 完整的错误处理和回滚机制
# - 数据库迁移和种子数据自动化
# - 安全的环境变量配置
# - 自动备份和恢复
# - 详细的部署日志记录
#
# 作者: Easy ERP Team
# 版本: 2.0.0
# 更新: 2025-01-17
# ===========================================

set -e

# 配置变量
PROJECT_DIR="/www/wwwroot/easy-erp-web"
BACKUP_DIR="/www/backup/easy-erp-web"
LOG_FILE="/www/wwwroot/easy-erp-web/logs/deploy.log"
SCRIPT_VERSION="2.0.0"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "请使用 root 用户运行此脚本"
        exit 1
    fi
}

# 检查宝塔面板是否已安装
check_bt_panel() {
    if ! command -v bt &> /dev/null; then
        error "宝塔面板未安装，请先安装宝塔面板"
        exit 1
    fi
    log "宝塔面板检查通过"
}

# 检查必要的软件
check_dependencies() {
    log "检查必要的软件..."

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js 未安装，请在宝塔面板中安装 Node.js 18.x"
        exit 1
    fi

    # 检查 npm（Node.js 自带，无需额外安装）
    if ! command -v npm &> /dev/null; then
        error "npm 未安装，请确保 Node.js 已正确安装"
        exit 1
    fi

    # 检查 PM2
    if ! command -v pm2 &> /dev/null; then
        log "安装 PM2..."
        npm install -g pm2
    fi

    # 检查 MySQL
    if ! systemctl is-active --quiet mysqld; then
        error "MySQL 服务未运行，请启动 MySQL 服务"
        exit 1
    fi

    # 检查 Redis
    if ! systemctl is-active --quiet redis; then
        warn "Redis 服务未运行，请启动 Redis 服务"
    fi

    log "依赖检查完成"
}

# 验证环境变量
validate_env_vars() {
    log "验证环境变量..."

    # 检查 .env 文件是否存在
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        error "环境变量文件 .env 不存在"
        return 1
    fi

    # 加载环境变量
    source "$PROJECT_DIR/.env"

    # 验证必要的环境变量
    local required_vars=("DATABASE_URL" "JWT_SECRET" "NODE_ENV")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -ne 0 ]; then
        error "缺少必要的环境变量: ${missing_vars[*]}"
        return 1
    fi

    # 验证数据库URL格式
    if [[ ! $DATABASE_URL =~ ^mysql://.*@.*:.*/.*$ ]]; then
        error "数据库URL格式不正确: $DATABASE_URL"
        return 1
    fi

    # 检查是否使用默认密码
    if [[ $DATABASE_URL == *"your_password"* ]]; then
        error "请修改数据库密码，不要使用默认值"
        return 1
    fi

    # 验证JWT密钥长度
    if [ ${#JWT_SECRET} -lt 32 ]; then
        error "JWT密钥长度不足，至少需要32个字符"
        return 1
    fi

    log "环境变量验证通过"
    return 0
}

# 测试数据库连接
test_database_connection() {
    log "测试数据库连接..."

    # 从 DATABASE_URL 解析连接信息
    local db_url="$DATABASE_URL"
    local db_user=$(echo "$db_url" | sed -n 's|mysql://\([^:]*\):.*|\1|p')
    local db_pass=$(echo "$db_url" | sed -n 's|mysql://[^:]*:\([^@]*\)@.*|\1|p')
    local db_host=$(echo "$db_url" | sed -n 's|mysql://[^@]*@\([^:]*\):.*|\1|p')
    local db_port=$(echo "$db_url" | sed -n 's|mysql://[^@]*@[^:]*:\([^/]*\)/.*|\1|p')
    local db_name=$(echo "$db_url" | sed -n 's|mysql://[^/]*/\(.*\)|\1|p')

    # 测试连接
    if ! mysql -h"$db_host" -P"$db_port" -u"$db_user" -p"$db_pass" -e "SELECT 1;" "$db_name" &>/dev/null; then
        error "数据库连接失败，请检查数据库配置和服务状态"
        return 1
    fi

    # 检查数据库是否存在
    if ! mysql -h"$db_host" -P"$db_port" -u"$db_user" -p"$db_pass" -e "USE $db_name;" &>/dev/null; then
        warn "数据库 $db_name 不存在，将自动创建"
        mysql -h"$db_host" -P"$db_port" -u"$db_user" -p"$db_pass" -e "CREATE DATABASE IF NOT EXISTS $db_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    fi

    log "数据库连接测试通过"
    return 0
}

# 验证种子数据是否存在
verify_seed_data_exists() {
    log "验证种子数据..."
    
    # 检查admin用户是否存在
    local admin_exists=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -se "SELECT COUNT(*) FROM accounts WHERE name='admin'" 2>/dev/null || echo "0")
    
    if [ "$admin_exists" -eq 0 ]; then
        log "admin用户不存在，需要执行种子数据"
        return 1
    fi
    
    # 检查角色是否存在
    local role_count=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -se "SELECT COUNT(*) FROM roles" 2>/dev/null || echo "0")
    
    if [ "$role_count" -eq 0 ]; then
        log "角色数据不存在，需要执行种子数据"
        return 1
    fi
    
    # 检查权限是否存在
    local permission_count=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -se "SELECT COUNT(*) FROM permissions" 2>/dev/null || echo "0")
    
    if [ "$permission_count" -eq 0 ]; then
        log "权限数据不存在，需要执行种子数据"
        return 1
    fi
    
    log "种子数据已存在"
    return 0
}

# 备份数据库
backup_database() {
    log "备份数据库..."

    # 解析数据库连接信息
    local db_url="$DATABASE_URL"
    local db_user=$(echo "$db_url" | sed -n 's|mysql://\([^:]*\):.*|\1|p')
    local db_pass=$(echo "$db_url" | sed -n 's|mysql://[^:]*:\([^@]*\)@.*|\1|p')
    local db_host=$(echo "$db_url" | sed -n 's|mysql://[^@]*@\([^:]*\):.*|\1|p')
    local db_port=$(echo "$db_url" | sed -n 's|mysql://[^@]*@[^:]*:\([^/]*\)/.*|\1|p')
    local db_name=$(echo "$db_url" | sed -n 's|mysql://[^/]*/\(.*\)|\1|p')

    # 创建备份目录
    mkdir -p "$BACKUP_DIR/database"

    # 检查数据库是否有表
    local table_count=$(mysql -h"$db_host" -P"$db_port" -u"$db_user" -p"$db_pass" -e "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema='$db_name';" -s -N 2>/dev/null || echo "0")

    if [ "$table_count" -gt 0 ]; then
        local backup_file="$BACKUP_DIR/database/backup_$(date +%Y%m%d_%H%M%S).sql"
        
        # 执行备份
        if mysqldump -h"$db_host" -P"$db_port" -u"$db_user" -p"$db_pass" \
            --single-transaction \
            --routines \
            --triggers \
            "$db_name" > "$backup_file" 2>/dev/null; then
            log "数据库备份完成: $backup_file"
            
            # 压缩备份文件
            gzip "$backup_file"
            log "备份文件已压缩: ${backup_file}.gz"
        else
            warn "数据库备份失败，但部署将继续"
        fi
    else
        log "数据库为空，跳过备份"
    fi

    return 0
}

# 验证种子数据
verify_seed_data() {
    log "验证种子数据..."

    cd "$PROJECT_DIR"

    # 验证必要的表是否存在
    local required_tables=("accounts" "roles" "permissions")
    local missing_tables=()

    # 解析数据库连接信息
    local db_url="$DATABASE_URL"
    local db_user=$(echo "$db_url" | sed -n 's|mysql://\([^:]*\):.*|\1|p')
    local db_pass=$(echo "$db_url" | sed -n 's|mysql://[^:]*:\([^@]*\)@.*|\1|p')
    local db_host=$(echo "$db_url" | sed -n 's|mysql://[^@]*@\([^:]*\):.*|\1|p')
    local db_port=$(echo "$db_url" | sed -n 's|mysql://[^@]*@[^:]*:\([^/]*\)/.*|\1|p')
    local db_name=$(echo "$db_url" | sed -n 's|mysql://[^/]*/\(.*\)|\1|p')

    for table in "${required_tables[@]}"; do
        local table_exists=$(mysql -h"$db_host" -P"$db_port" -u"$db_user" -p"$db_pass" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$db_name' AND table_name='$table';" -s -N 2>/dev/null || echo "0")
        
        if [ "$table_exists" -eq 0 ]; then
            missing_tables+=("$table")
        fi
    done

    if [ ${#missing_tables[@]} -ne 0 ]; then
        warn "缺少必要的表: ${missing_tables[*]}，需要执行数据库初始化"
        return 1
    fi

    # 检查是否有管理员账户
    local admin_count=$(mysql -h"$db_host" -P"$db_port" -u"$db_user" -p"$db_pass" -e "SELECT COUNT(*) FROM $db_name.accounts WHERE name='admin';" -s -N 2>/dev/null || echo "0")
    
    if [ "$admin_count" -eq 0 ]; then
        warn "未找到管理员账户，需要执行种子数据"
        return 1
    fi

    log "种子数据验证通过"
    return 0
}

# 创建项目目录
create_directories() {
    log "创建项目目录..."

    mkdir -p "$PROJECT_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$PROJECT_DIR/logs"

    log "目录创建完成"
}

# 备份现有项目
backup_project() {
    if [ -d "$PROJECT_DIR/.git" ]; then
        log "备份现有项目..."

        BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
        cp -r "$PROJECT_DIR" "$BACKUP_DIR/$BACKUP_NAME"

        log "备份完成: $BACKUP_DIR/$BACKUP_NAME"
    fi
}

# 克隆或更新项目
clone_or_update_project() {
    log "获取项目代码..."

    if [ ! -d "$PROJECT_DIR/.git" ]; then
        log "克隆项目..."
        git clone https://github.com/your-username/easy-erp-web.git "$PROJECT_DIR"
    else
        log "更新项目..."
        cd "$PROJECT_DIR"
        git pull origin main
    fi

    log "项目代码获取完成"
}

# 安装依赖
install_dependencies() {
    log "安装项目依赖..."

    cd "$PROJECT_DIR"
    npm install --production

    log "依赖安装完成"
}

# 构建项目
build_project() {
    log "构建项目..."

    cd "$PROJECT_DIR"
    npm run build

    log "项目构建完成"
}

# 配置环境变量
configure_env() {
    log "配置环境变量..."

    if [ ! -f "$PROJECT_DIR/.env" ]; then
        # 生成安全的随机密钥
        local jwt_secret=$(openssl rand -base64 48)
        local random_db_password=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)
        
        cat > "$PROJECT_DIR/.env" << EOF
# ===========================================
# Easy ERP Web 生产环境配置文件
# ===========================================

# 数据库配置
# 请修改用户名、密码、主机和数据库名称
DATABASE_URL="mysql://easy_erp_user:${random_db_password}@localhost:3306/easy_erp_web"

# Redis配置
REDIS_URL="redis://localhost:6379"

# JWT配置 - 自动生成的安全密钥
JWT_SECRET="${jwt_secret}"

# 阿里云OSS配置
# 请填入您的阿里云OSS配置信息
OSS_ACCESS_KEY_ID="请填入您的AccessKeyId"
OSS_ACCESS_KEY_SECRET="请填入您的AccessKeySecret"
OSS_BUCKET="请填入您的Bucket名称"
OSS_REGION="oss-cn-hangzhou"
OSS_ENDPOINT="oss-cn-hangzhou.aliyuncs.com"

# 应用配置
NODE_ENV=production
PORT=3008
HOSTNAME=0.0.0.0

# Next.js 配置
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# 日志配置
LOG_LEVEL=info

# 安全配置
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=3600

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# API 限流配置
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000
EOF

        # 设置安全的文件权限
        chmod 600 "$PROJECT_DIR/.env"
        
        # 创建配置检查清单
        cat > "$PROJECT_DIR/.env.checklist" << EOF
# 环境变量配置检查清单
# 请逐项检查并修改以下配置：

1. DATABASE_URL - 修改数据库用户名、密码和连接信息
   当前生成的随机密码: ${random_db_password}
   
2. OSS_ACCESS_KEY_ID - 填入您的阿里云AccessKeyId
3. OSS_ACCESS_KEY_SECRET - 填入您的阿里云AccessKeySecret  
4. OSS_BUCKET - 填入您的OSS存储桶名称
5. NEXT_PUBLIC_APP_URL - 修改为您的实际域名

注意：
- JWT_SECRET 已自动生成，无需修改
- 数据库密码已自动生成，请更新MySQL用户密码
- .env 文件权限已设置为 600 (仅所有者可读写)
EOF

        warn "==============================================="
        warn "环境变量文件已创建: $PROJECT_DIR/.env"
        warn "配置检查清单: $PROJECT_DIR/.env.checklist"
        warn "==============================================="
        warn "重要：请立即编辑 .env 文件并填入正确的配置信息"
        warn "数据库随机密码已生成，请记录并更新MySQL用户密码"
        warn "==============================================="
        
        # 暂停执行，等待用户配置
        read -p "请编辑 .env 文件完成配置后按 Enter 继续..."
        
        # 验证配置是否完成
        if grep -q "请填入" "$PROJECT_DIR/.env"; then
            error "检测到未完成的配置项，请完成所有必要配置"
            return 1
        fi
        
    else
        log "环境变量文件已存在，验证配置..."
        
        # 验证现有配置
        if ! validate_env_vars; then
            error "现有环境变量配置不正确"
            return 1
        fi
        
        # 检查文件权限
        local file_perms=$(stat -c "%a" "$PROJECT_DIR/.env" 2>/dev/null || stat -f "%A" "$PROJECT_DIR/.env" 2>/dev/null || echo "unknown")
        if [ "$file_perms" != "600" ]; then
            warn "调整 .env 文件权限为 600"
            chmod 600 "$PROJECT_DIR/.env"
        fi
    fi
    
    log "环境变量配置完成"
    return 0
}

# 数据库初始化
init_database() {
    log "初始化数据库..."

    cd "$PROJECT_DIR"

    # 验证环境变量
    if ! validate_env_vars; then
        error "环境变量验证失败"
        return 1
    fi

    # 测试数据库连接
    if ! test_database_connection; then
        error "数据库连接测试失败"
        return 1
    fi

    # 备份现有数据库（如果有数据）
    backup_database

    # 生成 Prisma 客户端
    log "生成 Prisma 客户端..."
    if ! npx prisma generate; then
        error "Prisma 客户端生成失败"
        return 1
    fi

    # 使用智能迁移同步系统
    log "执行数据库同步和迁移..."
    if ! npm run db:sync-migrate; then
        error "数据库操作失败"
        return 1
    fi
    
    log "✅ 数据库操作完成"

    # 最终验证数据库状态
    log "验证数据库最终状态..."
    if ! npx prisma db execute --stdin <<< "SELECT 1;" &>/dev/null; then
        error "数据库最终状态验证失败"
        return 1
    fi

    log "数据库初始化完成"
    return 0
}

# 启动应用
start_application() {
    log "启动应用..."

    cd "$PROJECT_DIR"

    # 停止现有应用
    pm2 stop easy-erp-web 2>/dev/null || true

    # 启动新应用
    pm2 start ecosystem.config.js --env production

    # 保存 PM2 配置
    pm2 save

    # 设置开机自启
    pm2 startup

    log "应用启动完成"
}

# 配置 Nginx
configure_nginx() {
    log "配置 Nginx..."

    # 这里需要用户手动在宝塔面板中配置
    warn "请在宝塔面板中手动配置 Nginx 反向代理"
    warn "参考部署文档中的 Nginx 配置部分"
}

# 检查部署状态
check_deployment() {
    log "检查部署状态..."

    # 检查 PM2 状态
    pm2 status

    # 检查端口
    if netstat -tlnp | grep -q ":3008"; then
        log "应用正在监听 3008 端口"
    else
        error "应用未正确启动"
        exit 1
    fi

    log "部署检查完成"
}

# 回滚函数
rollback_on_failure() {
    local step="$1"
    local backup_name="$2"
    
    error "部署在 $step 步骤失败，开始回滚..."
    
    # 停止应用
    pm2 stop easy-erp-web 2>/dev/null || true
    
    # 如果有备份，恢复代码
    if [ -n "$backup_name" ] && [ -d "$BACKUP_DIR/$backup_name" ]; then
        log "恢复代码备份..."
        rm -rf "$PROJECT_DIR"
        mv "$BACKUP_DIR/$backup_name" "$PROJECT_DIR"
    fi
    
    # 如果有数据库备份，提供恢复选项
    local latest_db_backup=$(ls -t "$BACKUP_DIR/database/"*.sql.gz 2>/dev/null | head -1)
    if [ -n "$latest_db_backup" ]; then
        warn "发现数据库备份: $latest_db_backup"
        read -p "是否恢复数据库备份？[y/N]: " restore_db
        if [[ $restore_db =~ ^[Yy]$ ]]; then
            log "恢复数据库备份..."
            # 解压并恢复数据库备份的逻辑
            gunzip -c "$latest_db_backup" | mysql -h"$db_host" -P"$db_port" -u"$db_user" -p"$db_pass" "$db_name"
        fi
    fi
    
    error "回滚完成，请检查问题后重新部署"
    exit 1
}

# 检查部署前置条件
check_prerequisites() {
    log "检查部署前置条件..."
    
    # 检查磁盘空间
    local available_space=$(df "$PROJECT_DIR" | awk 'NR==2 {print $4}')
    local required_space=1048576  # 1GB in KB
    
    if [ "$available_space" -lt "$required_space" ]; then
        error "磁盘空间不足，至少需要 1GB 可用空间"
        return 1
    fi
    
    # 检查端口是否被占用
    if netstat -tlnp | grep -q ":3008"; then
        warn "端口 3008 已被占用，将尝试停止现有进程"
        pm2 stop easy-erp-web 2>/dev/null || true
        sleep 2
        if netstat -tlnp | grep -q ":3008"; then
            error "无法释放端口 3008，请手动处理"
            return 1
        fi
    fi
    
    # 检查必要的系统工具
    local required_tools=("git" "node" "npm" "mysql" "mysqldump" "gzip")
    local missing_tools=()
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        error "缺少必要的系统工具: ${missing_tools[*]}"
        return 1
    fi
    
    log "前置条件检查通过"
    return 0
}

# 清理函数
cleanup() {
    log "清理临时文件..."
    
    # 清理临时文件
    find "$PROJECT_DIR" -name "*.tmp" -delete 2>/dev/null || true
    find "$PROJECT_DIR" -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # 清理旧的日志文件（保留最近7天）
    find "$PROJECT_DIR/logs" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    # 清理旧的备份文件（保留最近30天）
    find "$BACKUP_DIR" -name "backup_*" -mtime +30 -exec rm -rf {} + 2>/dev/null || true
    
    log "清理完成"
}

# 主函数
main() {
    log "开始部署 Easy ERP Web..."
    
    local backup_name=""
    local current_step=""

    # 设置错误处理
    set -e
    trap 'rollback_on_failure "$current_step" "$backup_name"' ERR

    # 步骤1：基础检查
    current_step="基础检查"
    check_root || exit 1
    check_bt_panel || exit 1
    check_prerequisites || exit 1
    check_dependencies || exit 1

    # 步骤2：环境准备
    current_step="环境准备"
    create_directories || exit 1

    # 步骤3：代码备份和更新
    current_step="代码备份"
    if [ -d "$PROJECT_DIR/.git" ]; then
        backup_name="backup_$(date +%Y%m%d_%H%M%S)"
        backup_project || warn "代码备份失败，但部署将继续"
    fi

    current_step="代码更新"
    clone_or_update_project || exit 1

    # 步骤4：依赖安装
    current_step="依赖安装"
    install_dependencies || exit 1

    # 步骤5：环境配置
    current_step="环境配置"
    configure_env || exit 1

    # 步骤6：数据库初始化（关键步骤）
    current_step="数据库初始化"
    init_database || exit 1

    # 步骤7：项目构建
    current_step="项目构建"
    build_project || exit 1

    # 步骤8：应用启动
    current_step="应用启动"
    start_application || exit 1

    # 步骤9：服务验证
    current_step="服务验证"
    check_deployment || exit 1

    # 步骤10：Nginx配置提醒
    current_step="Nginx配置"
    configure_nginx

    # 步骤11：清理
    current_step="清理"
    cleanup

    # 取消错误处理陷阱
    trap - ERR
    set +e

    log "==============================================="
    log "🎉 Easy ERP Web 部署成功！"
    log "==============================================="
    log "📍 应用URL: http://localhost:3008"
    log "📁 项目目录: $PROJECT_DIR"
    log "📊 查看状态: pm2 status"
    log "📋 查看日志: pm2 logs easy-erp-web"
    log "🔄 重启应用: pm2 restart easy-erp-web"
    log "📝 配置文件: $PROJECT_DIR/.env"
    log "==============================================="
    log "⚠️ 重要提醒："
    log "1. 请在宝塔面板中配置 Nginx 反向代理"
    log "2. 配置 SSL 证书以启用 HTTPS"
    log "3. 定期备份数据库和配置文件"
    log "4. 监控应用运行状态和日志"
    log "==============================================="
    
    # 显示管理员账户信息
    if [ -f "$PROJECT_DIR/.env" ]; then
        source "$PROJECT_DIR/.env"
        log "默认管理员账户:"
        log "用户名: admin"
        log "密码: 123456"
        log "⚠️ 请立即登录并修改默认密码！"
    fi
}

# 捕获退出信号（仅在实际部署时）
if [[ $1 != "--help" && $1 != "-h" && $1 != "--version" ]]; then
    trap cleanup EXIT
fi

# 显示帮助信息
if [[ $1 == "--help" || $1 == "-h" ]]; then
    echo "==========================================="
    echo "  Easy ERP Web 自动化部署脚本 v$SCRIPT_VERSION"
    echo "==========================================="
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help        显示此帮助信息"
    echo "  --version         显示版本信息"
    echo "  --update-only     仅更新项目代码和重启"
    echo "  --build-only      仅重新构建项目"
    echo "  --db-only         仅执行数据库操作"
    echo "  --check           检查部署环境和配置"
    echo ""
    echo "完整部署流程:"
    echo "  1. 系统检查     - 检查依赖、权限、资源"
    echo "  2. 环境准备     - 创建目录、配置权限"
    echo "  3. 代码管理     - 备份、克隆/更新代码"
    echo "  4. 依赖安装     - 安装项目依赖包"
    echo "  5. 环境配置     - 生成安全的配置文件"
    echo "  6. 数据库操作   - 迁移、种子数据、验证"
    echo "  7. 项目构建     - 编译生产环境代码"
    echo "  8. 应用启动     - PM2 启动和配置"
    echo "  9. 服务验证     - 健康检查和状态验证"
    echo "  10. 清理优化    - 临时文件清理"
    echo ""
    echo "示例:"
    echo "  $0                      # 完整部署流程"
    echo "  $0 --update-only        # 快速更新代码"
    echo "  $0 --build-only         # 重新构建"
    echo "  $0 --db-only            # 仅数据库操作"
    echo "  $0 --check              # 环境检查"
    echo ""
    echo "重要提醒:"
    echo "  • 请确保以 root 用户运行"
    echo "  • 首次部署需要手动配置 .env 文件"
    echo "  • 建议在测试环境先验证部署流程"
    echo "  • 部署过程中请勿中断脚本执行"
    echo ""
    echo "日志文件: $LOG_FILE"
    echo "项目目录: $PROJECT_DIR"
    echo "备份目录: $BACKUP_DIR"
    echo "==========================================="
    exit 0
fi

# 显示版本信息
if [[ $1 == "--version" ]]; then
    echo "Easy ERP Web 部署脚本 v$SCRIPT_VERSION"
    echo "构建日期: 2025-01-17"
    echo "兼容环境: CentOS 7+, Ubuntu 18+, 宝塔面板"
    exit 0
fi

# 处理参数
case $1 in
    --update-only)
        log "执行快速更新..."
        check_root || exit 1
        clone_or_update_project || exit 1
        install_dependencies || exit 1
        build_project || exit 1
        pm2 reload easy-erp-web || exit 1
        log "快速更新完成"
        ;;
    --build-only)
        log "执行重新构建..."
        check_root || exit 1
        cd "$PROJECT_DIR"
        build_project || exit 1
        pm2 reload easy-erp-web || exit 1
        log "重新构建完成"
        ;;
    --db-only)
        log "执行数据库操作..."
        check_root || exit 1
        cd "$PROJECT_DIR"
        configure_env || exit 1
        init_database || exit 1
        log "数据库操作完成"
        ;;
    --check)
        log "执行环境检查..."
        check_root || exit 1
        check_bt_panel || exit 1
        check_prerequisites || exit 1
        check_dependencies || exit 1
        if [ -f "$PROJECT_DIR/.env" ]; then
            validate_env_vars || exit 1
            test_database_connection || exit 1
        else
            warn ".env 文件不存在，请先运行完整部署"
        fi
        log "环境检查完成"
        ;;
    ""|--full)
        main
        ;;
    *)
        error "未知选项: $1"
        echo "使用 $0 --help 查看帮助信息"
        exit 1
        ;;
esac
