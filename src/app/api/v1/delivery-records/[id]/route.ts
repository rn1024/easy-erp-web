import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRequestToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 获取发货记录详情
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.account.findUnique({
      where: { id: tokenPayload.id },
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const record = await prisma.deliveryRecord.findUnique({
      where: { id: params.id },
      include: {
        shop: {
          select: { id: true, nickname: true, responsiblePerson: true },
        },
        product: {
          select: { id: true, code: true, specification: true, sku: true },
        },
        forwarder: {
          select: { id: true, nickname: true, contactPerson: true, contactPhone: true },
        },
        operator: {
          select: { id: true, name: true, operator: true },
        },
      },
    });

    if (!record) {
      return NextResponse.json({ message: 'Delivery record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('Get delivery record error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// 更新发货记录
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.account.findUnique({
      where: { id: tokenPayload.id },
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      shopId,
      productId,
      totalBoxes,
      fbaShipmentCode,
      fbaWarehouseCode,
      country,
      channel,
      forwarderId,
      shippingChannel,
      warehouseShippingDeadline,
      warehouseReceiptDeadline,
      shippingDetails,
      date,
      status,
    } = body;

    // 检查记录是否存在
    const existingRecord = await prisma.deliveryRecord.findUnique({
      where: { id: params.id },
    });

    if (!existingRecord) {
      return NextResponse.json({ message: 'Delivery record not found' }, { status: 404 });
    }

    // 如果更新了关联数据，验证是否存在
    if (shopId && shopId !== existingRecord.shopId) {
      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) {
        return NextResponse.json({ message: 'Shop not found' }, { status: 404 });
      }
    }

    if (productId && productId !== existingRecord.productId) {
      const product = await prisma.productInfo.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json({ message: 'Product not found' }, { status: 404 });
      }
    }

    if (forwarderId && forwarderId !== existingRecord.forwarderId) {
      const forwarder = await prisma.forwarder.findUnique({ where: { id: forwarderId } });
      if (!forwarder) {
        return NextResponse.json({ message: 'Forwarder not found' }, { status: 404 });
      }
    }

    // 更新发货记录
    const updatedRecord = await prisma.deliveryRecord.update({
      where: { id: params.id },
      data: {
        ...(shopId && { shopId }),
        ...(productId && { productId }),
        ...(totalBoxes && { totalBoxes }),
        ...(fbaShipmentCode !== undefined && { fbaShipmentCode }),
        ...(fbaWarehouseCode !== undefined && { fbaWarehouseCode }),
        ...(country !== undefined && { country }),
        ...(channel !== undefined && { channel }),
        ...(forwarderId && { forwarderId }),
        ...(shippingChannel !== undefined && { shippingChannel }),
        ...(warehouseShippingDeadline !== undefined && {
          warehouseShippingDeadline: warehouseShippingDeadline
            ? new Date(warehouseShippingDeadline)
            : null,
        }),
        ...(warehouseReceiptDeadline !== undefined && {
          warehouseReceiptDeadline: warehouseReceiptDeadline
            ? new Date(warehouseReceiptDeadline)
            : null,
        }),
        ...(shippingDetails !== undefined && { shippingDetails }),
        ...(date && { date: new Date(date) }),
        ...(status && { status }),
      },
      include: {
        shop: {
          select: { id: true, nickname: true, responsiblePerson: true },
        },
        product: {
          select: { id: true, code: true, specification: true, sku: true },
        },
        forwarder: {
          select: { id: true, nickname: true, contactPerson: true },
        },
        operator: {
          select: { id: true, name: true, operator: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRecord,
    });
  } catch (error) {
    console.error('Update delivery record error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// 删除发货记录
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.account.findUnique({
      where: { id: tokenPayload.id },
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 检查记录是否存在
    const existingRecord = await prisma.deliveryRecord.findUnique({
      where: { id: params.id },
    });

    if (!existingRecord) {
      return NextResponse.json({ message: 'Delivery record not found' }, { status: 404 });
    }

    // 只允许删除准备中或已取消状态的记录
    if (!['PREPARING', 'CANCELLED'].includes(existingRecord.status)) {
      return NextResponse.json(
        { message: 'Cannot delete record in current status' },
        { status: 400 }
      );
    }

    // 删除发货记录
    await prisma.deliveryRecord.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Delivery record deleted successfully',
    });
  } catch (error) {
    console.error('Delete delivery record error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
