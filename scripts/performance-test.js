#!/usr/bin/env node

/**
 * 性能测试脚本
 * 测试供货记录系统的API响应时间和数据库查询性能
 */

import fs from 'fs';
import path from 'path';

// 测试配置
const config = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  apiTimeout: 5000, // 5秒超时
  maxResponseTime: {
    fast: 200, // 快速响应 < 200ms
    normal: 1000, // 正常响应 < 1s
    slow: 3000, // 慢响应 < 3s
  },
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`),
};

// 性能统计
const performanceStats = {
  apiTests: [],
  dbQueries: [],
  bundleAnalysis: {},
  recommendations: [],
};

// API响应时间测试
async function testApiPerformance() {
  log.section('🚀 API性能测试');

  const apiEndpoints = [
    {
      name: 'Health Check',
      url: '/api/health',
      method: 'GET',
      expectedTime: config.maxResponseTime.fast,
    },
    {
      name: 'Share Verify (Mock)',
      url: '/api/v1/share/verify',
      method: 'POST',
      body: { shareCode: 'TEST2024', extractCode: '1234' },
      expectedTime: config.maxResponseTime.normal,
    },
  ];

  for (const endpoint of apiEndpoints) {
    await testSingleApi(endpoint);
  }
}

async function testSingleApi(endpoint) {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.apiTimeout);

    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    };

    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }

    const response = await fetch(`${config.baseUrl}${endpoint.url}`, options);
    clearTimeout(timeoutId);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const result = {
      name: endpoint.name,
      url: endpoint.url,
      method: endpoint.method,
      responseTime,
      status: response.status,
      success: response.ok,
    };

    performanceStats.apiTests.push(result);

    // 评估性能等级
    let performanceLevel = 'slow';
    let color = colors.red;

    if (responseTime < config.maxResponseTime.fast) {
      performanceLevel = 'excellent';
      color = colors.green;
    } else if (responseTime < config.maxResponseTime.normal) {
      performanceLevel = 'good';
      color = colors.blue;
    } else if (responseTime < config.maxResponseTime.slow) {
      performanceLevel = 'acceptable';
      color = colors.yellow;
    }

    console.log(
      `  ${color}${performanceLevel}${colors.reset} ${endpoint.name}: ${responseTime}ms (${response.status})`
    );

    if (responseTime > endpoint.expectedTime) {
      performanceStats.recommendations.push(`${endpoint.name} 响应时间过长，建议优化`);
    }
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(
      `  ${colors.red}failed${colors.reset} ${endpoint.name}: ${responseTime}ms (${error.message})`
    );

    performanceStats.apiTests.push({
      name: endpoint.name,
      url: endpoint.url,
      method: endpoint.method,
      responseTime,
      error: error.message,
      success: false,
    });
  }
}

// 数据库查询性能测试
async function testDatabasePerformance() {
  log.section('🗃️ 数据库查询性能分析');

  // 分析Prisma Schema文件
  const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const content = fs.readFileSync(schemaPath, 'utf8');

    // 检查索引配置
    const indexes = (content.match(/@@index/g) || []).length;
    const uniqueConstraints = (content.match(/@@unique/g) || []).length;
    const totalOptimizations = indexes + uniqueConstraints;

    performanceStats.dbQueries.push({
      type: 'schema_analysis',
      indexes,
      uniqueConstraints,
      totalOptimizations,
    });

    if (totalOptimizations > 5) {
      log.success(`数据库索引配置: ${totalOptimizations}个优化配置 (优秀)`);
    } else if (totalOptimizations > 2) {
      log.warning(`数据库索引配置: ${totalOptimizations}个优化配置 (一般)`);
    } else {
      log.error(`数据库索引配置: ${totalOptimizations}个优化配置 (需要改进)`);
      performanceStats.recommendations.push('建议添加更多数据库索引以优化查询性能');
    }

    // 检查供货记录表的关联复杂度
    if (content.includes('SupplyRecord') && content.includes('SupplyRecordItem')) {
      log.success('供货记录表结构: 正确使用了主表-明细表设计模式');
    }
  }
}

// Bundle大小分析
async function analyzeBundleSize() {
  log.section('📦 Bundle大小分析');

  const nextDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(nextDir)) {
    log.error('项目未构建，无法分析bundle大小');
    return;
  }

  // 分析供应商端页面大小
  const supplyPages = [
    {
      name: '供应商验证页面',
      path: '.next/server/app/supply/[shareCode]/page.js',
    },
    {
      name: '供货记录填写页面',
      path: '.next/server/app/supply/[shareCode]/dashboard/page.js',
    },
  ];

  for (const page of supplyPages) {
    const fullPath = path.join(process.cwd(), page.path);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      const sizeKB = (stats.size / 1024).toFixed(2);

      performanceStats.bundleAnalysis[page.name] = {
        sizeKB: parseFloat(sizeKB),
        sizeBytes: stats.size,
      };

      if (stats.size < 30 * 1024) {
        // 小于30KB
        log.success(`${page.name}: ${sizeKB} KB (优秀)`);
      } else if (stats.size < 50 * 1024) {
        // 小于50KB
        log.warning(`${page.name}: ${sizeKB} KB (良好)`);
      } else {
        log.error(`${page.name}: ${sizeKB} KB (需要优化)`);
        performanceStats.recommendations.push(`${page.name} 体积过大，建议进行代码分割`);
      }
    }
  }

  // 检查是否使用了代码分割
  checkCodeSplitting();
}

function checkCodeSplitting() {
  log.info('检查代码分割配置...');

  // 检查next.config.js
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    const content = fs.readFileSync(nextConfigPath, 'utf8');

    if (content.includes('experimental') && content.includes('chunk')) {
      log.success('代码分割: 已配置实验性优化');
    } else {
      log.warning('代码分割: 可以考虑启用更多优化选项');
      performanceStats.recommendations.push('考虑在next.config.js中启用实验性优化选项');
    }
  }

  // 检查动态导入
  const supplyLayoutPath = path.join(process.cwd(), 'src/app/supply/layout.tsx');
  if (fs.existsSync(supplyLayoutPath)) {
    const content = fs.readFileSync(supplyLayoutPath, 'utf8');

    if (content.includes('dynamic') || content.includes('lazy')) {
      log.success('组件懒加载: 已使用动态导入');
    } else {
      log.info('组件懒加载: 供应商端组件可以考虑使用懒加载');
    }
  }
}

// 内存使用情况分析
function analyzeMemoryUsage() {
  log.section('💾 内存使用分析');

  const used = process.memoryUsage();
  const memoryStats = {
    rss: (used.rss / 1024 / 1024).toFixed(2), // MB
    heapTotal: (used.heapTotal / 1024 / 1024).toFixed(2), // MB
    heapUsed: (used.heapUsed / 1024 / 1024).toFixed(2), // MB
    external: (used.external / 1024 / 1024).toFixed(2), // MB
  };

  performanceStats.memoryUsage = memoryStats;

  console.log(`  RSS: ${memoryStats.rss} MB`);
  console.log(`  Heap Total: ${memoryStats.heapTotal} MB`);
  console.log(`  Heap Used: ${memoryStats.heapUsed} MB`);
  console.log(`  External: ${memoryStats.external} MB`);

  if (parseFloat(memoryStats.heapUsed) > 50) {
    log.warning('堆内存使用较高，建议检查内存泄漏');
    performanceStats.recommendations.push('堆内存使用较高，检查是否存在内存泄漏');
  } else {
    log.success('内存使用正常');
  }
}

// 生成性能报告
function generatePerformanceReport() {
  log.section('📊 性能报告');

  // API性能统计
  if (performanceStats.apiTests.length > 0) {
    const avgResponseTime =
      performanceStats.apiTests
        .filter((test) => test.success)
        .reduce((sum, test) => sum + test.responseTime, 0) /
      performanceStats.apiTests.filter((test) => test.success).length;

    console.log(`API平均响应时间: ${avgResponseTime.toFixed(2)}ms`);

    const fastAPIs = performanceStats.apiTests.filter(
      (test) => test.success && test.responseTime < config.maxResponseTime.fast
    ).length;

    console.log(`快速API (< 200ms): ${fastAPIs}/${performanceStats.apiTests.length}`);
  }

  // Bundle大小统计
  const bundleSizes = Object.values(performanceStats.bundleAnalysis);
  if (bundleSizes.length > 0) {
    const totalSize = bundleSizes.reduce((sum, bundle) => sum + bundle.sizeKB, 0);
    console.log(`供应商端总bundle大小: ${totalSize.toFixed(2)} KB`);
  }

  // 性能建议
  if (performanceStats.recommendations.length > 0) {
    log.section('💡 性能优化建议');
    performanceStats.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  } else {
    log.success('🎉 性能表现优秀，无需特别优化！');
  }

  // 保存详细报告
  const reportPath = path.join(process.cwd(), 'performance-test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    config,
    stats: performanceStats,
    summary: {
      avgApiResponseTime:
        performanceStats.apiTests.length > 0
          ? performanceStats.apiTests
              .filter((test) => test.success)
              .reduce((sum, test) => sum + test.responseTime, 0) /
            performanceStats.apiTests.filter((test) => test.success).length
          : 0,
      totalBundleSize: Object.values(performanceStats.bundleAnalysis).reduce(
        (sum, bundle) => sum + bundle.sizeKB,
        0
      ),
      memoryUsage: performanceStats.memoryUsage,
      recommendationCount: performanceStats.recommendations.length,
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log.info(`详细性能报告已保存到: ${reportPath}`);
}

// 主函数
async function main() {
  console.log('🚀 供货记录系统性能测试');
  console.log('='.repeat(50));

  try {
    await testApiPerformance();
    await testDatabasePerformance();
    await analyzeBundleSize();
    analyzeMemoryUsage();
    generatePerformanceReport();

    console.log('\n✅ 性能测试完成');
  } catch (error) {
    log.error(`性能测试失败: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { testApiPerformance, testDatabasePerformance, analyzeBundleSize, performanceStats };
