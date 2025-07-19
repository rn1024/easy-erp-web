/*
 * @Author: Samuel Chen samuelcoding@qq.com
 * @Date: 2025-07-19 12:45:18
 * @LastEditors: Samuel Chen samuelcoding@qq.com
 * @LastEditTime: 2025-07-19 15:07:38
 * @FilePath: /easy-erp-web/next.config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 环境变量配置
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://erp.samuelcn.com',
  },

  // 启用React.StrictMode
  reactStrictMode: true,

  // 构建优化
  compiler: {
    // 在生产环境移除 console
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 优化构建输出
  output: 'standalone',

  // 启用压缩
  swcMinify: true,

  // Webpack配置
  webpack: (config, { isServer }) => {
    // 恢复正常的代码分割策略
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            // 恢复正常的chunk大小限制
            maxSize: 500000,
          },
        },
      },
    };

    // 只在客户端构建时排除Node.js专用模块
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        url: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
