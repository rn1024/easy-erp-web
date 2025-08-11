#!/bin/bash

# ===========================================
# Easy ERP Web 文件持久化部署脚本 v1.0
# ===========================================
# 专门解决文件上传持久化和权限问题的增强部署脚本
#
# 解决的问题:
# 1. 文件上传后无法访问
# 2. 部署时删除历史文件
# 3. 服务器文件权限问题
#
# 作者: Easy ERP Team
# 版本: 1.0.0
# 更新: 2025-01-17
# ===========================================

set -e

# 配置变量
PROJECT_DIR="/www/wwwroot/easy-erp-web"
UPLOADS_BACKUP_DIR="/www/backup/easy-erp-uploads"
UPLOADS_PERSISTENT_DIR="/www/persistent/easy-erp-uploads"
LOG_FILE="/www/wwwroot/easy-erp-web/logs/file-persistence-deploy.log"
SCRIPT_VERSION="1.0.0"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "请使用 root 用户运行此脚本"
        exit 1
    fi
}

# 创建必要的目录
create_directories() {
    log "创建必要的目录..."
    
    # 创建备份目录
    mkdir -p "$UPLOADS_BACKUP_DIR"
    
    # 创建持久化存储目录
    mkdir -p "$UPLOADS_PERSISTENT_DIR"
    
    # 创建日志目录
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # 设置目录权限
    chmod 755 "$UPLOADS_BACKUP_DIR"
    chmod 755 "$UPLOADS_PERSISTENT_DIR"
    
    log "目录创建完成"
}

# 备份现有上传文件
backup_uploads() {
    log "备份现有上传文件..."
    
    if [ -d "$PROJECT_DIR/public/uploads" ] && [ "$(ls -A $PROJECT_DIR/public/uploads 2>/dev/null)" ]; then
        local backup_timestamp=$(date '+%Y%m%d_%H%M%S')
        local backup_path="$UPLOADS_BACKUP_DIR/uploads_backup_$backup_timestamp"
        
        cp -r "$PROJECT_DIR/public/uploads" "$backup_path"
        
        # 压缩备份以节省空间
        tar -czf "$backup_path.tar.gz" -C "$UPLOADS_BACKUP_DIR" "uploads_backup_$backup_timestamp"
        rm -rf "$backup_path"
        
        log "文件已备份到: $backup_path.tar.gz"
        
        # 清理超过30天的备份
        find "$UPLOADS_BACKUP_DIR" -name "uploads_backup_*.tar.gz" -mtime +30 -delete 2>/dev/null || true
        
    else
        info "没有找到需要备份的上传文件"
    fi
}

# 设置持久化存储
setup_persistent_storage() {
    log "设置持久化存储..."
    
    # 如果持久化目录为空，从当前uploads目录复制数据
    if [ ! "$(ls -A $UPLOADS_PERSISTENT_DIR 2>/dev/null)" ] && [ -d "$PROJECT_DIR/public/uploads" ]; then
        log "初始化持久化存储数据..."
        cp -r "$PROJECT_DIR/public/uploads/"* "$UPLOADS_PERSISTENT_DIR/" 2>/dev/null || true
    fi
    
    # 确保项目uploads目录存在
    mkdir -p "$PROJECT_DIR/public/uploads"
    
    # 删除现有的uploads目录（如果不是软链接）
    if [ -d "$PROJECT_DIR/public/uploads" ] && [ ! -L "$PROJECT_DIR/public/uploads" ]; then
        rm -rf "$PROJECT_DIR/public/uploads"
    fi
    
    # 创建软链接到持久化存储
    ln -sfn "$UPLOADS_PERSISTENT_DIR" "$PROJECT_DIR/public/uploads"
    
    log "持久化存储设置完成"
}

# 优化文件权限
optimize_file_permissions() {
    log "优化文件权限..."
    
    # 设置持久化目录权限
    find "$UPLOADS_PERSISTENT_DIR" -type f -exec chmod 644 {} \; 2>/dev/null || true
    find "$UPLOADS_PERSISTENT_DIR" -type d -exec chmod 755 {} \; 2>/dev/null || true
    
    # 设置所有者（尝试多种可能的web服务器用户）
    local web_users=("www-data" "nginx" "apache" "www")
    local web_user_set=false
    
    for user in "${web_users[@]}"; do
        if id "$user" &>/dev/null; then
            chown -R "$user:$user" "$UPLOADS_PERSISTENT_DIR" 2>/dev/null && {
                log "文件所有者设置为: $user"
                web_user_set=true
                break
            }
        fi
    done
    
    if [ "$web_user_set" = false ]; then
        warn "无法设置web服务器用户所有权，请手动设置"
    fi
    
    # 设置软链接权限
    if [ -L "$PROJECT_DIR/public/uploads" ]; then
        chown -h "$user:$user" "$PROJECT_DIR/public/uploads" 2>/dev/null || true
    fi
    
    log "文件权限优化完成"
}

