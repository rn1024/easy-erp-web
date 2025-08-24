# 生产环境安全操作手册

**文档版本**: v1.0.0  
**创建时间**: 2024-01-21  
**适用场景**: 生产环境数据库迁移冲突修复  
**操作等级**: 🔴 高风险操作  
**必需权限**: 数据库管理员 + 系统管理员  

## ⚠️ 重要声明

**本手册适用于生产环境关键操作，任何步骤都不可跳过或简化。**

- 🚫 **禁止在生产环境进行实验性操作**
- 🚫 **禁止在没有备份的情况下执行任何变更**
- 🚫 **禁止在业务高峰期执行非紧急操作**
- ✅ **所有操作必须有至少 2 人在线确认**
- ✅ **每个步骤执行后必须验证结果**
- ✅ **遇到异常立即停止并启动回滚流程**

## 1. 操作前准备清单

### 1.1 人员准备

#### 必需在线人员
- [ ] **主操作员**: 执行具体操作
- [ ] **监督员**: 监督操作过程，确认每个步骤
- [ ] **数据库管理员**: 处理数据库相关问题
- [ ] **系统管理员**: 处理系统和部署问题

#### 待命人员
- [ ] **技术负责人**: 重大决策和应急处理
- [ ] **产品负责人**: 业务影响评估和用户沟通

### 1.2 环境准备

#### 网络和访问
- [ ] **VPN 连接**: 确保稳定的网络连接
- [ ] **服务器访问**: 确认可以正常 SSH 到生产服务器
- [ ] **数据库访问**: 确认数据库连接正常
- [ ] **监控面板**: 打开系统监控面板

#### 工具准备
- [ ] **终端工具**: 准备多个终端窗口
- [ ] **数据库客户端**: 准备数据库管理工具
- [ ] **监控工具**: 准备系统监控工具
- [ ] **通讯工具**: 确保团队沟通渠道畅通

### 1.3 时间准备

#### 操作时间窗口
- **推荐时间**: 凌晨 2:00 - 6:00 (业务低峰期)
- **避免时间**: 工作日 9:00 - 18:00 (业务高峰期)
- **预留时间**: 至少 2 小时的操作窗口
- **应急时间**: 额外 1 小时的应急处理时间

## 2. 详细操作步骤

### 阶段一: 环境验证 (预计 10 分钟)

#### Step 1.1: 系统状态检查

```bash
# 1. 连接到生产服务器
ssh root@121.41.237.2

# 2. 进入项目目录
cd /path/to/easy-erp-web

# 3. 检查当前服务状态
pm2 status

# 4. 检查系统资源
free -h
df -h
top -n 1
```

**验证标准**:
- ✅ SSH 连接成功
- ✅ 项目目录存在且可访问
- ✅ PM2 服务正常运行
- ✅ 系统资源充足 (内存 > 20%, 磁盘 > 10%)

**异常处理**:
- 🚫 如果 SSH 连接失败 → 检查网络和服务器状态
- 🚫 如果服务异常 → 先修复服务问题再继续
- 🚫 如果资源不足 → 清理资源或选择其他时间

#### Step 1.2: 数据库连接验证

```bash
# 1. 检查环境变量
cat .env | grep DATABASE_URL

# 2. 测试数据库连接
npx prisma db pull --print > /tmp/schema_test.prisma

# 3. 验证连接成功
if [ $? -eq 0 ]; then
    echo "✅ 数据库连接正常"
    rm /tmp/schema_test.prisma
else
    echo "❌ 数据库连接失败"
    exit 1
fi
```

**验证标准**:
- ✅ DATABASE_URL 环境变量存在且格式正确
- ✅ 数据库连接测试成功
- ✅ 可以正常读取数据库结构

**异常处理**:
- 🚫 如果环境变量缺失 → 检查 .env 文件配置
- 🚫 如果连接失败 → 检查数据库服务状态和网络
- 🚫 如果权限不足 → 确认数据库用户权限

#### Step 1.3: 应用健康检查

```bash
# 1. 检查应用响应
curl -f http://localhost:3000/api/health

# 2. 检查关键接口
curl -f http://localhost:3000/api/v1/auth/status

# 3. 检查数据库查询
curl -f http://localhost:3000/api/v1/system/status
```

**验证标准**:
- ✅ 健康检查接口返回 200 状态码
- ✅ 认证接口正常响应
- ✅ 系统状态接口正常响应

