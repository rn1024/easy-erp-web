# 部署文件上传优化实施文档

## 概述

本文档记录了针对生产环境文件上传访问问题的优化方案实施情况。该方案专门解决线上文件权限问题，同时保持本地开发环境不受影响。

## 实施内容

### 1. 部署脚本优化 ✅

**文件**: `scripts/deploy.sh`

**修改内容**:
- 添加了 `optimize_file_permissions()` 函数
- 在项目构建完成后自动执行文件权限优化

**功能特性**:
- 确保 `public/uploads` 目录存在
- 设置正确的文件权限 (644/755)
- 尝试设置 www-data 所有者
- 提供权限设置验证和日志记录

### 2. 上传API优化 ✅

**文件**: `src/app/api/v1/upload/route.ts`

**修改内容**:
- 在 `uploadToLocal` 函数中添加生产环境权限修复逻辑
- 仅在 `NODE_ENV=production` 时执行权限设置

**功能特性**:
- 上传文件后自动设置正确权限
- 环境隔离，不影响本地开发
- 包含错误处理和日志记录

### 3. 测试验证 ✅

**文件**: `scripts/test-file-permissions.sh`

**功能**:
- 验证文件权限优化功能
- 创建测试文件和目录
- 检查权限设置效果

## 部署流程

### 自动部署（推荐）

通过 GitHub Actions 自动触发：

1. 推送代码到 `main` 分支
2. GitHub Actions 自动执行部署
3. 部署脚本自动执行文件权限优化
4. 验证部署结果

### 手动部署

在服务器上执行：

```bash
# 进入项目目录
cd /www/wwwroot/easy-erp-web

# 执行部署脚本
sudo ./scripts/deploy.sh
```

## 环境变量配置

确保生产环境 `.env` 文件包含：

```bash
NODE_ENV=production
```

## 验证方法

### 1. 检查文件权限

```bash
# 检查uploads目录权限
ls -la public/uploads/

# 检查具体文件权限
find public/uploads -type f -exec ls -la {} \;
find public/uploads -type d -exec ls -la {} \;
```

### 2. 测试文件上传

1. 登录系统
2. 上传测试文件
3. 验证文件可以正常访问
4. 检查文件权限是否正确

### 3. 运行测试脚本

```bash
# 运行权限优化测试
./scripts/test-file-permissions.sh
```

## 故障排查

### 常见问题

1. **www-data 用户不存在**
   - 症状：部署日志显示"无法设置www-data所有者"
   - 解决：手动创建 www-data 用户或使用其他 web 服务器用户

2. **权限设置失败**
   - 症状：文件权限仍然不正确
   - 解决：检查部署脚本是否以 root 权限运行

3. **文件无法访问**
   - 症状：上传的文件返回 403 或 404
   - 解决：检查 Nginx 配置和文件权限

### 日志检查

```bash
# 查看部署日志
tail -f /tmp/easy-erp-deploy.log

# 查看应用日志
pm2 logs easy-erp-web

# 查看 Nginx 日志
tail -f /var/log/nginx/error.log
```

## 回滚方案

如果优化导致问题，可以快速回滚：

### 1. 代码回滚

```bash
# 回滚到上一个版本
git reset --hard HEAD~1
npm run build
pm2 restart easy-erp-web
```

### 2. 手动修复权限

```bash
# 重置uploads目录权限
chmod -R 755 public/uploads
chown -R www-data:www-data public/uploads
```

## 性能影响

- **部署时间**: 增加约 5-10 秒（权限设置时间）
- **运行时性能**: 无影响（仅在文件上传时执行）
- **存储空间**: 无额外占用

## 安全考虑

- 文件权限设置为最小必要权限 (644/755)
- 仅在生产环境执行权限修复
- 包含错误处理，避免权限设置失败影响部署
- 保持本地开发环境隔离

## 后续优化建议

1. **监控告警**: 添加文件权限监控
2. **自动化测试**: 集成到 CI/CD 流程
3. **性能优化**: 考虑批量权限设置
4. **文档完善**: 添加更多故障排查案例

## 联系信息

如有问题，请联系开发团队或查看相关文档：
- 部署文档: `docs/README.md`
- API文档: `docs/api-documentation.md`
- 故障排查: `docs/troubleshooting.md`

---

**实施日期**: 2025-08-11  
**版本**: v1.0  
**状态**: 已完成 ✅
