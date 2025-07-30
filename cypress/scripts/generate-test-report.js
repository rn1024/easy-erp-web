#!/usr/bin/env node

/**
 * E2E测试报告生成脚本
 * 生成详细的测试执行报告和统计分析
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 报告配置
const REPORT_DIR = path.join(__dirname, '..', 'reports');
const RESULTS_DIR = path.join(__dirname, '..', 'results');
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
const VIDEOS_DIR = path.join(__dirname, '..', 'videos');

// 确保目录存在
[REPORT_DIR, RESULTS_DIR, SCREENSHOTS_DIR, VIDEOS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * 执行测试并收集结果
 */
function runTests() {
  console.log('🚀 开始执行E2E测试...');
  
  try {
    // 运行测试并生成报告
    const command = `npx cypress run --reporter mochawesome --reporter-options reportDir=${RESULTS_DIR},overwrite=false,html=false,json=true`;
    execSync(command, { stdio: 'inherit' });
    
    console.log('✅ 测试执行完成');
    return true;
  } catch (error) {
    console.error('❌ 测试执行失败:', error.message);
    return false;
  }
}

/**
 * 收集测试结果
 */
function collectTestResults() {
  console.log('📊 开始收集测试结果...');
  
  const results = {
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      pending: 0,
      duration: 0,
      passPercent: 0,
      pendingPercent: 0,
      other: 0,
      hasOther: false,
      skippedPercent: 0,
      hasSkipped: false
    },
    suites: [],
    tests: [],
    passes: [],
    failures: [],
    pending: [],
    skipped: [],
    other: []
  };

  // 读取测试结果文件
  const resultsFiles = fs.readdirSync(RESULTS_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(RESULTS_DIR, file));

  resultsFiles.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      
      // 合并统计信息
      results.summary.total += data.stats.tests || 0;
      results.summary.passed += data.stats.passes || 0;
      results.summary.failed += data.stats.failures || 0;
      results.summary.skipped += data.stats.skipped || 0;
      results.summary.pending += data.stats.pending || 0;
      results.summary.duration += data.stats.duration || 0;
      results.summary.passPercent = Math.round((results.summary.passed / results.summary.total) * 100);
      
      // 收集测试详情
      if (data.results) {
        data.results.forEach(result => {
          if (result.suites) {
            result.suites.forEach(suite => {
              collectSuiteData(suite, results);
            });
          }
        });
      }
    } catch (error) {
      console.error(`❌ 读取结果文件失败: ${file}`, error.message);
    }
  });

  console.log(`📊 共收集 ${results.summary.total} 个测试用例`);
  return results;
}

/**
 * 收集套件数据
 */
function collectSuiteData(suite, results) {
  if (suite.tests) {
    suite.tests.forEach(test => {
      const testData = {
        title: test.title,
        fullTitle: test.fullTitle,
        duration: test.duration,
        state: test.state,
        speed: test.speed,
        pass: test.state === 'passed',
        fail: test.state === 'failed',
        pending: test.state === 'pending',
        skipped: test.state === 'skipped',
        code: test.code,
        err: test.err,
        uuid: test.uuid,
        parentUUID: test.parentUUID,
        isHook: test.isHook,
        skipped: test.skipped
      };

      results.tests.push(testData);

      switch (test.state) {
        case 'passed':
          results.passes.push(testData);
          break;
        case 'failed':
          results.failures.push(testData);
          break;
        case 'pending':
          results.pending.push(testData);
          break;
        case 'skipped':
          results.skipped.push(testData);
          break;
        default:
          results.other.push(testData);
      }
    });
  }

  if (suite.suites) {
    suite.suites.forEach(subSuite => {
      collectSuiteData(subSuite, results);
    });
  }
}

/**
 * 生成HTML报告
 */
