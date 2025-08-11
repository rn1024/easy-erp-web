# 服务器文件上传访问问题解决指南

## 问题描述

**现象**: 在本地开发环境中，文件上传和访问功能正常，但在服务器环境下，上传的文件无法通过URL访问。

**环境差异**:
- 本地开发: Next.js开发服务器自动处理`public`目录下的静态文件
- 服务器环境: 使用nginx反向代理，需要明确配置静态文件服务规则

## 根本原因

1. **nginx配置缺失**: 服务器nginx配置中缺少`/uploads/`路径的静态文件服务规则
2. **文件权限问题**: uploads目录的文件权限设置不正确，nginx无法读取
3. **路径映射错误**: nginx无法正确映射`/uploads/`请求到实际文件路径

## 解决方案

### 方案一: 自动修复脚本（推荐）

我们提供了两个脚本来解决这个问题：

#### 1. 诊断脚本

首先运行诊断脚本来确认问题：

```bash
# 在服务器上执行
bash scripts/diagnose-server-uploads.sh
```

这个脚本会检查：
- uploads目录是否存在及权限设置
- nginx配置是否包含uploads规则
- nginx进程状态和用户权限
- 网络访问和文件访问测试

#### 2. 修复脚本

确认问题后，运行修复脚本：

```bash
# 在服务器上以root用户执行
sudo bash scripts/server-upload-fix.sh
```

这个脚本会自动：
- 备份现有nginx配置
- 添加`/uploads/`静态文件服务规则
- 修复文件和目录权限
- 重新加载nginx配置
- 验证修复效果

### 方案二: 手动修复

如果需要手动修复，请按以下步骤操作：

#### 1. 修改nginx配置

编辑nginx配置文件（通常在`/etc/nginx/sites-available/erp.samuelcn.com.conf`）：

```nginx
# 在server块中添加以下配置
location /uploads/ {
    alias /www/wwwroot/easy-erp-web/public/uploads/;
    
    # 缓存设置
    expires 1y;
    add_header Cache-Control "public, immutable";
    
    # CORS支持
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, OPTIONS";
    add_header Access-Control-Allow-Headers "Range";
    
    # 支持范围请求
    add_header Accept-Ranges bytes;
    
    # 安全头
    add_header X-Content-Type-Options nosniff;
    
    # 尝试提供文件，如果不存在返回404
    try_files $uri =404;
    
    # 日志
    access_log /var/log/nginx/uploads_access.log;
    error_log /var/log/nginx/uploads_error.log;
}
```

#### 2. 修复文件权限

```bash
# 设置目录权限
find /www/wwwroot/easy-erp-web/public/uploads -type d -exec chmod 755 {} \;

# 设置文件权限
find /www/wwwroot/easy-erp-web/public/uploads -type f -exec chmod 644 {} \;

# 设置所有者（根据实际的web服务器用户）
chown -R www-data:www-data /www/wwwroot/easy-erp-web/public/uploads
```

#### 3. 重新加载nginx

```bash
# 测试配置
nginx -t

# 重新加载配置
systemctl reload nginx
```

## 验证修复效果

### 1. 检查nginx配置

```bash
# 确认配置已生效
nginx -t
systemctl status nginx
```

### 2. 测试文件访问

1. 通过系统上传一个测试文件
2. 复制文件的访问URL（例如：`https://erp.samuelcn.com/uploads/images/test.jpg`）
3. 在浏览器中打开URL，确认文件可以正常访问
4. 检查浏览器开发者工具，确认返回状态码为200

### 3. 检查日志

```bash
# 查看nginx访问日志
tail -f /var/log/nginx/uploads_access.log

# 查看nginx错误日志
tail -f /var/log/nginx/uploads_error.log

# 查看nginx主错误日志
tail -f /var/log/nginx/error.log
```

## 预防措施

### 1. 文件持久化

为了防止部署时文件丢失，建议使用持久化存储方案：

```bash
# 运行文件持久化部署脚本
sudo bash scripts/deploy-with-file-persistence.sh
```

### 2. 权限监控

系统会自动创建权限监控脚本，定期检查和修复文件权限：

```bash
# 查看定时任务
crontab -l | grep erp-uploads

# 手动运行权限修复
/usr/local/bin/erp-uploads-permission-fix.sh
```

## 常见问题排查

### 问题1: 403 Forbidden错误

**原因**: nginx用户无权限读取文件

**解决**:
```bash
# 检查文件权限
ls -la /www/wwwroot/easy-erp-web/public/uploads/

# 修复权限
chmod 755 /www/wwwroot/easy-erp-web/public/uploads/
chmod 644 /www/wwwroot/easy-erp-web/public/uploads/*
chown -R www-data:www-data /www/wwwroot/easy-erp-web/public/uploads/
```

### 问题2: 404 Not Found错误

**原因**: nginx配置中路径映射不正确

**解决**:
```bash
# 检查nginx配置
grep -A 10 "location /uploads/" /etc/nginx/sites-available/erp.samuelcn.com.conf

# 确认文件实际存在
ls -la /www/wwwroot/easy-erp-web/public/uploads/
```

### 问题3: 文件上传成功但无法访问

**原因**: 新上传的文件权限不正确

**解决**:
```bash
# 检查最新上传的文件权限
find /www/wwwroot/easy-erp-web/public/uploads/ -type f -newermt "1 hour ago" -exec ls -la {} \;

# 修复权限
find /www/wwwroot/easy-erp-web/public/uploads/ -type f -newermt "1 hour ago" -exec chmod 644 {} \;
```

## 技术细节

### nginx配置说明

- `alias`: 将URL路径映射到实际文件系统路径
- `expires 1y`: 设置长期缓存，提高性能
- `try_files $uri =404`: 如果文件不存在，返回404而不是转发到应用
- `add_header Access-Control-Allow-Origin *`: 允许跨域访问
- `add_header Accept-Ranges bytes`: 支持断点续传

### 文件权限说明

- 目录权限755: 所有者可读写执行，组和其他用户可读执行
- 文件权限644: 所有者可读写，组和其他用户只读
- 所有者www-data: nginx进程的运行用户

## 联系支持

如果按照本指南操作后仍有问题，请提供以下信息：

1. 诊断脚本的完整输出
2. nginx错误日志内容
3. 具体的错误现象和复现步骤
4. 服务器环境信息（操作系统、nginx版本等）

---

**最后更新**: 2025-01-17  
**版本**: 1.0.0  
**适用环境**: 生产服务器（nginx + Next.js）