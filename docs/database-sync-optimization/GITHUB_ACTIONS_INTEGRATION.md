# GitHub Actions 集成优化方案

## 📋 方案概述

基于 Easy ERP 项目的数据库同步优化需求，设计完整的 GitHub Actions CI/CD 集成方案，实现数据库迁移、备份恢复、监控告警的自动化流程，确保代码变更的安全性和可靠性。

## 🎯 集成目标

### 核心目标
- **自动化数据库迁移**: 代码合并时自动执行数据库迁移
- **安全性保障**: 迁移前自动备份，失败时自动回滚
- **质量门控**: 多环境验证，确保迁移安全性
- **监控集成**: 实时监控迁移过程，异常时立即告警
- **可追溯性**: 完整的操作日志和审计记录

### 性能指标
- **部署时间**: 完整流程 ≤ 10分钟
- **成功率**: 自动化部署成功率 ≥ 99%
- **回滚时间**: 异常回滚时间 ≤ 2分钟
- **监控覆盖**: 关键步骤监控覆盖率 100%

## 🏗️ 架构设计

### 整体流程架构
```mermaid
graph TB
    subgraph "代码变更触发"
        A1["Pull Request"]
        A2["Push to Main"]
        A3["Release Tag"]
    end
    
    subgraph "预检查阶段"
        B1["代码质量检查"]
        B2["数据库迁移验证"]
        B3["安全扫描"]
        B4["依赖检查"]
    end
    
    subgraph "测试环境部署"
        C1["创建测试数据库"]
        C2["执行迁移脚本"]
        C3["运行集成测试"]
        C4["性能基准测试"]
    end
    
    subgraph "生产环境部署"
        D1["生产数据库备份"]
        D2["蓝绿部署准备"]
        D3["执行数据库迁移"]
        D4["应用部署"]
        D5["健康检查"]
        D6["流量切换"]
    end
    
    subgraph "监控告警"
        E1["迁移过程监控"]
        E2["性能指标监控"]
        E3["异常告警"]
        E4["自动回滚"]
    end
    
    subgraph "后置处理"
        F1["清理临时资源"]
        F2["更新部署记录"]
        F3["发送通知"]
        F4["生成报告"]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    
    B1 --> B2
    B2 --> B3
    B3 --> B4
    B4 --> C1
    
    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> D1
    
    D1 --> D2
    D2 --> D3
    D3 --> D4
    D4 --> D5
    D5 --> D6
    
    D3 --> E1
    D4 --> E2
    E1 --> E3
    E2 --> E3
    E3 --> E4
    
    D6 --> F1
    E4 --> F1
    F1 --> F2
    F2 --> F3
    F3 --> F4
```

### 环境分层设计

```mermaid
graph LR
    subgraph "开发环境"
        A1["Feature Branch"]
        A2["本地数据库"]
        A3["开发者测试"]
    end
    
    subgraph "测试环境"
        B1["PR Validation"]
        B2["测试数据库"]
        B3["自动化测试"]
        B4["集成测试"]
    end
    
    subgraph "预发布环境"
        C1["Staging Deploy"]
        C2["生产数据副本"]
        C3["性能测试"]
        C4["用户验收测试"]
    end
    
    subgraph "生产环境"
        D1["Production Deploy"]
        D2["生产数据库"]
        D3["蓝绿部署"]
        D4["监控告警"]
    end
    
    A1 --> B1
    B1 --> C1
    C1 --> D1
```

## 🔧 Workflow 实现

### 1. 主工作流配置