**异常处理**:
- 🚫 如果接口无响应 → 检查应用服务状态
- 🚫 如果返回错误 → 查看应用日志排查问题
- 🚫 如果数据库查询失败 → 检查数据库连接和权限

### 阶段二: 数据备份 (预计 15 分钟)

#### Step 2.1: 创建完整数据库备份

```bash
# 1. 创建备份目录
BACKUP_DIR="/backup/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# 2. 导出数据库结构和数据
# 注意：需要根据实际的数据库连接信息调整
mysqldump -h [host] -u [username] -p[password] [database_name] > $BACKUP_DIR/full_backup.sql

# 3. 验证备份文件
if [ -f "$BACKUP_DIR/full_backup.sql" ] && [ -s "$BACKUP_DIR/full_backup.sql" ]; then
    echo "✅ 数据库备份创建成功: $BACKUP_DIR/full_backup.sql"
    ls -lh $BACKUP_DIR/full_backup.sql
else
    echo "❌ 数据库备份创建失败"
    exit 1
fi
```

**验证标准**:
- ✅ 备份文件创建成功
- ✅ 备份文件大小合理 (不为空)
- ✅ 备份文件包含完整的数据库结构和数据

**异常处理**:
- 🚫 如果备份失败 → 检查数据库连接和权限
- 🚫 如果备份文件为空 → 检查 mysqldump 命令参数
- 🚫 如果磁盘空间不足 → 清理空间或选择其他位置

#### Step 2.2: 备份迁移状态

```bash
# 1. 备份 Prisma 迁移目录
cp -r prisma/migrations $BACKUP_DIR/migrations_backup

# 2. 备份当前 schema 文件
cp prisma/schema.prisma $BACKUP_DIR/schema_backup.prisma

# 3. 导出当前迁移状态
npx prisma migrate status > $BACKUP_DIR/migration_status.txt

# 4. 验证备份完整性
if [ -d "$BACKUP_DIR/migrations_backup" ] && [ -f "$BACKUP_DIR/schema_backup.prisma" ]; then
    echo "✅ 迁移状态备份完成"
    ls -la $BACKUP_DIR/
else
    echo "❌ 迁移状态备份失败"
    exit 1
fi
```

**验证标准**:
- ✅ 迁移目录备份成功
- ✅ Schema 文件备份成功
- ✅ 迁移状态记录成功

#### Step 2.3: 创建回滚脚本

```bash
# 创建自动回滚脚本
cat > $BACKUP_DIR/rollback.sh << 'EOF'
#!/bin/bash
set -euo pipefail

BACKUP_DIR="$(dirname "$0")"
echo "🔄 开始回滚操作..."

# 1. 停止应用服务
echo "停止应用服务..."
pm2 stop easy-erp

# 2. 恢复数据库
echo "恢复数据库..."
mysql -h [host] -u [username] -p[password] [database_name] < $BACKUP_DIR/full_backup.sql

# 3. 恢复迁移状态
echo "恢复迁移状态..."
rm -rf prisma/migrations
cp -r $BACKUP_DIR/migrations_backup prisma/migrations
cp $BACKUP_DIR/schema_backup.prisma prisma/schema.prisma

# 4. 重启应用服务
echo "重启应用服务..."
pm2 start easy-erp

# 5. 验证恢复结果
echo "验证恢复结果..."
sleep 10
curl -f http://localhost:3000/api/health

echo "✅ 回滚操作完成"
EOF

# 设置执行权限
chmod +x $BACKUP_DIR/rollback.sh

echo "✅ 回滚脚本创建完成: $BACKUP_DIR/rollback.sh"
```

### 阶段三: 问题诊断 (预计 10 分钟)

#### Step 3.1: 检查迁移状态

```bash
# 1. 查看当前迁移状态
echo "📊 当前迁移状态:"
npx prisma migrate status

# 2. 检查问题迁移文件
echo "📄 问题迁移文件内容:"
cat prisma/migrations/20250821015630_add_shipment_file_field/migration.sql

# 3. 记录状态到日志
npx prisma migrate status > $BACKUP_DIR/current_migration_status.txt
```

#### Step 3.2: 检查数据库字段状态

