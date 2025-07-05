import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 获取发货记录详情
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const record = await prisma.deliveryRecord.findUnique({
      where: { id: params.id },
      include: {
        shop: {
          select: {
            id: true,
            nickname: true,
          },
        },
        forwarder: {
          select: {
            id: true,
            nickname: true,
            contactPerson: true,
            contactPhone: true,
          },
        },
        product: {
          select: {
            id: true,
            code: true,
            specification: true,
            sku: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        operator: {
          select: {
            id: true,
            name: true,
          },
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
    const user = await getCurrentUser(request);
    if (!user) {
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

    // 构建更新数据
    const updateData: any = {};
    if (shopId !== undefined) updateData.shopId = shopId;
    if (productId !== undefined) updateData.productId = productId;
    if (totalBoxes !== undefined) {
      if (totalBoxes <= 0) {
        return NextResponse.json(
          { message: 'Total boxes must be greater than 0' },
          { status: 400 }
        );
      }
      updateData.totalBoxes = parseInt(totalBoxes);
    }
    if (fbaShipmentCode !== undefined) updateData.fbaShipmentCode = fbaShipmentCode || null;
    if (fbaWarehouseCode !== undefined) updateData.fbaWarehouseCode = fbaWarehouseCode || null;
    if (country !== undefined) updateData.country = country || null;
    if (channel !== undefined) updateData.channel = channel || null;
    if (forwarderId !== undefined) updateData.forwarderId = forwarderId;
    if (shippingChannel !== undefined) updateData.shippingChannel = shippingChannel || null;
    if (warehouseShippingDeadline !== undefined) {
      updateData.warehouseShippingDeadline = warehouseShippingDeadline
        ? new Date(warehouseShippingDeadline)
        : null;
    }
    if (warehouseReceiptDeadline !== undefined) {
      updateData.warehouseReceiptDeadline = warehouseReceiptDeadline
        ? new Date(warehouseReceiptDeadline)
        : null;
    }
    if (shippingDetails !== undefined) updateData.shippingDetails = shippingDetails || null;
    if (date !== undefined) updateData.date = new Date(date);
    if (status !== undefined) updateData.status = status;

    // 验证关联数据是否存在
    const checks = [];
    if (shopId) checks.push(prisma.shop.findUnique({ where: { id: shopId } }));
    if (productId) checks.push(prisma.productInfo.findUnique({ where: { id: productId } }));
    if (forwarderId) checks.push(prisma.forwarder.findUnique({ where: { id: forwarderId } }));

    if (checks.length > 0) {
      const results = await Promise.all(checks);
      let index = 0;

      if (shopId && !results[index++]) {
        return NextResponse.json({ message: 'Shop not found' }, { status: 404 });
      }
      if (productId && !results[index++]) {
        return NextResponse.json({ message: 'Product not found' }, { status: 404 });
      }
      if (forwarderId && !results[index++]) {
        return NextResponse.json({ message: 'Forwarder not found' }, { status: 404 });
      }
    }

    // 更新发货记录
    const updatedRecord = await prisma.deliveryRecord.update({
      where: { id: params.id },
      data: updateData,
      include: {
        shop: {
          select: {
            id: true,
            nickname: true,
          },
        },
        forwarder: {
          select: {
            id: true,
            nickname: true,
            contactPerson: true,
          },
        },
        product: {
          select: {
            id: true,
            code: true,
            specification: true,
            sku: true,
          },
        },
        operator: {
          select: {
            id: true,
            name: true,
          },
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
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 检查记录是否存在
    const existingRecord = await prisma.deliveryRecord.findUnique({
      where: { id: params.id },
    });

    if (!existingRecord) {
      return NextResponse.json({ message: 'Delivery record not found' }, { status: 404 });
    }

    // 只有准备中和已取消的记录可以删除
    if (!['PREPARING', 'CANCELLED'].includes(existingRecord.status)) {
      return NextResponse.json(
        { message: 'Only preparing and cancelled records can be deleted' },
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
