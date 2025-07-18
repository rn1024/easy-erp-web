/** @type {import('next').NextConfig} */
const nextConfig = {
  // 环境变量配置
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://erp.samuelcn.com',
  },

  // 启用React.StrictMode
  reactStrictMode: true,

  // 恢复正常的实验性功能
  experimental: {
    // 启用 worker threads 以提高构建性能
    workerThreads: true,
  },

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