```bash
# 1. 检查 shipmentFile 字段是否存在
echo "🔍 检查 shipmentFile 字段状态:"

# 创建检查脚本
cat > /tmp/check_field.sql << 'EOF'
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    CHARACTER_MAXIMUM_LENGTH
FROM 
    INFORMATION_SCHEMA.COLUMNS 
WHERE 
    TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'shipment_records' 
    AND COLUMN_NAME = 'shipmentFile';
EOF

# 执行检查
mysql -h [host] -u [username] -p[password] [database_name] < /tmp/check_field.sql > $BACKUP_DIR/field_check_result.txt

# 显示结果
echo "字段检查结果:"
cat $BACKUP_DIR/field_check_result.txt

# 清理临时文件
rm /tmp/check_field.sql
```

**判断标准**:
- 如果查询返回结果 → 字段已存在，使用方案一
- 如果查询无结果 → 字段不存在，需要进一步分析

#### Step 3.3: 生成诊断报告

```bash
# 创建诊断报告
cat > $BACKUP_DIR/diagnosis_report.md << EOF
# 生产环境问题诊断报告

**诊断时间**: $(date '+%Y-%m-%d %H:%M:%S')
**操作员**: $(whoami)
**服务器**: $(hostname)

## 系统状态
\`\`\`
$(pm2 status)
\`\`\`

## 迁移状态
\`\`\`
$(cat $BACKUP_DIR/current_migration_status.txt)
\`\`\`

## 字段检查结果
\`\`\`
$(cat $BACKUP_DIR/field_check_result.txt)
\`\`\`

## 推荐方案
$(if [ -s $BACKUP_DIR/field_check_result.txt ]; then echo "方案一: 迁移状态同步"; else echo "需要进一步分析"; fi)
EOF

echo "✅ 诊断报告生成完成: $BACKUP_DIR/diagnosis_report.md"
cat $BACKUP_DIR/diagnosis_report.md
```

### 阶段四: 执行修复 (预计 5 分钟)

#### Step 4.1: 方案一 - 迁移状态同步 (推荐)

**适用条件**: 数据库中已存在 `shipmentFile` 字段

```bash
# 1. 确认执行方案
echo "🔧 执行方案一: 迁移状态同步"
echo "⚠️  此操作将标记迁移 20250821015630_add_shipment_file_field 为已应用"
read -p "确认执行? (输入 'YES' 继续): " confirm

if [ "$confirm" != "YES" ]; then
    echo "❌ 操作已取消"
    exit 1
fi

# 2. 执行迁移状态同步
echo "执行迁移状态同步..."
npx prisma migrate resolve --applied 20250821015630_add_shipment_file_field

# 3. 验证操作结果
echo "验证操作结果..."
npx prisma migrate status

# 4. 记录操作结果
npx prisma migrate status > $BACKUP_DIR/after_fix_migration_status.txt

echo "✅ 方案一执行完成"
```

**验证标准**:
- ✅ 命令执行无错误
- ✅ 迁移状态显示为已应用
- ✅ 没有待应用的迁移

#### Step 4.2: 方案二 - 条件迁移修复 (备选)

**适用条件**: 方案一失败或字段不存在

```bash
# 1. 备份原始迁移文件
cp prisma/migrations/20250821015630_add_shipment_file_field/migration.sql $BACKUP_DIR/original_migration.sql

# 2. 修改迁移文件
cat > prisma/migrations/20250821015630_add_shipment_file_field/migration.sql << 'EOF'
-- AddShipmentFileField
ALTER TABLE `shipment_records` ADD COLUMN IF NOT EXISTS `shipmentFile` VARCHAR(191) NULL;
EOF

# 3. 执行修改后的迁移
echo "执行修改后的迁移..."
npx prisma migrate deploy

# 4. 验证结果
npx prisma migrate status

echo "✅ 方案二执行完成"
```

### 阶段五: 验证测试 (预计 15 分钟)

#### Step 5.1: 数据库验证

```bash
# 1. 验证数据库连接
echo "🔍 验证数据库连接..."
npx prisma db pull --print > /tmp/current_schema.prisma

if [ $? -eq 0 ]; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接失败"
    exit 1
fi

# 2. 验证表结构
echo "🔍 验证表结构..."
mysql -h [host] -u [username] -p[password] [database_name] -e "DESCRIBE shipment_records;" > $BACKUP_DIR/table_structure.txt

echo "当前表结构:"
cat $BACKUP_DIR/table_structure.txt

# 3. 验证数据完整性
echo "🔍 验证数据完整性..."
mysql -h [host] -u [username] -p[password] [database_name] -e "SELECT COUNT(*) as total_records FROM shipment_records;" > $BACKUP_DIR/data_count.txt

echo "数据记录数:"
cat $BACKUP_DIR/data_count.txt
```

