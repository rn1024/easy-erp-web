# Next.js CMS 系统安全加固指南

## 概述

本文档提供了 Next.js CMS 管理系统的全面安全加固指南，涵盖认证安全、数据保护、网络安全、系统防护等多个方面。

## 1. 身份认证与授权安全

### 1.1 JWT 令牌安全

#### 当前实现

```typescript
// src/lib/auth.ts
const JWT_SECRET = process.env.JWT_SECRET; // 256位随机密钥
const ACCESS_TOKEN_EXPIRES = '1h'; // 访问令牌1小时有效
const REFRESH_TOKEN_EXPIRES = '7d'; // 刷新令牌7天有效
```

#### 安全建议

- ✅ 使用强随机密钥（至少256位）
- ✅ 设置合理的过期时间
- ✅ 使用安全算法（HS256）
- ⚠️ 建议实现令牌轮换机制
- ⚠️ 考虑使用RS256算法（公私钥对）

#### 加固措施

```typescript
// 令牌黑名单机制
const tokenBlacklist = new Set<string>();

export const revokeToken = (token: string) => {
  tokenBlacklist.add(token);
  // 存储到Redis，设置过期时间
  redisService.setex(`blacklist:${token}`, 3600, '1');
};

export const isTokenRevoked = async (token: string) => {
  return await redisService.exists(`blacklist:${token}`);
};
```

### 1.2 密码安全策略

#### 当前实现

```typescript
// 使用bcrypt加密，12轮盐值
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

#### 安全建议

- ✅ 使用bcrypt加密存储
- ✅ 合理的盐轮数（12轮）
- ⚠️ 实现密码复杂度验证
- ⚠️ 添加密码历史记录防重复使用

#### 加固措施

```typescript
// 密码复杂度验证
export const validatePasswordStrength = (password: string) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid:
      password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    errors: [
      password.length < minLength ? '密码长度至少8位' : null,
      !hasUpperCase ? '必须包含大写字母' : null,
      !hasLowerCase ? '必须包含小写字母' : null,
      !hasNumbers ? '必须包含数字' : null,
      !hasSpecialChar ? '必须包含特殊字符' : null,
    ].filter(Boolean),
  };
};
```

### 1.3 验证码安全

#### 当前实现

```typescript
// Redis存储，10分钟有效期
await redisService.setex(`captcha:${key}`, 600, code.toLowerCase());
```

#### 安全建议

- ✅ 使用Redis持久化存储
- ✅ 设置合理过期时间
- ⚠️ 限制验证码尝试次数
- ⚠️ 增加验证码复杂度

#### 加固措施

```typescript
// 验证码尝试次数限制
export const checkCaptchaAttempts = async (key: string) => {
  const attempts = (await redisService.get(`captcha_attempts:${key}`)) || 0;
  if (attempts >= 5) {
    throw new Error('验证码尝试次数过多，请重新获取');
  }

  await redisService.incr(`captcha_attempts:${key}`);
  await redisService.expire(`captcha_attempts:${key}`, 600);
};
```

## 2. 输入验证与数据安全

### 2.1 API 参数验证

#### 当前实现

```typescript
// 使用中间件进行基础验证
ValidationMiddleware.validateRequired(['username', 'password', 'captcha', 'key']);
```

#### 安全建议

- ✅ 服务端验证所有输入
- ⚠️ 使用更严格的验证库（如Zod）
- ⚠️ 实现输入长度和格式限制

#### 加固措施

```typescript
// 使用Zod进行严格验证
import { z } from 'zod';

const LoginSchema = z.object({
  username: z
    .string()
    .min(3, '用户名至少3个字符')
    .max(50, '用户名最多50个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  password: z.string().min(8, '密码至少8个字符').max(128, '密码最多128个字符'),
  captcha: z.string().length(4, '验证码必须为4位'),
  key: z.string().uuid('无效的验证码标识'),
});

export const validateLoginInput = (data: unknown) => {
  return LoginSchema.parse(data);
};
```

### 2.2 SQL注入防护

#### 当前实现

```typescript
// 使用Prisma ORM自动防护
const user = await prisma.account.findUnique({
  where: { name: username },
});
```

#### 安全建议

- ✅ 使用Prisma ORM参数化查询
- ✅ 避免原生SQL拼接
- ⚠️ 对原生查询使用参数绑定

### 2.3 XSS防护

#### 当前实现

```typescript
// 基础输出转义
const sanitizedContent = DOMPurify.sanitize(userInput);
```

#### 安全建议

- ✅ 输出时进行HTML转义
- ⚠️ 实施内容安全策略（CSP）
- ⚠️ 验证和过滤用户输入

#### 加固措施

```typescript
// 严格的CSP策略
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "child-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
].join('; ');
```

## 3. 文件上传安全

### 3.1 文件类型验证

#### 当前实现

```typescript
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
];
```

#### 安全建议

- ✅ 白名单验证文件类型
- ✅ 文件大小限制
- ⚠️ 检查文件头魔数
- ⚠️ 病毒扫描集成

#### 加固措施

```typescript
// 文件头魔数验证
const FILE_SIGNATURES = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
};

