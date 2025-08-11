#!/bin/bash

# 测试文件权限优化函数
# 这个脚本用于验证部署脚本中的文件权限优化功能

set -e

# 设置项目目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

warn() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1" >&2
}

# 优化文件权限函数（从deploy.sh复制）
optimize_file_permissions() {
    log "🔧 优化文件权限..."
    
    # 确保uploads目录存在
    mkdir -p "$PROJECT_DIR/public/uploads"
    
    # 设置文件权限
    log "设置文件权限 (644/755)..."
    find "$PROJECT_DIR/public/uploads" -type f -exec chmod 644 {} \; 2>/dev/null || true
    find "$PROJECT_DIR/public/uploads" -type d -exec chmod 755 {} \; 2>/dev/null || true
    
    # 设置所有者（如果需要）
    log "设置文件所有者..."
    chown -R www-data:www-data "$PROJECT_DIR/public/uploads" 2>/dev/null || {
        warn "无法设置www-data所有者，可能需要手动配置"
    }
    
    # 验证权限设置
    if [ -d "$PROJECT_DIR/public/uploads" ]; then
        local dir_perms=$(stat -c "%a" "$PROJECT_DIR/public/uploads" 2>/dev/null || stat -f "%A" "$PROJECT_DIR/public/uploads" 2>/dev/null || echo "unknown")
        log "uploads目录权限: $dir_perms"
    fi
    
    log "✅ 文件权限优化完成"
}

# 创建测试文件
create_test_files() {
    log "创建测试文件..."
    
    # 创建测试目录结构
    mkdir -p "$PROJECT_DIR/public/uploads/images/2024/1"
    mkdir -p "$PROJECT_DIR/public/uploads/documents/2024/1"
    
    # 创建测试文件
    echo "test image" > "$PROJECT_DIR/public/uploads/images/2024/1/test.jpg"
    echo "test document" > "$PROJECT_DIR/public/uploads/documents/2024/1/test.pdf"
    
    log "测试文件创建完成"
}

# 检查权限
check_permissions() {
    log "检查文件权限..."
    
    if [ -f "$PROJECT_DIR/public/uploads/images/2024/1/test.jpg" ]; then
        local file_perms=$(stat -c "%a" "$PROJECT_DIR/public/uploads/images/2024/1/test.jpg" 2>/dev/null || stat -f "%A" "$PROJECT_DIR/public/uploads/images/2024/1/test.jpg" 2>/dev/null || echo "unknown")
        log "测试文件权限: $file_perms"
    fi
    
    if [ -d "$PROJECT_DIR/public/uploads/images" ]; then
        local dir_perms=$(stat -c "%a" "$PROJECT_DIR/public/uploads/images" 2>/dev/null || stat -f "%A" "$PROJECT_DIR/public/uploads/images" 2>/dev/null || echo "unknown")
        log "测试目录权限: $dir_perms"
    fi
}

# 主函数
main() {
    log "开始测试文件权限优化功能..."
    
    create_test_files
    check_permissions
    
    log "执行权限优化..."
    optimize_file_permissions
    
    log "优化后检查权限..."
    check_permissions
    
    log "✅ 测试完成"
}

# 执行测试
main "$@"
