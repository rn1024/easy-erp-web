import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 获取发货产品记录详情
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const record = await prisma.shipmentProductRecord.findUnique({
      where: { id: params.id },
      include: {
        shipmentRecord: {
          select: {
            id: true,
            date: true,
            status: true,
            country: true,
            channel: true,
            shippingChannel: true,
            shop: {
              select: {
                id: true,
                nickname: true,
                responsiblePerson: true,
              },
            },
            operator: {
              select: {
                id: true,
                name: true,
              },
            },
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
        forwarder: {
          select: {
            id: true,
            nickname: true,
            contactPerson: true,
            contactPhone: true,
            companyName: true,
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json({ message: 'Shipment product record not found' }, { status: 404 });
    }

    return NextResponse.json({
      code: 0,
      msg: '获取发货产品记录详情成功',
      data: record,
    });
  } catch (error) {
    console.error('Get shipment product record error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// 更新发货产品记录
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, forwarderId, totalBoxes, fbaShipmentCode, fbaWarehouseCode } = body;

    // 检查记录是否存在
    const existingRecord = await prisma.shipmentProductRecord.findUnique({
      where: { id: params.id },
      include: {
        shipmentRecord: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!existingRecord) {
      return NextResponse.json({ message: 'Shipment product record not found' }, { status: 404 });
    }

    // 检查发货记录状态是否允许修改
    if (!['PREPARING'].includes(existingRecord.shipmentRecord.status)) {
      return NextResponse.json(
        { message: 'Cannot modify product record when shipment is not in preparing status' },
        { status: 400 }
      );
    }

    // 构建更新数据
    const updateData: any = {};
    if (productId !== undefined) {
      // 验证产品是否存在
      const product = await prisma.productInfo.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json({ message: 'Product not found' }, { status: 404 });
      }
      updateData.productId = productId;
    }

    if (forwarderId !== undefined) {
      if (forwarderId) {
        // 验证货代是否存在
        const forwarder = await prisma.forwarder.findUnique({ where: { id: forwarderId } });
        if (!forwarder) {
          return NextResponse.json({ message: 'Forwarder not found' }, { status: 404 });
        }
      }
      updateData.forwarderId = forwarderId || null;
    }

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

    // 更新记录
    const updatedRecord = await prisma.shipmentProductRecord.update({
      where: { id: params.id },
      data: updateData,
      include: {
        shipmentRecord: {
          select: {
            id: true,
            date: true,
            status: true,
            country: true,
            channel: true,
            shop: {
              select: {
                id: true,
                nickname: true,
              },
            },
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
        forwarder: {
          select: {
            id: true,
            nickname: true,
            contactPerson: true,
            contactPhone: true,
          },
        },
      },
    });

    return NextResponse.json({
      code: 0,
      msg: '更新发货产品记录成功',
      data: updatedRecord,
    });
  } catch (error) {
    console.error('Update shipment product record error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// 删除发货产品记录
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 检查记录是否存在
    const existingRecord = await prisma.shipmentProductRecord.findUnique({
      where: { id: params.id },
      include: {
        shipmentRecord: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!existingRecord) {
      return NextResponse.json({ message: 'Shipment product record not found' }, { status: 404 });
    }

    // 检查发货记录状态是否允许删除
    if (!['PREPARING'].includes(existingRecord.shipmentRecord.status)) {
      return NextResponse.json(
        { message: 'Cannot delete product record when shipment is not in preparing status' },
        { status: 400 }
      );
    }

    // 删除记录
    await prisma.shipmentProductRecord.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      code: 0,
      msg: '删除发货产品记录成功',
    });
  } catch (error) {
    console.error('Delete shipment product record error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
