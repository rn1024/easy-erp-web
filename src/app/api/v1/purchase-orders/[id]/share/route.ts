import { NextRequest, NextResponse } from 'next/server';
import { SupplyShareManager, ShareConfig } from '@/lib/supply-share';
import { prisma } from '@/lib/db';
import { withAuth, ApiResponseHelper } from '@/lib/middleware';

// 获取分享链接信息
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const purchaseOrderId = pathParts[pathParts.length - 2]; // [id]在share前一个位置

    // 检查是否查询分享历史
    const action = url.searchParams.get('action');

    if (action === 'history') {
      // 返回分享历史列表
      const shareHistory = await SupplyShareManager.getShareHistory();
      return ApiResponseHelper.success({
        shareHistory: shareHistory.filter(
          (item) => !purchaseOrderId || item.purchaseOrderId === purchaseOrderId
        ),
        totalCount: shareHistory.length,
      });
    }

    // 验证采购订单是否存在
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
    });

    if (!purchaseOrder) {
      return ApiResponseHelper.notFound('采购订单不存在');
    }

    // 获取最新的有效分享链接信息
    const shareInfo = await SupplyShareManager.getShareInfo(purchaseOrderId);

    return ApiResponseHelper.success({
      shareInfo,
      orderNumber: purchaseOrder.orderNumber,
      hasActiveShare: !!shareInfo,
    });
  } catch (error) {
    console.error('Get share link error:', error);
    return ApiResponseHelper.serverError('获取分享信息失败');
  }
});

// 创建分享链接
export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const purchaseOrderId = pathParts[pathParts.length - 2];

    const body = await request.json();

    // 验证请求参数
    const { expiresIn = 7 * 24, extractCode, accessLimit } = body; // 默认7天有效期

    if (expiresIn <= 0 || expiresIn > 365 * 24) {
      return ApiResponseHelper.validationError({}, '有效期必须在1小时到365天之间');
    }

    // 验证采购订单是否存在
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
    });

    if (!purchaseOrder) {
      return ApiResponseHelper.notFound('采购订单不存在');
    }

    // 创建分享配置
    const shareConfig: ShareConfig = {
      expiresIn,
      extractCode,
      accessLimit,
    };

    // 生成新的分享链接（每次都创建新的）
    const shareInfo = await SupplyShareManager.generateShareLink(purchaseOrderId, shareConfig);

    // 生成分享文案
    const shareText = SupplyShareManager.generateShareText(shareInfo, purchaseOrder.orderNumber);

    return ApiResponseHelper.success({
      shareInfo,
      shareText,
      orderNumber: purchaseOrder.orderNumber,
      message: '分享链接创建成功',
    });
  } catch (error) {
    console.error('Create share link error:', error);
    return ApiResponseHelper.serverError('创建分享链接失败');
  }
});

// 更新分享链接设置
export const PUT = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const purchaseOrderId = pathParts[pathParts.length - 2];

    const body = await request.json();
    const { expiresIn, extractCode, accessLimit } = body;

    if (expiresIn && (expiresIn <= 0 || expiresIn > 365 * 24)) {
      return ApiResponseHelper.validationError({}, '有效期必须在1小时到365天之间');
    }

    // 检查是否有现有的分享链接
    const existingShare = await SupplyShareManager.getShareInfo(purchaseOrderId);
    if (!existingShare) {
      return ApiResponseHelper.notFound('分享链接不存在，请先创建分享链接');
    }

    // 创建新的分享配置（更新实际上是创建新的分享链接）
    const shareConfig: ShareConfig = {
      expiresIn: expiresIn || 7 * 24,
      extractCode: extractCode !== undefined ? extractCode : undefined,
      accessLimit: accessLimit !== undefined ? accessLimit : undefined,
    };

    // 禁用旧的分享链接
    await SupplyShareManager.disableShareLink(purchaseOrderId);

    // 生成新的分享链接
    const shareInfo = await SupplyShareManager.generateShareLink(purchaseOrderId, shareConfig);

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
    });

    const shareText = SupplyShareManager.generateShareText(
      shareInfo,
      purchaseOrder?.orderNumber || ''
    );

    return ApiResponseHelper.success({
      shareInfo,
      shareText,
      orderNumber: purchaseOrder?.orderNumber,
      message: '分享链接更新成功',
    });
  } catch (error) {
    console.error('Update share link error:', error);
    return ApiResponseHelper.serverError('更新分享链接失败');
  }
});

// 删除/禁用分享链接
export const DELETE = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const purchaseOrderId = pathParts[pathParts.length - 2];

    // 禁用分享链接
    const success = await SupplyShareManager.disableShareLink(purchaseOrderId);

    if (!success) {
      return ApiResponseHelper.notFound('分享链接不存在或已被禁用');
    }

    return ApiResponseHelper.success({ message: '分享链接已禁用' });
  } catch (error) {
    console.error('Delete share link error:', error);
    return ApiResponseHelper.serverError('禁用分享链接失败');
  }
});