```yaml
# .github/workflows/database-sync-ci.yml
name: Database Sync CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  release:
    types: [ published ]

env:
  NODE_VERSION: '18'
  MYSQL_VERSION: '8.0'
  MONITORING_ENABLED: true

jobs:
  # 预检查阶段
  pre-checks:
    name: Pre-deployment Checks
    runs-on: ubuntu-latest
    outputs:
      has-migrations: ${{ steps.check-migrations.outputs.has-migrations }}
      migration-hash: ${{ steps.check-migrations.outputs.migration-hash }}
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Code Quality Check
        run: |
          pnpm run lint
          pnpm run type-check
          pnpm run test:unit
      
      - name: Security Scan
        run: |
          pnpm audit --audit-level moderate
          npx snyk test --severity-threshold=high
      
      - name: Check Database Migrations
        id: check-migrations
        run: |
          # 检查是否有新的迁移文件
          MIGRATION_FILES=$(git diff --name-only ${{ github.event.before }}..${{ github.sha }} -- prisma/migrations/ || echo "")
          if [ -n "$MIGRATION_FILES" ]; then
            echo "has-migrations=true" >> $GITHUB_OUTPUT
            echo "Found migration files: $MIGRATION_FILES"
            
            # 生成迁移文件哈希
            MIGRATION_HASH=$(find prisma/migrations -name "*.sql" -exec cat {} \; | sha256sum | cut -d' ' -f1)
            echo "migration-hash=$MIGRATION_HASH" >> $GITHUB_OUTPUT
          else
            echo "has-migrations=false" >> $GITHUB_OUTPUT
          fi
      
      - name: Validate Migration Scripts
        if: steps.check-migrations.outputs.has-migrations == 'true'
        run: |
          # 验证迁移脚本语法
          pnpm prisma validate
          pnpm prisma format --check
          
          # 检查迁移脚本是否包含危险操作
          ./scripts/validate-migrations.sh
      
      - name: Upload Migration Artifacts
        if: steps.check-migrations.outputs.has-migrations == 'true'
        uses: actions/upload-artifact@v4
        with:
          name: migration-files-${{ steps.check-migrations.outputs.migration-hash }}
          path: |
            prisma/migrations/
            prisma/schema.prisma
          retention-days: 30

  # 测试环境部署
  test-deployment:
    name: Test Environment Deployment
    runs-on: ubuntu-latest
    needs: pre-checks
    if: needs.pre-checks.outputs.has-migrations == 'true'
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test_password
          MYSQL_DATABASE: easy_erp_test
        ports:
          - 3306:3306
        options: >
          --health-cmd="mysqladmin ping -h localhost"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >
          --health-cmd="redis-cli ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Setup Test Database
        env:
          DATABASE_URL: mysql://root:test_password@localhost:3306/easy_erp_test
        run: |
          # 等待数据库就绪
          ./scripts/wait-for-db.sh
          
          # 创建测试数据
          pnpm prisma db push
          pnpm prisma db seed
      
      - name: Run Database Migration
        env:
          DATABASE_URL: mysql://root:test_password@localhost:3306/easy_erp_test
        run: |
          # 记录迁移开始时间
          echo "MIGRATION_START=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> $GITHUB_ENV
          
          # 执行迁移
          pnpm prisma migrate deploy
          
          # 验证迁移结果
          pnpm prisma db pull
          git diff --exit-code prisma/schema.prisma || {
            echo "Schema mismatch detected after migration"
            exit 1
          }
      
      - name: Run Integration Tests
        env:
          DATABASE_URL: mysql://root:test_password@localhost:3306/easy_erp_test
          REDIS_URL: redis://localhost:6379
        run: |
          pnpm run test:integration
          pnpm run test:e2e
      
      - name: Performance Benchmark
        env:
          DATABASE_URL: mysql://root:test_password@localhost:3306/easy_erp_test
        run: |
          # 运行性能基准测试
          pnpm run test:performance
          
          # 生成性能报告
          ./scripts/generate-performance-report.sh
      
      - name: Upload Test Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-${{ github.sha }}
          path: |
            test-results/
            coverage/
            performance-report.json

  # 生产环境部署
  production-deployment:
    name: Production Deployment
    runs-on: ubuntu-latest
    needs: [pre-checks, test-deployment]
    if: |
      github.ref == 'refs/heads/main' && 
      needs.pre-checks.outputs.has-migrations == 'true' &&
      needs.test-deployment.result == 'success'
    environment:
      name: production
      url: https://erp.company.com
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Download Migration Artifacts
        uses: actions/download-artifact@v4
        with:
          name: migration-files-${{ needs.pre-checks.outputs.migration-hash }}
      
      - name: Setup Production Database Connection
        run: |
          # 配置生产数据库连接
          echo "DATABASE_URL=${{ secrets.PRODUCTION_DATABASE_URL }}" >> $GITHUB_ENV
          echo "BACKUP_STORAGE_URL=${{ secrets.BACKUP_STORAGE_URL }}" >> $GITHUB_ENV
          
          # 验证数据库连接
          ./scripts/verify-db-connection.sh
      
      - name: Create Database Backup
        id: backup
        run: |
          # 创建迁移前备份
          BACKUP_ID=$(date +%Y%m%d_%H%M%S)_migration_${{ github.sha }}
          echo "backup-id=$BACKUP_ID" >> $GITHUB_OUTPUT
          
          # 执行备份
          ./scripts/create-backup.sh $BACKUP_ID
          
          # 验证备份完整性
          ./scripts/verify-backup.sh $BACKUP_ID
          
          echo "Backup created: $BACKUP_ID"
      
      - name: Enable Maintenance Mode
        run: |
          # 启用维护模式
          ./scripts/enable-maintenance-mode.sh
          
          # 等待活跃连接结束
          ./scripts/wait-for-connections-drain.sh
      
      - name: Execute Database Migration
        id: migration
        run: |
          # 记录迁移开始时间
          echo "MIGRATION_START=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> $GITHUB_ENV
          
          # 启动监控
          ./scripts/start-migration-monitoring.sh &
          MONITOR_PID=$!
          echo "monitor-pid=$MONITOR_PID" >> $GITHUB_OUTPUT
          
          # 执行迁移
          timeout 600 pnpm prisma migrate deploy || {
            echo "Migration timed out or failed"
            kill $MONITOR_PID 2>/dev/null || true
            exit 1
          }
          
          # 停止监控
          kill $MONITOR_PID 2>/dev/null || true
          
          # 验证迁移结果
          ./scripts/verify-migration.sh
      
      - name: Deploy Application
        run: |
          # 构建应用
          pnpm run build
          
          # 部署到生产环境
          ./scripts/deploy-application.sh
      
      - name: Health Check
        run: |
          # 等待应用启动
          sleep 30
          
          # 执行健康检查
          ./scripts/health-check.sh
          
          # 验证关键功能
          ./scripts/smoke-test.sh
      
      - name: Disable Maintenance Mode
        run: |
          # 禁用维护模式
          ./scripts/disable-maintenance-mode.sh
          
          # 逐步恢复流量
          ./scripts/gradual-traffic-restore.sh
      
      - name: Post-deployment Monitoring
        run: |
          # 启动部署后监控
          ./scripts/start-post-deployment-monitoring.sh
          
          # 等待监控稳定
          sleep 300
          
          # 检查关键指标
          ./scripts/check-deployment-metrics.sh
      
      - name: Cleanup on Failure
        if: failure()
        run: |
          echo "Deployment failed, initiating rollback..."
          
          # 回滚数据库
          ./scripts/rollback-database.sh ${{ steps.backup.outputs.backup-id }}
          
          # 回滚应用
          ./scripts/rollback-application.sh
          
          # 禁用维护模式
          ./scripts/disable-maintenance-mode.sh
          
          # 发送失败通知
          ./scripts/send-failure-notification.sh
      
      - name: Send Success Notification
        if: success()
        run: |
          ./scripts/send-success-notification.sh
      
      - name: Update Deployment Record
        if: always()
        run: |
          ./scripts/update-deployment-record.sh

  # 监控和告警
  monitoring:
    name: Post-deployment Monitoring
    runs-on: ubuntu-latest
    needs: production-deployment
    if: always() && needs.production-deployment.result != 'skipped'
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
      
      - name: Setup Monitoring
        run: |
          # 配置监控告警
          ./scripts/setup-deployment-monitoring.sh
          
          # 创建临时告警规则
          ./scripts/create-deployment-alerts.sh
      
      - name: Monitor Deployment
        run: |
          # 监控部署后30分钟
          timeout 1800 ./scripts/monitor-deployment.sh || {
            echo "Monitoring completed or timed out"
          }
      
      - name: Generate Deployment Report
        run: |
          ./scripts/generate-deployment-report.sh
      
      - name: Cleanup Monitoring
        if: always()
        run: |
          # 清理临时告警规则
          ./scripts/cleanup-deployment-alerts.sh
```

