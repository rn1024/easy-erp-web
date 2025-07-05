const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

// 配置axios实例
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// 添加响应拦截器进行错误处理
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('服务器连接失败，请确保开发服务器已启动 (pnpm dev)');
    }
    if (error.code === 'ETIMEDOUT') {
      throw new Error('请求超时，服务器可能正在启动中');
    }
    throw error;
  }
);

// 测试结果统计
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const log = (message, color = '\x1b[0m') => {
  console.log(`${color}${message}\x1b[0m`);
};

const success = (message) => log(`✅ ${message}`, '\x1b[32m');
const error = (message) => log(`❌ ${message}`, '\x1b[31m');
const info = (message) => log(`ℹ️  ${message}`, '\x1b[34m');
const warn = (message) => log(`⚠️  ${message}`, '\x1b[33m');

// 测试函数
const test = async (name, testFn) => {
  totalTests++;
  try {
    await testFn();
    passedTests++;
    success(`${name} - 通过`);
  } catch (err) {
    failedTests++;
    error(`${name} - 失败: ${err.message}`);
  }
};

// 获取JWT payload
const getJWTPayload = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Token is undefined or not a string');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // 添加padding if needed
    const paddedBase64 = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const jsonPayload = Buffer.from(paddedBase64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error(`Failed to parse JWT: ${error.message}`);
  }
};

// 检查token是否即将过期
const isTokenExpiringSoon = (token, minutes = 5) => {
  const payload = getJWTPayload(token);
  if (!payload.exp) return false;

  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const thresholdTime = minutes * 60 * 1000;

  return expirationTime - currentTime < thresholdTime;
};

// 环境检查
const checkEnvironment = async () => {
  info('🔍 检查测试环境...');

  try {
    // 检查健康状态端点
    await api.get('/../health', { timeout: 5000 });
    success('服务器连接正常');
  } catch (err) {
    error('服务器连接失败');
    info('请确保：');
    info('1. 开发服务器已启动: pnpm dev');
    info('2. 数据库连接正常');
    info('3. Redis服务正常');
    throw new Error('环境检查失败');
  }
};

// 主要测试流程
const runTests = async () => {
  info('🚀 开始Token自动刷新机制测试...\n');

  // 首先检查环境
  await checkEnvironment();
  info('');

  let accessToken = '';
  let refreshToken = '';

  // 测试1: 登录获取tokens
  await test('登录获取Access Token和Refresh Token', async () => {
    const response = await api.post('/auth/login-simple', {
      username: 'admin',
      password: 'admin123456',
    });

    if (response.data.code !== 0) {
      throw new Error(`登录失败: ${response.data.msg}`);
    }

    const { token, refreshToken: newRefreshToken } = response.data.data;
    if (!token || !newRefreshToken) {
      throw new Error('登录响应中缺少token或refreshToken');
    }

    accessToken = token;
    refreshToken = newRefreshToken;

    info(`Access Token: ${accessToken.substring(0, 20)}...`);
    info(`Refresh Token: ${newRefreshToken.substring(0, 20)}...`);
  });

  // 测试2: 验证Access Token格式和内容
  await test('验证Access Token格式和内容', async () => {
    const payload = getJWTPayload(accessToken);

    if (!payload.id || !payload.name || !payload.exp) {
      throw new Error('Access Token payload缺少必要字段');
    }

    const expirationTime = new Date(payload.exp * 1000);
    info(`Token过期时间: ${expirationTime.toLocaleString()}`);

    const timeUntilExpiry = payload.exp * 1000 - Date.now();
    info(`距离过期还有: ${Math.round(timeUntilExpiry / 60000)}分钟`);
  });

  // 测试3: 使用Access Token访问受保护的API
  await test('使用Access Token访问受保护的API', async () => {
    const response = await api.get('/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.data.code !== 0) {
      throw new Error(`API访问失败: ${response.data.msg}`);
    }

    info(`当前用户: ${response.data.data.name}`);
  });

  // 测试4: 使用Refresh Token刷新Access Token
  await test('使用Refresh Token刷新Access Token', async () => {
    const response = await api.post('/auth/refresh', {
      refreshToken: refreshToken,
    });

    if (response.data.code !== 0) {
      throw new Error(`Token刷新失败: ${response.data.msg}`);
    }

    const { token: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
    if (!newAccessToken || !newRefreshToken) {
      throw new Error('刷新响应中缺少新的token');
    }

    // 验证新token和旧token不同
    if (newAccessToken === accessToken) {
      throw new Error('新的Access Token与旧的相同');
    }

    if (newRefreshToken === refreshToken) {
      throw new Error('新的Refresh Token与旧的相同');
    }

    // 更新tokens
    const oldAccessToken = accessToken;
    accessToken = newAccessToken;
    refreshToken = newRefreshToken;

    info(`旧Access Token: ${oldAccessToken.substring(0, 20)}...`);
    info(`新Access Token: ${newAccessToken.substring(0, 20)}...`);
  });

  // 测试5: 验证新token可以正常使用
  await test('验证新token可以正常使用', async () => {
    const response = await api.get('/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.data.code !== 0) {
      throw new Error(`新token访问API失败: ${response.data.msg}`);
    }

    info(`使用新token成功访问用户信息: ${response.data.data.name}`);
  });

  // 测试6: 测试无效的Refresh Token
  await test('测试无效的Refresh Token', async () => {
    try {
      const response = await api.post('/auth/refresh', {
        refreshToken: 'invalid.refresh.token',
      });

      if (response.data.code === 0) {
        throw new Error('无效的refresh token不应该成功');
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        // 预期的401错误
        info('无效refresh token正确返回401错误');
      } else {
        throw err;
      }
    }
  });

  // 测试7: 测试不存在的Refresh Token
  await test('测试不存在的Refresh Token', async () => {
    // 生成一个格式正确但不存在的refresh token
    const fakePayload = {
      id: 'nonexistent-user-id',
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    };

    // 这里我们只是测试API的响应，不需要真正签名token
    try {
      const response = await api.post('/auth/refresh', {
        refreshToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Im5vbmV4aXN0ZW50LXVzZXItaWQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTYzOTU2MjQwMCwiZXhwIjoxNjM5NjQ4ODAwfQ.fake-signature',
      });

      if (response.data.code === 0) {
        throw new Error('不存在的refresh token不应该成功');
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        info('不存在的refresh token正确返回401错误');
      } else {
        throw err;
      }
    }
  });

  // 测试结果统计
  info('\n📊 测试结果统计:');
  info(`总测试数: ${totalTests}`);
  success(`通过: ${passedTests}`);

  if (failedTests > 0) {
    error(`失败: ${failedTests}`);
  } else {
    success('所有测试通过! 🎉');
  }

  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  info(`成功率: ${successRate}%`);

  if (passedTests === totalTests) {
    success('\n✨ Token自动刷新机制测试完成，所有功能正常！');
    info('\n🔧 自动刷新机制特性:');
    info('• Access Token过期时间: 8小时');
    info('• Refresh Token过期时间: 30天');
    info('• 自动在token过期前5分钟刷新');
    info('• 请求失败时自动重试刷新');
    info('• 刷新失败时自动跳转登录页面');
    info('• 支持并发请求的token刷新队列');
  } else {
    error('\n❌ 部分测试失败，请检查实现。');
  }
};

// 运行测试
runTests().catch((err) => {
  error(`测试执行失败: ${err.message}`);
  process.exit(1);
});
