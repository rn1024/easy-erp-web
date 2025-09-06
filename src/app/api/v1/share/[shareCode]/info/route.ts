import { NextRequest, NextResponse } from 'next/server';
import { SupplyShareManager } from '@/lib/supply-share';
import { SupplyQuantityValidator } from '@/lib/supply-validator';
import { ApiResponseHelper } from '@/lib/middleware';
import { prisma } from '@/lib/db';

// 获取采购订单信息（公开API，通过分享码访问）
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

    // 获取采购订单详情
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        shop: {
          select: {
            nickname: true,
            responsiblePerson: true,
          },
        },
        supplier: {
          select: {
            nickname: true,
            contactPerson: true,
            contactPhone: true,
          },
        },
      },
    });

    if (!purchaseOrder) {
      return ApiResponseHelper.notFound('采购订单不存在');
    }

    // 获取采购订单产品清单
    const purchaseItems = await prisma.productItem.findMany({
      where: {
        relatedType: 'PURCHASE_ORDER',
        relatedId: purchaseOrderId,
      },
      include: {
        product: {
          include: {
            images: {
              orderBy: {
                sortOrder: 'asc',
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 获取供货统计信息
    const statistics = await SupplyQuantityValidator.getSupplyStatistics(purchaseOrderId);

    // 计算每个产品的可供货数量
    const availableProducts = await Promise.all(
      purchaseItems.map(async (item) => {
        const availableQuantity = await SupplyQuantityValidator.getAvailableQuantity(
          purchaseOrderId,
          item.productId
        );

        const suppliedQuantity =
          statistics.productStatuses.find((p) => p.productId === item.productId)
            ?.suppliedQuantity || 0;

        return {
          id: item.id,
          product: item.product,
          purchaseQuantity: item.quantity,
          suppliedQuantity,
          availableQuantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          remark: item.remark,
        };
      })
    );

    // 组装响应数据（脱敏处理）
    const orderInfo = {
      id: purchaseOrder.id,
      orderNumber: purchaseOrder.orderNumber,
      totalAmount: purchaseOrder.totalAmount,
      finalAmount: purchaseOrder.finalAmount,
      status: purchaseOrder.status,
      urgent: purchaseOrder.urgent,
      remark: purchaseOrder.remark,
      createdAt: purchaseOrder.createdAt,
      // 店铺信息（部分脱敏）
      shop: {
        name: purchaseOrder.shop.nickname,
        responsiblePerson: purchaseOrder.shop.responsiblePerson,
      },
      // 供应商信息
      supplier: {
        name: purchaseOrder.supplier.nickname,
        contactPerson: purchaseOrder.supplier.contactPerson,
        contactPhone: purchaseOrder.supplier.contactPhone,
      },
    };

    return ApiResponseHelper.success({
      orderInfo,
      products: availableProducts,
      statistics: {
        totalProducts: availableProducts.length,
        totalSupplyRecords: statistics.totalRecords,
        activeSupplyRecords: statistics.activeRecords,
        totalSupplyAmount: statistics.totalAmount,
      },
      shareInfo: verifyResult.shareInfo,
    });
  } catch (error) {
    console.error('Get purchase order info error:', error);
    return ApiResponseHelper.serverError('获取采购订单信息失败');
  }
}
