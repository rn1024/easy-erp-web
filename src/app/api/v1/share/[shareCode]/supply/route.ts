import { NextRequest, NextResponse } from 'next/server';
import { SupplyShareManager } from '@/lib/supply-share';
import { SupplyQuantityValidator } from '@/lib/supply-validator';
import { ApiResponseHelper } from '@/lib/middleware';
import { prisma } from '@/lib/db';

// 创建供货记录（公开API，通过分享码访问）
export async function POST(request: NextRequest, { params }: { params: { shareCode: string } }) {
  try {
    const shareCode = params.shareCode;
    const body = await request.json();

    const { items, totalAmount, remark, extractCode } = body;

    // 验证分享链接权限
    const verifyResult = await SupplyShareManager.verifyShareAccess(shareCode, extractCode);
    if (!verifyResult.success) {
      return ApiResponseHelper.error(verifyResult.message || '访问被拒绝');
    }

    const purchaseOrderId = verifyResult.purchaseOrderId!;

    // 验证必需参数
    if (!items || !Array.isArray(items) || items.length === 0) {
      return ApiResponseHelper.validationError({}, '请提供完整的供货信息');
    }

    // 验证供货明细
    const validItems = items.filter((item: any) => item.quantity > 0);
    if (validItems.length === 0) {
      return ApiResponseHelper.validationError({}, '请至少填写一个产品的供货数量');
    }

    // 实时验证数量是否超限（并发控制）
    const validationResult = await SupplyQuantityValidator.validateSupplyQuantityRealtime(
      purchaseOrderId,
      validItems
    );

    if (!validationResult.valid) {
      // 获取最新的可选产品列表
      const availableProducts =
        await SupplyQuantityValidator.getAvailableProductsList(purchaseOrderId);

      return ApiResponseHelper.validationError(
        {
          errors: validationResult.errors,
          availableProducts: availableProducts,
          needRefresh: true,
        },
        validationResult.message || '供货数量验证失败'
      );
    }

    // 验证采购订单是否存在并获取供应商信息
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
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

    // 开始事务创建供货记录
    const result = await prisma.$transaction(async (tx) => {
      // 创建供货记录主记录（不存储supplierInfo，通过purchaseOrderId关联）
      const supplyRecord = await tx.supplyRecord.create({
        data: {
          purchaseOrderId,
          shareCode,
          supplierInfo: {}, // 空对象，通过purchaseOrderId关联获取供应商信息
          totalAmount: Number(totalAmount) || 0,
          remark: remark || null,
          status: 'active',
        },
      });

      // 创建供货记录明细
      const supplyRecordItems = await Promise.all(
        validItems.map((item: any) =>
          tx.supplyRecordItem.create({
            data: {
              supplyRecordId: supplyRecord.id,
              productId: item.productId,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice) || 0,
              totalPrice: Number(item.totalPrice) || 0,
              remark: item.remark || null,
            },
          })
        )
      );

      return {
        supplyRecord,
        items: supplyRecordItems,
      };
    });

    // 记录操作日志
    await prisma.log.create({
      data: {
        category: 'SUPPLY_RECORD',
        module: '供货管理',
        operation: '创建供货记录',
        operatorAccountId: null, // 系统操作，明确设置为null
        status: 'SUCCESS',
        details: {
          purchaseOrderId,
          shareCode,
          supplierInfo: purchaseOrder.supplier?.nickname || '未知供应商',
          recordId: result.supplyRecord.id,
          itemCount: validItems.length,
          totalAmount: totalAmount,
          clientIP:
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        },
      },
    });

    return ApiResponseHelper.success({
      recordId: result.supplyRecord.id,
      message: '供货记录提交成功',
      summary: {
        itemCount: validItems.length,
        totalAmount: Number(totalAmount),
        createdAt: result.supplyRecord.createdAt,
      },
    });
  } catch (error) {
    console.error('Submit supply record error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      shareCode: params.shareCode,
    });
    return ApiResponseHelper.serverError(
      `提交供货记录失败: ${error instanceof Error ? error.message : '未知错误'}`
    );
  }
}