#### Step 5.2: 应用验证

```bash
# 1. 重新生成 Prisma 客户端
echo "🔧 重新生成 Prisma 客户端..."
npx prisma generate

# 2. 重启应用服务
echo "🔄 重启应用服务..."
pm2 restart easy-erp

# 3. 等待服务启动
echo "⏳ 等待服务启动..."
sleep 15

# 4. 验证服务状态
echo "🔍 验证服务状态..."
pm2 status

# 5. 验证应用响应
echo "🔍 验证应用响应..."
curl -f http://localhost:3000/api/health

if [ $? -eq 0 ]; then
    echo "✅ 应用服务正常"
else
    echo "❌ 应用服务异常"
    echo "查看应用日志:"
    pm2 logs easy-erp --lines 20
    exit 1
fi
```

#### Step 5.3: 功能验证

```bash
# 1. 测试关键接口
echo "🔍 测试关键接口..."

# 认证接口
curl -f http://localhost:3000/api/v1/auth/status
echo "✅ 认证接口正常"

# 系统状态接口
curl -f http://localhost:3000/api/v1/system/status
echo "✅ 系统状态接口正常"

# 数据库查询接口 (如果存在)
curl -f http://localhost:3000/api/v1/shipment/list?page=1&limit=1
echo "✅ 数据查询接口正常"

# 2. 记录测试结果
echo "$(date '+%Y-%m-%d %H:%M:%S') - 功能验证通过" >> $BACKUP_DIR/test_results.log
```

### 阶段六: 部署验证 (预计 10 分钟)

#### Step 6.1: 模拟部署流程

```bash
# 1. 测试迁移部署
echo "🚀 测试迁移部署..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ 迁移部署测试成功"
else
    echo "❌ 迁移部署测试失败"
    exit 1
fi

# 2. 测试应用构建
echo "🔧 测试应用构建..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 应用构建测试成功"
else
    echo "❌ 应用构建测试失败"
    exit 1
fi
```

#### Step 6.2: 触发实际部署

```bash
# 1. 确认部署
echo "🚀 准备触发实际部署"
echo "⚠️  此操作将触发 GitHub Actions 部署流程"
read -p "确认触发部署? (输入 'DEPLOY' 继续): " deploy_confirm

if [ "$deploy_confirm" != "DEPLOY" ]; then
    echo "❌ 部署已取消"
    exit 1
fi

# 2. 创建部署标记提交
echo "创建部署标记..."
git add .
git commit -m "fix: resolve shipment_file_field migration conflict

- Mark migration 20250821015630_add_shipment_file_field as applied
- Fix duplicate column name error in production deployment
- Ensure zero-downtime migration resolution

Tested-by: Production Team
Reviewed-by: Database Administrator"

# 3. 推送到远程仓库
echo "推送到远程仓库..."
git push origin main

echo "✅ 部署已触发，请监控 GitHub Actions 状态"
```

#### Step 6.3: 监控部署状态

```bash
# 1. 监控部署进度
echo "📊 监控部署进度..."
echo "请在浏览器中打开 GitHub Actions 页面监控部署状态"
echo "URL: https://github.com/[your-repo]/actions"

# 2. 本地监控服务状态
echo "📊 本地监控服务状态..."
for i in {1..30}; do
    echo "检查第 $i 次 ($(date '+%H:%M:%S'))..."
    
    # 检查服务状态
    pm2 status | grep easy-erp
    
    # 检查应用响应
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ 服务正常运行"
    else
        echo "⚠️ 服务响应异常"
    fi
    
    sleep 30
done
```

## 3. 异常处理流程

### 3.1 常见异常及处理

#### 异常一: 数据库连接失败

**症状**:
```
Error: P1001: Can't reach database server at `localhost:3306`
```

**处理步骤**:
```bash
# 1. 检查数据库服务状态
sudo systemctl status mysql

# 2. 检查网络连接
telnet localhost 3306

# 3. 检查环境变量
echo $DATABASE_URL

# 4. 重启数据库服务 (如果必要)
sudo systemctl restart mysql
```

#### 异常二: 迁移状态同步失败

**症状**:
```
Error: Migration `20250821015630_add_shipment_file_field` cannot be marked as applied
```

