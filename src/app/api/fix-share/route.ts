import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const shareCode = 'cZz5Qr6aZaybuEKU';
    const correctExtractCode = 'zGeC';

    console.log('修复分享码:', shareCode);

    // 查找分享链接
    const shareLink = await prisma.supplyShareLink.findUnique({
      where: { shareCode },
    });

    if (!shareLink) {
      return NextResponse.json({
        success: false,
        message: '分享链接不存在',
      });
    }

    console.log('当前分享链接状态:', {
      extractCode: shareLink.extractCode,
      status: shareLink.status,
      accessLimit: shareLink.accessLimit,
      uniqueUserCount: shareLink.uniqueUserCount,
      expiresAt: shareLink.expiresAt,
    });

    // 修复操作
    const fixes = [];
    const updateData: any = {};

    // 1. 修复提取码
    if (shareLink.extractCode !== correctExtractCode) {
      updateData.extractCode = correctExtractCode;
      fixes.push(`提取码从 "${shareLink.extractCode}" 修复为 "${correctExtractCode}"`);
    }

    // 2. 修复状态
    if (shareLink.status !== 'active') {
      updateData.status = 'active';
      fixes.push(`状态从 "${shareLink.status}" 修复为 "active"`);
    }

    // 3. 重置访问人数（如果有问题）
    if (shareLink.uniqueUserCount > 0) {
      updateData.uniqueUserCount = 0;
      updateData.accessCount = 0;
      fixes.push(`重置访问人数从 ${shareLink.uniqueUserCount} 为 0`);
    }

    // 4. 增加访问限制（确保足够）
    if (!shareLink.accessLimit || shareLink.accessLimit < 10) {
      updateData.accessLimit = 10;
      fixes.push(`访问限制从 ${shareLink.accessLimit} 增加为 10`);
    }

    // 5. 延长过期时间（如果快过期）
    const now = new Date();
    const hoursUntilExpiry = (shareLink.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilExpiry < 24) {
      const newExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天后
      updateData.expiresAt = newExpiresAt;
      fixes.push(
        `过期时间从 ${shareLink.expiresAt.toISOString()} 延长到 ${newExpiresAt.toISOString()}`
      );
    }

    // 执行修复
    if (Object.keys(updateData).length > 0) {
      await prisma.supplyShareLink.update({
        where: { shareCode },
        data: updateData,
      });

      // 清除相关的访问记录（重新开始计数）
      await prisma.supplyShareAccess.deleteMany({
        where: { shareCode },
      });

      fixes.push('清除了所有访问记录，重新开始计数');
    }

    // 获取修复后的状态
    const updatedShareLink = await prisma.supplyShareLink.findUnique({
      where: { shareCode },
    });

    return NextResponse.json({
      success: true,
      message: '分享链接修复完成',
      fixes,
      before: {
        extractCode: shareLink.extractCode,
        status: shareLink.status,
        accessLimit: shareLink.accessLimit,
        uniqueUserCount: shareLink.uniqueUserCount,
        expiresAt: shareLink.expiresAt,
      },
      after: {
        extractCode: updatedShareLink?.extractCode,
        status: updatedShareLink?.status,
        accessLimit: updatedShareLink?.accessLimit,
        uniqueUserCount: updatedShareLink?.uniqueUserCount,
        expiresAt: updatedShareLink?.expiresAt,
      },
    });
  } catch (error) {
    console.error('修复失败:', error);
    return NextResponse.json({
      success: false,
      message: '修复失败',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
