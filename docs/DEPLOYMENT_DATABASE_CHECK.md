# 部署脚本数据库连接检查功能

## 📋 任务完成总结

根据用户需求，我们在部署脚本中成功增加了判断数据库是否连接成功的功能。

## 🎯 实现的功能

### 1. 创建了独立的数据库连接检查脚本

**文件**: `scripts/check-database-connection.sh`

**功能特性**:
- ✅ 全面的环境变量检查
- ✅ DATABASE_URL 格式验证
- ✅ 数据库连接信息解析
- ✅ MySQL 服务状态检查
- ✅ MySQL 客户端连接测试
- ✅ Prisma 数据库连接测试
- ✅ 彩色输出和详细日志
- ✅ 错误诊断和故障排除提示

### 2. 集成到 GitHub Actions 部署流程

**修改文件**: `.github/workflows/deploy.yml`

**集成位置**:
1. **Deploy Job** - 部署前数据库连接验证
2. **Verify Job** - 部署后数据库连接确认
3. **Troubleshoot** - 失败时自动数据库诊断

### 3. 更新了文档说明

**修改文件**: `scripts/README.md`

**新增内容**:
- 数据库连接检查脚本的详细使用说明
- 集成到部署流程的说明
- 故障排除指南更新

## 🔧 技术实现细节

### 脚本架构

```bash
# 主要检查流程
1. check_env_file()          # 检查 .env 文件
2. validate_database_url()   # 验证 DATABASE_URL
3. parse_database_url()      # 解析连接信息
4. check_database_service()  # 检查服务状态
5. test_mysql_connection()   # MySQL 客户端测试
6. test_prisma_connection()  # Prisma 连接测试
```

### GitHub Actions 集成

```yaml
# 在 deploy job 中
- name: Database connection test
  uses: appleboy/ssh-action@v1.0.3
  with:
    script: |
      cd /www/wwwroot/easy-erp-web
      ./scripts/check-database-connection.sh

# 在 verify job 中
- name: Database connection verification
  uses: appleboy/ssh-action@v1.0.3
  with:
    script: |
      cd /www/wwwroot/easy-erp-web
      ./scripts/check-database-connection.sh

# 在 troubleshoot 中
- name: Troubleshoot on failure
  if: failure()
  uses: appleboy/ssh-action@v1.0.3
  with:
    script: |
      cd /www/wwwroot/easy-erp-web
      ./scripts/check-database-connection.sh || echo "数据库诊断完成"
```

## ✅ 测试验证

### 本地测试结果

```bash
$ ./scripts/check-database-connection.sh

===========================================
🔗 数据库连接检查脚本
===========================================
执行时间: 2025年 8月13日 星期三 22时50分49秒 CST

[2025-08-13 22:50:49] 检查环境变量文件...
[2025-08-13 22:50:49] ✅ .env文件存在
[2025-08-13 22:50:49] ✅ 环境变量加载成功
[2025-08-13 22:50:49] 验证DATABASE_URL...
[2025-08-13 22:50:49] ✅ DATABASE_URL格式正确
[2025-08-13 22:50:49] 解析数据库连接信息...
[2025-08-13 22:50:49] ℹ️  数据库连接信息:
[2025-08-13 22:50:49] ℹ️    主机: localhost
[2025-08-13 22:50:49] ℹ️    端口: 3306
[2025-08-13 22:50:49] ℹ️    用户: erp_user
[2025-08-13 22:50:49] ℹ️    数据库: easy_erp_db
[2025-08-13 22:50:49] ✅ 数据库连接信息解析成功
[2025-08-13 22:50:49] 检查数据库服务状态...
[2025-08-13 22:50:49] 测试MySQL客户端连接...
[2025-08-13 22:50:49] ⚠️  MySQL客户端未安装，跳过MySQL连接测试
[2025-08-13 22:50:49] 测试Prisma数据库连接...
🔗 连接数据库...
✅ Prisma数据库连接成功
🔍 执行测试查询...
✅ 数据库查询测试成功
📊 检查数据库版本...
📋 数据库版本: 8.0.42
[2025-08-13 22:50:49] ✅ Prisma连接测试成功

===========================================
[2025-08-13 22:50:49] 🎉 数据库连接检查完成 - 所有测试通过！
===========================================

退出码: 0
```

## 🚀 使用方法

### 手动执行

```bash
# 在项目根目录执行
./scripts/check-database-connection.sh
```

### 在部署中自动执行

脚本已自动集成到 GitHub Actions 部署流程中，会在以下阶段自动执行：

1. **部署前检查** - 确保数据库连接正常再进行部署
2. **部署后验证** - 确认部署后数据库连接仍然正常
3. **失败诊断** - 部署失败时自动执行数据库诊断

## 🔍 故障排除

如果数据库连接检查失败，脚本会提供详细的错误信息和诊断建议：

- **环境变量问题**: 检查 `.env` 文件和 `DATABASE_URL` 配置
- **网络连接问题**: 检查数据库服务器可访问性
- **服务状态问题**: 检查 MySQL 服务是否运行
- **权限问题**: 检查数据库用户权限

## 📈 改进效果

1. **提前发现问题**: 在部署过程中及时发现数据库连接问题
2. **快速定位故障**: 详细的诊断信息帮助快速定位问题根源
3. **自动化检查**: 无需手动验证，自动化程度更高
4. **标准化流程**: 统一的数据库连接检查标准
5. **减少部署失败**: 提前验证减少因数据库问题导致的部署失败

## 📝 相关文件

- `scripts/check-database-connection.sh` - 数据库连接检查脚本
- `.github/workflows/deploy.yml` - 更新的部署工作流
- `scripts/README.md` - 更新的脚本使用文档
- `DEPLOYMENT_DATABASE_CHECK.md` - 本总结文档

---

**任务状态**: ✅ 已完成

**创建时间**: 2025-08-13

**功能验证**: ✅ 通过本地测试