**处理步骤**:
```bash
# 1. 检查迁移历史表
mysql -h [host] -u [username] -p[password] [database_name] -e "SELECT * FROM _prisma_migrations WHERE migration_name LIKE '%shipment_file_field%';"

# 2. 手动清理迁移记录 (谨慎操作)
mysql -h [host] -u [username] -p[password] [database_name] -e "DELETE FROM _prisma_migrations WHERE migration_name = '20250821015630_add_shipment_file_field';"

# 3. 重新尝试标记
npx prisma migrate resolve --applied 20250821015630_add_shipment_file_field
```

#### 异常三: 应用启动失败

**症状**:
```
Application failed to start after migration
```

**处理步骤**:
```bash
# 1. 查看应用日志
pm2 logs easy-erp --lines 50

# 2. 检查 Prisma 客户端
npx prisma generate

# 3. 重启应用
pm2 restart easy-erp

# 4. 如果仍然失败，执行回滚
$BACKUP_DIR/rollback.sh
```

### 3.2 紧急回滚流程

#### 触发条件
- 数据库出现异常
- 应用无法正常启动
- 用户报告严重问题
- 监控指标异常

#### 回滚步骤

```bash
# 1. 立即停止当前操作
echo "🚨 触发紧急回滚"

# 2. 执行自动回滚脚本
$BACKUP_DIR/rollback.sh

# 3. 验证回滚结果
curl -f http://localhost:3000/api/health

# 4. 通知相关人员
echo "📞 通知技术负责人和产品负责人"

# 5. 记录回滚原因
echo "$(date '+%Y-%m-%d %H:%M:%S') - 紧急回滚执行，原因: [填写具体原因]" >> $BACKUP_DIR/rollback.log
```

## 4. 操作后检查清单

### 4.1 立即检查 (操作完成后 5 分钟内)

- [ ] **服务状态**: PM2 显示服务正常运行
- [ ] **应用响应**: 健康检查接口返回正常
- [ ] **数据库连接**: 数据库查询正常
- [ ] **关键功能**: 主要业务功能可用
- [ ] **错误日志**: 无新的错误日志产生

### 4.2 短期监控 (操作完成后 1 小时内)

- [ ] **系统稳定性**: 服务持续稳定运行
- [ ] **性能指标**: 响应时间在正常范围内
- [ ] **用户反馈**: 无用户报告问题
- [ ] **监控告警**: 无异常告警触发
- [ ] **业务指标**: 关键业务指标正常

### 4.3 长期观察 (操作完成后 24 小时内)

- [ ] **数据一致性**: 数据完整性检查通过
- [ ] **备份验证**: 自动备份正常执行
- [ ] **部署流程**: 后续部署正常进行
- [ ] **团队反馈**: 开发团队确认问题解决
- [ ] **文档更新**: 相关文档已更新

## 5. 总结和改进

### 5.1 操作总结模板

```markdown
# 生产环境迁移修复操作总结

**操作时间**: [开始时间] - [结束时间]
**操作人员**: [主操作员], [监督员]
**问题描述**: shipmentFile 字段重复添加导致迁移冲突
**解决方案**: [实际使用的方案]
**操作结果**: [成功/失败]

## 操作过程
1. [详细记录每个步骤的执行情况]
2. [包括遇到的问题和解决方法]
3. [记录关键决策点和原因]

## 验证结果
- 服务状态: [正常/异常]
- 功能验证: [通过/失败]
- 性能影响: [无影响/轻微影响/严重影响]
- 用户影响: [无影响/轻微影响/严重影响]

## 经验教训
1. [总结本次操作的经验]
2. [识别可以改进的地方]
3. [提出预防类似问题的建议]

## 后续行动
- [ ] [需要跟进的事项]
- [ ] [需要改进的流程]
- [ ] [需要更新的文档]
```

### 5.2 流程改进建议

1. **预防措施**
   - 建立迁移文件审查机制
   - 完善部署前检查流程
   - 加强环境同步管理

2. **工具改进**
   - 开发自动化检查脚本
   - 完善监控告警系统
   - 建立一键回滚机制

3. **团队建设**
   - 定期进行应急演练
   - 完善操作文档和培训
   - 建立知识分享机制

---

**文档维护**: 本文档应在每次生产环境操作后进行更新和完善  
**审核状态**: 需要技术负责人和数据库管理员审核确认  
**版本控制**: 所有修改都应记录版本变更历史  

> ⚠️ **重要提醒**: 本手册仅适用于特定的迁移冲突问题，其他生产环境操作应制定专门的操作手册。任何生产环境操作都应该谨慎进行，确保数据安全和服务稳定。