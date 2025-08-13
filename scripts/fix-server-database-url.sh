#!/bin/bash
set -e

# 服务器数据库URL修复脚本
# 解决服务器121.41.237.2上的DATABASE_URL解析失败问题

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Easy ERP 服务器数据库URL修复脚本${NC}"
echo "=========================================="
echo "📅 执行时间: $(date)"
echo "🖥️  目标服务器: 121.41.237.2"
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用root权限运行此脚本${NC}"
    echo "使用方法: sudo $0"
    exit 1
fi

# 1. 检查当前环境变量状态
echo -e "${GREEN}1. 检查当前环境变量状态...${NC}"
echo -e "${BLUE}当前DATABASE_URL: ${DATABASE_URL:-'未设置'}${NC}"
echo -e "${BLUE}当前REDIS_URL: ${REDIS_URL:-'未设置'}${NC}"
echo -e "${BLUE}当前JWT_SECRET: ${JWT_SECRET:-'未设置'}${NC}"
echo ""

# 2. 检查MySQL服务状态
echo -e "${GREEN}2. 检查MySQL服务状态...${NC}"
if systemctl is-active --quiet mysql; then
    echo -e "${GREEN}✅ MySQL服务正在运行${NC}"
    MYSQL_STATUS=$(systemctl status mysql --no-pager -l)
    echo -e "${BLUE}MySQL状态详情:${NC}"
    echo "$MYSQL_STATUS" | head -5
else
    echo -e "${YELLOW}⚠️  MySQL服务未运行，尝试启动...${NC}"
    systemctl start mysql
    sleep 3
    if systemctl is-active --quiet mysql; then
        echo -e "${GREEN}✅ MySQL服务启动成功${NC}"
    else
        echo -e "${RED}❌ MySQL服务启动失败${NC}"
        echo "请检查MySQL配置和日志: /var/log/mysql/error.log"
        exit 1
    fi
fi

# 3. 检查MySQL端口监听
echo -e "${GREEN}3. 检查MySQL端口监听...${NC}"
if netstat -tlnp | grep :3306 > /dev/null; then
    echo -e "${GREEN}✅ MySQL正在监听3306端口${NC}"
    netstat -tlnp | grep :3306
else
    echo -e "${RED}❌ MySQL未监听3306端口${NC}"
    echo "请检查MySQL配置文件"
fi
echo ""

# 4. 获取数据库配置信息
echo -e "${GREEN}4. 配置数据库连接信息...${NC}"
echo -e "${YELLOW}请输入数据库配置信息:${NC}"

# 默认配置建议
echo -e "${BLUE}建议配置:${NC}"
echo "- 用户名: easy_erp_user 或 root"
echo "- 主机: localhost (本地MySQL)"
echo "- 端口: 3306"
echo "- 数据库: easy_erp_db"
echo ""

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

echo ""
echo -e "${BLUE}构建的DATABASE_URL: mysql://${DB_USER}:***@${DB_HOST}:${DB_PORT}/${DB_NAME}${NC}"

# 5. 测试数据库连接
echo -e "${GREEN}5. 测试数据库连接...${NC}"
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1 as test;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库连接测试成功${NC}"
else
    echo -e "${RED}❌ 数据库连接测试失败${NC}"
    echo "请检查以下项目:"
    echo "1. 用户名和密码是否正确"
    echo "2. 数据库是否存在"
    echo "3. 用户是否有访问权限"
    
    # 尝试创建数据库
    echo -e "${YELLOW}尝试创建数据库...${NC}"
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 数据库创建成功${NC}"
    else
        echo -e "${RED}❌ 数据库创建失败，请手动检查${NC}"
        exit 1
    fi
fi

# 6. 生成其他必要的环境变量
echo -e "${GREEN}6. 生成其他环境变量...${NC}"

# 生成JWT密钥
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo -e "${GREEN}✅ 生成新的JWT_SECRET${NC}"
else
    echo -e "${BLUE}使用现有的JWT_SECRET${NC}"
fi

# 设置Redis URL
if [ -z "$REDIS_URL" ]; then
    REDIS_URL="redis://localhost:6379"
    echo -e "${GREEN}✅ 设置默认REDIS_URL${NC}"
else
    echo -e "${BLUE}使用现有的REDIS_URL${NC}"
fi

# 7. 设置系统环境变量
echo -e "${GREEN}7. 设置系统环境变量...${NC}"

