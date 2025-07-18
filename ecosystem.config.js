module.exports = {
  apps: [
    {
      name: 'easy-erp-web',
      script: 'npm',
      args: 'start',
      cwd: '/www/wwwroot/easy-erp-web',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3008,
        HOSTNAME: '0.0.0.0',
        NEXT_PUBLIC_APP_URL: 'https://erp.samuelcn.com',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3008,
        HOSTNAME: '0.0.0.0',
        NEXT_PUBLIC_APP_URL: 'https://erp.samuelcn.com',
      },
      // 日志配置
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,

      // 内存和性能配置
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',

      // 监控配置
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git', '.next'],

      // 重启策略
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',

      // 集群配置
      kill_timeout: 5000,

      // 环境变量
      env_file: '.env',

      // 进程管理
      pid_file: './logs/app.pid',

      // 合并日志
      merge_logs: true,

      // 日志轮转
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // 启动脚本 - 移除构建步骤，因为已在CI中完成
      post_update: ['npm install --production', 'npm run db:sync-migrate'],
    },
  ],
};