### 2. 迁移验证工作流

```yaml
# .github/workflows/migration-validation.yml
name: Migration Validation

on:
  pull_request:
    paths:
      - 'prisma/migrations/**'
      - 'prisma/schema.prisma'

jobs:
  validate-migrations:
    name: Validate Database Migrations
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        mysql-version: ['8.0', '8.1']
    
    services:
      mysql:
        image: mysql:${{ matrix.mysql-version }}
        env:
          MYSQL_ROOT_PASSWORD: test_password
          MYSQL_DATABASE: migration_test
        ports:
          - 3306:3306
        options: >
          --health-cmd="mysqladmin ping -h localhost"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=10
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Analyze Migration Changes
        run: |
          # 分析迁移变更
          ./scripts/analyze-migration-changes.sh
          
          # 检查破坏性变更
          ./scripts/check-breaking-changes.sh
          
          # 估算迁移时间
          ./scripts/estimate-migration-time.sh
      
      - name: Test Migration on Empty Database
        env:
          DATABASE_URL: mysql://root:test_password@localhost:3306/migration_test
        run: |
          # 在空数据库上测试迁移
          pnpm prisma migrate deploy
          
          # 验证 schema 一致性
          pnpm prisma db pull
          git diff --exit-code prisma/schema.prisma
      
      - name: Test Migration with Sample Data
        env:
          DATABASE_URL: mysql://root:test_password@localhost:3306/migration_test
        run: |
          # 重置数据库
          pnpm prisma migrate reset --force
          
          # 创建旧版本 schema
          git checkout HEAD~1 -- prisma/
          pnpm prisma migrate deploy
          
          # 插入测试数据
          ./scripts/insert-sample-data.sh
          
          # 切换到新版本并迁移
          git checkout HEAD -- prisma/
          pnpm prisma migrate deploy
          
          # 验证数据完整性
          ./scripts/verify-data-integrity.sh
      
      - name: Performance Impact Test
        env:
          DATABASE_URL: mysql://root:test_password@localhost:3306/migration_test
        run: |
          # 创建大量测试数据
          ./scripts/create-large-dataset.sh
          
          # 测试迁移性能
          time pnpm prisma migrate deploy
          
          # 测试查询性能影响
          ./scripts/test-query-performance.sh
      
      - name: Generate Migration Report
        run: |
          ./scripts/generate-migration-report.sh > migration-report.md
      
      - name: Comment PR with Report
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('migration-report.md', 'utf8');
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
```

