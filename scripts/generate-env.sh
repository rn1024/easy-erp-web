#!/bin/bash

# 环境变量生成脚本
# 用于生成 .env 文件

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Easy ERP Web 环境变量配置向导${NC}"
echo "======================================"

# 生成随机JWT密钥
generate_jwt_secret() {
    openssl rand -base64 32
}

# 询问用户输入
ask_input() {
    local prompt=$1
    local default=$2
    local var_name=$3

    if [ -n "$default" ]; then
        read -p "$(echo -e "${YELLOW}$prompt${NC} (默认: $default): ")" input
        eval "$var_name=\"${input:-$default}\""
    else
        read -p "$(echo -e "${YELLOW}$prompt${NC}: ")" input
        eval "$var_name=\"$input\""
    fi
}

# 主配置函数
main() {
    echo -e "${GREEN}正在收集环境变量信息...${NC}"
    echo ""

    # 数据库配置
    echo -e "${GREEN}1. 数据库配置${NC}"
    ask_input "MySQL 用户名" "easy_erp_user" "DB_USER"
    ask_input "MySQL 密码" "" "DB_PASSWORD"
    ask_input "MySQL 主机" "localhost" "DB_HOST"
    ask_input "MySQL 端口" "3306" "DB_PORT"
    ask_input "数据库名" "easy_erp_web" "DB_NAME"

    echo ""

    # Redis配置
    echo -e "${GREEN}2. Redis配置${NC}"
    ask_input "Redis 主机" "localhost" "REDIS_HOST"
    ask_input "Redis 端口" "6379" "REDIS_PORT"
    ask_input "Redis 密码 (可选)" "" "REDIS_PASSWORD"

    echo ""

    # JWT配置
    echo -e "${GREEN}3. JWT配置${NC}"
    JWT_SECRET=$(generate_jwt_secret)
    echo -e "${YELLOW}JWT密钥已自动生成: ${JWT_SECRET}${NC}"

    echo ""

    # OSS配置
    echo -e "${GREEN}4. 阿里云OSS配置${NC}"
    ask_input "OSS Access Key ID" "" "OSS_ACCESS_KEY_ID"
    ask_input "OSS Access Key Secret" "" "OSS_ACCESS_KEY_SECRET"
    ask_input "OSS 存储桶名称" "" "OSS_BUCKET"
    ask_input "OSS 区域" "oss-cn-hangzhou" "OSS_REGION"
    ask_input "OSS 终端点" "oss-cn-hangzhou.aliyuncs.com" "OSS_ENDPOINT"

    echo ""

    # 应用配置
    echo -e "${GREEN}5. 应用配置${NC}"
    ask_input "应用端口" "3000" "APP_PORT"
    ask_input "运行环境" "production" "NODE_ENV"

    echo ""

    # 生成环境变量文件
    generate_env_file

    echo -e "${GREEN}环境变量配置完成！${NC}"
    echo -e "${YELLOW}请检查生成的 .env 文件并确认配置正确。${NC}"
}

# 生成环境变量文件
generate_env_file() {
    ENV_FILE=".env"

    echo -e "${GREEN}正在生成环境变量文件...${NC}"

    # 构建数据库URL
    if [ -n "$REDIS_PASSWORD" ]; then
        REDIS_URL="redis://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}"
    else
        REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"
    fi

    DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

    # 写入环境变量文件
    cat > "$ENV_FILE" << EOF
# Easy ERP Web 环境变量配置
# 生成时间: $(date '+%Y-%m-%d %H:%M:%S')

# 数据库配置
DATABASE_URL="${DATABASE_URL}"

# Redis配置
REDIS_URL="${REDIS_URL}"

# JWT配置
JWT_SECRET="${JWT_SECRET}"

# 阿里云OSS配置
OSS_ACCESS_KEY_ID="${OSS_ACCESS_KEY_ID}"
OSS_ACCESS_KEY_SECRET="${OSS_ACCESS_KEY_SECRET}"
OSS_BUCKET="${OSS_BUCKET}"
OSS_REGION="${OSS_REGION}"
OSS_ENDPOINT="${OSS_ENDPOINT}"

# 应用配置
NODE_ENV="${NODE_ENV}"
PORT=${APP_PORT}

# 系统配置
TZ="Asia/Shanghai"
EOF

    echo -e "${GREEN}环境变量文件已生成: ${ENV_FILE}${NC}"
    echo ""
    echo -e "${YELLOW}生成的配置:${NC}"
    echo "数据库: ${DATABASE_URL}"
    echo "Redis: ${REDIS_URL}"
    echo "JWT密钥: ${JWT_SECRET:0:10}..."
    echo "OSS存储桶: ${OSS_BUCKET}"
    echo "应用端口: ${APP_PORT}"
    echo ""
}

# 生成GitHub Secrets格式
generate_github_secrets() {
    echo -e "${GREEN}生成GitHub Secrets配置...${NC}"

    SECRETS_FILE="github-secrets.txt"

    cat > "$SECRETS_FILE" << EOF
# GitHub Secrets 配置
# 请在GitHub仓库的Settings > Secrets and variables > Actions中添加以下配置

# 服务器连接配置
HOST=your-server-ip
USERNAME=root
SSH_KEY=your-private-ssh-key
PORT=22

# 数据库连接
DATABASE_URL=${DATABASE_URL}

# Redis连接
REDIS_URL=${REDIS_URL}

# JWT密钥
JWT_SECRET=${JWT_SECRET}

# 阿里云OSS配置
OSS_ACCESS_KEY_ID=${OSS_ACCESS_KEY_ID}
OSS_ACCESS_KEY_SECRET=${OSS_ACCESS_KEY_SECRET}
OSS_BUCKET=${OSS_BUCKET}
OSS_REGION=${OSS_REGION}
OSS_ENDPOINT=${OSS_ENDPOINT}
EOF

    echo -e "${GREEN}GitHub Secrets配置已生成: ${SECRETS_FILE}${NC}"
}

# 显示帮助信息
show_help() {
    echo "Easy ERP Web 环境变量生成脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help       显示帮助信息"
    echo "  -g, --github     生成GitHub Secrets配置"
    echo "  -i, --interactive 交互式配置"
    echo ""
    echo "示例:"
    echo "  $0               # 交互式配置"
    echo "  $0 -g            # 生成GitHub Secrets配置"
    echo "  $0 -i            # 交互式配置"
}

# 处理命令行参数
case $1 in
    -h|--help)
        show_help
        exit 0
        ;;
    -g|--github)
        if [ -f ".env" ]; then
            source .env
            generate_github_secrets
        else
            echo -e "${RED}错误: .env 文件不存在，请先运行配置向导${NC}"
            exit 1
        fi
        ;;
    -i|--interactive|"")
        main
        ;;
    *)
        echo -e "${RED}错误: 未知选项 $1${NC}"
        show_help
        exit 1
        ;;
esac
