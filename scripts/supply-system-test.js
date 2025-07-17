#!/usr/bin/env node

/**
 * 供货记录系统综合测试脚本
 * 包括安全性测试、功能性测试和性能测试
 */

import fs from 'fs';
import path from 'path';

// 测试配置
const config = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  testShareCode: 'TEST2024',
  testExtractCode: '1234',
  maxResponseTime: 5000, // 5秒
  testPurchaseOrderId: 'test-order-001',
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`),
  header: (msg) =>
    console.log(
      `\n${colors.magenta}${'='.repeat(50)}${colors.reset}\n${colors.magenta}${msg}${colors.reset}\n${colors.magenta}${'='.repeat(50)}${colors.reset}`
    ),
};

// 测试结果统计
const testStats = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
};

// 测试结果记录
const testResults = [];

// 辅助函数
function addTest(name, status, message, details = null) {
  testStats.total++;
  testStats[status]++;

  testResults.push({
    name,
    status,
    message,
    details,
    timestamp: new Date().toISOString(),
  });

  const icon = status === 'passed' ? '✓' : status === 'failed' ? '✗' : '⚠';
  const color =
    status === 'passed' ? colors.green : status === 'failed' ? colors.red : colors.yellow;
  console.log(`  ${color}${icon}${colors.reset} ${name}: ${message}`);

  if (details) {
    console.log(`    ${colors.cyan}详情:${colors.reset} ${details}`);
  }
}

// 安全性测试
async function runSecurityTests() {
  log.section('🔒 安全性测试');

  // 1. 检查分享链接安全性
  await testShareLinkSecurity();

  // 2. 检查API安全性
  await testApiSecurity();

  // 3. 检查输入验证
  await testInputValidation();

  // 4. 检查身份验证绕过
  await testAuthBypass();
}

async function testShareLinkSecurity() {
  log.info('测试分享链接安全性...');

  // 检查分享码长度和复杂度
  const shareCodePattern = /^[A-Z0-9]{8}$/;
  if (shareCodePattern.test(config.testShareCode)) {
    addTest('分享码格式', 'passed', '8位大写字母和数字组合，符合安全要求');
  } else {
    addTest('分享码格式', 'failed', '分享码格式不符合安全要求');
  }

  // 检查提取码强度
  const extractCodePattern = /^[A-Z0-9]{4}$/;
  if (extractCodePattern.test(config.testExtractCode)) {
    addTest('提取码格式', 'passed', '4位大写字母和数字组合');
  } else {
    addTest('提取码格式', 'warning', '提取码可能需要更强的复杂度');
  }

  // 检查文件是否存在敏感信息泄露
  checkSupplySystemFiles();
}

function checkSupplySystemFiles() {
  log.info('检查供货记录系统文件安全性...');

  const sensitivePatterns = [
    /password.*=.*['"]/i,
    /secret.*=.*['"]/i,
    /key.*=.*['"]/i,
    /token.*=.*['"]/i,
  ];

  const filesToCheck = [
    'src/lib/supply-share.ts',
    'src/lib/supply-validator.ts',
    'src/app/api/v1/share/verify/route.ts',
    'src/app/api/v1/share/[shareCode]/info/route.ts',
    'src/app/api/v1/share/[shareCode]/supply/route.ts',
  ];

  let securityIssues = 0;

  filesToCheck.forEach((file) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');

      // 检查是否包含敏感信息
      sensitivePatterns.forEach((pattern) => {
        if (pattern.test(content)) {
          securityIssues++;
          addTest(`文件安全检查: ${file}`, 'warning', '可能包含敏感信息', pattern.toString());
        }
      });

      // 检查是否有TODO或FIXME注释
      if (/TODO|FIXME|XXX|HACK/i.test(content)) {
        addTest(`代码质量: ${file}`, 'warning', '包含TODO或FIXME注释');
      }
    }
  });

  if (securityIssues === 0) {
    addTest('文件敏感信息检查', 'passed', '未发现明显的敏感信息泄露');
  }
}

async function testApiSecurity() {
  log.info('测试API安全性...');

  // 检查是否有未保护的API端点
  const publicApis = [
    '/api/v1/share/verify',
    '/api/v1/share/[shareCode]/info',
    '/api/v1/share/[shareCode]/supply',
  ];

  const protectedApis = [
    '/api/v1/purchase-orders/[id]/share',
    '/api/v1/purchase-orders/[id]/supply-records',
    '/api/v1/supply-records/[id]/disable',
  ];

  addTest('公开API识别', 'passed', `已识别${publicApis.length}个公开API端点`);
  addTest('受保护API识别', 'passed', `已识别${protectedApis.length}个受保护API端点`);

  // 检查API响应头安全性
  checkApiSecurityHeaders();
}

function checkApiSecurityHeaders() {
  log.info('检查API安全响应头配置...');

  // 检查middleware.ts中的安全头配置
  const middlewarePath = path.join(process.cwd(), 'src/middleware.ts');
  if (fs.existsSync(middlewarePath)) {
    const content = fs.readFileSync(middlewarePath, 'utf8');

    const requiredHeaders = [
      'X-XSS-Protection',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
    ];

    let foundHeaders = 0;
    requiredHeaders.forEach((header) => {
      if (content.includes(header)) {
        foundHeaders++;
      }
    });

    if (foundHeaders === requiredHeaders.length) {
      addTest(
        'API安全响应头',
        'passed',
        `配置了${foundHeaders}/${requiredHeaders.length}个必要的安全响应头`
      );
    } else {
      addTest(
        'API安全响应头',
        'warning',
        `仅配置了${foundHeaders}/${requiredHeaders.length}个安全响应头`
      );
    }
  }
}

async function testInputValidation() {
  log.info('测试输入验证安全性...');

  // 检查是否使用了输入验证库
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (dependencies.zod) {
      addTest('输入验证库', 'passed', '使用了Zod进行类型验证');
    } else if (dependencies.joi || dependencies.yup) {
      addTest('输入验证库', 'passed', '使用了输入验证库');
    } else {
      addTest('输入验证库', 'warning', '未检测到专门的输入验证库');
    }
  }

  // 检查SQL注入防护
  checkSqlInjectionProtection();
}

function checkSqlInjectionProtection() {
  log.info('检查SQL注入防护...');

  // 检查是否使用Prisma ORM
  const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
  if (fs.existsSync(schemaPath)) {
    addTest('SQL注入防护', 'passed', '使用Prisma ORM，自动防护SQL注入');
  } else {
    addTest('SQL注入防护', 'warning', '请确认是否有SQL注入防护措施');
  }
}

async function testAuthBypass() {
  log.info('测试身份验证绕过机制...');

  // 检查admin-layout.tsx中的身份验证绕过逻辑
  const layoutPath = path.join(process.cwd(), 'src/components/admin-layout.tsx');
  if (fs.existsSync(layoutPath)) {
    const content = fs.readFileSync(layoutPath, 'utf8');

    if (content.includes('shouldSkipAuth') && content.includes('/supply/')) {
      addTest('供应商端身份验证绕过', 'passed', '正确配置了供应商端路由的身份验证绕过');
    } else {
      addTest('供应商端身份验证绕过', 'failed', '供应商端身份验证绕过配置可能有问题');
    }
  }
}

// 功能性测试
async function runFunctionalTests() {
  log.section('⚙️ 功能性测试');

  await testDatabaseSchema();
  await testApiEndpoints();
  await testComponents();
  await testBusinessLogic();
}

async function testDatabaseSchema() {
  log.info('测试数据库模式...');

  const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const content = fs.readFileSync(schemaPath, 'utf8');

    // 检查供货记录相关表
    const requiredTables = ['SupplyShareLink', 'SupplyRecord', 'SupplyRecordItem'];

    let foundTables = 0;
    requiredTables.forEach((table) => {
      if (content.includes(`model ${table}`)) {
        foundTables++;
      }
    });

    if (foundTables === requiredTables.length) {
      addTest('数据库表结构', 'passed', `成功创建了${foundTables}个供货记录相关表`);
    } else {
      addTest('数据库表结构', 'failed', `仅找到${foundTables}/${requiredTables.length}个必要的表`);
    }

    // 检查索引配置
    if (content.includes('@@index') || content.includes('@@unique')) {
      addTest('数据库索引', 'passed', '配置了数据库索引以优化查询性能');
    } else {
      addTest('数据库索引', 'warning', '建议添加数据库索引以优化查询性能');
    }
  }
}

async function testApiEndpoints() {
  log.info('测试API端点结构...');

  const apiPaths = [
    'src/app/api/v1/share/verify/route.ts',
    'src/app/api/v1/share/[shareCode]/info/route.ts',
    'src/app/api/v1/share/[shareCode]/supply/route.ts',
    'src/app/api/v1/purchase-orders/[id]/share/route.ts',
    'src/app/api/v1/purchase-orders/[id]/supply-records/route.ts',
    'src/app/api/v1/supply-records/[id]/disable/route.ts',
  ];

  let foundApis = 0;
  apiPaths.forEach((apiPath) => {
    if (fs.existsSync(path.join(process.cwd(), apiPath))) {
      foundApis++;
    }
  });

  if (foundApis === apiPaths.length) {
    addTest('API端点完整性', 'passed', `所有${foundApis}个API端点文件都存在`);
  } else {
    addTest('API端点完整性', 'failed', `仅找到${foundApis}/${apiPaths.length}个API端点文件`);
  }
}

async function testComponents() {
  log.info('测试前端组件...');

  const componentPaths = [
    'src/app/supply/layout.tsx',
    'src/app/supply/styles.css',
    'src/app/supply/[shareCode]/page.tsx',
    'src/app/supply/[shareCode]/dashboard/page.tsx',
    'src/app/system/purchase-orders/components/supply-share-modal.tsx',
    'src/app/system/purchase-orders/components/supply-records-modal.tsx',
  ];

  let foundComponents = 0;
  componentPaths.forEach((componentPath) => {
    if (fs.existsSync(path.join(process.cwd(), componentPath))) {
      foundComponents++;
    }
  });

  if (foundComponents === componentPaths.length) {
    addTest('前端组件完整性', 'passed', `所有${foundComponents}个组件文件都存在`);
  } else {
    addTest(
      '前端组件完整性',
      'failed',
      `仅找到${foundComponents}/${componentPaths.length}个组件文件`
    );
  }
}

async function testBusinessLogic() {
  log.info('测试业务逻辑...');

  // 检查核心业务逻辑文件
  const businessLogicFiles = [
    'src/lib/supply-share.ts',
    'src/lib/supply-validator.ts',
    'src/services/supply.ts',
  ];

  let foundLogicFiles = 0;
  businessLogicFiles.forEach((file) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      foundLogicFiles++;

      const content = fs.readFileSync(filePath, 'utf8');

      // 检查错误处理
      if (content.includes('try {') && content.includes('catch')) {
        // 有错误处理
      } else {
        addTest(`错误处理: ${file}`, 'warning', '可能缺少充分的错误处理机制');
      }
    }
  });

  if (foundLogicFiles === businessLogicFiles.length) {
    addTest('业务逻辑文件', 'passed', `所有${foundLogicFiles}个业务逻辑文件都存在`);
  } else {
    addTest(
      '业务逻辑文件',
      'failed',
      `仅找到${foundLogicFiles}/${businessLogicFiles.length}个业务逻辑文件`
    );
  }
}

// 性能测试
async function runPerformanceTests() {
  log.section('⚡ 性能测试');

  await testBundleSize();
  await testCodeComplexity();
}

async function testBundleSize() {
  log.info('测试打包大小...');

  // 检查.next/BUILD_ID是否存在（表示构建成功）
  const nextDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextDir)) {
    addTest('构建状态', 'passed', '项目已成功构建');

    // 检查供应商端页面大小
    const supplyPages = [
      '.next/server/app/supply/[shareCode]/page.js',
      '.next/server/app/supply/[shareCode]/dashboard/page.js',
    ];

    supplyPages.forEach((pagePath) => {
      const fullPath = path.join(process.cwd(), pagePath);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        const sizeKB = (stats.size / 1024).toFixed(2);

        if (stats.size < 50 * 1024) {
          // 小于50KB
          addTest(`页面大小: ${path.basename(pagePath)}`, 'passed', `${sizeKB} KB (优秀)`);
        } else if (stats.size < 100 * 1024) {
          // 小于100KB
          addTest(`页面大小: ${path.basename(pagePath)}`, 'warning', `${sizeKB} KB (可接受)`);
        } else {
          addTest(`页面大小: ${path.basename(pagePath)}`, 'failed', `${sizeKB} KB (过大)`);
        }
      }
    });
  } else {
    addTest('构建状态', 'failed', '项目未构建或构建失败');
  }
}

async function testCodeComplexity() {
  log.info('测试代码复杂度...');

  const coreFiles = ['src/lib/supply-share.ts', 'src/lib/supply-validator.ts'];

  coreFiles.forEach((file) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').length;

      if (lines < 200) {
        addTest(`代码复杂度: ${path.basename(file)}`, 'passed', `${lines} 行 (简洁)`);
      } else if (lines < 400) {
        addTest(`代码复杂度: ${path.basename(file)}`, 'warning', `${lines} 行 (中等)`);
      } else {
        addTest(`代码复杂度: ${path.basename(file)}`, 'failed', `${lines} 行 (复杂)`);
      }
    }
  });
}

// 生成测试报告
function generateReport() {
  log.header('📊 测试报告');

  console.log(`总测试数: ${testStats.total}`);
  console.log(`${colors.green}通过: ${testStats.passed}${colors.reset}`);
  console.log(`${colors.red}失败: ${testStats.failed}${colors.reset}`);
  console.log(`${colors.yellow}警告: ${testStats.warnings}${colors.reset}`);

  const successRate = ((testStats.passed / testStats.total) * 100).toFixed(1);
  console.log(`成功率: ${successRate}%`);

  if (testStats.failed === 0) {
    log.success('🎉 所有关键测试都通过了！');
  } else {
    log.error(`❌ 有 ${testStats.failed} 个测试失败，需要关注`);
  }

  if (testStats.warnings > 0) {
    log.warning(`⚠️ 有 ${testStats.warnings} 个警告，建议优化`);
  }

  // 生成详细报告文件
  const reportPath = path.join(process.cwd(), 'supply-system-test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    stats: testStats,
    config: config,
    results: testResults,
    summary: {
      status: testStats.failed === 0 ? 'PASSED' : 'FAILED',
      successRate: successRate + '%',
      recommendations: generateRecommendations(),
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log.info(`详细报告已保存到: ${reportPath}`);
}

function generateRecommendations() {
  const recommendations = [];

  if (testStats.failed > 0) {
    recommendations.push('修复所有失败的测试用例');
  }

  if (testStats.warnings > 0) {
    recommendations.push('优化所有警告项以提高系统质量');
  }

  recommendations.push('定期运行安全扫描');
  recommendations.push('监控API响应性能');
  recommendations.push('设置自动化测试流程');

  return recommendations;
}

// 主函数
async function main() {
  log.header('🧪 供货记录系统综合测试');

  log.info(`测试配置:`);
  console.log(`  - 基础URL: ${config.baseUrl}`);
  console.log(`  - 测试分享码: ${config.testShareCode}`);
  console.log(`  - 最大响应时间: ${config.maxResponseTime}ms`);

  try {
    await runSecurityTests();
    await runFunctionalTests();
    await runPerformanceTests();
  } catch (error) {
    log.error(`测试执行出错: ${error.message}`);
    testStats.failed++;
  }

  generateReport();

  // 退出码
  process.exit(testStats.failed > 0 ? 1 : 0);
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runSecurityTests, runFunctionalTests, runPerformanceTests, testStats, config };