### 3. 回滚工作流

```yaml
# .github/workflows/rollback.yml
name: Emergency Rollback

on:
  workflow_dispatch:
    inputs:
      backup_id:
        description: 'Backup ID to rollback to'
        required: true
        type: string
      reason:
        description: 'Rollback reason'
        required: true
        type: string
      confirm:
        description: 'Type "CONFIRM" to proceed with rollback'
        required: true
        type: string

jobs:
  rollback:
    name: Emergency Database Rollback
    runs-on: ubuntu-latest
    environment:
      name: production
    
    steps:
      - name: Validate Confirmation
        run: |
          if [ "${{ github.event.inputs.confirm }}" != "CONFIRM" ]; then
            echo "Rollback not confirmed. Exiting."
            exit 1
          fi
      
      - name: Checkout Code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Verify Backup Exists
        run: |
          ./scripts/verify-backup-exists.sh ${{ github.event.inputs.backup_id }}
      
      - name: Enable Maintenance Mode
        run: |
          ./scripts/enable-maintenance-mode.sh
      
      - name: Create Pre-rollback Backup
        run: |
          CURRENT_BACKUP_ID=$(date +%Y%m%d_%H%M%S)_pre_rollback
          ./scripts/create-backup.sh $CURRENT_BACKUP_ID
          echo "Pre-rollback backup created: $CURRENT_BACKUP_ID"
      
      - name: Execute Rollback
        run: |
          ./scripts/rollback-database.sh ${{ github.event.inputs.backup_id }}
      
      - name: Verify Rollback
        run: |
          ./scripts/verify-rollback.sh
      
      - name: Disable Maintenance Mode
        run: |
          ./scripts/disable-maintenance-mode.sh
      
      - name: Send Rollback Notification
        run: |
          ./scripts/send-rollback-notification.sh \
            "${{ github.event.inputs.backup_id }}" \
            "${{ github.event.inputs.reason }}"
```

