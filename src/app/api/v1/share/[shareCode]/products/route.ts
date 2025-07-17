import { NextRequest, NextResponse } from 'next/server';
import { SupplyShareManager } from '@/lib/supply-share';
import { SupplyQuantityValidator } from '@/lib/supply-validator';
import { ApiResponseHelper } from '@/lib/middleware';

// 获取供应商可选的产品列表（公开API，通过分享码访问）
export async function GET(request: NextRequest, { params }: { params: { shareCode: string } }) {
  try {
    const shareCode = params.shareCode;
    const url = new URL(request.url);
    const extractCode = url.searchParams.get('extractCode');

    // 验证分享链接权限
    const verifyResult = await SupplyShareManager.verifyShareAccess(
      shareCode,
      extractCode || undefined
    );

    if (!verifyResult.success) {
      return ApiResponseHelper.error(verifyResult.message || '访问被拒绝');
    }

    const purchaseOrderId = verifyResult.purchaseOrderId!;

    // 获取实时可选产品列表
    const availableProducts =
      await SupplyQuantityValidator.getAvailableProductsList(purchaseOrderId);

    return ApiResponseHelper.success({
      products: availableProducts,
      totalCount: availableProducts.length,
      message: '获取可选产品列表成功',
    });
  } catch (error) {
    console.error('Get available products error:', error);
    return ApiResponseHelper.serverError('获取可选产品列表失败');
  }
}
