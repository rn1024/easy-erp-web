# 生产环境安全执行方案

**文档版本**: v1.0.0  
**创建时间**: 2024-01-21  
**执行场景**: 解决 shipmentFile 字段重复添加导致的迁移冲突  
**风险等级**: 🟡 低风险操作  
**执行权限**: 数据库管理员 + 技术负责人  
**预计执行时间**: 5-10 分钟  
**业务影响**: 零停机时间

## 📋 执行前准备清单

### 人员准备

- [ ] **主执行人**: 数据库管理员在线
- [ ] **技术负责人**: 在线监督和授权
- [ ] **备用人员**: 系统管理员待命
- [ ] **业务负责人**: 知情并确认执行时间窗口

### 环境准备

- [ ] **服务器连接**: 确认可以正常 SSH 连接到生产服务器
- [ ] **数据库连接**: 确认数据库连接正常
- [ ] **备份验证**: 确认最新备份存在且完整
- [ ] **监控系统**: 确认监控和告警系统正常
- [ ] **回滚脚本**: 确认回滚脚本已准备就绪

### 时间窗口

- [ ] **业务低峰期**: 选择用户访问量最低的时间段
- [ ] **团队在线**: 确保关键人员都在线
- [ ] **无其他变更**: 确认没有其他系统变更计划
- [ ] **充足时间**: 预留足够的时间进行验证和可能的回滚

## 🎯 推荐执行方案: 迁移状态同步法

### 方案概述

**核心思路**: 不修改数据库结构，只同步 Prisma 迁移状态记录

**技术原理**:

- 生产数据库中 `shipmentFile` 字段已存在
- Prisma 迁移记录中缺少对应的迁移记录
- 通过 `prisma migrate resolve --applied` 同步状态
- 告诉 Prisma "这个迁移已经应用过了"

**优势分析**:

- ✅ **零风险**: 不修改任何数据库结构
- ✅ **零停机**: 应用服务无需重启
- ✅ **快速执行**: 整个过程 2-3 分钟
- ✅ **完全可逆**: 可以随时撤销操作
- ✅ **无数据影响**: 不涉及任何数据变更

## 🔧 详细执行步骤

### 步骤 1: 环境验证 (预计 1 分钟)

```bash
# 1.1 连接到生产服务器
ssh root@121.41.237.2

# 1.2 进入项目目录
cd /path/to/easy-erp-web

# 1.3 验证环境变量
if [ -f ".env" ]; then
    echo "✅ .env 文件存在"
else
    echo "❌ .env 文件不存在，请检查环境配置"
    exit 1
fi

# 1.4 验证数据库连接
npx prisma db pull --preview-feature
if [ $? -eq 0 ]; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接失败，请检查连接配置"
    exit 1
fi

# 1.5 检查当前迁移状态
echo "当前迁移状态:"
npx prisma migrate status
```

**预期输出**:

```
Database schema is up to date!

Following migration have not yet been applied:
20250821015630_add_shipment_file_field

To apply pending migrations to the database, run `prisma migrate deploy`.
```

### 步骤 2: 数据库状态确认 (预计 1 分钟)

```bash
# 2.1 检查 shipmentFile 字段是否存在
echo "检查 shipmentFile 字段状态:"
mysql -h [host] -u [user] -p[password] [database] -e "
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = '[database_name]'
  AND TABLE_NAME = 'Shipment'
  AND COLUMN_NAME = 'shipmentFile';"

# 2.2 检查迁移记录表
echo "检查迁移记录状态:"
mysql -h [host] -u [user] -p[password] [database] -e "
SELECT
    migration_name,
    checksum,
    finished_at,
    applied_steps_count
FROM _prisma_migrations
WHERE migration_name = '20250821015630_add_shipment_file_field';"
```

**预期结果**:

- `shipmentFile` 字段存在 ✅
- 迁移记录不存在 ✅
- 这确认了我们的分析是正确的

### 步骤 3: 执行状态同步 (预计 1 分钟)

```bash
# 3.1 标记迁移为已应用
echo "执行迁移状态同步..."
npx prisma migrate resolve --applied 20250821015630_add_shipment_file_field

# 3.2 验证同步结果
echo "验证同步结果:"
npx prisma migrate status
```