## 📜 支持脚本实现

### 1. 迁移验证脚本

```bash
#!/bin/bash
# scripts/validate-migrations.sh

set -e

echo "=== 验证数据库迁移脚本 ==="

# 检查危险操作
check_dangerous_operations() {
    echo "检查危险操作..."
    
    DANGEROUS_PATTERNS=(
        "DROP TABLE"
        "DROP DATABASE"
        "TRUNCATE"
        "DELETE FROM.*WHERE.*1=1"
        "UPDATE.*SET.*WHERE.*1=1"
    )
    
    for pattern in "${DANGEROUS_PATTERNS[@]}"; do
        if grep -r -i "$pattern" prisma/migrations/; then
            echo "❌ 发现危险操作: $pattern"
            echo "请确认此操作是否必要，并添加适当的安全检查"
            exit 1
        fi
    done
    
    echo "✅ 未发现危险操作"
}

# 检查迁移文件命名
check_migration_naming() {
    echo "检查迁移文件命名..."
    
    find prisma/migrations -name "*.sql" | while read -r file; do
        filename=$(basename "$file")
        if [[ ! $filename =~ ^[0-9]{14}_.*\.sql$ ]]; then
            echo "❌ 迁移文件命名不规范: $file"
            echo "应该遵循格式: YYYYMMDDHHMMSS_description.sql"
            exit 1
        fi
    done
    
    echo "✅ 迁移文件命名规范"
}

# 检查迁移文件大小
check_migration_size() {
    echo "检查迁移文件大小..."
    
    MAX_SIZE=1048576  # 1MB
    
    find prisma/migrations -name "*.sql" | while read -r file; do
        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
        if [ "$size" -gt "$MAX_SIZE" ]; then
            echo "⚠️  迁移文件过大: $file (${size} bytes)"
            echo "建议将大型迁移拆分为多个小迁移"
        fi
    done
    
    echo "✅ 迁移文件大小检查完成"
}

# 检查索引创建
check_index_creation() {
    echo "检查索引创建..."
    
    if grep -r -i "CREATE.*INDEX" prisma/migrations/; then
        echo "⚠️  发现索引创建操作"
        echo "请确认:"
        echo "1. 索引创建是否使用 ALGORITHM=INPLACE"
        echo "2. 是否在低峰期执行"
        echo "3. 是否评估了对性能的影响"
    fi
    
    echo "✅ 索引创建检查完成"
}

# 执行所有检查
check_dangerous_operations
check_migration_naming
check_migration_size
check_index_creation

echo "✅ 迁移验证完成"
```

### 2. 备份创建脚本

```bash
#!/bin/bash
# scripts/create-backup.sh

set -e

BACKUP_ID="$1"
if [ -z "$BACKUP_ID" ]; then
    echo "错误: 请提供备份ID"
    exit 1
fi

echo "=== 创建数据库备份: $BACKUP_ID ==="

# 配置
BACKUP_DIR="/var/backups/mysql"
S3_BUCKET="${BACKUP_STORAGE_BUCKET:-easy-erp-backups}"
DATABASE_NAME="${DATABASE_NAME:-easy_erp}"
MYSQL_HOST="${MYSQL_HOST:-localhost}"
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_PASSWORD="${MYSQL_PASSWORD}"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名
BACKUP_FILE="$BACKUP_DIR/${BACKUP_ID}.sql.gz"
METADATA_FILE="$BACKUP_DIR/${BACKUP_ID}.metadata.json"

echo "创建备份文件: $BACKUP_FILE"

# 创建数据库备份
mysqldump \
    --host="$MYSQL_HOST" \
    --user="$MYSQL_USER" \
    --password="$MYSQL_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --add-drop-table \
    --create-options \
    --disable-keys \
    --extended-insert \
    --quick \
    --lock-tables=false \
    "$DATABASE_NAME" | gzip > "$BACKUP_FILE"

# 验证备份文件
if [ ! -f "$BACKUP_FILE" ] || [ ! -s "$BACKUP_FILE" ]; then
    echo "❌ 备份文件创建失败"
    exit 1
fi

# 创建元数据
cat > "$METADATA_FILE" << EOF
{
  "backup_id": "$BACKUP_ID",
  "database_name": "$DATABASE_NAME",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "mysql_version": "$(mysql --version)",
  "file_size": $(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE"),
  "checksum": "$(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)",
  "git_commit": "${GITHUB_SHA:-$(git rev-parse HEAD)}",
  "environment": "${ENVIRONMENT:-production}"
}
EOF

# 上传到 S3
if command -v aws &> /dev/null; then
    echo "上传备份到 S3..."
    aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/database/$BACKUP_ID.sql.gz"
    aws s3 cp "$METADATA_FILE" "s3://$S3_BUCKET/database/$BACKUP_ID.metadata.json"
    
    # 设置生命周期
    aws s3api put-object-tagging \
        --bucket "$S3_BUCKET" \
        --key "database/$BACKUP_ID.sql.gz" \
        --tagging 'TagSet=[{Key=Type,Value=DatabaseBackup},{Key=Environment,Value='"$ENVIRONMENT"'}]'
fi

# 清理本地旧备份（保留最近7天）
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.metadata.json" -mtime +7 -delete

echo "✅ 备份创建完成: $BACKUP_ID"
echo "文件大小: $(du -h "$BACKUP_FILE" | cut -f1)"
echo "校验和: $(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)"
```

