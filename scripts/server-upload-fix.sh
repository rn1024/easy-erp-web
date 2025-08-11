#!/bin/bash

# ===========================================
# Easy ERP 服务器文件上传访问修复脚本
# ===========================================
# 专门解决服务器环境下上传文件无法访问的问题
# 本地开发环境无需执行此脚本
#
# 问题描述:
# - 本地开发环境文件上传和访问正常
# - 服务器环境上传后无法通过URL访问文件
# - 根本原因: nginx配置缺少/uploads/静态文件服务规则
#
# 作者: Easy ERP Team
# 版本: 1.0.0
# 更新: 2025-01-17
# ===========================================

set -e

# 配置变量
NGINX_CONFIG_FILE="/etc/nginx/sites-available/erp.samuelcn.com.conf"
PROJECT_DIR="/www/wwwroot/easy-erp-web"
UPLOADS_DIR="$PROJECT_DIR/public/uploads"
LOG_FILE="/var/log/easy-erp-upload-fix.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "请使用root用户运行此脚本"
        exit 1
    fi
}

# 检查nginx配置文件
check_nginx_config() {
    log "检查nginx配置文件..."
    
    if [ ! -f "$NGINX_CONFIG_FILE" ]; then
        error "nginx配置文件不存在: $NGINX_CONFIG_FILE"
        info "请检查配置文件路径或nginx安装"
        exit 1
    fi
    
    log "nginx配置文件存在: $NGINX_CONFIG_FILE"
}

# 检查uploads目录
check_uploads_directory() {
    log "检查uploads目录..."
    
    if [ ! -d "$UPLOADS_DIR" ]; then
        warn "uploads目录不存在，正在创建..."
        mkdir -p "$UPLOADS_DIR"
        mkdir -p "$UPLOADS_DIR"/{images,documents,videos,avatars,accessories,labels}
    fi
    
    log "uploads目录检查完成: $UPLOADS_DIR"
}

# 备份nginx配置
backup_nginx_config() {
    log "备份nginx配置..."
    
    local backup_file="${NGINX_CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$NGINX_CONFIG_FILE" "$backup_file"
    
    log "nginx配置已备份到: $backup_file"
}

# 检查nginx配置中是否已存在uploads配置
check_uploads_config_exists() {
    if grep -q "location /uploads/" "$NGINX_CONFIG_FILE"; then
        log "✅ nginx配置中已存在/uploads/配置块"
        return 0
    else
        log "❌ nginx配置中缺少/uploads/配置块"
        return 1
    fi
}

# 添加uploads配置到nginx
add_uploads_config() {
    log "添加uploads配置到nginx..."
    
    # 查找插入位置（在最后一个location块之后）
    local insert_line=$(grep -n "location /_next/image" "$NGINX_CONFIG_FILE" | tail -1 | cut -d: -f1)
    
    if [ -z "$insert_line" ]; then
        # 如果找不到_next/image，在server块结束前插入
        insert_line=$(grep -n "}" "$NGINX_CONFIG_FILE" | tail -2 | head -1 | cut -d: -f1)
    else
        # 找到_next/image配置块的结束位置
        insert_line=$((insert_line + 10))
    fi
    
    # 创建临时文件
    local temp_file=$(mktemp)
    
    # 在指定行后插入uploads配置
    {
        head -n "$insert_line" "$NGINX_CONFIG_FILE"
        cat << 'EOF'

    # 静态文件服务 - 上传文件
    location /uploads/ {
        alias /www/wwwroot/easy-erp-web/public/uploads/;
        
        # 缓存设置
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # CORS支持
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
        add_header Access-Control-Allow-Headers "Range";
        
        # 支持范围请求
        add_header Accept-Ranges bytes;
        
        # 安全头
        add_header X-Content-Type-Options nosniff;
        
        # 尝试提供文件，如果不存在返回404
        try_files $uri =404;
        
        # 日志
        access_log /var/log/nginx/uploads_access.log;
        error_log /var/log/nginx/uploads_error.log;
    }
EOF
        tail -n +$((insert_line + 1)) "$NGINX_CONFIG_FILE"
    } > "$temp_file"
    
    # 替换原文件
    mv "$temp_file" "$NGINX_CONFIG_FILE"
    
    log "uploads配置已添加到nginx"
}