**预期输出**:

```
Database schema is up to date!

No pending migrations to apply.
```

### 步骤 4: 应用服务验证 (预计 2 分钟)

```bash
# 4.1 重新生成 Prisma 客户端 (确保一致性)
echo "重新生成 Prisma 客户端..."
npx prisma generate

# 4.2 检查应用服务状态
echo "检查应用服务状态:"
pm2 status

# 4.3 测试数据库连接
echo "测试数据库连接:"
curl -f http://localhost:3000/api/health

# 4.4 测试关键功能 (如果有健康检查接口)
echo "测试关键业务功能:"
# 这里可以添加具体的业务功能测试
```

### 步骤 5: 部署验证 (预计 2 分钟)

```bash
# 5.1 尝试正常的部署流程
echo "验证部署流程..."

# 如果使用 PM2
pm2 restart easy-erp

# 等待服务启动
sleep 10

# 5.2 验证服务启动
echo "验证服务启动状态:"
pm2 status
curl -f http://localhost:3000/api/health

# 5.3 检查错误日志
echo "检查最近的错误日志:"
pm2 logs easy-erp --lines 20
```

### 步骤 6: 最终验证 (预计 2 分钟)

```bash
# 6.1 完整的迁移状态检查
echo "=== 最终验证报告 ==="
echo "1. 迁移状态:"
npx prisma migrate status

echo "2. 数据库 Schema 验证:"
npx prisma db pull --preview-feature

echo "3. 应用服务状态:"
pm2 status

echo "4. 健康检查:"
curl -f http://localhost:3000/api/health

echo "5. 最近日志 (检查是否有错误):"
pm2 logs easy-erp --lines 10

echo "=== 验证完成 ==="
```

## 🚨 异常处理流程

### 情况 1: 字段不存在

**现象**: 数据库中没有 `shipmentFile` 字段

**处理方案**:

```bash
# 这种情况下，正常执行迁移即可
echo "字段不存在，执行正常迁移:"
npx prisma migrate deploy
```

### 情况 2: 迁移记录已存在

**现象**: `_prisma_migrations` 表中已有对应记录

**处理方案**:

```bash
# 检查为什么 prisma migrate status 显示未应用
echo "迁移记录已存在，检查状态不一致原因:"
npx prisma migrate status --verbose

# 可能需要重置迁移状态
npx prisma migrate resolve --rolled-back 20250821015630_add_shipment_file_field
npx prisma migrate resolve --applied 20250821015630_add_shipment_file_field
```

### 情况 3: 数据库连接失败

**现象**: 无法连接到数据库

**处理方案**:

```bash
# 1. 检查数据库服务状态
sudo systemctl status mysql

# 2. 检查网络连接
telnet [db_host] [db_port]

# 3. 检查环境变量
echo $DATABASE_URL

# 4. 如果问题严重，暂停操作并联系数据库管理员
echo "数据库连接异常，暂停操作，请联系 DBA"
```

### 情况 4: 应用服务启动失败

**现象**: PM2 显示服务异常或健康检查失败

**处理方案**:

```bash
# 1. 查看详细错误日志
pm2 logs easy-erp --lines 50

# 2. 检查端口占用
netstat -tlnp | grep :3000

# 3. 尝试重新生成 Prisma 客户端
npx prisma generate
pm2 restart easy-erp

# 4. 如果仍然失败，执行快速回滚
./scripts/quick-rollback.sh
```

## 📊 成功标准

### 技术指标

- [ ] `npx prisma migrate status` 显示 "No pending migrations"
- [ ] 应用服务正常启动 (PM2 状态为 online)
- [ ] 健康检查接口返回 200 状态码
- [ ] 数据库连接正常
- [ ] 无新的错误日志产生

### 业务指标

- [ ] 用户可以正常访问系统
- [ ] 关键业务功能正常工作
- [ ] 数据读写操作正常
- [ ] 文件上传功能正常 (如果涉及 shipmentFile)
- [ ] 无用户投诉或异常反馈

### 监控指标

- [ ] 系统响应时间在正常范围内
- [ ] 数据库查询性能正常
- [ ] 服务器资源使用率正常
- [ ] 错误率保持在基线水平
- [ ] 所有监控告警保持正常状态

