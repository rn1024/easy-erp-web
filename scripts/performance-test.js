const https = require('https');
const http = require('http');

// 测试配置
const config = {
  baseUrl: 'http://localhost:3000',
  testToken: '', // 需要从登录API获取
  concurrency: 10, // 并发请求数
  iterations: 100, // 测试迭代次数
};

// API测试用例
const testCases = [
  {
    name: '用户登录',
    method: 'POST',
    path: '/api/v1/auth/login',
    data: {
      username: 'admin',
      password: 'admin123',
      captchaKey: 'test',
      captcha: 'test',
    },
    requiresAuth: false,
  },
  {
    name: '获取用户信息',
    method: 'GET',
    path: '/api/v1/me',
    requiresAuth: true,
  },
  {
    name: '获取系统日志（数据密集型）',
    method: 'GET',
    path: '/api/v1/logs?page=1&pageSize=50',
    requiresAuth: true,
    isDataIntensive: true,
  },
  {
    name: '获取财务报表（数据密集型）',
    method: 'GET',
    path: '/api/v1/financial-reports?page=1&pageSize=20',
    requiresAuth: true,
    isDataIntensive: true,
  },
  {
    name: '获取产品列表',
    method: 'GET',
    path: '/api/v1/products?page=1&pageSize=20',
    requiresAuth: true,
  },
  {
    name: '获取库存列表（数据密集型）',
    method: 'GET',
    path: '/api/v1/finished-inventory?page=1&pageSize=50',
    requiresAuth: true,
    isDataIntensive: true,
  },
  {
    name: '获取采购订单（数据密集型）',
    method: 'GET',
    path: '/api/v1/purchase-orders?page=1&pageSize=30',
    requiresAuth: true,
    isDataIntensive: true,
  },
  {
    name: '获取发货记录',
    method: 'GET',
    path: '/api/v1/delivery-records?page=1&pageSize=20',
    requiresAuth: true,
  },
  {
    name: '获取仓库任务',
    method: 'GET',
    path: '/api/v1/warehouse-tasks?page=1&pageSize=20',
    requiresAuth: true,
  },
];

// 性能统计
class PerformanceStats {
  constructor() {
    this.stats = new Map();
  }

  addResult(testName, responseTime, success) {
    if (!this.stats.has(testName)) {
      this.stats.set(testName, {
        times: [],
        successCount: 0,
        errorCount: 0,
        min: Infinity,
        max: 0,
        total: 0,
      });
    }

    const stat = this.stats.get(testName);
    stat.times.push(responseTime);
    stat.total += responseTime;
    stat.min = Math.min(stat.min, responseTime);
    stat.max = Math.max(stat.max, responseTime);

    if (success) {
      stat.successCount++;
    } else {
      stat.errorCount++;
    }
  }

  getReport() {
    const report = [];

    for (const [testName, stat] of this.stats) {
      const avg = stat.total / stat.times.length;
      const totalRequests = stat.successCount + stat.errorCount;
      const successRate = (stat.successCount / totalRequests) * 100;

      // 计算百分位数
      const sortedTimes = stat.times.sort((a, b) => a - b);
      const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
      const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
      const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

      report.push({
        testName,
        totalRequests,
        successCount: stat.successCount,
        errorCount: stat.errorCount,
        successRate: successRate.toFixed(2) + '%',
        avgResponseTime: avg.toFixed(2) + 'ms',
        minResponseTime: stat.min.toFixed(2) + 'ms',
        maxResponseTime: stat.max.toFixed(2) + 'ms',
        p50: p50.toFixed(2) + 'ms',
        p95: p95.toFixed(2) + 'ms',
        p99: p99.toFixed(2) + 'ms',
      });
    }

    return report;
  }
}

// HTTP请求函数
function makeRequest(testCase, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.baseUrl + testCase.path);
    const startTime = Date.now();

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: testCase.method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    const requestModule = url.protocol === 'https:' ? https : http;

    const req = requestModule.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        try {
          const jsonData = JSON.parse(data);
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
            responseTime,
            data: jsonData,
          });
        } catch (error) {
          resolve({
            success: false,
            statusCode: res.statusCode,
            responseTime,
            error: 'Invalid JSON response',
          });
        }
      });
    });

    req.on('error', (error) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      resolve({
        success: false,
        responseTime,
        error: error.message,
      });
    });

    // 发送请求数据
    if (testCase.data) {
      req.write(JSON.stringify(testCase.data));
    }

    req.end();
  });
}

