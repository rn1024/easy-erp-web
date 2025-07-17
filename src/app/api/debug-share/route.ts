import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const shareCode = 'cZz5Qr6aZaybuEKU';

    console.log('查询分享码:', shareCode);

    const shareLink = await prisma.supplyShareLink.findUnique({
      where: { shareCode },
    });

    if (!shareLink) {
      return NextResponse.json({
        success: false,
        message: '分享链接不存在',
      });
    }

    // 检查是否过期
    const now = new Date();
    const isExpired = shareLink.expiresAt < now;

    // 检查访问记录
    const accessRecords = await prisma.supplyShareAccess.findMany({
      where: { shareCode },
      orderBy: { firstAccessAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      shareLink: {
        id: shareLink.id,
        shareCode: shareLink.shareCode,
        extractCode: shareLink.extractCode,
        status: shareLink.status,
        expiresAt: shareLink.expiresAt,
        accessLimit: shareLink.accessLimit,
        accessCount: shareLink.accessCount,
        uniqueUserCount: shareLink.uniqueUserCount,
        createdAt: shareLink.createdAt,
        isExpired,
        currentTime: now,
      },
      accessRecords: accessRecords.map((record) => ({
        id: record.id,
        userFingerprint: record.userFingerprint,
        ipAddress: record.ipAddress,
        userAgent: record.userAgent,
        firstAccessAt: record.firstAccessAt,
        lastAccessAt: record.lastAccessAt,
        accessCount: record.accessCount,
      })),
      analysis: {
        linkExists: true,
        status: shareLink.status,
        isExpired,
        extractCodeMatch: shareLink.extractCode === 'zGeC',
        accessLimitReached:
          shareLink.accessLimit && shareLink.uniqueUserCount >= shareLink.accessLimit,
        totalUniqueUsers: shareLink.uniqueUserCount,
        accessLimit: shareLink.accessLimit,
      },
    });
  } catch (error) {
    console.error('查询失败:', error);
    return NextResponse.json({
      success: false,
      message: '查询失败',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
