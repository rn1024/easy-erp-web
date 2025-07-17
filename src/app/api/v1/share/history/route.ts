import { NextRequest, NextResponse } from 'next/server';
import { SupplyShareManager } from '@/lib/supply-share';
import { withAuth, ApiResponseHelper } from '@/lib/middleware';

// 获取所有分享历史
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const purchaseOrderId = url.searchParams.get('purchaseOrderId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

    // 获取分享历史列表
    const allHistory = await SupplyShareManager.getShareHistory();

    // 根据采购订单ID过滤
    let filteredHistory = allHistory;
    if (purchaseOrderId) {
      filteredHistory = allHistory.filter((item) => item.purchaseOrderId === purchaseOrderId);
    }

    // 分页处理
    const total = filteredHistory.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

    return ApiResponseHelper.success({
      shareHistory: paginatedHistory,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get share history error:', error);
    return ApiResponseHelper.serverError('获取分享历史失败');
  }
});

// 获取分享链接详细统计
export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { shareCode } = body;

    if (!shareCode) {
      return ApiResponseHelper.validationError({}, '请提供分享码');
    }

    // 获取访问统计
    const statistics = await SupplyShareManager.getAccessStatistics(shareCode);

    return ApiResponseHelper.success({
      shareCode,
      statistics,
    });
  } catch (error) {
    console.error('Get share statistics error:', error);
    return ApiResponseHelper.serverError('获取分享统计失败');
  }
});
