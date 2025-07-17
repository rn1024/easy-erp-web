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

    // 验证分享链接
    const verifyResult = await SupplyShareManager.verifyShareAccess(shareCode, extractCode);

    if (!verifyResult.success) {
      return ApiResponseHelper.error(verifyResult.message || '验证失败');
    }

    return ApiResponseHelper.success({
      message: '验证成功',
      shareInfo: verifyResult.shareInfo,
      purchaseOrderId: verifyResult.purchaseOrderId,
    });
  } catch (error) {
    console.error('Verify share link error:', error);
    return ApiResponseHelper.serverError('验证分享链接失败');
  }
}
