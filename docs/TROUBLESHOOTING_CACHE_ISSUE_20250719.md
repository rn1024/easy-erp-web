# Next.js + Nginx 代理缓存问题排查记录

**日期**: 2025年7月19日  
**问题等级**: P1 (影响线上功能)  
**处理时长**: ~3小时  
**最终状态**: ✅ 已解决  

---

## 📋 问题概述

**核心问题**: 代码更新后，线上页面仍显示旧版本，新增的"分享给供应商"功能无法显示

**影响范围**: 
- 线上环境采购订单页面功能缺失
- 用户无法使用新增的分享功能
- 可能影响其他系统页面的更新

---

## 🔍 问题现象

### 1. 初始表现
- **本地环境**: 分享功能正常显示和工作
- **线上环境**: 采购订单页面缺少分享按钮
- **浏览器显示**: 页面加载正常，但功能缺失

### 2. 技术表现
```bash
# 浏览器请求的JS文件（旧版本）
page-90088224ec7d410b.js

# 服务器实际的JS文件（新版本）  
page-e9a85cad20fc736e.js
```

### 3. 构建错误
```bash
DOMException [DataCloneError]: #<Object> could not be cloned.
Error: Collecting page data for /system/accounts is still timing out after 2 attempts.
```

---

## 🕵️ 排查过程

### 阶段1: 误入歧途的缓存假设 ❌

**错误假设**: Next.js页面缓存问题
**尝试方案**:
- 创建`src/app/system/layout.tsx`添加`dynamic = 'force-dynamic'`
- 清理`.next/cache`目录
- 修改next.config.js缓存配置

**结果**: 问题未解决，反复尝试20+次

### 阶段2: 深入服务器环境分析 ✅

**关键发现**:
1. **登录线上环境实际测试**
   ```bash
   # 直接访问Next.js应用(3008端口)
   curl http://localhost:3008/system/purchase-orders | grep page-
   # 输出: page-e9a85cad20fc736e.js (新版本)
   
   # 通过nginx访问
   curl https://erp.samuelcn.com/system/purchase-orders | grep page-
   # 输出: page-90088224ec7d410b.js (旧版本)
   ```

2. **发现nginx代理缓存配置**
   ```nginx
   proxy_cache_path /www/server/nginx/proxy_cache_dir levels=1:2 keys_zone=cache_one:20m inactive=1d max_size=5g;
   proxy_cache cache_one;
   ```

### 阶段3: PM2配置问题发现 ✅

**发现standalone模式配置错误**:
```javascript
// 错误配置
script: 'npm',
args: 'start'

// 正确配置
script: '.next/standalone/server.js'
```

### 阶段4: 静态资源缺失问题 ✅

**发现standalone模式静态资源未复制**:
- `.next/standalone/.next/static/` 目录缺失
- `public/` 目录内容未复制到standalone

---

## 🎯 根本原因分析

### 1. 主要原因: Nginx代理缓存
```nginx
# 全局启用代理缓存，缓存1天
proxy_cache cache_one;
inactive=1d

# 虽然添加了no-cache头，但nginx仍然缓存响应
add_header Cache-Control no-cache;
```

**问题**: nginx的`proxy_cache`会忽略响应头中的`Cache-Control: no-cache`，继续缓存HTML页面

### 2. 次要原因: PM2配置不当
```javascript
// 使用npm start而非standalone模式
script: 'npm',
args: 'start'
```

**问题**: 未充分利用Next.js standalone模式的性能优势

### 3. 辅助原因: 静态资源复制不完整
**问题**: standalone模式需要手动复制`.next/static`和`public`目录

---

## ✅ 解决方案

### 1. 立即解决方案: 关闭nginx代理缓存

```bash
# 清理现有缓存
rm -rf /www/server/nginx/proxy_cache_dir/*

# 修改反向代理配置
# 在 /www/server/panel/vhost/nginx/proxy/erp.samuelcn.com/*.conf 中添加:
proxy_cache off;

# 重新加载nginx
nginx -s reload
```

### 2. 优化PM2配置

```javascript
// ecosystem.config.js
{
  name: 'easy-erp-web',
  script: '.next/standalone/server.js',  // 使用standalone模式
  // 其他配置...
}
```

### 3. 完善部署脚本

```bash
# scripts/deploy-standalone.sh
# 1. 构建应用
pnpm build

# 2. 复制静态资源
cp -r .next/static .next/standalone/.next/

# 3. 复制public目录
cp -r public/* .next/standalone/public/

# 4. 创建favicon.ico
cp .next/standalone/public/favicon.svg .next/standalone/public/favicon.ico
```

---

## 🛡️ 预防措施

### 1. 部署流程优化

**新增自动化脚本**:
```bash
# 使用改进的构建命令
pnpm build:standalone
```

**脚本功能**:
- 自动复制所有必需的静态资源
- 验证构建产物完整性
- 提供清晰的错误提示

### 2. 监控机制

**建议添加**:
- 部署后自动功能验证
- 静态资源版本一致性检查
- 缓存状态监控

### 3. 文档和规范

**更新文档**:
- 部署SOP增加静态资源检查步骤
- nginx配置最佳实践
- standalone模式部署指南

---

## 📝 经验总结

### ✅ 正确的排查方法

1. **系统性分析**: 从浏览器→nginx→Next.js完整链路分析
2. **实际环境测试**: 直接登录服务器验证，而非仅看日志
3. **对比验证**: 本地vs服务器，直连vs代理的对比
4. **根因分析**: 深入到配置层面找根本原因

### ❌ 错误的排查方法

1. **盲目假设**: 未验证就认为是Next.js缓存问题
2. **重复尝试**: 在错误方向上反复尝试20+次
3. **表面修复**: 只关注表象，未找到根本原因
4. **缺乏验证**: 未通过实际测试验证修复效果

### 🎓 关键学习点

1. **nginx代理缓存的影响**
   - `proxy_cache`会缓存所有响应，包括HTML
   - 仅设置响应头无法阻止nginx缓存
   - 需要使用`proxy_no_cache`和`proxy_cache_bypass`

2. **Next.js standalone模式**
   - 需要手动复制静态资源和public目录
   - 比npm start模式性能更好
   - 构建产物更独立，便于部署

3. **问题排查的重要性**
   - 要有系统性思维，不能头痛医头
   - 要验证假设，不能凭感觉
   - 要记录过程，便于复盘

---

## 🔗 相关资源

- [Next.js Standalone Mode Documentation](https://nextjs.org/docs/pages/api-reference/next-config-js/output)
- [Nginx Proxy Cache Configuration](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache)
- [项目部署脚本](../scripts/deploy-standalone.sh)
- [PM2 配置文件](../ecosystem.config.js)

---

**记录人**: AI Assistant  
**审核人**: 待补充  
**归档日期**: 2025年7月19日 
