import { NextRequest, NextResponse } from 'next/server';
import { withAuth, ApiResponseHelper } from '@/lib/middleware';
import { SupplyQuantityValidator } from '@/lib/supply-validator';
import { prisma } from '@/lib/db';

// 失效供货记录
export const PUT = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const recordId = pathParts[pathParts.length - 2]; // [id]在disable前一个位置

    // 验证供货记录是否存在
    const supplyRecord = await prisma.supplyRecord.findUnique({
      where: { id: recordId },
    });

    if (!supplyRecord) {
      return ApiResponseHelper.notFound('供货记录不存在');
    }

    if (supplyRecord.status !== 'active') {
      return ApiResponseHelper.error('供货记录已失效');
    }

    // 失效供货记录
    await prisma.supplyRecord.update({
      where: { id: recordId },
      data: {
        status: 'disabled',
        updatedAt: new Date(),
      },
    });

    // 记录操作日志
    await prisma.log.create({
      data: {
        category: 'SUPPLY_RECORD',
        module: '供货管理',
        operation: '失效供货记录',
        operatorAccountId: user.id,
        status: 'SUCCESS',
        details: {
          recordId,
          purchaseOrderId: supplyRecord.purchaseOrderId,
          reason: '管理员操作失效',
        },
      },
    });

    return ApiResponseHelper.success({
      message: '供货记录已失效，已释放对应的产品数量',
    });
  } catch (error) {
    console.error('Disable supply record error:', error);
    return ApiResponseHelper.serverError('失效供货记录失败');
  }
});
