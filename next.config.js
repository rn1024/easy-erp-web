/** @type {import('next').NextConfig} */
const nextConfig = {
  // 构建时暂时忽略ESLint错误
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 暂时忽略TypeScript错误
  typescript: {
    ignoreBuildErrors: true,
  },
  // Webpack配置
  webpack: (config, { isServer }) => {
    // 只在客户端构建时排除这些Node.js专用模块
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
        // 排除urllib和相关依赖
        urllib: false,
        'proxy-agent': false,
      };

      // 排除服务器端模块不被打包到客户端
      config.externals = config.externals || [];
      config.externals.push({
        'ali-oss': 'ali-oss',
        urllib: 'urllib',
        'proxy-agent': 'proxy-agent',
      });
    }

    return config;
  },
};

module.exports = nextConfig;
