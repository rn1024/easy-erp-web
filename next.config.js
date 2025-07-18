/** @type {import('next').NextConfig} */
const nextConfig = {
  // 环境变量配置
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://erp.samuelcn.com',
  },

  // 在开发环境中禁用 React.StrictMode 以避免双重渲染导致的重复请求
  reactStrictMode: process.env.NODE_ENV === 'production',

  // Webpack配置
  webpack: (config, { isServer }) => {
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
