import { NextRequest, NextResponse } from 'next/server';
import { SupplyShareManager } from '@/lib/supply-share';
import { ApiResponseHelper } from '@/lib/middleware';

// 验证分享链接和提取码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shareCode, extractCode } = body;

    if (!shareCode) {
      return ApiResponseHelper.validationError({}, '请提供分享码');
    }

    // 获取用户IP和UserAgent
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.ip ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // 验证分享链接
    const verifyResult = await SupplyShareManager.verifyShareAccess(
      shareCode,
      extractCode,
      ipAddress,
      userAgent
    );

    if (!verifyResult.success) {
      return ApiResponseHelper.error(verifyResult.message || '验证失败');
    }

    return ApiResponseHelper.success({
      message: '验证成功',
      shareInfo: verifyResult.shareInfo,
      purchaseOrderId: verifyResult.purchaseOrderId,
      userToken: verifyResult.userToken, // 返回用户token
    });
  } catch (error) {
    console.error('Verify share link error:', error);
    return ApiResponseHelper.serverError('验证分享链接失败');
  }
}
