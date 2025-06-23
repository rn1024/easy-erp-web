const { PrismaClient } = require('../generated/prisma');

async function checkDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 检查数据库连接...');
    await prisma.$connect();
    console.log('✅ 数据库连接成功！');

    // 检查是否有表
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
    `;

    console.log(`📊 数据库中共有 ${tableCount[0].count} 个表`);

    // 检查是否有管理员账户
    try {
      const adminCount = await prisma.account.count({
        where: { name: 'admin' },
      });
      console.log(`👤 管理员账户: ${adminCount > 0 ? '已创建' : '未创建'}`);
    } catch (error) {
      console.log('⚠️  账户表尚未创建');
    }
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.log('\n📝 请检查以下配置:');
    console.log('1. MySQL服务是否启动');
    console.log('2. 数据库用户名和密码是否正确');
    console.log('3. 数据库名称是否存在');
    console.log('4. .env.local文件中的DATABASE_URL配置');
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