export const validateFileHeader = (buffer: Buffer, mimeType: string) => {
  const signature = FILE_SIGNATURES[mimeType];
  if (!signature) return false;

  return signature.every((byte, index) => buffer[index] === byte);
};

// 文件名安全处理
export const sanitizeFileName = (filename: string) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // 替换特殊字符
    .replace(/\.+/g, '.') // 合并多个点
    .replace(/^\.+|\.+$/g, '') // 移除开头结尾的点
    .substring(0, 255); // 限制长度
};
```

### 3.2 存储安全

#### 当前实现

```typescript
// 阿里云OSS存储
const uploadResult = await ossClient.put(objectName, fileBuffer);
```

#### 安全建议

- ✅ 使用云存储服务
- ⚠️ 设置访问权限控制
- ⚠️ 启用访问日志记录

#### 加固措施

```typescript
// OSS安全配置
const ossConfig = {
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
  region: process.env.OSS_REGION,
  secure: true, // 强制HTTPS
  timeout: 60000, // 60秒超时
};

// 生成带签名的临时访问URL
export const generateSignedUrl = (objectName: string, expires = 3600) => {
  return ossClient.signatureUrl(objectName, { expires });
};
```

## 4. 网络安全

### 4.1 HTTPS强制

#### 加固措施

```typescript
// middleware.ts - 强制HTTPS重定向
export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const url = request.nextUrl.clone();

    if (url.protocol === 'http:') {
      url.protocol = 'https:';
      return NextResponse.redirect(url, 301);
    }
  }

  return NextResponse.next();
}
```

### 4.2 安全响应头

#### 加固措施

```typescript
// next.config.js - 安全响应头
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];
```

### 4.3 CORS配置

#### 加固措施

```typescript
// 严格的CORS配置
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24小时预检缓存
};
```

## 5. 系统监控与日志

### 5.1 安全事件记录

#### 加固措施

```typescript
// 安全日志记录
export const logSecurityEvent = async (event: {
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'PASSWORD_CHANGED' | 'SUSPICIOUS_ACTIVITY';
  accountId?: string;
  ip: string;
  userAgent: string;
  details?: any;
}) => {
  await prisma.log.create({
    data: {
      category: 'SECURITY',
      module: 'AUTH',
      operation: event.type,
      operatorAccountId: event.accountId || 'SYSTEM',
      status: event.type.includes('FAILED') ? 'FAILURE' : 'SUCCESS',
      details: {
        ip: event.ip,
        userAgent: event.userAgent,
        timestamp: new Date().toISOString(),
        ...event.details,
      },
    },
  });
};
```

### 5.2 异常行为监控

#### 加固措施

```typescript
// 登录失败次数限制
export const checkLoginAttempts = async (ip: string, username: string) => {
  const ipKey = `login_attempts:ip:${ip}`;
  const userKey = `login_attempts:user:${username}`;

  const ipAttempts = (await redisService.get(ipKey)) || 0;
  const userAttempts = (await redisService.get(userKey)) || 0;

  if (ipAttempts >= 10 || userAttempts >= 5) {
    throw new Error('登录尝试次数过多，请稍后再试');
  }
};

export const recordLoginFailure = async (ip: string, username: string) => {
  const ipKey = `login_attempts:ip:${ip}`;
  const userKey = `login_attempts:user:${username}`;

  await redisService.incr(ipKey);
  await redisService.expire(ipKey, 3600); // 1小时

  await redisService.incr(userKey);
  await redisService.expire(userKey, 1800); // 30分钟
};
```

## 6. 数据库安全

### 6.1 连接安全

#### 加固措施

```typescript
// 数据库连接安全配置
const databaseUrl = new URL(process.env.DATABASE_URL!);

