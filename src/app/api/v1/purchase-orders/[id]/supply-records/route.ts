import { NextRequest, NextResponse } from 'next/server';
import { withAuth, ApiResponseHelper } from '@/lib/middleware';
import { SupplyQuantityValidator } from '@/lib/supply-validator';
import { prisma } from '@/lib/db';

// 获取采购订单的供货记录列表和统计
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const purchaseOrderId = pathParts[pathParts.length - 2]; // [id]在supply-records前一个位置

    // 验证采购订单是否存在
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
    });

    if (!purchaseOrder) {
      return ApiResponseHelper.notFound('采购订单不存在');
    }

    // 获取供货统计信息
    const statistics = await SupplyQuantityValidator.getSupplyStatistics(purchaseOrderId);

    // 获取供货记录列表
    const supplyRecords = await prisma.supplyRecord.findMany({
      where: { purchaseOrderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                specification: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 格式化供货记录数据
    const formattedRecords = supplyRecords.map((record) => ({
      id: record.id,
      status: record.status,
      supplierInfo: record.supplierInfo,
      totalAmount: record.totalAmount,
      itemCount: record.items.length,
      items: record.items.map((item) => ({
        id: item.id,
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        remark: item.remark,
      })),
      remark: record.remark,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));

    return ApiResponseHelper.success({
      statistics,
      records: formattedRecords,
      orderInfo: {
        id: purchaseOrder.id,
        orderNumber: purchaseOrder.orderNumber,
        totalAmount: purchaseOrder.totalAmount,
        status: purchaseOrder.status,
      },
    });
  } catch (error) {
    console.error('Get supply records error:', error);
    return ApiResponseHelper.serverError('获取供货记录失败');
  }
});