function generateHTMLReport(results) {
  console.log('📝 开始生成HTML报告...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(REPORT_DIR, `test-report-${timestamp}.html`);
  
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E2E测试报告</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header p { opacity: 0.9; font-size: 1.1rem; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .card { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .card h3 { margin-bottom: 1rem; color: #333; }
        .stat { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
        .stat-label { color: #666; }
        .stat-value { font-weight: bold; }
        .success { color: #52c41a; }
        .failure { color: #ff4d4f; }
        .pending { color: #faad14; }
        .progress-bar { width: 100%; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; margin-top: 0.5rem; }
        .progress-fill { height: 100%; background: #52c41a; transition: width 0.3s; }
        .test-list { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
        .test-item { padding: 1rem; border-bottom: 1px solid #f0f0f0; }
        .test-item:last-child { border-bottom: none; }
        .test-title { font-weight: bold; margin-bottom: 0.5rem; }
        .test-meta { font-size: 0.9rem; color: #666; }
        .test-duration { color: #1890ff; }
        .test-status { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
        .status-passed { background: #f6ffed; color: #52c41a; }
        .status-failed { background: #fff2f0; color: #ff4d4f; }
        .status-pending { background: #fff7e6; color: #faad14; }
        .failure-details { background: #fff2f0; border: 1px solid #ffccc7; border-radius: 4px; padding: 1rem; margin-top: 1rem; }
        .failure-stack { font-family: 'Courier New', monospace; font-size: 0.9rem; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="header">
        <h1>E2E测试报告</h1>
        <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
    </div>

    <div class="container">
        <div class="summary">
            <div class="card">
                <h3>测试概览</h3>
                <div class="stat">
                    <span class="stat-label">总测试数</span>
                    <span class="stat-value">${results.summary.total}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">通过</span>
                    <span class="stat-value success">${results.summary.passed}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">失败</span>
                    <span class="stat-value failure">${results.summary.failed}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">跳过</span>
                    <span class="stat-value pending">${results.summary.skipped}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${results.summary.passPercent}%"></div>
                </div>
                <div style="margin-top: 0.5rem; text-align: center; color: #666;">
                    通过率: ${results.summary.passPercent}%
                </div>
            </div>

            <div class="card">
                <h3>执行统计</h3>
                <div class="stat">
                    <span class="stat-label">总耗时</span>
                    <span class="stat-value">${formatDuration(results.summary.duration)}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">平均耗时</span>
                    <span class="stat-value">${formatDuration(results.summary.duration / results.summary.total)}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">待处理</span>
                    <span class="stat-value pending">${results.summary.pending}</span>
                </div>
            </div>

            <div class="card">
                <h3>测试结果分布</h3>
                <div class="stat">
                    <span class="stat-label">成功</span>
                    <span class="stat-value success">${results.passes.length}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">失败</span>
                    <span class="stat-value failure">${results.failures.length}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">跳过</span>
                    <span class="stat-value pending">${results.skipped.length}</span>
                </div>
            </div>
        </div>

        ${results.failures.length > 0 ? `
        <div class="card">
            <h3>失败测试 (${results.failures.length})</h3>
            ${results.failures.map(test => `
                <div class="test-item">
                    <div class="test-title">${test.title}</div>
                    <div class="test-meta">
                        <span class="test-status status-failed">失败</span>
                        <span class="test-duration">耗时: ${formatDuration(test.duration)}</span>
                    </div>
                    ${test.err ? `
                    <div class="failure-details">
                        <strong>错误信息:</strong> ${test.err.message}
                        <div class="failure-stack">${test.err.stack || ''}</div>
                    </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="card">
            <h3>所有测试 (${results.tests.length})</h3>
            ${results.tests.map(test => `
                <div class="test-item">
                    <div class="test-title">${test.title}</div>
                    <div class="test-meta">
                        <span class="test-status status-${test.state}">${test.state}</span>
                        <span class="test-duration">耗时: ${formatDuration(test.duration)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>
  `;

  fs.writeFileSync(reportPath, html);
  console.log(`✅ HTML报告已生成: ${reportPath}`);
  return reportPath;
}

/**
 * 生成JSON报告
 */
function generateJSONReport(results) {
  console.log('📝 开始生成JSON报告...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(REPORT_DIR, `test-results-${timestamp}.json`);
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`✅ JSON报告已生成: ${reportPath}`);
  return reportPath;
}

/**
 * 生成Markdown报告
 */
function generateMarkdownReport(results) {
  console.log('📝 开始生成Markdown报告...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(REPORT_DIR, `test-report-${timestamp}.md`);
  
  const markdown = `# E2E测试报告

生成时间: ${new Date().toLocaleString('zh-CN')}

## 测试概览

| 指标 | 数值 |
|------|------|
| 总测试数 | ${results.summary.total} |
| 通过 | ${results.summary.passed} ✅ |
| 失败 | ${results.summary.failed} ❌ |
| 跳过 | ${results.summary.skipped} ⚠️ |
| 待处理 | ${results.summary.pending} ⏳ |
| 通过率 | ${results.summary.passPercent}% |
| 总耗时 | ${formatDuration(results.summary.duration)} |

## 测试结果统计

### 按状态分布
- ✅ **通过**: ${results.passes.length} 个测试
- ❌ **失败**: ${results.failures.length} 个测试
- ⚠️ **跳过**: ${results.skipped.length} 个测试
- ⏳ **待处理**: ${results.pending.length} 个测试

### 失败测试详情

${results.failures.length > 0 ? results.failures.map(test => `
#### ${test.title}
- **状态**: ❌ 失败
- **耗时**: ${formatDuration(test.duration)}
- **错误**: ${test.err?.message || '无错误信息'}
`).join('\n') : '无失败测试'}

## 性能统计

- **平均测试耗时**: ${formatDuration(results.summary.duration / results.summary.total)}
- **最快测试**: ${formatDuration(Math.min(...results.tests.map(t => t.duration)))}
- **最慢测试**: ${formatDuration(Math.max(...results.tests.map(t => t.duration)))}

---

*此报告由自动化测试框架生成*
`;

  fs.writeFileSync(reportPath, markdown);
  console.log(`✅ Markdown报告已生成: ${reportPath}`);
  return reportPath;
}

/**
 * 格式化持续时间
 */
function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * 压缩报告文件
 */
function compressReports() {
  console.log('📦 开始压缩报告文件...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archiveName = `test-reports-${timestamp}.zip`;
  
  try {
    // 使用zip压缩（需要系统支持zip命令）
    execSync(`cd ${REPORT_DIR} && zip -r ${archiveName} *.html *.json *.md`, { stdio: 'ignore' });
    console.log(`✅ 报告已压缩: ${path.join(REPORT_DIR, archiveName)}`);
    return path.join(REPORT_DIR, archiveName);
  } catch (error) {
    console.warn('⚠️ 压缩失败，跳过压缩步骤');
    return null;
  }
}

/**
 * 上传报告到云存储（可选）
 */
function uploadReports() {
  console.log('☁️ 开始上传报告到云存储...');
  
  // 这里可以集成AWS S3、阿里云OSS等云存储服务
  // 示例代码：
  /*
  const AWS = require('aws-sdk');
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  });
  
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `reports/e2e-${new Date().toISOString()}/`,
    Body: fs.createReadStream(reportPath)
  };
  
  return s3.upload(params).promise();
  */
  
  console.log('📤 云存储上传功能未启用，跳过此步骤');
  return Promise.resolve();
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const options = {
    run: args.includes('--run') || args.includes('-r'),
    html: args.includes('--html') || args.includes('-h'),
    json: args.includes('--json') || args.includes('-j'),
    markdown: args.includes('--markdown') || args.includes('-m'),
    compress: args.includes('--compress') || args.includes('-c'),
    upload: args.includes('--upload') || args.includes('-u'),
    quiet: args.includes('--quiet') || args.includes('-q'),
    help: args.includes('--help') || args.includes('--h')
  };

  if (options.help) {
    console.log(`
E2E测试报告生成脚本

用法: node generate-test-report.js [选项]

选项:
  -r, --run       先运行测试再生成报告
  -h, --html      生成HTML报告
  -j, --json      生成JSON报告
  -m, --markdown  生成Markdown报告
  -c, --compress  压缩报告文件
  -u, --upload    上传到云存储
  -q, --quiet     静默模式
  --help          显示帮助信息

示例:
  node generate-test-report.js --run --html --json
  node generate-test-report.js --markdown --compress
    `);
    return;
  }

  // 默认生成所有格式报告
  if (!options.html && !options.json && !options.markdown) {
    options.html = true;
    options.json = true;
    options.markdown = true;
  }

  try {
    console.log('🚀 开始生成测试报告...\n');

    let results = null;

    if (options.run) {
      const success = runTests();
      if (!success) {
        console.error('❌ 测试运行失败，终止报告生成');
        process.exit(1);
      }
    }

    results = collectTestResults();

    if (results.summary.total === 0) {
      console.warn('⚠️ 未找到测试结果，请确保测试已运行');
      return;
    }

    const reports = [];

    if (options.html) {
      reports.push(generateHTMLReport(results));
    }

    if (options.json) {
      reports.push(generateJSONReport(results));
    }

    if (options.markdown) {
      reports.push(generateMarkdownReport(results));
    }

    if (options.compress) {
      const archive = compressReports();
      if (archive) reports.push(archive);
    }

    if (options.upload) {
      uploadReports().catch(console.error);
    }

    if (!options.quiet) {
      console.log('\n' + '='.repeat(50));
      console.log('📊 测试报告生成完成！');
      console.log('='.repeat(50));
      reports.forEach(report => {
        console.log(`📄 ${report}`);
      });
      console.log(`\n📊 测试统计:`);
      console.log(`   总测试: ${results.summary.total}`);
      console.log(`   通过: ${results.summary.passed} ✅`);
      console.log(`   失败: ${results.summary.failed} ❌`);
      console.log(`   跳过: ${results.summary.skipped} ⚠️`);
      console.log(`   通过率: ${results.summary.passPercent}%`);
    }

  } catch (error) {
    console.error('❌ 报告生成失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  runTests,
  collectTestResults,
  generateHTMLReport,
  generateJSONReport,
  generateMarkdownReport,
  formatDuration,
  compressReports,
  uploadReports
};