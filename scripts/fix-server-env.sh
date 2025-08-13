#!/bin/bash
set -e

# 服务器环境修复脚本
# 解决 DATABASE_URL 解析失败问题

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Easy ERP 服务器环境修复脚本${NC}"
echo "======================================"
echo "📅 执行时间: $(date)"
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用root权限运行此脚本${NC}"
    echo "使用方法: sudo $0"
    exit 1
fi

# 1. 检查MySQL服务状态
echo -e "${GREEN}1. 检查MySQL服务状态...${NC}"
if systemctl is-active --quiet mysql; then
    echo -e "${GREEN}✅ MySQL服务正在运行${NC}"
else
    echo -e "${YELLOW}⚠️  MySQL服务未运行，尝试启动...${NC}"
    systemctl start mysql
    if systemctl is-active --quiet mysql; then
        echo -e "${GREEN}✅ MySQL服务启动成功${NC}"
    else
        echo -e "${RED}❌ MySQL服务启动失败${NC}"
        exit 1
    fi
fi

# 2. 设置环境变量
echo -e "${GREEN}2. 配置环境变量...${NC}"

# 检查是否已存在环境变量配置
if [ -f "/etc/environment" ]; then
    echo -e "${YELLOW}📋 当前环境变量配置:${NC}"
    grep -E "(DATABASE_URL|REDIS_URL|JWT_SECRET)" /etc/environment || echo "未找到相关配置"
fi

echo ""
echo -e "${YELLOW}请输入数据库配置信息:${NC}"

# 获取数据库配置
read -p "MySQL用户名 (默认: easy_erp_user): " DB_USER
DB_USER=${DB_USER:-easy_erp_user}

read -s -p "MySQL密码: " DB_PASSWORD
echo ""

read -p "MySQL主机 (默认: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "MySQL端口 (默认: 3306): " DB_PORT
DB_PORT=${DB_PORT:-3306}

read -p "数据库名 (默认: easy_erp_db): " DB_NAME
DB_NAME=${DB_NAME:-easy_erp_db}

# 构建DATABASE_URL
DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# 3. 测试数据库连接
echo -e "${GREEN}3. 测试数据库连接...${NC}"
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库连接测试成功${NC}"
else
    echo -e "${RED}❌ 数据库连接测试失败${NC}"
    echo "请检查数据库配置信息"
    exit 1
fi

# 4. 设置系统环境变量
echo -e "${GREEN}4. 设置系统环境变量...${NC}"

# 生成JWT密钥
JWT_SECRET=$(openssl rand -base64 32)

# 设置Redis URL (假设Redis在本地运行)
REDIS_URL="redis://localhost:6379"

# 创建环境变量配置
cat > /tmp/erp_env_vars << EOF
# Easy ERP 环境变量配置
export DATABASE_URL="$DATABASE_URL"
export REDIS_URL="$REDIS_URL"
export JWT_SECRET="$JWT_SECRET"
export OSS_ACCESS_KEY_ID="your_oss_access_key_id"
export OSS_ACCESS_KEY_SECRET="your_oss_access_key_secret"
export OSS_BUCKET="easy-erp-web"
export OSS_REGION="cn-hangzhou"
export NODE_ENV="production"
export PORT="3008"
EOF

# 添加到系统环境变量
echo "" >> /etc/environment
echo "# Easy ERP 环境变量配置 - $(date)" >> /etc/environment
echo "DATABASE_URL=$DATABASE_URL" >> /etc/environment
echo "REDIS_URL=$REDIS_URL" >> /etc/environment
echo "JWT_SECRET=$JWT_SECRET" >> /etc/environment
echo "OSS_ACCESS_KEY_ID=your_oss_access_key_id" >> /etc/environment
echo "OSS_ACCESS_KEY_SECRET=your_oss_access_key_secret" >> /etc/environment
echo "OSS_BUCKET=easy-erp-web" >> /etc/environment
echo "OSS_REGION=cn-hangzhou" >> /etc/environment
echo "NODE_ENV=production" >> /etc/environment
echo "PORT=3008" >> /etc/environment

# 添加到当前会话
source /tmp/erp_env_vars

echo -e "${GREEN}✅ 环境变量设置完成${NC}"

# 5. 验证环境变量
echo -e "${GREEN}5. 验证环境变量设置...${NC}"
echo "DATABASE_URL: $DATABASE_URL"
echo "REDIS_URL: $REDIS_URL"
echo "JWT_SECRET: [已设置]"

# 6. 创建项目环境变量文件
echo -e "${GREEN}6. 创建项目环境变量文件...${NC}"
PROJECT_DIR="/www/wwwroot/easy-erp-web"
if [ -d "$PROJECT_DIR" ]; then
    cat > "$PROJECT_DIR/.env" << EOF
DATABASE_URL=$DATABASE_URL
REDIS_URL=$REDIS_URL
JWT_SECRET=$JWT_SECRET
OSS_ACCESS_KEY_ID=your_oss_access_key_id
OSS_ACCESS_KEY_SECRET=your_oss_access_key_secret
OSS_BUCKET=easy-erp-web
OSS_REGION=cn-hangzhou
OSS_ENDPOINT=easy-erp-web.oss-cn-hangzhou.aliyuncs.com
NEXT_PUBLIC_APP_URL=https://erp.samuelcn.com
OSS_PATH_PREFIX=template
NODE_ENV=production
PORT=3008
EOF
    echo -e "${GREEN}✅ 项目环境变量文件创建完成${NC}"
else
    echo -e "${YELLOW}⚠️  项目目录不存在，跳过项目环境变量文件创建${NC}"
fi

# 7. 清理临时文件
rm -f /tmp/erp_env_vars

echo ""
echo -e "${GREEN}🎉 服务器环境修复完成！${NC}"
echo "======================================"
echo -e "${YELLOW}接下来的步骤:${NC}"
echo "1. 重新登录SSH会话以加载新的环境变量"
echo "2. 或者运行: source /etc/environment"
echo "3. 然后重新执行部署脚本: ./scripts/deploy-to-ecs.sh"
echo ""
echo -e "${YELLOW}注意事项:${NC}"
echo "- 请记得更新OSS相关配置"
echo "- 确保Redis服务正在运行"
echo "- 如有问题，请检查 /var/log/mysql/error.log"
echo ""