# 验证文件访问
verify_file_access() {
    log "验证文件访问..."
    
    # 创建测试文件
    local test_file="$UPLOADS_PERSISTENT_DIR/test_access_$(date +%s).txt"
    echo "File access test - $(date)" > "$test_file"
    
    # 检查文件是否可读
    if [ -r "$test_file" ]; then
        log "✅ 文件读取测试通过"
    else
        error "❌ 文件读取测试失败"
        return 1
    fi
    
    # 检查通过软链接访问
    local linked_test_file="$PROJECT_DIR/public/uploads/test_access_$(date +%s).txt"
    if [ -r "$linked_test_file" ]; then
        log "✅ 软链接访问测试通过"
    else
        error "❌ 软链接访问测试失败"
        return 1
    fi
    
    # 清理测试文件
    rm -f "$test_file" 2>/dev/null || true
    
    log "文件访问验证完成"
}

# 创建文件权限监控脚本
create_permission_monitor() {
    log "创建文件权限监控脚本..."
    
    cat > "/usr/local/bin/erp-uploads-permission-fix.sh" << 'EOF'
#!/bin/bash
# Easy ERP 上传文件权限修复脚本

UPLOADS_DIR="/www/persistent/easy-erp-uploads"

if [ -d "$UPLOADS_DIR" ]; then
    # 修复文件权限
    find "$UPLOADS_DIR" -type f -not -perm 644 -exec chmod 644 {} \; 2>/dev/null
    find "$UPLOADS_DIR" -type d -not -perm 755 -exec chmod 755 {} \; 2>/dev/null
    
    # 修复所有者（如果需要）
    if id "www-data" &>/dev/null; then
        chown -R www-data:www-data "$UPLOADS_DIR" 2>/dev/null
    fi
fi
EOF
    
    chmod +x "/usr/local/bin/erp-uploads-permission-fix.sh"
    
    # 创建定时任务（每小时检查一次）
    (crontab -l 2>/dev/null; echo "0 * * * * /usr/local/bin/erp-uploads-permission-fix.sh >/dev/null 2>&1") | crontab -
    
    log "权限监控脚本创建完成"
}

# 生成部署报告
generate_deployment_report() {
    log "生成部署报告..."
    
    local report_file="$PROJECT_DIR/deployment-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# Easy ERP 文件持久化部署报告

**部署时间**: $(date '+%Y-%m-%d %H:%M:%S')
**脚本版本**: $SCRIPT_VERSION

## 配置信息

- **项目目录**: $PROJECT_DIR
- **持久化存储**: $UPLOADS_PERSISTENT_DIR
- **备份目录**: $UPLOADS_BACKUP_DIR
- **软链接**: $PROJECT_DIR/public/uploads -> $UPLOADS_PERSISTENT_DIR

## 解决的问题

✅ **问题1**: 文件上传后无法访问
- **解决方案**: 更新nginx配置，添加/uploads/静态文件服务规则
- **配置文件**: nginx/erp.samuelcn.com.conf

✅ **问题2**: 部署时删除历史文件
- **解决方案**: 实现持久化存储，使用软链接机制
- **持久化目录**: $UPLOADS_PERSISTENT_DIR

✅ **问题3**: 服务器文件权限问题
- **解决方案**: 自动权限修复和监控机制
- **监控脚本**: /usr/local/bin/erp-uploads-permission-fix.sh
- **定时任务**: 每小时自动检查和修复权限

## 验证步骤

1. 检查软链接: \`ls -la $PROJECT_DIR/public/uploads\`
2. 测试文件上传功能
3. 验证文件访问URL: https://your-domain.com/uploads/...
4. 检查nginx配置是否生效

## 维护建议

- 定期检查备份目录空间使用情况
- 监控权限修复脚本的执行日志
- 在重大更新前手动备份uploads目录

EOF
    
    log "部署报告已生成: $report_file"
}

# 主函数
main() {
    log "==========================================="
    log "Easy ERP 文件持久化部署脚本 v$SCRIPT_VERSION"
    log "==========================================="
    
    # 检查权限
    check_root
    
    # 创建目录
    create_directories
    
    # 备份现有文件
    backup_uploads
    
    # 设置持久化存储
    setup_persistent_storage
    
    # 优化文件权限
    optimize_file_permissions
    
    # 验证文件访问
    verify_file_access
    
    # 创建权限监控
    create_permission_monitor
    
    # 生成部署报告
    generate_deployment_report
    
    log "==========================================="
    log "✅ 文件持久化部署完成！"
    log "==========================================="
    
    info "下一步操作:"
    info "1. 重启nginx服务: systemctl reload nginx"
    info "2. 测试文件上传功能"
    info "3. 验证文件访问URL"
    info "4. 查看部署报告了解详细信息"
}

# 执行主函数
main "$@"