### 3. 监控脚本

```bash
#!/bin/bash
# scripts/start-migration-monitoring.sh

set -e

echo "=== 启动迁移监控 ==="

# 配置
MONITORING_INTERVAL=5
ALERT_WEBHOOK="${ALERT_WEBHOOK_URL}"
DATABASE_URL="${DATABASE_URL}"

# 监控函数
monitor_migration() {
    while true; do
        # 获取当前时间
        TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
        
        # 检查数据库连接
        if ! mysql --execute="SELECT 1" "$DATABASE_URL" &>/dev/null; then
            send_alert "critical" "数据库连接失败" "无法连接到数据库"
            continue
        fi
        
        # 检查活跃连接数
        CONNECTIONS=$(mysql --execute="SHOW STATUS LIKE 'Threads_connected'" "$DATABASE_URL" | awk 'NR==2 {print $2}')
        if [ "$CONNECTIONS" -gt 100 ]; then
            send_alert "warning" "数据库连接数过高" "当前连接数: $CONNECTIONS"
        fi
        
        # 检查锁等待
        LOCK_WAITS=$(mysql --execute="SELECT COUNT(*) FROM information_schema.INNODB_LOCKS" "$DATABASE_URL" | awk 'NR==2 {print $1}')
        if [ "$LOCK_WAITS" -gt 0 ]; then
            send_alert "warning" "检测到锁等待" "等待锁数量: $LOCK_WAITS"
        fi
        
        # 检查慢查询
        SLOW_QUERIES=$(mysql --execute="SHOW STATUS LIKE 'Slow_queries'" "$DATABASE_URL" | awk 'NR==2 {print $2}')
        if [ "$SLOW_QUERIES" -gt "${LAST_SLOW_QUERIES:-0}" ]; then
            NEW_SLOW=$(( SLOW_QUERIES - ${LAST_SLOW_QUERIES:-0} ))
            if [ "$NEW_SLOW" -gt 5 ]; then
                send_alert "warning" "慢查询增加" "新增慢查询: $NEW_SLOW"
            fi
        fi
        LAST_SLOW_QUERIES="$SLOW_QUERIES"
        
        # 记录监控数据
        echo "[$TIMESTAMP] 连接数: $CONNECTIONS, 锁等待: $LOCK_WAITS, 慢查询: $SLOW_QUERIES"
        
        sleep "$MONITORING_INTERVAL"
    done
}

# 发送告警
send_alert() {
    local severity="$1"
    local title="$2"
    local message="$3"
    
    if [ -n "$ALERT_WEBHOOK" ]; then
        curl -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"severity\": \"$severity\",
                \"title\": \"$title\",
                \"message\": \"$message\",
                \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
                \"source\": \"migration-monitor\"
            }"
    fi
    
    echo "[ALERT] [$severity] $title: $message"
}

# 启动监控
monitor_migration
```

