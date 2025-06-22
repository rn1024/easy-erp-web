# 部署安全检查清单

## 🔒 生产环境部署前安全检查

### 1. 环境变量安全

#### 必须更改的默认值

- [ ] `JWT_SECRET` - 使用256位强随机密钥
- [ ] `DATABASE_URL` - 使用强密码的数据库连接
- [ ] `OSS_ACCESS_KEY_SECRET` - 阿里云OSS密钥
- [ ] `REDIS_PASSWORD` - Redis访问密码

#### 安全配置验证

```bash
# 检查JWT密钥长度（至少32字符）
echo $JWT_SECRET | wc -c

# 验证数据库连接安全性
# 确保使用SSL连接：DATABASE_URL="mysql://user:pass@host:3306/db?sslmode=require"

# 检查Redis密码设置
redis-cli -h $REDIS_HOST -p $REDIS_PORT auth $REDIS_PASSWORD
```

### 2. 数据库安全

#### 数据库配置检查

- [ ] 数据库用户权限最小化
- [ ] 启用SSL/TLS连接
- [ ] 定期备份策略已配置
- [ ] 数据库访问IP白名单已设置

#### 数据安全验证

```sql
-- 检查敏感数据加密
SELECT COUNT(*) FROM accounts WHERE password NOT LIKE '$2b$%';  -- 应该返回0

-- 验证索引优化
SHOW INDEX FROM accounts;
SHOW INDEX FROM logs;

-- 检查数据完整性
SELECT COUNT(*) FROM accounts WHERE status IS NULL;  -- 应该返回0
```

### 3. 网络安全

#### HTTPS配置

- [ ] SSL证书已安装且有效
- [ ] 强制HTTPS重定向已启用
- [ ] HSTS头已配置
- [ ] 证书自动更新已设置

#### 防火墙配置

```bash
# 检查开放端口
netstat -tuln | grep LISTEN

# 验证防火墙规则
ufw status
# 或
iptables -L

# 应该只开放必要端口：
# - 80/443 (HTTP/HTTPS)
# - 22 (SSH, 限制IP)
# - 3306 (MySQL, 仅内网)
# - 6379 (Redis, 仅内网)
```

### 4. 应用安全

#### 代码安全扫描

```bash
# 依赖安全扫描
npm audit
pnpm audit

# 修复高危漏洞
npm audit fix
pnpm audit --fix

# 检查过期依赖
npm outdated
pnpm outdated
```

#### 配置文件安全

- [ ] 移除开发环境配置
- [ ] 禁用调试模式
- [ ] 移除测试数据和账户
- [ ] 日志级别设置为 `warn` 或 `error`

### 5. 文件系统安全

#### 文件权限检查

```bash
# 检查应用文件权限
find /path/to/app -type f -perm -o+w

# 设置正确的文件权限
chmod -R 644 /path/to/app
chmod -R 755 /path/to/app/bin
chmod 600 /path/to/app/.env*

# 检查上传目录权限
ls -la /path/to/uploads
```

#### 文件上传安全

- [ ] 文件类型白名单已配置
- [ ] 文件大小限制已设置
- [ ] 文件名安全化处理
- [ ] 病毒扫描已集成（可选）

### 6. 监控和日志

#### 日志配置

- [ ] 安全事件日志已启用
- [ ] 日志轮转已配置
- [ ] 敏感信息脱敏处理
- [ ] 日志存储安全

#### 监控配置

```bash
# 检查系统资源监控
htop
iostat
netstat -i

# 验证日志记录
tail -f /var/log/app/security.log
tail -f /var/log/nginx/access.log
```

### 7. 备份和恢复

#### 备份策略验证

- [ ] 数据库自动备份已配置
- [ ] 文件备份已配置
- [ ] 备份加密已启用
- [ ] 恢复流程已测试

#### 备份测试

```bash
# 测试数据库备份
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > backup_test.sql

# 测试备份恢复
mysql -u $DB_USER -p$DB_PASS $DB_TEST < backup_test.sql

# 验证备份完整性
md5sum backup_test.sql
```

### 8. 性能和可用性

#### 性能优化检查

- [ ] 数据库查询优化
- [ ] 静态资源CDN配置
- [ ] 缓存策略已实施
- [ ] 图片压缩已启用

#### 可用性测试

```bash
# 负载测试
ab -n 1000 -c 10 https://yourdomain.com/

# 健康检查
curl -f https://yourdomain.com/api/health

# SSL测试
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

## 🚨 安全事件响应

### 事件分类

1. **Critical**: 数据泄露、系统入侵
2. **High**: 认证绕过、权限提升
3. **Medium**: 异常访问模式、暴力破解
4. **Low**: 配置问题、性能异常

### 响应流程

1. **检测** - 监控告警触发
2. **分析** - 确定事件严重程度
3. **遏制** - 阻止进一步损害
4. **根除** - 消除威胁源
5. **恢复** - 恢复正常服务
6. **总结** - 事后分析和改进

### 紧急联系信息

```
安全团队: security@company.com
运维团队: ops@company.com
管理层: management@company.com
```

## 📋 部署检查表

### 部署前检查

- [ ] 所有安全配置已验证
- [ ] 依赖安全扫描通过
- [ ] 代码安全审查完成
- [ ] 备份策略已测试
- [ ] 监控系统已配置
- [ ] 应急响应计划已准备

### 部署后验证

- [ ] 应用正常启动
- [ ] 所有API端点可访问
- [ ] 认证系统正常工作
- [ ] 文件上传功能正常
- [ ] 日志记录正常
- [ ] 监控告警正常

### 持续安全维护

- [ ] 定期安全扫描（每周）
- [ ] 依赖更新检查（每月）
- [ ] 安全日志审查（每日）
- [ ] 备份验证测试（每月）
- [ ] 应急响应演练（每季度）

---

**最后更新**: 2024年12月24日  
**检查者**: ******\_\_\_\_******  
**部署日期**: ******\_\_\_\_******  
**下次检查**: ******\_\_\_\_******
