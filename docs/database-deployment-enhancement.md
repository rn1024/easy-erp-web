# 数据库部署增强方案

## 概述

本次更新大幅增强了 GitHub Actions 部署工作流中的数据库初始化和检查逻辑，解决了线上部署时数据库表不存在的问题。

## 问题背景

在之前的部署过程中，经常出现以下问题：
- 数据库为空时，`permissions` 表等关键表不存在
- 数据库表结构不完整，导致应用启动失败
- 缺乏有效的数据库状态检查和修复机制
- 错误处理不够完善，难以定位问题

## 解决方案

### 1. 智能数据库状态检测

```bash
# 检查数据库连接
echo "🔍 测试数据库连接..."
if ! node -e "..."; then
  echo "❌ 数据库连接失败，终止部署"
  exit 1
fi

# 检查数据库表结构
TABLE_COUNT=$(node -e "...")
echo "📊 数据库中共有 $TABLE_COUNT 个表"
```

### 2. 分层初始化策略

根据数据库表数量采用不同的初始化策略：

#### 空数据库 (0 个表)
- 执行完整的数据库迁移部署
- 验证关键表创建成功
- 初始化种子数据

#### 不完整数据库 (< 25 个表)
- 使用 `prisma db push` 强制同步
- 重新检查表数量
- 验证修复结果

#### 完整数据库 (≥ 25 个表)
- 使用现有迁移脚本确保最新状态
- 跳过重复初始化

### 3. 关键表验证

对核心业务表进行专门验证：

```bash
CRITICAL_TABLES=("accounts" "roles" "permissions" "shops" "suppliers")
for table in "${CRITICAL_TABLES[@]}"; do
  # 验证表是否存在
  if ! node -e "..."; then
    echo "❌ 关键表 $table 创建失败"
    exit 1
  fi
done
```

### 4. 数据库修复机制

当检测到数据库表不完整时：

```bash
# 尝试使用db push强制同步
echo "🔧 强制同步数据库结构..."
npx prisma db push --force-reset || npx prisma db push

# 重新检查表数量
NEW_TABLE_COUNT=$(node -e "...")
if [ "$NEW_TABLE_COUNT" -lt "25" ]; then
  echo "❌ 数据库结构修复失败"
  exit 1
fi
```

### 5. 最终状态验证

部署完成前进行全面的状态检查：

```bash
echo "📊 数据库最终状态:"
echo "  - 表数量: $FINAL_TABLE_COUNT"
echo "  - 角色数量: $ROLE_COUNT"
echo "  - 账户数量: $ACCOUNT_COUNT"

if [ "$FINAL_TABLE_COUNT" -lt "25" ] || [ "$ROLE_COUNT" -eq "0" ]; then
  echo "❌ 数据库状态验证失败"
  exit 1
fi
```

## 改进效果

### 1. 提高部署成功率
- 自动检测和修复数据库问题
- 减少因数据库状态异常导致的部署失败

### 2. 增强错误处理
- 详细的日志输出，便于问题定位
- 明确的错误信息和退出机制

### 3. 智能化部署
- 根据实际情况选择最适合的初始化策略
- 避免不必要的重复操作

### 4. 状态透明化
- 实时显示数据库状态信息
- 便于监控和调试

## 使用说明

### 自动触发

当代码推送到 `main` 分支时，GitHub Actions 会自动执行增强的部署流程。

### 手动触发

可以在 GitHub Actions 页面手动触发部署：
1. 进入项目的 Actions 页面
2. 选择 "Deploy to ECS" 工作流
3. 点击 "Run workflow" 按钮

### 监控部署

在 Actions 执行过程中，可以实时查看详细的数据库初始化日志：
- 数据库连接状态
- 表数量统计
- 初始化策略选择
- 验证结果

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务是否正常
   - 验证环境变量配置

2. **表创建失败**
   - 检查 Prisma schema 文件
   - 验证迁移文件完整性

3. **种子数据初始化失败**
   - 检查种子数据脚本
   - 验证数据完整性

### 调试方法

1. 查看 GitHub Actions 日志
2. SSH 登录服务器检查本地状态
3. 使用 `node scripts/check-db.js` 检查数据库状态

## 技术细节

### 依赖工具
- Prisma CLI
- Node.js 脚本
- Bash 脚本

### 关键文件
- `.github/workflows/deploy.yml` - 部署工作流
- `scripts/init-empty-database.js` - 空数据库初始化脚本
- `scripts/check-db.js` - 数据库状态检查脚本

### 环境要求
- Node.js 18+
- MySQL 数据库
- Prisma 6.13.0+

## 总结

通过这次增强，部署流程变得更加智能和可靠，能够自动处理各种数据库状态，大大提高了线上部署的成功率和稳定性。