### 4. 健康检查脚本

```bash
#!/bin/bash
# scripts/health-check.sh

set -e

echo "=== 应用健康检查 ==="

# 配置
APP_URL="${APP_URL:-http://localhost:3000}"
MAX_RETRIES=30
RETRY_INTERVAL=10

# 检查应用响应
check_app_response() {
    local url="$1"
    local expected_status="${2:-200}"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        return 0
    else
        return 1
    fi
}

# 检查数据库连接
check_database() {
    echo "检查数据库连接..."
    
    if check_app_response "$APP_URL/api/health/database"; then
        echo "✅ 数据库连接正常"
    else
        echo "❌ 数据库连接失败"
        return 1
    fi
}

# 检查关键API
check_critical_apis() {
    echo "检查关键API..."
    
    local apis=(
        "/api/health"
        "/api/auth/status"
        "/api/users/profile"
        "/api/orders/list"
    )
    
    for api in "${apis[@]}"; do
        if check_app_response "$APP_URL$api"; then
            echo "✅ API正常: $api"
        else
            echo "❌ API异常: $api"
            return 1
        fi
    done
}

# 检查应用性能
check_performance() {
    echo "检查应用性能..."
    
    # 测试响应时间
    response_time=$(curl -s -o /dev/null -w "%{time_total}" "$APP_URL/api/health")
    
    # 转换为毫秒
    response_time_ms=$(echo "$response_time * 1000" | bc)
    
    if (( $(echo "$response_time_ms < 1000" | bc -l) )); then
        echo "✅ 响应时间正常: ${response_time_ms}ms"
    else
        echo "⚠️  响应时间较慢: ${response_time_ms}ms"
    fi
}

# 主检查流程
main() {
    echo "开始健康检查..."
    
    # 等待应用启动
    echo "等待应用启动..."
    for i in $(seq 1 $MAX_RETRIES); do
        if check_app_response "$APP_URL/api/health"; then
            echo "✅ 应用已启动 (尝试 $i/$MAX_RETRIES)"
            break
        else
            if [ $i -eq $MAX_RETRIES ]; then
                echo "❌ 应用启动超时"
                exit 1
            fi
            echo "等待应用启动... ($i/$MAX_RETRIES)"
            sleep $RETRY_INTERVAL
        fi
    done
    
    # 执行各项检查
    check_database
    check_critical_apis
    check_performance
    
    echo "✅ 健康检查完成"
}

main
```

## 📊 监控集成

### 1. GitHub Actions 监控指标

```typescript
// src/monitoring/github-actions-metrics.ts
export interface GitHubActionsMetrics {
  // 部署指标
  deploymentDuration: number
  deploymentSuccess: boolean
  migrationDuration: number
  migrationSuccess: boolean
  
  // 质量指标
  testCoverage: number
  testPassRate: number
  codeQualityScore: number
  
  // 性能指标
  buildTime: number
  deploymentSize: number
  startupTime: number
  
  // 错误指标
  errorCount: number
  warningCount: number
  criticalIssues: number
}

export class GitHubActionsMonitor {
  private influxClient: InfluxDB
  
  constructor() {
    this.influxClient = new InfluxDB({
      url: process.env.INFLUXDB_URL!,
      token: process.env.INFLUXDB_TOKEN!
    })
  }
  
  async recordDeploymentMetrics(metrics: GitHubActionsMetrics) {
    const writeApi = this.influxClient.getWriteApi(
      process.env.INFLUXDB_ORG!,
      process.env.INFLUXDB_BUCKET!
    )
    
    // 记录部署指标
    const deploymentPoint = new Point('github_actions_deployment')
      .tag('repository', process.env.GITHUB_REPOSITORY!)
      .tag('branch', process.env.GITHUB_REF_NAME!)
      .tag('commit', process.env.GITHUB_SHA!)
      .floatField('duration', metrics.deploymentDuration)
      .booleanField('success', metrics.deploymentSuccess)
      .floatField('migration_duration', metrics.migrationDuration)
      .booleanField('migration_success', metrics.migrationSuccess)
      .timestamp(new Date())
    
    // 记录质量指标
    const qualityPoint = new Point('github_actions_quality')
      .tag('repository', process.env.GITHUB_REPOSITORY!)
      .tag('branch', process.env.GITHUB_REF_NAME!)
      .floatField('test_coverage', metrics.testCoverage)
      .floatField('test_pass_rate', metrics.testPassRate)
      .floatField('code_quality_score', metrics.codeQualityScore)
      .timestamp(new Date())
    
    writeApi.writePoints([deploymentPoint, qualityPoint])
    await writeApi.close()
  }
  
  async createDeploymentAlert(severity: 'info' | 'warning' | 'critical', message: string) {
    const alert = {
      id: `github-actions-${Date.now()}`,
      severity,
      title: 'GitHub Actions 部署告警',
      message,
      source: 'github-actions',
      repository: process.env.GITHUB_REPOSITORY,
      commit: process.env.GITHUB_SHA,
      branch: process.env.GITHUB_REF_NAME,
      timestamp: new Date().toISOString()
    }
    
    // 发送到告警系统
    await this.sendAlert(alert)
  }
  
  private async sendAlert(alert: any) {
    if (process.env.ALERT_WEBHOOK_URL) {
      await fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      })
    }
  }
}
```

