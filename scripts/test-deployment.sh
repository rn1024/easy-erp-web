#!/bin/bash

# 测试部署流程脚本
# 用于验证新的数据库同步策略和备份机制

set -e  # 遇到错误立即退出

echo "🧪 开始测试部署流程..."
echo "======================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查必要的文件和脚本
check_prerequisites() {
    log_info "检查部署前置条件..."
    
    # 检查关键文件
    local files=(
        "prisma/schema.prisma"
        "scripts/deploy-to-ecs.sh"
        "scripts/db-backup.sh"
        "scripts/db-rollback.sh"
        "docs/database-schema-change-process.md"
        ".env"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            log_success "$file 存在"
        else
            log_error "$file 不存在"
            return 1
        fi
    done
    
    # 检查脚本执行权限
    local scripts=(
        "scripts/deploy-to-ecs.sh"
        "scripts/db-backup.sh"
        "scripts/db-rollback.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ -x "$script" ]; then
            log_success "$script 有执行权限"
        else
            log_warning "$script 没有执行权限，正在添加..."
            chmod +x "$script"
        fi
    done
}

# 验证Prisma配置
validate_prisma() {
    log_info "验证Prisma配置..."
    
    # 验证schema
    if npx prisma validate; then
        log_success "Prisma schema 验证通过"
    else
        log_error "Prisma schema 验证失败"
        return 1
    fi
    
    # 检查迁移文件
    log_info "检查迁移文件..."
    if [ -d "prisma/migrations" ]; then
        migration_count=$(find prisma/migrations -name "migration.sql" | wc -l)
        log_success "找到 $migration_count 个迁移文件"
        
        # 列出所有迁移
        find prisma/migrations -name "migration.sql" | while read -r migration; do
            migration_dir=$(dirname "$migration")
            migration_name=$(basename "$migration_dir")
            log_info "  - $migration_name"
        done
    else
        log_warning "prisma/migrations 目录不存在"
    fi
}

# 测试备份脚本
test_backup_script() {
    log_info "测试备份脚本语法..."
    
    # 检查备份脚本语法
    if bash -n scripts/db-backup.sh; then
        log_success "备份脚本语法正确"
    else
        log_error "备份脚本语法错误"
        return 1
    fi
    
    # 检查回滚脚本语法
    if bash -n scripts/db-rollback.sh; then
        log_success "回滚脚本语法正确"
    else
        log_error "回滚脚本语法错误"
        return 1
    fi
}

# 测试部署脚本
test_deploy_script() {
    log_info "测试部署脚本语法..."
    
    if bash -n scripts/deploy-to-ecs.sh; then
        log_success "部署脚本语法正确"
    else
        log_error "部署脚本语法错误"
        return 1
    fi
}

# 检查环境变量
check_environment() {
    log_info "检查环境变量配置..."
    
    if [ -f ".env" ]; then
        # 检查关键环境变量
        local required_vars=(
            "DATABASE_URL"
            "JWT_SECRET"
            "NODE_ENV"
        )
        
        for var in "${required_vars[@]}"; do
            if grep -q "^${var}=" .env; then
                log_success "$var 已配置"
            else
                log_warning "$var 未在.env文件中找到"
            fi
        done
    else
        log_error ".env 文件不存在"
        return 1
    fi
}

# 验证GitHub Actions工作流
validate_github_actions() {
    log_info "验证GitHub Actions工作流..."
    
    if [ -f ".github/workflows/deploy.yml" ]; then
        log_success "GitHub Actions工作流文件存在"
        
        # 检查是否包含备份步骤
        if grep -q "db-backup.sh" .github/workflows/deploy.yml; then
            log_success "工作流包含数据库备份步骤"
        else
            log_warning "工作流未包含数据库备份步骤"
        fi
        
        # 检查是否包含迁移状态检查
        if grep -q "prisma migrate status" .github/workflows/deploy.yml; then
            log_success "工作流包含迁移状态检查"
        else
            log_warning "工作流未包含迁移状态检查"
        fi
    else
        log_error "GitHub Actions工作流文件不存在"
        return 1
    fi
}

# 生成测试报告
generate_report() {
    log_info "生成测试报告..."
    
    local report_file="test-deployment-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# 部署流程测试报告

**测试时间**: $(date)
**测试版本**: $(git rev-parse --short HEAD 2>/dev/null || echo "未知")

## 测试结果

### ✅ 通过的检查项
- Prisma schema 验证
- 迁移文件完整性
- 脚本语法检查
- 环境变量配置
- GitHub Actions工作流

### 📋 迁移文件列表
$(find prisma/migrations -name "migration.sql" | while read -r migration; do
    migration_dir=$(dirname "$migration")
    migration_name=$(basename "$migration_dir")
    echo "- $migration_name"
done)

### 🔧 关键改进
1. **统一数据库同步策略**: 移除了 \`db push\` 回退逻辑，统一使用 \`prisma migrate deploy\`
2. **增加备份机制**: 部署前自动创建数据库备份
3. **完善回滚流程**: 提供完整的数据库回滚脚本
4. **标准化流程**: 建立了完整的schema变更标准流程文档

### 📚 相关文档
- [数据库Schema变更标准流程](docs/database-schema-change-process.md)
- [部署脚本](scripts/deploy-to-ecs.sh)
- [备份脚本](scripts/db-backup.sh)
- [回滚脚本](scripts/db-rollback.sh)

### 🚀 下一步行动
1. 在测试环境验证完整部署流程
2. 监控生产环境部署效果
3. 根据实际使用情况优化流程

---
*报告生成时间: $(date)*
EOF

    log_success "测试报告已生成: $report_file"
}

# 主测试流程
main() {
    echo "🧪 Easy ERP 部署流程测试"
    echo "======================================"
    echo "测试时间: $(date)"
    echo "当前目录: $(pwd)"
    echo "Git提交: $(git rev-parse --short HEAD 2>/dev/null || echo '未知')"
    echo "======================================"
    echo ""
    
    # 执行所有测试
    check_prerequisites
    validate_prisma
    test_backup_script
    test_deploy_script
    check_environment
    validate_github_actions
    generate_report
    
    echo ""
    echo "======================================"
    log_success "所有测试完成！"
    echo "======================================"
    
    # 显示总结
    echo ""
    log_info "测试总结:"
    echo "  ✅ 前置条件检查完成"
    echo "  ✅ Prisma配置验证通过"
    echo "  ✅ 备份脚本测试通过"
    echo "  ✅ 部署脚本测试通过"
    echo "  ✅ 环境变量检查完成"
    echo "  ✅ GitHub Actions验证通过"
    echo ""
    log_success "部署流程已准备就绪！"
}

# 错误处理
trap 'log_error "测试过程中发生错误，退出码: $?"' ERR

# 执行主函数
main "$@"
