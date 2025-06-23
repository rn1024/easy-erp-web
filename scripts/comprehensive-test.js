const https = require('https');
const http = require('http');

// 测试配置
const config = {
  baseUrl: 'http://localhost:3000',
  timeout: 10000,
  maxRetries: 3,
};

// 测试状态
let testToken = '';
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
};

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

// 日志函数
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}`),
};

// HTTP 请求函数
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, config.baseUrl);
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: config.timeout,
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const responseData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: true,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.data) {
      req.write(JSON.stringify(options.data));
    }

    req.end();
  });
}

// 运行单个测试
async function runTest(testCase) {
  const {
    name,
    path,
    method = 'GET',
    data,
    headers = {},
    expectedStatus = 200,
    requiresAuth = true,
  } = testCase;

  testResults.total++;

  try {
    const requestHeaders = { ...headers };
    if (requiresAuth && testToken) {
      requestHeaders.Authorization = `Bearer ${testToken}`;
    }

    const startTime = Date.now();
    const response = await makeRequest(path, {
      method,
      data,
      headers: requestHeaders,
    });
    const responseTime = Date.now() - startTime;

    // 检查状态码
    if (response.statusCode === expectedStatus) {
      testResults.passed++;
      log.success(`${name} - ${responseTime}ms`);
      return { success: true, responseTime, response };
    } else {
      testResults.failed++;
      const error = `状态码错误: 期望 ${expectedStatus}, 实际 ${response.statusCode}`;
      log.error(`${name} - ${error}`);
      testResults.errors.push({ test: name, error, response });
      return { success: false, error, response };
    }
  } catch (error) {
    testResults.failed++;
    log.error(`${name} - ${error.message}`);
    testResults.errors.push({ test: name, error: error.message });
    return { success: false, error: error.message };
  }
}

// 认证测试
async function testAuthentication() {
  log.title('🔐 身份认证测试');

  // 1. 获取验证码
  await runTest({
    name: '获取验证码',
    path: '/api/v1/auth/verifycode',
    requiresAuth: false,
  });

  // 2. 登录测试
  const loginResult = await runTest({
    name: '用户登录',
    path: '/api/v1/auth/login',
    method: 'POST',
    data: {
      username: 'admin',
      password: 'admin123',
      captchaKey: 'test',
      captcha: 'test',
    },
    requiresAuth: false,
  });

  if (loginResult.success && loginResult.response.data.token) {
    testToken = loginResult.response.data.token;
    log.info(`获取到认证token: ${testToken.slice(0, 20)}...`);
  }

  // 3. 获取用户信息
  await runTest({
    name: '获取用户信息',
    path: '/api/v1/me',
  });
}

// 基础数据管理测试
async function testBasicDataManagement() {
  log.title('📊 基础数据管理测试');

  const modules = [
    { name: '用户管理', path: '/api/v1/accounts' },
    { name: '角色管理', path: '/api/v1/roles' },
    { name: '店铺管理', path: '/api/v1/shops' },
    { name: '供应商管理', path: '/api/v1/suppliers' },
    { name: '货代管理', path: '/api/v1/forwarding-agents' },
    { name: '产品分类管理', path: '/api/v1/product-categories' },
    { name: '产品管理', path: '/api/v1/products' },
  ];

  for (const module of modules) {
    await runTest({
      name: `获取${module.name}列表`,
      path: `${module.path}?page=1&pageSize=10`,
    });
  }
}

// 库存管理测试
async function testInventoryManagement() {
  log.title('📦 库存管理测试');

  const inventoryModules = [
    { name: '成品库存', path: '/api/v1/finished-inventory' },
    { name: '散件库存', path: '/api/v1/spare-inventory' },
  ];

  for (const module of inventoryModules) {
    await runTest({
      name: `获取${module.name}列表`,
      path: `${module.path}?page=1&pageSize=10`,
    });
  }
}

// 业务流程测试
async function testBusinessProcesses() {
  log.title('🏭 业务流程测试');

  const businessModules = [
    { name: '采购订单', path: '/api/v1/purchase-orders' },
    { name: '仓库任务', path: '/api/v1/warehouse-tasks' },
    { name: '发货记录', path: '/api/v1/delivery-records' },
    { name: '财务报表', path: '/api/v1/financial-reports' },
  ];

  for (const module of businessModules) {
    await runTest({
      name: `获取${module.name}列表`,
      path: `${module.path}?page=1&pageSize=10`,
    });
  }
}

// 系统管理测试
async function testSystemManagement() {
  log.title('⚙️ 系统管理测试');

  await runTest({
    name: '获取系统日志',
    path: '/api/v1/logs?page=1&pageSize=10',
  });

  await runTest({
    name: '获取日志统计',
    path: '/api/v1/logs/stats?days=7',
  });
}

// 性能测试
async function testPerformance() {
  log.title('⚡ 性能测试');

  const performanceTests = [
    {
      name: '大数据量系统日志查询',
      path: '/api/v1/logs?page=1&pageSize=100',
      expectedMaxTime: 1000,
    },
    {
      name: '财务报表数据查询',
      path: '/api/v1/financial-reports?page=1&pageSize=50',
      expectedMaxTime: 800,
    },
    {
      name: '库存数据查询',
      path: '/api/v1/finished-inventory?page=1&pageSize=100',
      expectedMaxTime: 600,
    },
  ];

  for (const test of performanceTests) {
    const startTime = Date.now();
    const result = await runTest({
      name: test.name,
      path: test.path,
    });
    const responseTime = Date.now() - startTime;

    if (result.success) {
      if (responseTime <= test.expectedMaxTime) {
        log.success(`${test.name} 性能良好 (${responseTime}ms <= ${test.expectedMaxTime}ms)`);
      } else {
        log.warning(`${test.name} 性能较慢 (${responseTime}ms > ${test.expectedMaxTime}ms)`);
      }
    }
  }
}

// 并发测试
async function testConcurrency() {
  log.title('🚀 并发测试');

  const concurrentRequests = Array(10)
    .fill()
    .map((_, index) => ({
      name: `并发请求-${index + 1}`,
      path: '/api/v1/me',
    }));

  log.info('开始并发测试 (10个并发请求)...');
  const startTime = Date.now();

  const results = await Promise.allSettled(concurrentRequests.map((test) => runTest(test)));

  const totalTime = Date.now() - startTime;
  const successCount = results.filter(
    (result) => result.status === 'fulfilled' && result.value.success
  ).length;

  log.info(
    `并发测试完成: ${successCount}/${concurrentRequests.length} 成功, 总时间: ${totalTime}ms`
  );
}

// 错误处理测试
async function testErrorHandling() {
  log.title('🛡️ 错误处理测试');

  const errorTests = [
    {
      name: '未认证访问',
      path: '/api/v1/accounts',
      requiresAuth: false,
      expectedStatus: 401,
    },
    {
      name: '无效路由',
      path: '/api/v1/invalid-endpoint',
      expectedStatus: 404,
    },
    {
      name: '无效方法',
      path: '/api/v1/accounts',
      method: 'PATCH',
      expectedStatus: 405,
    },
  ];

  for (const test of errorTests) {
    await runTest(test);
  }
}

// 生成测试报告
function generateReport() {
  log.title('📋 测试报告');

  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(2);

  console.log(`总测试数: ${testResults.total}`);
  console.log(`${colors.green}成功: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}失败: ${testResults.failed}${colors.reset}`);
  console.log(`成功率: ${successRate}%`);

  if (testResults.errors.length > 0) {
    log.title('❌ 失败详情');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }

  // 生成性能建议
  if (parseFloat(successRate) < 95) {
    log.title('🎯 优化建议');
    console.log('- 检查API接口实现');
    console.log('- 验证数据库连接');
    console.log('- 确认环境变量配置');
    console.log('- 检查服务器运行状态');
  } else {
    log.success('🎉 所有测试通过！系统运行良好。');
  }
}

// 主测试函数
async function runAllTests() {
  console.log(`${colors.bold}${colors.blue}🚀 Easy ERP Web 综合功能测试${colors.reset}`);
  console.log('====================================\n');

  try {
    // 检查服务器状态
    log.info('检查开发服务器状态...');
    await makeRequest('/api/v1/auth/verifycode');
    log.success('开发服务器运行正常');

    // 运行测试套件
    await testAuthentication();
    await testBasicDataManagement();
    await testInventoryManagement();
    await testBusinessProcesses();
    await testSystemManagement();
    await testPerformance();
    await testConcurrency();
    await testErrorHandling();

    // 生成报告
    generateReport();
  } catch (error) {
    log.error(`测试执行失败: ${error.message}`);
    log.warning('请确保开发服务器正在运行 (pnpm dev)');
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('测试运行出错:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  runTest,
  makeRequest,
};
