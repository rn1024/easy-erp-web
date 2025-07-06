# 🔄 项目回滚指南

本项目使用 GitHub 原生版本控制功能进行回滚，无需复杂的自定义回滚系统。

## 📋 回滚方法

### 方法一：使用 Git Revert（推荐）

```bash
# 1. 查看最近的提交记录
git log --oneline -10

# 2. 回滚特定的提交（创建新的回滚提交）
git revert <commit-hash>

# 3. 推送到远程仓库，触发自动部署
git push origin main
```

**优点**：

- 保留完整的版本历史
- 安全，不会丢失代码
- 可以回滚多个提交

### 方法二：使用 Git Reset（谨慎使用）

```bash
# 1. 重置到指定提交（慎用！会丢失之后的提交）
git reset --hard <commit-hash>

# 2. 强制推送（危险操作）
git push origin main --force
```

**警告**：此方法会永久删除之后的提交！

### 方法三：GitHub Web 界面操作

1. 进入 GitHub 仓库页面
2. 找到要回滚的提交
3. 点击 "Revert" 按钮
4. 创建 Pull Request 或直接提交
5. GitHub Actions 会自动触发部署

## 🚀 部署流程

无论使用哪种回滚方法，一旦代码推送到 `main` 分支，GitHub Actions 会自动：

1. **构建和测试**：验证回滚后的代码
2. **部署到服务器**：自动部署到生产环境
3. **健康检查**：验证应用正常运行

## 🔧 紧急回滚步骤

如果需要紧急回滚到上一个稳定版本：

```bash
# 快速回滚到上一个提交
git revert HEAD
git push origin main
```

## 📊 回滚验证

回滚完成后，可以通过以下方式验证：

1. **健康检查**：`curl https://erp.samuelcn.com/api/health`
2. **验证码接口**：`curl https://erp.samuelcn.com/api/v1/auth/verifycode`
3. **应用日志**：登录服务器查看 `pm2 logs easy-erp-web`

## 💡 最佳实践

1. **使用 git revert**：保留版本历史，便于后续分析
2. **小步回滚**：逐个回滚问题提交，而不是一次性回滚多个
3. **验证测试**：回滚后及时验证应用功能
4. **文档记录**：记录回滚原因和影响范围

## 🚨 注意事项

- **数据库迁移**：如果涉及数据库Schema变更，可能需要手动处理
- **缓存清理**：回滚后可能需要清理Redis缓存
- **依赖冲突**：检查 `package.json` 依赖是否需要重新安装

## 📞 紧急联系

如果回滚过程中遇到问题：

1. 检查 GitHub Actions 构建日志
2. 查看服务器应用日志：`ssh root@121.41.237.2 "pm2 logs easy-erp-web"`
3. 确认服务器备份：`/www/wwwroot/easy-erp-web-last-backup`