## 🔄 执行后检查清单

### 立即检查 (执行完成后 5 分钟内)

- [ ] 记录执行时间和结果
- [ ] 验证所有技术指标
- [ ] 检查应用服务状态
- [ ] 查看系统监控面板
- [ ] 通知相关人员执行结果

### 短期监控 (执行完成后 30 分钟内)

- [ ] 持续监控系统性能指标
- [ ] 关注用户反馈和投诉
- [ ] 检查业务功能是否正常
- [ ] 监控错误日志和异常
- [ ] 确认数据一致性

### 长期观察 (执行完成后 24 小时内)

- [ ] 监控系统稳定性
- [ ] 收集用户使用反馈
- [ ] 分析性能趋势
- [ ] 验证数据完整性
- [ ] 评估修复效果

## 📝 执行记录模板

```markdown
# 生产环境修复执行记录

**执行时间**: [开始时间] - [结束时间]
**执行人员**: [主执行人] / [监督人员]
**执行方案**: 迁移状态同步法

## 执行过程

### 步骤 1: 环境验证

- 开始时间: [时间]
- 执行结果: [成功/失败]
- 备注: [详细说明]

### 步骤 2: 数据库状态确认

- 开始时间: [时间]
- shipmentFile 字段状态: [存在/不存在]
- 迁移记录状态: [存在/不存在]
- 执行结果: [成功/失败]
- 备注: [详细说明]

### 步骤 3: 执行状态同步

- 开始时间: [时间]
- 执行命令: npx prisma migrate resolve --applied 20250821015630_add_shipment_file_field
- 执行结果: [成功/失败]
- 备注: [详细说明]

### 步骤 4: 应用服务验证

- 开始时间: [时间]
- PM2 状态: [正常/异常]
- 健康检查: [通过/失败]
- 执行结果: [成功/失败]
- 备注: [详细说明]

### 步骤 5: 部署验证

- 开始时间: [时间]
- 服务重启: [成功/失败]
- 功能测试: [通过/失败]
- 执行结果: [成功/失败]
- 备注: [详细说明]

### 步骤 6: 最终验证

- 开始时间: [时间]
- 迁移状态: [正常/异常]
- 应用状态: [正常/异常]
- 业务功能: [正常/异常]
- 执行结果: [成功/失败]
- 备注: [详细说明]

## 总结

**整体结果**: [成功/失败/部分成功]
**总耗时**: [X 分钟]
**遇到的问题**: [详细描述]
**解决方案**: [详细描述]
**后续行动**: [如果有]

## 验证结果

**技术指标**: [全部通过/部分通过/未通过]
**业务指标**: [全部通过/部分通过/未通过]
**监控指标**: [全部正常/部分异常/异常]

## 经验总结

**成功因素**: [列出关键成功因素]
**改进建议**: [列出可以改进的地方]
**预防措施**: [列出未来的预防措施]
```

## 🎯 执行建议

### 最佳执行时间

- **推荐时间**: 凌晨 2:00 - 4:00 (用户访问量最低)
- **备选时间**: 中午 12:00 - 14:00 (午休时间)
- **避免时间**: 工作日上午和下午的高峰期

### 团队协作

- **主执行人**: 负责具体操作执行
- **监督人员**: 负责流程监督和决策
- **备用人员**: 待命支持和应急处理
- **沟通协调**: 保持实时沟通，及时反馈进展

### 风险控制

- **谨慎原则**: 每一步都要仔细验证
- **及时停止**: 发现异常立即停止操作
- **快速回滚**: 准备好快速回滚方案
- **充分沟通**: 保持团队间的充分沟通

---

**最终确认**:

- [ ] 技术方案已充分验证
- [ ] 风险评估已完成
- [ ] 回滚方案已准备
- [ ] 团队人员已就位
- [ ] 执行时间已确认
- [ ] 业务方已知情确认

> 🎯 **执行原则**: 安全第一，稳妥推进，充分验证，及时沟通
>
> 🚨 **重要提醒**: 如果在任何步骤中遇到意外情况，请立即停止操作并联系技术负责人，不要强行继续执行。