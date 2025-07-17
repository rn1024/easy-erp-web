import { PrismaClient } from './generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixAdminPassword() {
  try {
    console.log('🔧 修复admin用户密码...');

    // 新密码：123456
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 查找admin用户
    let adminUser = await prisma.account.findFirst({
      where: { name: 'admin' },
    });

    if (!adminUser) {
      console.log('❌ 未找到admin用户，创建新用户...');
      adminUser = await prisma.account.create({
        data: {
          name: 'admin',
          password: hashedPassword,
          status: 'ACTIVE',
          operator: 'system',
        },
      });
      console.log('✅ 创建admin用户成功');
    } else {
      console.log('✅ 找到admin用户，更新密码...');
      await prisma.account.update({
        where: { id: adminUser.id },
        data: {
          password: hashedPassword,
          status: 'ACTIVE',
        },
      });
      console.log('✅ 更新admin密码成功');
    }

    // 验证密码
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log(`✅ 密码验证: ${isValid ? '成功' : '失败'}`);

    console.log('\n🎉 修复完成！');
    console.log('👤 用户名: admin');
    console.log('🔑 密码: 123456');
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();
