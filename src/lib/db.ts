import { PrismaClient } from '../../generated/prisma';

// 扩展全局类型定义以支持Prisma实例
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// 获取数据库 URL，如果未设置则使用默认值（用于构建时）
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;

  // 如果没有 DATABASE_URL，使用一个占位符URL，这样 Prisma 可以正常实例化
  if (!url) {
    // 在构建时或测试时使用占位符
    return 'mysql://build:build@localhost:3306/build_placeholder';
  }

  return url;
};

// 创建Prisma客户端实例
const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });
};

// 创建Prisma客户端实例
const prisma = globalThis.prisma || createPrismaClient();

// 在开发环境中复用实例，避免热重载时创建多个连接
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// 优雅关闭数据库连接
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };
