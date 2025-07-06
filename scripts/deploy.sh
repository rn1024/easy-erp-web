#!/bin/bash

# Easy ERP Web 部署脚本
# 用于在宝塔面板环境中部署应用

set -e

# 配置变量
PROJECT_DIR="/www/wwwroot/easy-erp-web"
BACKUP_DIR="/www/backup/easy-erp-web"
LOG_FILE="/www/wwwroot/easy-erp-web/logs/deploy.log"

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

    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        log "安装 pnpm..."
        npm install -g pnpm@8
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
    pnpm install --frozen-lockfile

    log "依赖安装完成"
}

# 构建项目
build_project() {
    log "构建项目..."

    cd "$PROJECT_DIR"
    pnpm build

    log "项目构建完成"
}

# 配置环境变量
configure_env() {
    log "配置环境变量..."

    if [ ! -f "$PROJECT_DIR/.env" ]; then
        cat > "$PROJECT_DIR/.env" << EOF
# 数据库配置
DATABASE_URL="mysql://easy_erp_user:your_password@localhost:3306/easy_erp_web"

# Redis配置
REDIS_URL="redis://localhost:6379"

# JWT配置
JWT_SECRET="$(openssl rand -base64 32)"

# 阿里云OSS配置
OSS_ACCESS_KEY_ID="your-access-key-id"
OSS_ACCESS_KEY_SECRET="your-access-key-secret"
OSS_BUCKET="your-bucket-name"
OSS_REGION="oss-cn-hangzhou"
OSS_ENDPOINT="oss-cn-hangzhou.aliyuncs.com"

# 应用配置
NODE_ENV=production
PORT=3000
EOF
        warn "环境变量文件已创建，请编辑 $PROJECT_DIR/.env 文件填入正确的配置"
    fi
}

# 数据库初始化
init_database() {
    log "初始化数据库..."

    cd "$PROJECT_DIR"

    # 使用项目本地的 Prisma（推荐）
    npx prisma generate
    npx prisma db push

    # 或者使用 pnpm scripts（更推荐）
    # pnpm db:generate
    # pnpm db:push

    log "数据库初始化完成"
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
    if netstat -tlnp | grep -q ":3000"; then
        log "应用正在监听 3000 端口"
    else
        error "应用未正确启动"
        exit 1
    fi

    log "部署检查完成"
}

# 清理函数
cleanup() {
    log "清理临时文件..."
    # 清理逻辑
}

# 主函数
main() {
    log "开始部署 Easy ERP Web..."

    check_root
    check_bt_panel
    check_dependencies
    create_directories
    backup_project
    clone_or_update_project
    install_dependencies
    build_project
    configure_env
    init_database
    start_application
    configure_nginx
    check_deployment
    cleanup

    log "部署完成！"
    log "请访问您的域名查看应用"
    log "如需查看日志，请使用：pm2 logs easy-erp-web"
}

# 捕获退出信号
trap cleanup EXIT

# 显示帮助信息
if [[ $1 == "--help" || $1 == "-h" ]]; then
    echo "Easy ERP Web 部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  --update-only  仅更新项目代码"
    echo "  --build-only   仅构建项目"
    echo ""
    echo "示例:"
    echo "  $0                 # 完整部署"
    echo "  $0 --update-only   # 仅更新代码"
    echo "  $0 --build-only    # 仅构建"
    exit 0
fi

# 处理参数
case $1 in
    --update-only)
        clone_or_update_project
        install_dependencies
        build_project
        pm2 reload easy-erp-web
        ;;
    --build-only)
        build_project
        pm2 reload easy-erp-web
        ;;
    *)
        main
        ;;
esac
