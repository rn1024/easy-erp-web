#!/usr/bin/env node

const Redis = require('redis');
require('dotenv').config();

// 动态导入 PrismaClient，避免在客户端未生成时出错
let PrismaClient;
try {
  PrismaClient = require('@prisma/client').PrismaClient;
} catch (error) {
  console.log('⚠️  Prisma客户端未生成，跳过数据库检查');
  PrismaClient = null;
}

async function checkConnections() {
  console.log('🔍 开始检查服务连接...\n');

  let allConnected = true;

  // 检查MySQL连接
  console.log('📊 检查MySQL连接...');
  if (PrismaClient) {
    try {
      const prisma = new PrismaClient();
      await prisma.$connect();
      console.log('✅ MySQL连接成功');

      // 执行简单查询验证
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ MySQL查询测试成功');

      await prisma.$disconnect();
    } catch (error) {
      console.error('❌ MySQL连接失败:', error.message);
      allConnected = false;
    }
  } else {
    console.log('⚠️  跳过MySQL检查（Prisma客户端未生成）');
  }

  console.log('');

  // 检查Redis连接
  console.log('📊 检查Redis连接...');
  try {
    let redisClient;

    if (process.env.REDIS_URL) {
      redisClient = Redis.createClient({
        url: process.env.REDIS_URL,
      });
    } else {
      redisClient = Redis.createClient();
    }

    await redisClient.connect();

    // 执行PING测试
    const pong = await redisClient.ping();
    if (pong === 'PONG') {
      console.log('✅ Redis连接成功');
    } else {
      console.log('❌ Redis PING测试失败');
      allConnected = false;
    }

    await redisClient.disconnect();
  } catch (error) {
    console.error('❌ Redis连接失败:', error.message);
    allConnected = false;
  }

  console.log('');

  // 输出总结
  if (allConnected) {
    console.log('🎉 所有服务连接正常！');
    process.exit(0);
  } else {
    console.log('⚠️  部分服务连接失败，请检查配置');
    process.exit(1);
  }
}

// 运行检查
checkConnections().catch((error) => {
  console.error('💥 连接检查脚本出错:', error);
  process.exit(1);
});
