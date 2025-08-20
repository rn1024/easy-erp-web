# 数据库Schema变更标准流程

本文档定义了Easy ERP项目中数据库schema变更的标准流程，确保生产环境的安全性和一致性。

## 🎯 核心原则

1. **迁移优先**: 所有schema变更必须通过Prisma迁移文件实现
2. **向后兼容**: 新的迁移不应破坏现有功能
3. **备份保护**: 生产环境变更前必须创建备份
4. **测试验证**: 所有变更必须在开发环境充分测试
5. **文档记录**: 重要变更必须有详细的文档说明

## 📋 变更流程

### 1. 开发阶段

#### 1.1 修改Schema文件
```bash
# 编辑 prisma/schema.prisma 文件
vim prisma/schema.prisma
```

#### 1.2 创建迁移文件
```bash
# 创建新的迁移文件
npx prisma migrate dev --name describe_your_change

# 示例：添加新字段
npx prisma migrate dev --name add_user_avatar_field

# 示例：创建新表
npx prisma migrate dev --name create_audit_log_table
```

#### 1.3 验证迁移
```bash
# 检查迁移状态
npx prisma migrate status

# 验证schema
npx prisma validate

# 重新生成客户端
npx prisma generate
```

### 2. 测试阶段

#### 2.1 本地测试
```bash
# 重置数据库（仅开发环境）
npx prisma migrate reset

# 运行种子数据
npm run db:seed

# 运行测试套件
npm test
npm run test:e2e
```

#### 2.2 功能验证
- 验证新功能正常工作
- 确认现有功能未受影响
- 检查API端点响应
- 验证前端界面显示

### 3. 部署准备

#### 3.1 代码审查
- 迁移文件SQL语句审查
- Schema变更影响评估
- 性能影响分析
- 安全性检查

#### 3.2 部署计划
- 确定部署时间窗口
- 准备回滚方案
- 通知相关人员
- 准备监控方案

### 4. 生产部署

#### 4.1 部署前检查
```bash
# 检查生产环境迁移状态
ssh production-server "cd /www/wwwroot/easy-erp-web && npx prisma migrate status"

# 创建数据库备份
ssh production-server "cd /www/wwwroot/easy-erp-web && bash scripts/db-backup.sh"
```

#### 4.2 执行部署
```bash
# 使用标准部署脚本
bash scripts/deploy-to-ecs.sh
```

#### 4.3 部署后验证
```bash
# 检查迁移状态
npx prisma migrate status

# 验证应用健康状态
curl -f http://localhost:3000/api/health

# 检查关键功能
# - 用户登录
# - 数据查询
# - 新功能测试
```

## 🚨 紧急回滚

如果部署后发现问题，立即执行回滚：

```bash
# 查看可用备份
ls -la backups/backup_*.sql.gz

# 执行回滚
bash scripts/db-rollback.sh backups/backup_easy_erp_db_YYYYMMDD_HHMMSS.sql.gz
```

## 📝 变更类型和注意事项

### 安全变更（推荐）
- ✅ 添加新表
- ✅ 添加新字段（可空或有默认值）
- ✅ 添加索引
- ✅ 创建新的枚举值

### 谨慎变更（需要特别注意）
- ⚠️ 修改字段类型
- ⚠️ 添加非空字段
- ⚠️ 重命名字段或表
- ⚠️ 删除枚举值

### 危险变更（需要特殊流程）
- 🚫 删除表或字段
- 🚫 修改主键
- 🚫 删除索引（可能影响性能）

## 🛠️ 常用命令

### 迁移管理
```bash
# 查看迁移历史
npx prisma migrate status

# 标记迁移为已应用（仅在特殊情况下使用）
npx prisma migrate resolve --applied "20250821015630_add_shipment_file_field"

# 重置迁移历史（仅开发环境）
npx prisma migrate reset
```

### 数据库操作
```bash
# 生成Prisma客户端
npx prisma generate

# 验证schema
npx prisma validate

# 查看数据库内容
npx prisma studio
```

### 备份和恢复
```bash
# 创建备份
bash scripts/db-backup.sh

# 执行回滚
bash scripts/db-rollback.sh <backup_file>
```

## 📊 监控和日志

### 部署监控
- 应用启动状态
- 数据库连接状态
- API响应时间
- 错误日志监控

### 关键指标
- 迁移执行时间
- 数据库查询性能
- 应用内存使用
- 用户访问异常

## 🔧 故障排除

### 常见问题

1. **迁移失败**
   ```bash
   # 查看详细错误
   npx prisma migrate status
   
   # 检查数据库连接
   npx prisma db pull
   ```

2. **Schema不一致**
   ```bash
   # 重新生成客户端
   npx prisma generate
   
   # 验证schema
   npx prisma validate
   ```

3. **应用启动失败**
   ```bash
   # 检查PM2日志
   pm2 logs easy-erp-web
   
   # 检查数据库连接
   mysql -u erp_user -p -e "SELECT 1"
   ```

## 📚 相关文档

- [Prisma迁移文档](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [数据库备份策略](./database-backup-strategy.md)
- [部署流程文档](./deployment-process.md)
- [故障排除指南](./troubleshooting-guide.md)

## 🔄 流程改进

本流程会根据实际使用情况持续改进，如有建议请提交Issue或PR。

---

**最后更新**: 2025-08-21  
**版本**: 1.0  
**维护者**: Easy ERP开发团队
