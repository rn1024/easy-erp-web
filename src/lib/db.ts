import { PrismaClient } from '../../generated/prisma';

// 扩展全局类型定义以支持Prisma实例
declare global {
  var prisma: PrismaClient | undefined;
}

// 创建Prisma客户端实例
const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// 在开发环境中复用实例，避免热重载时创建多个连接
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// 优雅关闭数据库连接
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };
