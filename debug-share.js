import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkShareCode() {
  try {
    const shareCode = 'cZz5Qr6aZaybuEKU';

    console.log('查询分享码:', shareCode);

    const shareLink = await prisma.supplyShareLink.findUnique({
      where: { shareCode },
    });

    if (!shareLink) {
      console.log('❌ 分享链接不存在');
      return;
    }

    console.log('✅ 分享链接信息:');
    console.log('ID:', shareLink.id);
    console.log('提取码:', shareLink.extractCode);
    console.log('状态:', shareLink.status);
    console.log('过期时间:', shareLink.expiresAt);
    console.log('访问限制:', shareLink.accessLimit);
    console.log('访问次数:', shareLink.accessCount);
    console.log('唯一用户数:', shareLink.uniqueUserCount);
    console.log('创建时间:', shareLink.createdAt);

    // 检查是否过期
    const now = new Date();
    const isExpired = shareLink.expiresAt < now;
    console.log('当前时间:', now);
    console.log('是否过期:', isExpired ? '是' : '否');

    // 检查访问记录
    const accessRecords = await prisma.supplyShareAccess.findMany({
      where: { shareCode },
      orderBy: { firstAccessAt: 'desc' },
    });

    console.log('\n访问记录数量:', accessRecords.length);
    accessRecords.forEach((record, index) => {
      console.log(`访问记录 ${index + 1}:`);
      console.log('  用户指纹:', record.userFingerprint);
      console.log('  IP地址:', record.ipAddress);
      console.log('  首次访问:', record.firstAccessAt);
      console.log('  访问次数:', record.accessCount);
    });
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkShareCode();
