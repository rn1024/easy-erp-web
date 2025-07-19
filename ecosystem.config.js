/*
 * @Author: Samuel Chen samuelcoding@qq.com
 * @Date: 2025-07-06 22:07:02
 * @LastEditors: Samuel Chen samuelcoding@qq.com
 * @LastEditTime: 2025-07-19 13:18:28
 * @FilePath: /easy-erp-web/ecosystem.config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
module.exports = {
  apps: [
    {
      name: 'easy-erp-web',
      script: '.next/standalone/server.js',
      cwd: '/www/wwwroot/easy-erp-web',
      instances: 2,
      exec_mode: 'cluster',
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

      // 内存和性能配置 - 恢复到8GB环境的设置
      max_memory_restart: '4G',
      node_args: '--max-old-space-size=4096',

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

      // 启动脚本
      post_update: ['npm install --omit=dev', 'npm run db:sync-migrate'],
    },
  ],
};