### 2. 部署仪表板配置

```json
{
  "dashboard": {
    "title": "GitHub Actions 部署监控",
    "tags": ["github-actions", "deployment", "ci-cd"],
    "time": {
      "from": "now-24h",
      "to": "now"
    },
    "panels": [
      {
        "title": "部署成功率",
        "type": "stat",
        "targets": [
          {
            "query": "SELECT mean(success) FROM github_actions_deployment WHERE time >= now() - 24h GROUP BY time(1h)"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100,
            "thresholds": {
              "steps": [
                { "color": "red", "value": 0 },
                { "color": "yellow", "value": 95 },
                { "color": "green", "value": 99 }
              ]
            }
          }
        }
      },
      {
        "title": "部署时长趋势",
        "type": "timeseries",
        "targets": [
          {
            "query": "SELECT mean(duration) FROM github_actions_deployment WHERE time >= now() - 7d GROUP BY time(1h)"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "custom": {
              "drawStyle": "line",
              "lineInterpolation": "smooth"
            }
          }
        }
      },
      {
        "title": "迁移执行统计",
        "type": "piechart",
        "targets": [
          {
            "query": "SELECT count(migration_success) FROM github_actions_deployment WHERE time >= now() - 7d GROUP BY migration_success"
          }
        ]
      },
      {
        "title": "最近部署记录",
        "type": "table",
        "targets": [
          {
            "query": "SELECT time, repository, branch, commit, duration, success FROM github_actions_deployment WHERE time >= now() - 24h ORDER BY time DESC LIMIT 20"
          }
        ]
      }
    ]
  }
}
```

## ✅ 验收标准

### 功能验收
- [ ] 支持自动化数据库迁移流程
- [ ] 实现迁移前自动备份机制
- [ ] 支持迁移失败自动回滚
- [ ] 集成监控告警系统
- [ ] 提供多环境部署支持
- [ ] 实现蓝绿部署策略

### 性能验收
- [ ] 完整部署流程 ≤ 10分钟
- [ ] 迁移失败回滚时间 ≤ 2分钟
- [ ] 自动化部署成功率 ≥ 99%
- [ ] 监控告警响应时间 ≤ 30秒

### 安全验收
- [ ] 迁移脚本安全验证
- [ ] 敏感信息加密存储
- [ ] 操作审计日志完整
- [ ] 权限控制机制完善

### 可靠性验收
- [ ] 支持并发部署控制
- [ ] 异常情况自动恢复
- [ ] 完整的错误处理机制
- [ ] 部署状态实时跟踪

### 可维护性验收
- [ ] 提供完整的部署文档
- [ ] 支持配置热更新
- [ ] 提供故障排查指南
- [ ] 支持部署流程自定义

---

**文档版本**: v1.0  
**创建时间**: 2025-01-22  
**依赖文档**: DESIGN_database_sync_optimization.md, BACKUP_RECOVERY_DESIGN.md, MONITORING_ALERT_DESIGN.md  
**状态**: ✅ GitHub Actions集成方案设计完成，等待实施确认