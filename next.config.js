/** @type {import('next').NextConfig} */
const nextConfig = {
  // 环境变量配置
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://erp.samuelcn.com',
  },

  // 在开发环境中禁用 React.StrictMode 以避免双重渲染导致的重复请求
  reactStrictMode: process.env.NODE_ENV === 'production',

  // 内存优化配置
  experimental: {
    // 禁用 worker threads 以减少内存使用
    workerThreads: false,
    // 限制并发处理
    cpus: 1,
  },

  // 构建优化
  compiler: {
    // 在生产环境移除 console
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 优化构建输出
  output: 'standalone',

  // 减少打包体积
  swcMinify: true,

  // Webpack配置
  webpack: (config, { isServer }) => {
    // 内存优化
    config.optimization = {
      ...config.optimization,
      // 减少内存使用
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            maxSize: 244000, // 限制chunk大小
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