// 启用SSL连接
if (process.env.NODE_ENV === 'production') {
  databaseUrl.searchParams.set('sslmode', 'require');
  databaseUrl.searchParams.set('sslcert', process.env.DB_SSL_CERT_PATH!);
  databaseUrl.searchParams.set('sslkey', process.env.DB_SSL_KEY_PATH!);
  databaseUrl.searchParams.set('sslrootcert', process.env.DB_SSL_CA_PATH!);
}
```

### 6.2 敏感数据保护

#### 加固措施

```typescript
// 敏感字段加密存储
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY!;
const ALGORITHM = 'aes-256-gcm';

export const encryptSensitiveData = (text: string) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from('cms-system'));

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
};
```

## 7. 环境变量安全

### 7.1 敏感配置管理

#### 安全建议

```bash
# .env.production - 生产环境配置
DATABASE_URL="postgresql://user:password@host:port/db?sslmode=require"
JWT_SECRET="your-256-bit-secret-key-here"
DATA_ENCRYPTION_KEY="your-encryption-key-here"

# Redis配置
REDIS_URL="rediss://user:password@host:port"
REDIS_TLS_CERT_PATH="/path/to/cert.pem"

# OSS配置
OSS_ACCESS_KEY_ID="your-access-key"
OSS_ACCESS_KEY_SECRET="your-secret-key"
OSS_BUCKET="your-bucket-name"
OSS_REGION="oss-cn-beijing"

# 安全配置
ALLOWED_ORIGINS="https://yourdomain.com,https://admin.yourdomain.com"
SESSION_TIMEOUT="3600"
BCRYPT_ROUNDS="12"
```

### 7.2 密钥轮换策略

#### 加固措施

```typescript
// 支持多个JWT密钥的验证
const JWT_SECRETS = [process.env.JWT_SECRET_CURRENT!, process.env.JWT_SECRET_PREVIOUS!].filter(
  Boolean
);

export const verifyTokenWithRotation = (token: string) => {
  for (const secret of JWT_SECRETS) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      continue;
    }
  }
  throw new Error('Invalid token');
};
```

## 8. 部署安全

### 8.1 容器安全

#### Docker配置

```dockerfile
# 使用非root用户运行
FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 只复制必要文件
COPY --chown=nextjs:nodejs package*.json ./
COPY --chown=nextjs:nodejs . .

USER nextjs
EXPOSE 3000
```

### 8.2 服务器加固

#### 系统配置

```bash
# 防火墙配置
ufw enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# 系统更新
apt update && apt upgrade -y
apt install fail2ban -y

# Nginx安全配置
server_tokens off;
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
```

## 9. 安全检查清单

### 9.1 开发阶段

- [ ] 代码静态安全扫描
- [ ] 依赖包漏洞检查
- [ ] 敏感信息泄露检查
- [ ] 单元测试覆盖安全功能

### 9.2 部署前检查

- [ ] 环境变量安全配置
- [ ] SSL证书配置正确
- [ ] 数据库连接加密
- [ ] 日志记录完整

### 9.3 运行时监控

- [ ] 异常登录监控
- [ ] API调用频率监控
- [ ] 文件上传行为监控
- [ ] 系统资源使用监控

### 9.4 定期安全维护

- [ ] 密钥轮换（每90天）
- [ ] 依赖包更新（每月）
- [ ] 安全日志审计（每周）
- [ ] 渗透测试（每季度）

## 10. 应急响应

### 10.1 安全事件处理流程

1. **事件识别**

   - 监控告警触发
   - 异常行为发现
   - 用户报告问题

2. **事件评估**

   - 确定影响范围
   - 评估安全风险
   - 制定响应策略

3. **事件处置**

   - 阻断攻击源
   - 修复安全漏洞
   - 恢复正常服务

4. **事后分析**
   - 根因分析
   - 改进措施
   - 更新安全策略

### 10.2 紧急联系方式

```typescript
// 安全事件通知
export const notifySecurityTeam = async (incident: {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedSystems: string[];
}) => {
  // 发送邮件通知
  // 发送短信告警
  // 记录事件日志
};
```

---

**文档版本：** 1.0.0  
**最后更新：** 2024年12月24日  
**适用系统：** Next.js CMS Template v2.0  
**维护团队：** 安全团队
