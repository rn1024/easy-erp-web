import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const purchaseOrderId = 'cmd6q8r33007bzet2oovfpc7q';

    const shareLinks = await prisma.supplyShareLink.findMany({
      where: { purchaseOrderId },
      orderBy: { createdAt: 'desc' },
    });

    const result = shareLinks.map((link) => ({
      shareCode: link.shareCode,
      extractCode: link.extractCode,
      status: link.status,
      accessLimit: link.accessLimit,
      uniqueUserCount: link.uniqueUserCount,
      accessCount: link.accessCount,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
      isExpired: link.expiresAt < new Date(),
      reachedLimit: link.accessLimit && link.uniqueUserCount >= link.accessLimit,
    }));

    return NextResponse.json({
      success: true,
      totalShares: result.length,
      shares: result,
      analysis: {
        activeShares: result.filter((s) => s.status === 'active' && !s.isExpired).length,
        reachedLimitShares: result.filter((s) => s.reachedLimit).length,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
