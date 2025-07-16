import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('🔐 正在重置admin密码...');

    // 新密码
    const newPassword = '123456';

    // 加密密码
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 查找admin用户
    const adminUser = await prisma.account.findFirst({
      where: { name: 'admin' },
    });

    if (!adminUser) {
      console.log('❌ 未找到admin用户');
      return;
    }

    console.log(`📋 找到admin用户: ${adminUser.name} (ID: ${adminUser.id})`);

    // 更新密码
    await prisma.account.update({
      where: { id: adminUser.id },
      data: {
        password: hashedPassword,
        status: 'ACTIVE', // 确保账户是激活状态
      },
    });

    console.log('✅ admin密码重置成功!');
    console.log('📋 登录信息:');
    console.log('   用户名: admin');
    console.log('   密码: 123456');
    console.log('   状态: 激活');
  } catch (error) {
    console.error('❌ 密码重置失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行重置
resetAdminPassword();
