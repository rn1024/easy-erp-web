const { spawn, exec } = require('child_process');
const axios = require('axios');
const path = require('path');

const log = (message, color = '\x1b[0m') => {
  console.log(`${color}${message}\x1b[0m`);
};

const success = (message) => log(`✅ ${message}`, '\x1b[32m');
const error = (message) => log(`❌ ${message}`, '\x1b[31m');
const info = (message) => log(`ℹ️  ${message}`, '\x1b[34m');
const warn = (message) => log(`⚠️  ${message}`, '\x1b[33m');

// 检查端口是否被占用
const checkPort = (port) => {
  return new Promise((resolve) => {
    const command =
      process.platform === 'win32' ? `netstat -an | findstr :${port}` : `lsof -i :${port}`;

    exec(command, (error, stdout, stderr) => {
      resolve(stdout.trim().length > 0);
    });
  });
};

// 等待服务启动
const waitForServer = async (url, timeout = 60000) => {
  const start = Date.now();

  info(`等待服务器启动 (${url})...`);

  while (Date.now() - start < timeout) {
    try {
      await axios.get(url, { timeout: 3000 });
      return true;
    } catch (err) {
      process.stdout.write('.');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  console.log(''); // 换行
  return false;
};

// 启动开发服务器
const startDevServer = () => {
  return new Promise((resolve, reject) => {
    info('启动开发服务器...');

    const devServer = spawn('pnpm', ['dev'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    let serverStarted = false;

    // 监听输出
    devServer.stdout.on('data', (data) => {
      const output = data.toString();
      if (
        output.includes('Ready') ||
        output.includes('started') ||
        output.includes('localhost:3000')
      ) {
        if (!serverStarted) {
          serverStarted = true;
          success('开发服务器启动成功');
          resolve(devServer);
        }
      }
    });

    devServer.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('EADDRINUSE')) {
        warn('端口3000已被占用，尝试使用现有服务器');
        resolve(null);
      }
    });

    // 设置超时
    setTimeout(() => {
      if (!serverStarted) {
        devServer.kill();
        reject(new Error('开发服务器启动超时'));
      }
    }, 30000);

    return devServer;
  });
};

// 运行测试脚本
const runTestScript = (scriptPath) => {
  return new Promise((resolve, reject) => {
    const testProcess = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`测试脚本退出，代码: ${code}`));
      }
    });

    testProcess.on('error', (err) => {
      reject(err);
    });
  });
};

// 主函数
const main = async () => {
  const args = process.argv.slice(2);
  const testType = args[0] || 'token'; // 默认运行token测试

  info('🚀 自动化测试运行器\n');

  let devServer = null;
  let serverWasRunning = false;

  try {
    // 1. 检查服务器状态
    info('1. 检查开发服务器状态...');
    const isServerRunning = await checkPort(3000);

    if (isServerRunning) {
      info('开发服务器已在运行');
      serverWasRunning = true;

      // 验证服务器响应
      try {
        await axios.get('http://localhost:3000/api/health', { timeout: 5000 });
        success('服务器响应正常');
      } catch (err) {
        throw new Error('服务器无响应，请重启开发服务器');
      }
    } else {
      // 启动开发服务器
      devServer = await startDevServer();

      if (devServer) {
        // 等待服务器就绪
        const serverReady = await waitForServer('http://localhost:3000/api/health');
        if (!serverReady) {
          throw new Error('服务器启动超时');
        }
      } else {
        // 服务器已在运行（端口被占用的情况）
        serverWasRunning = true;
      }
    }

    // 2. 运行指定的测试
    info(`\n2. 运行${testType}测试...`);

    const testScripts = {
      token: 'scripts/test-token-refresh.js',
      api: 'scripts/test-api-manually.js',
      integration: '__tests__/api/integration.test.ts',
    };

    const scriptPath = testScripts[testType];
    if (!scriptPath) {
      throw new Error(`未知的测试类型: ${testType}`);
    }

    if (testType === 'integration') {
      // 运行Jest测试
      await runTestScript('node_modules/.bin/jest');
    } else {
      // 运行普通测试脚本
      await runTestScript(scriptPath);
    }

    success('\n🎉 测试完成！');
  } catch (err) {
    error(`\n❌ 测试失败: ${err.message}`);
    process.exit(1);
  } finally {
    // 清理：如果我们启动了服务器，则关闭它
    if (devServer && !serverWasRunning) {
      info('\n🔧 清理开发服务器...');
      devServer.kill();

      // 等待进程退出
      await new Promise((resolve) => {
        devServer.on('close', resolve);
        setTimeout(resolve, 5000); // 最多等待5秒
      });
    }
  }
};

// 显示帮助信息
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
使用方法: node scripts/run-tests.js [test-type]

测试类型:
  token       - Token刷新机制测试 (默认)
  api         - API功能测试
  integration - 集成测试

示例:
  node scripts/run-tests.js token
  node scripts/run-tests.js api
  node scripts/run-tests.js integration

或通过pnpm脚本运行:
  pnpm test:auto:token
  pnpm test:auto:api
  pnpm test:auto:integration
`);
  process.exit(0);
}

// 处理进程退出
process.on('SIGINT', () => {
  info('\n收到退出信号，正在清理...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  info('\n收到终止信号，正在清理...');
  process.exit(0);
});

// 运行主函数
main().catch((err) => {
  error(`运行器失败: ${err.message}`);
  process.exit(1);
});