# 修复文件权限
fix_file_permissions() {
    log "修复文件权限..."
    
    # 设置目录权限
    find "$UPLOADS_DIR" -type d -exec chmod 755 {} \; 2>/dev/null || true
    
    # 设置文件权限
    find "$UPLOADS_DIR" -type f -exec chmod 644 {} \; 2>/dev/null || true
    
    # 设置所有者
    local web_users=("www-data" "nginx" "apache" "www")
    local web_user_set=false
    
    for user in "${web_users[@]}"; do
        if id "$user" &>/dev/null; then
            chown -R "$user:$user" "$UPLOADS_DIR" 2>/dev/null && {
                log "文件所有者设置为: $user"
                web_user_set=true
                break
            }
        fi
    done
    
    if [ "$web_user_set" = false ]; then
        warn "无法设置web服务器用户所有权，请手动检查"
    fi
    
    log "文件权限修复完成"
}

# 测试nginx配置
test_nginx_config() {
    log "测试nginx配置..."
    
    if nginx -t; then
        log "✅ nginx配置测试通过"
    else
        error "❌ nginx配置测试失败"
        return 1
    fi
}

# 重新加载nginx
reload_nginx() {
    log "重新加载nginx..."
    
    if systemctl reload nginx; then
        log "✅ nginx重新加载成功"
    else
        error "❌ nginx重新加载失败"
        return 1
    fi
}

# 创建测试文件
create_test_file() {
    log "创建测试文件..."
    
    local test_file="$UPLOADS_DIR/test-access-$(date +%s).txt"
    echo "File access test - $(date)" > "$test_file"
    chmod 644 "$test_file"
    
    log "测试文件已创建: $test_file"
    echo "$test_file"
}

# 验证文件访问
verify_file_access() {
    log "验证文件访问..."
    
    local test_file=$(create_test_file)
    local test_filename=$(basename "$test_file")
    local test_url="https://erp.samuelcn.com/uploads/$test_filename"
    
    info "测试URL: $test_url"
    
    # 等待nginx重新加载完成
    sleep 2
    
    # 使用curl测试访问
    if curl -s -o /dev/null -w "%{http_code}" "$test_url" | grep -q "200"; then
        log "✅ 文件访问测试成功"
        log "✅ 问题已解决！上传文件现在可以正常访问了"
    else
        warn "❌ 文件访问测试失败"
        warn "请检查域名解析和防火墙设置"
    fi
    
    # 清理测试文件
    rm -f "$test_file" 2>/dev/null || true
}

# 显示解决方案总结
show_solution_summary() {
    log "==========================================="
    log "🎉 服务器文件上传访问修复完成！"
    log "==========================================="
    
    info "解决的问题:"
    info "✅ nginx配置缺少/uploads/静态文件服务规则"
    info "✅ 文件权限设置不正确"
    info "✅ 上传文件无法通过URL访问"
    
    info "修改内容:"
    info "📝 nginx配置文件: $NGINX_CONFIG_FILE"
    info "📁 uploads目录权限: $UPLOADS_DIR"
    info "🔄 nginx服务已重新加载"
    
    info "验证方法:"
    info "1. 上传一个文件到系统"
    info "2. 复制文件的访问URL"
    info "3. 在浏览器中打开URL验证是否可以访问"
    
    info "如果仍有问题，请检查:"
    info "- 域名DNS解析是否正确"
    info "- 服务器防火墙设置"
    info "- SSL证书配置"
}

# 主函数
main() {
    log "==========================================="
    log "Easy ERP 服务器文件上传访问修复脚本"
    log "==========================================="
    
    # 检查权限
    check_root
    
    # 检查nginx配置文件
    check_nginx_config
    
    # 检查uploads目录
    check_uploads_directory
    
    # 备份nginx配置
    backup_nginx_config
    
    # 检查是否需要添加uploads配置
    if ! check_uploads_config_exists; then
        add_uploads_config
    fi
    
    # 修复文件权限
    fix_file_permissions
    
    # 测试nginx配置
    test_nginx_config
    
    # 重新加载nginx
    reload_nginx
    
    # 验证文件访问
    verify_file_access
    
    # 显示解决方案总结
    show_solution_summary
}

# 执行主函数
main "$@"