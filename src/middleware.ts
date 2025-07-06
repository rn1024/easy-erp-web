import { NextRequest, NextResponse } from 'next/server';

// 安全响应头
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// 获取客户端IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return request.ip || 'unknown';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 创建响应
  const response = NextResponse.next();

  // 添加安全响应头
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // 生产环境强制HTTPS (在反向代理环境中由nginx处理)
  if (process.env.NODE_ENV === 'production' && !request.url.startsWith('https://')) {
    // 检查是否通过反向代理访问
    const xForwardedProto = request.headers.get('x-forwarded-proto');
    const xForwardedHost = request.headers.get('x-forwarded-host');

    // 如果没有反向代理头，则进行重定向
    if (!xForwardedProto && !xForwardedHost) {
      const host = request.headers.get('host') || 'localhost';
      return NextResponse.redirect(`https://${host}${pathname}`, 301);
    }
  }

  // 记录访问日志（仅在开发环境）
  if (process.env.NODE_ENV === 'development') {
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    // eslint-disable-next-line no-console
    console.log(
      `[${new Date().toISOString()}] ${request.method} ${pathname} - IP: ${ip} - UA: ${userAgent.substring(0, 100)}`
    );
  }

  return response;
}

// 配置中间件匹配路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了：
     * - api/health (健康检查)
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - 静态资源文件
     */
    '/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