// 获取供货记录详情（公开API，通过分享码访问）
export async function GET(request: NextRequest, { params }: { params: { shareCode: string } }) {
  try {
    const shareCode = params.shareCode;
    const url = new URL(request.url);
    const extractCode = url.searchParams.get('extractCode');
    const recordId = url.searchParams.get('recordId');

    // 验证分享链接权限
    const verifyResult = await SupplyShareManager.verifyShareAccess(
      shareCode,
      extractCode || undefined
    );
    if (!verifyResult.success) {
      return ApiResponseHelper.error(verifyResult.message || '访问被拒绝');
    }

    const purchaseOrderId = verifyResult.purchaseOrderId!;

    if (recordId) {
      // 获取特定供货记录详情
      const supplyRecord = await prisma.supplyRecord.findFirst({
        where: {
          id: recordId,
          purchaseOrderId,
          shareCode,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  code: true,
                  specification: true,
                  color: true,
                  sku: true,
                },
              },
            },
          },
        },
      });

      if (!supplyRecord) {
        return ApiResponseHelper.notFound('供货记录不存在');
      }

      return ApiResponseHelper.success({
        record: {
          id: supplyRecord.id,
          status: supplyRecord.status,
          supplierInfo: supplyRecord.supplierInfo,
          totalAmount: supplyRecord.totalAmount,
          items: supplyRecord.items.map((item) => ({
            id: item.id,
            product: item.product,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            remark: item.remark,
          })),
          remark: supplyRecord.remark,
          createdAt: supplyRecord.createdAt,
          updatedAt: supplyRecord.updatedAt,
        },
      });
    } else {
      // 获取该分享链接下的所有供货记录
      const supplyRecords = await prisma.supplyRecord.findMany({
        where: {
          purchaseOrderId,
          shareCode,
        },
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

      const formattedRecords = supplyRecords.map((record) => ({
        id: record.id,
        status: record.status,
        supplierInfo: record.supplierInfo,
        totalAmount: record.totalAmount,
        itemCount: record.items.length,
        createdAt: record.createdAt,
      }));

      return ApiResponseHelper.success({
        records: formattedRecords,
        totalCount: supplyRecords.length,
      });
    }
  } catch (error) {
    console.error('Get supply record error:', error);
    return ApiResponseHelper.serverError('获取供货记录失败');
  }
}

// 更新供货记录（公开API，通过分享码访问）
export async function PUT(request: NextRequest, { params }: { params: { shareCode: string } }) {
  try {
    const shareCode = params.shareCode;
    const body = await request.json();

    const { recordId, items, totalAmount, remark, extractCode } = body;

    if (!recordId) {
      return ApiResponseHelper.validationError({}, '请提供供货记录ID');
    }

    // 验证分享链接权限
    const verifyResult = await SupplyShareManager.verifyShareAccess(shareCode, extractCode);
    if (!verifyResult.success) {
      return ApiResponseHelper.error(verifyResult.message || '访问被拒绝');
    }

    const purchaseOrderId = verifyResult.purchaseOrderId!;

    // 验证供货记录是否存在且属于该采购订单
    const existingRecord = await prisma.supplyRecord.findFirst({
      where: {
        id: recordId,
        purchaseOrderId,
        shareCode,
        status: 'active',
      },
    });

    if (!existingRecord) {
      return ApiResponseHelper.notFound('供货记录不存在或已失效');
    }

    // 验证供货明细
    const validItems = items.filter((item: any) => item.quantity > 0);
    if (validItems.length === 0) {
      return ApiResponseHelper.validationError({}, '请至少填写一个产品的供货数量');
    }

    // 实时验证数量是否超限（排除当前编辑的记录）
    const validationResult = await SupplyQuantityValidator.validateSupplyQuantityRealtime(
      purchaseOrderId,
      validItems,
      recordId
    );

    if (!validationResult.valid) {
      // 获取最新的可选产品列表
      const availableProducts =
        await SupplyQuantityValidator.getAvailableProductsList(purchaseOrderId);

      return ApiResponseHelper.validationError(
        {
          errors: validationResult.errors,
          availableProducts: availableProducts,
          needRefresh: true,
        },
        validationResult.message || '供货数量验证失败'
      );
    }

    // 获取采购订单信息用于日志记录
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        supplier: {
          select: {
            nickname: true,
          },
        },
      },
    });

    // 开始事务更新供货记录
    const result = await prisma.$transaction(async (tx) => {
      // 更新供货记录主记录（不更新supplierInfo，保持通过purchaseOrderId关联）
      const updatedRecord = await tx.supplyRecord.update({
        where: { id: recordId },
        data: {
          totalAmount: Number(totalAmount) || 0,
          remark: remark || null,
          updatedAt: new Date(),
        },
      });

      // 删除旧的明细记录
      await tx.supplyRecordItem.deleteMany({
        where: { supplyRecordId: recordId },
      });

      // 创建新的明细记录
      const newItems = await Promise.all(
        validItems.map((item: any) =>
          tx.supplyRecordItem.create({
            data: {
              supplyRecordId: recordId,
              productId: item.productId,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice) || 0,
              totalPrice: Number(item.totalPrice) || 0,
              remark: item.remark || null,
            },
          })
        )
      );

      return {
        supplyRecord: updatedRecord,
        items: newItems,
      };
    });

    // 记录操作日志
    await prisma.log.create({
      data: {
        category: 'SUPPLY_RECORD',
        module: '供货管理',
        operation: '更新供货记录',
        operatorAccountId: null, // 系统操作，明确设置为null
        status: 'SUCCESS',
        details: {
          purchaseOrderId,
          shareCode,
          supplierInfo: purchaseOrder?.supplier?.nickname || '未知供应商',
          recordId,
          itemCount: validItems.length,
          totalAmount: totalAmount,
          clientIP:
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        },
      },
    });

    return ApiResponseHelper.success({
      recordId,
      message: '供货记录更新成功',
      updatedAt: result.supplyRecord.updatedAt,
    });
  } catch (error) {
    console.error('Update supply record error:', error);
    return ApiResponseHelper.serverError('更新供货记录失败');
  }
}
