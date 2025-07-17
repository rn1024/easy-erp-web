import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function fixShareLink() {
  try {
    const shareCode = 'cZz5Qr6aZaybuEKU';
    const correctExtractCode = 'zGeC';

    console.log('🔍 开始修复分享码:', shareCode);

    // 1. 查找当前分享链接状态
    const shareLink = await prisma.supplyShareLink.findUnique({
      where: { shareCode },
    });

    if (!shareLink) {
      console.log('❌ 分享链接不存在');
      return;
    }

    console.log('📊 当前状态:');
    console.log('- 提取码:', shareLink.extractCode);
    console.log('- 状态:', shareLink.status);
    console.log('- 访问限制:', shareLink.accessLimit);
    console.log('- 唯一用户数:', shareLink.uniqueUserCount);
    console.log('- 过期时间:', shareLink.expiresAt);
    console.log('- 创建时间:', shareLink.createdAt);

    // 2. 分析问题
    const issues = [];
    if (shareLink.extractCode !== correctExtractCode) {
      issues.push(`提取码错误: 当前是"${shareLink.extractCode}", 应该是"${correctExtractCode}"`);
    }
    if (shareLink.status !== 'active') {
      issues.push(`状态错误: 当前是"${shareLink.status}", 应该是"active"`);
    }
    if (shareLink.accessLimit && shareLink.uniqueUserCount >= shareLink.accessLimit) {
      issues.push(`访问人数达到限制: ${shareLink.uniqueUserCount}/${shareLink.accessLimit}`);
    }

    const now = new Date();
    if (shareLink.expiresAt < now) {
      issues.push(`链接已过期: ${shareLink.expiresAt} < ${now}`);
    }

    if (issues.length === 0) {
      console.log('✅ 分享链接状态正常，无需修复');
      return;
    }

    console.log('🚨 发现问题:');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });

    // 3. 执行修复
    console.log('\n🔧 开始修复...');

    const updateData: any = {};

    // 修复提取码
    if (shareLink.extractCode !== correctExtractCode) {
      updateData.extractCode = correctExtractCode;
      console.log(`✅ 提取码: "${shareLink.extractCode}" → "${correctExtractCode}"`);
    }

    // 修复状态
    if (shareLink.status !== 'active') {
      updateData.status = 'active';
      console.log(`✅ 状态: "${shareLink.status}" → "active"`);
    }

    // 重置访问计数
    updateData.uniqueUserCount = 0;
    updateData.accessCount = 0;
    console.log(`✅ 重置访问计数: ${shareLink.uniqueUserCount} → 0`);

    // 增加访问限制
    if (!shareLink.accessLimit || shareLink.accessLimit < 20) {
      updateData.accessLimit = 20;
      console.log(`✅ 访问限制: ${shareLink.accessLimit} → 20`);
    }

    // 延长过期时间
    const hoursUntilExpiry = (shareLink.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilExpiry < 48) {
      const newExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30天后
      updateData.expiresAt = newExpiresAt;
      console.log(
        `✅ 过期时间: ${shareLink.expiresAt.toLocaleString()} → ${newExpiresAt.toLocaleString()}`
      );
    }

    // 执行更新
    await prisma.supplyShareLink.update({
      where: { shareCode },
      data: updateData,
    });

    // 清除访问记录
    const deleteResult = await prisma.supplyShareAccess.deleteMany({
      where: { shareCode },
    });
    console.log(`✅ 清除访问记录: ${deleteResult.count} 条`);

    // 4. 验证修复结果
    const updatedShareLink = await prisma.supplyShareLink.findUnique({
      where: { shareCode },
    });

    console.log('\n🎉 修复完成！新状态:');
    console.log('- 提取码:', updatedShareLink?.extractCode);
    console.log('- 状态:', updatedShareLink?.status);
    console.log('- 访问限制:', updatedShareLink?.accessLimit);
    console.log('- 唯一用户数:', updatedShareLink?.uniqueUserCount);
    console.log('- 过期时间:', updatedShareLink?.expiresAt);

    // 5. 测试验证逻辑
    console.log('\n🧪 测试验证...');

    // 模拟验证过程
    if (updatedShareLink) {
      const testResult = {
        extractCodeMatch: updatedShareLink.extractCode === correctExtractCode,
        statusActive: updatedShareLink.status === 'active',
        notExpired: updatedShareLink.expiresAt > now,
        accessAllowed:
          !updatedShareLink.accessLimit ||
          updatedShareLink.uniqueUserCount < updatedShareLink.accessLimit,
      };

      console.log('验证结果:');
      console.log('- 提取码匹配:', testResult.extractCodeMatch ? '✅' : '❌');
      console.log('- 状态激活:', testResult.statusActive ? '✅' : '❌');
      console.log('- 未过期:', testResult.notExpired ? '✅' : '❌');
      console.log('- 允许访问:', testResult.accessAllowed ? '✅' : '❌');

      const allPassed = Object.values(testResult).every((v) => v === true);
      console.log('总体结果:', allPassed ? '✅ 通过' : '❌ 失败');
    }
  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行修复
fixShareLink();