// 并发测试函数
async function runConcurrentTest(testCase, token, concurrency, iterations) {
  const stats = new PerformanceStats();
  const batches = Math.ceil(iterations / concurrency);

  console.log(`\n🔄 测试: ${testCase.name}`);
  console.log(`   并发数: ${concurrency}, 总请求数: ${iterations}`);

  for (let batch = 0; batch < batches; batch++) {
    const currentBatchSize = Math.min(concurrency, iterations - batch * concurrency);
    const promises = [];

    for (let i = 0; i < currentBatchSize; i++) {
      promises.push(makeRequest(testCase, token));
    }

    const results = await Promise.all(promises);

    results.forEach((result) => {
      stats.addResult(testCase.name, result.responseTime, result.success);

      if (!result.success) {
        console.log(`   ❌ 错误: ${result.error || result.statusCode}`);
      }
    });

    // 显示进度
    const completed = (batch + 1) * concurrency;
    const progress = Math.min(completed, iterations);
    process.stdout.write(
      `\r   进度: ${progress}/${iterations} (${((progress / iterations) * 100).toFixed(1)}%)`
    );
  }

  console.log('\n   ✅ 完成');
  return stats;
}

// 获取认证token
async function getAuthToken() {
  console.log('🔐 获取认证token...');

  const loginTest = testCases.find((tc) => tc.name === '用户登录');
  const result = await makeRequest(loginTest);

  if (result.success && result.data && result.data.data && result.data.data.token) {
    console.log('✅ 登录成功');
    return result.data.data.token;
  } else {
    console.log('❌ 登录失败:', result);
    return null;
  }
}

// 主测试函数
async function runPerformanceTest() {
  console.log('🚀 Easy ERP Web 性能测试开始');
  console.log('====================================');

  // 获取认证token
  const token = await getAuthToken();
  if (!token) {
    console.log('❌ 无法获取认证token，测试终止');
    return;
  }

  const allStats = new PerformanceStats();

  // 执行测试用例
  for (const testCase of testCases) {
    if (testCase.name === '用户登录') continue; // 跳过登录测试

    const useToken = testCase.requiresAuth ? token : null;
    const iterations = testCase.isDataIntensive ? config.iterations * 2 : config.iterations;

    const stats = await runConcurrentTest(testCase, useToken, config.concurrency, iterations);

    // 合并统计数据
    for (const [testName, stat] of stats.stats) {
      for (let i = 0; i < stat.times.length; i++) {
        allStats.addResult(testName, stat.times[i], i < stat.successCount);
      }
    }
  }

  // 生成报告
  console.log('\n\n📊 性能测试报告');
  console.log('=====================================');

  const report = allStats.getReport();

  console.log('| 测试名称 | 总请求数 | 成功率 | 平均响应时间 | P50 | P95 | P99 | 最小 | 最大 |');
  console.log('|---------|---------|--------|-------------|-----|-----|-----|------|------|');

  report.forEach((item) => {
    console.log(
      `| ${item.testName} | ${item.totalRequests} | ${item.successRate} | ${item.avgResponseTime} | ${item.p50} | ${item.p95} | ${item.p99} | ${item.minResponseTime} | ${item.maxResponseTime} |`
    );
  });

  // 性能警告
  console.log('\n⚠️  性能问题分析:');
  report.forEach((item) => {
    const avgTime = parseFloat(item.avgResponseTime);
    const p95Time = parseFloat(item.p95);

    if (avgTime > 1000) {
      console.log(`🔴 ${item.testName}: 平均响应时间过慢 (${item.avgResponseTime})`);
    } else if (avgTime > 500) {
      console.log(`🟡 ${item.testName}: 平均响应时间较慢 (${item.avgResponseTime})`);
    }

    if (p95Time > 2000) {
      console.log(`🔴 ${item.testName}: P95响应时间过慢 (${item.p95})`);
    }

    const successRate = parseFloat(item.successRate);
    if (successRate < 99) {
      console.log(`🔴 ${item.testName}: 成功率过低 (${item.successRate})`);
    }
  });

  console.log('\n✅ 性能测试完成!');
}

// 运行测试
if (require.main === module) {
  runPerformanceTest().catch(console.error);
}

module.exports = { runPerformanceTest, PerformanceStats };
