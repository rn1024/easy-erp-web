#!/bin/bash

# ===========================================
# Easy ERP 服务器上传问题诊断脚本
# ===========================================
# 快速诊断服务器环境下文件上传访问问题
# 无需root权限，安全执行
#
# 作者: Easy ERP Team
# 版本: 1.0.0
# 更新: 2025-01-17
# ===========================================

set -e

# 配置变量
PROJECT_DIR="/www/wwwroot/easy-erp-web"
UPLOADS_DIR="$PROJECT_DIR/public/uploads"
NGINX_CONFIG_FILE="/etc/nginx/sites-available/erp.samuelcn.com.conf"
DOMAIN="erp.samuelcn.com"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 输出函数
pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

fail() {
    echo -e "${RED}❌ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# 检查uploads目录
check_uploads_directory() {
    header "检查uploads目录"
    
    if [ -d "$UPLOADS_DIR" ]; then
        pass "uploads目录存在: $UPLOADS_DIR"
        
        # 检查目录权限
        local dir_perms=$(stat -c "%a" "$UPLOADS_DIR" 2>/dev/null || stat -f "%A" "$UPLOADS_DIR" 2>/dev/null || echo "unknown")
        if [ "$dir_perms" = "755" ] || [ "$dir_perms" = "775" ]; then
            pass "目录权限正确: $dir_perms"
        else
            warn "目录权限可能有问题: $dir_perms (建议: 755)"
        fi
        
        # 检查目录所有者
        local dir_owner=$(stat -c "%U:%G" "$UPLOADS_DIR" 2>/dev/null || stat -f "%Su:%Sg" "$UPLOADS_DIR" 2>/dev/null || echo "unknown")
        info "目录所有者: $dir_owner"
        
        # 检查是否有文件
        local file_count=$(find "$UPLOADS_DIR" -type f | wc -l)
        info "文件数量: $file_count"
        
        if [ "$file_count" -gt 0 ]; then
            # 检查第一个文件的权限
            local first_file=$(find "$UPLOADS_DIR" -type f | head -1)
            if [ -n "$first_file" ]; then
                local file_perms=$(stat -c "%a" "$first_file" 2>/dev/null || stat -f "%A" "$first_file" 2>/dev/null || echo "unknown")
                if [ "$file_perms" = "644" ] || [ "$file_perms" = "664" ]; then
                    pass "文件权限正确: $file_perms"
                else
                    warn "文件权限可能有问题: $file_perms (建议: 644)"
                fi
            fi
        fi
    else
        fail "uploads目录不存在: $UPLOADS_DIR"
    fi
}

# 检查nginx配置
check_nginx_config() {
    header "检查nginx配置"
    
    if [ -f "$NGINX_CONFIG_FILE" ]; then
        pass "nginx配置文件存在: $NGINX_CONFIG_FILE"
        
        # 检查是否有uploads配置
        if grep -q "location /uploads/" "$NGINX_CONFIG_FILE"; then
            pass "nginx配置包含/uploads/规则"
            
            # 显示uploads配置
            info "uploads配置内容:"
            grep -A 10 "location /uploads/" "$NGINX_CONFIG_FILE" | sed 's/^/    /'
        else
            fail "nginx配置缺少/uploads/规则"
            warn "这是导致文件无法访问的主要原因"
        fi
        
        # 检查是否有client_max_body_size设置
        if grep -q "client_max_body_size" "$NGINX_CONFIG_FILE"; then
            local max_size=$(grep "client_max_body_size" "$NGINX_CONFIG_FILE" | head -1 | awk '{print $2}' | sed 's/;//')
            pass "文件上传大小限制: $max_size"
        else
            warn "未设置client_max_body_size，可能限制大文件上传"
        fi
    else
        fail "nginx配置文件不存在: $NGINX_CONFIG_FILE"
        warn "请检查nginx配置文件路径"
    fi
}

# 检查nginx进程
check_nginx_process() {
    header "检查nginx进程"
    
    if pgrep nginx > /dev/null; then
        pass "nginx进程正在运行"
        
        # 检查nginx用户
        local nginx_user=$(ps aux | grep nginx | grep -v grep | head -1 | awk '{print $1}')
        info "nginx运行用户: $nginx_user"
        
        # 检查nginx用户是否能访问uploads目录
        if [ -d "$UPLOADS_DIR" ]; then
            if sudo -u "$nginx_user" test -r "$UPLOADS_DIR" 2>/dev/null; then
                pass "nginx用户可以读取uploads目录"
            else
                fail "nginx用户无法读取uploads目录"
                warn "这可能导致403 Forbidden错误"
            fi
        fi
    else
        fail "nginx进程未运行"
    fi
}

# 测试网络连接
test_network_access() {
    header "测试网络访问"
    
    # 测试域名解析
    if nslookup "$DOMAIN" > /dev/null 2>&1; then
        pass "域名解析正常: $DOMAIN"
    else
        fail "域名解析失败: $DOMAIN"
    fi
    
    # 测试HTTPS连接
    if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200\|301\|302"; then
        pass "HTTPS连接正常"
    else
        warn "HTTPS连接可能有问题"
    fi
    
    # 如果有测试文件，尝试访问
    if [ -d "$UPLOADS_DIR" ]; then
        local test_files=$(find "$UPLOADS_DIR" -name "*.jpg" -o -name "*.png" -o -name "*.txt" | head -3)
        if [ -n "$test_files" ]; then
            info "测试现有文件访问:"
            echo "$test_files" | while read -r file; do
                if [ -n "$file" ]; then
                    local rel_path=${file#$UPLOADS_DIR/}
                    local test_url="https://$DOMAIN/uploads/$rel_path"
                    local status=$(curl -s -o /dev/null -w "%{http_code}" "$test_url")
                    if [ "$status" = "200" ]; then
                        pass "文件可访问: /uploads/$rel_path"
                    else
                        fail "文件无法访问: /uploads/$rel_path (HTTP $status)"
                    fi
                fi
            done
        else
            info "uploads目录中没有找到测试文件"
        fi
    fi
}

# 生成诊断报告
generate_diagnosis_report() {
    header "诊断总结"
    
    echo
    info "问题分析:"
    
    # 检查主要问题
    local has_uploads_config=false
    local has_permission_issue=false
    local has_nginx_issue=false
    
    if [ -f "$NGINX_CONFIG_FILE" ] && grep -q "location /uploads/" "$NGINX_CONFIG_FILE"; then
        has_uploads_config=true
    fi
    
    if [ ! -d "$UPLOADS_DIR" ]; then
        has_permission_issue=true
    fi
    
    if ! pgrep nginx > /dev/null; then
        has_nginx_issue=true
    fi
    
    # 给出建议
    if [ "$has_uploads_config" = false ]; then
        fail "主要问题: nginx配置缺少/uploads/静态文件服务规则"
        info "解决方案: 运行 server-upload-fix.sh 脚本修复配置"
    fi
    
    if [ "$has_permission_issue" = true ]; then
        fail "权限问题: uploads目录不存在或权限不正确"
        info "解决方案: 检查目录权限和所有者设置"
    fi
    
    if [ "$has_nginx_issue" = true ]; then
        fail "服务问题: nginx未运行"
        info "解决方案: 启动nginx服务"
    fi
    
    if [ "$has_uploads_config" = true ] && [ "$has_permission_issue" = false ] && [ "$has_nginx_issue" = false ]; then
        pass "配置看起来正常，如果仍有问题请检查防火墙和DNS设置"
    fi
    
    echo
    info "下一步操作建议:"
    info "1. 如果是配置问题，运行: sudo bash scripts/server-upload-fix.sh"
    info "2. 如果是权限问题，检查文件所有者和权限设置"
    info "3. 测试文件上传功能并验证访问URL"
    info "4. 查看nginx错误日志: tail -f /var/log/nginx/error.log"
}

# 主函数
main() {
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${BLUE}Easy ERP 服务器上传问题诊断脚本${NC}"
    echo -e "${BLUE}===========================================${NC}"
    
    check_uploads_directory
    check_nginx_config
    check_nginx_process
    test_network_access
    generate_diagnosis_report
    
    echo
    echo -e "${GREEN}诊断完成！${NC}"
}

# 执行主函数
main "$@"