# 备份现有环境配置
if [ -f "/etc/environment" ]; then
    cp /etc/environment /etc/environment.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✅ 已备份现有环境配置${NC}"
fi

# 移除旧的Easy ERP配置
sed -i '/# Easy ERP/,/^$/d' /etc/environment 2>/dev/null || true

# 添加新的环境变量配置
cat >> /etc/environment << EOF

# Easy ERP 环境变量配置 - $(date)
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

echo -e "${GREEN}✅ 系统环境变量设置完成${NC}"

# 8. 设置当前会话环境变量
echo -e "${GREEN}8. 设置当前会话环境变量...${NC}"
export DATABASE_URL="$DATABASE_URL"
export REDIS_URL="$REDIS_URL"
export JWT_SECRET="$JWT_SECRET"
export OSS_ACCESS_KEY_ID="your_oss_access_key_id"
export OSS_ACCESS_KEY_SECRET="your_oss_access_key_secret"
export OSS_BUCKET="easy-erp-web"
export OSS_REGION="cn-hangzhou"
export OSS_ENDPOINT="easy-erp-web.oss-cn-hangzhou.aliyuncs.com"
export NEXT_PUBLIC_APP_URL="https://erp.samuelcn.com"
export OSS_PATH_PREFIX="template"
export NODE_ENV="production"
export PORT="3008"

echo -e "${GREEN}✅ 当前会话环境变量设置完成${NC}"

# 9. 创建项目环境变量文件
echo -e "${GREEN}9. 创建项目环境变量文件...${NC}"
PROJECT_DIR="/www/wwwroot/easy-erp-web"
if [ -d "$PROJECT_DIR" ]; then
    # 备份现有.env文件
    if [ -f "$PROJECT_DIR/.env" ]; then
        cp "$PROJECT_DIR/.env" "$PROJECT_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${GREEN}✅ 已备份现有.env文件${NC}"
    fi
    
    # 创建新的.env文件
    cat > "$PROJECT_DIR/.env" << EOF
# Easy ERP 生产环境配置 - $(date)
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
    
    # 设置文件权限
    chmod 600 "$PROJECT_DIR/.env"
    chown www-data:www-data "$PROJECT_DIR/.env" 2>/dev/null || true
    
    echo -e "${GREEN}✅ 项目.env文件创建完成${NC}"
else
    echo -e "${YELLOW}⚠️  项目目录 $PROJECT_DIR 不存在${NC}"
    echo "请先运行部署脚本创建项目目录"
fi

# 10. 验证配置
echo -e "${GREEN}10. 验证环境变量配置...${NC}"
echo -e "${BLUE}DATABASE_URL: mysql://${DB_USER}:***@${DB_HOST}:${DB_PORT}/${DB_NAME}${NC}"
echo -e "${BLUE}REDIS_URL: $REDIS_URL${NC}"
echo -e "${BLUE}JWT_SECRET: [已设置 ${#JWT_SECRET} 字符]${NC}"
echo -e "${BLUE}NODE_ENV: production${NC}"
echo -e "${BLUE}PORT: 3008${NC}"

# 11. 最终数据库连接测试
echo -e "${GREEN}11. 最终数据库连接验证...${NC}"
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT 'DATABASE_URL配置成功' as status, NOW() as timestamp;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ DATABASE_URL配置验证成功${NC}"
else
    echo -e "${RED}❌ DATABASE_URL配置验证失败${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 服务器数据库URL修复完成！${NC}"
echo "=========================================="
echo -e "${YELLOW}接下来的步骤:${NC}"
echo "1. 重新登录SSH会话以加载新的环境变量"
echo "   或运行: source /etc/environment"
echo "2. 进入项目目录: cd /www/wwwroot/easy-erp-web"
echo "3. 重新执行部署脚本: ./scripts/deploy-to-ecs.sh"
echo "4. 或者运行Prisma迁移: npx prisma migrate deploy"
echo ""
echo -e "${YELLOW}重要提醒:${NC}"
echo "- 请更新OSS相关配置 (OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET)"
echo "- 确保Redis服务正在运行: systemctl status redis"
echo "- 如遇问题，检查日志: /var/log/mysql/error.log"
echo "- 环境变量已备份到: /etc/environment.backup.*"
echo ""
echo -e "${GREEN}修复脚本执行完成 - $(date)${NC}"