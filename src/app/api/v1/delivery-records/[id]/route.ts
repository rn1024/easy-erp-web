import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 获取发货记录详情 (兼容旧API格式)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 解析复合ID
    const [shipmentRecordId, productRecordId] = params.id.includes('-')
      ? params.id.split('-')
      : [params.id, null];

    if (productRecordId) {
      // 如果是复合ID，获取指定的产品记录
      const productRecord = await prisma.shipmentProductRecord.findUnique({
        where: { id: productRecordId },
        include: {
          shipmentRecord: {
            include: {
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
                  operator: true,
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
            },
          },
        },
      });

      if (!productRecord) {
        return NextResponse.json({ message: 'Delivery record not found' }, { status: 404 });
      }

      // 转换为旧格式
      const compatibleRecord = {
        id: `${productRecord.shipmentRecord.id}-${productRecord.id}`,
        shopId: productRecord.shipmentRecord.shopId,
        productId: productRecord.productId,
        totalBoxes: productRecord.totalBoxes,
        fbaShipmentCode: productRecord.fbaShipmentCode,
        fbaWarehouseCode: productRecord.fbaWarehouseCode,
        country: productRecord.shipmentRecord.country,
        channel: productRecord.shipmentRecord.channel,
        forwarderId: productRecord.forwarderId,
        shippingChannel: productRecord.shipmentRecord.shippingChannel,
        warehouseShippingDeadline: productRecord.shipmentRecord.warehouseShippingDeadline,
        warehouseReceiptDeadline: productRecord.shipmentRecord.warehouseReceiptDeadline,
        shippingDetails: productRecord.shipmentRecord.shippingDetails,
        date: productRecord.shipmentRecord.date,
        status: productRecord.shipmentRecord.status,
        operatorId: productRecord.shipmentRecord.operatorId,
        createdAt: productRecord.shipmentRecord.createdAt,
        updatedAt: productRecord.shipmentRecord.updatedAt,
        shop: productRecord.shipmentRecord.shop,
        product: productRecord.product,
        forwarder: productRecord.forwarder,
        operator: productRecord.shipmentRecord.operator,
      };

      return NextResponse.json({
        success: true,
        data: compatibleRecord,
      });
    } else {
      // 如果是简单ID，获取发货记录的第一个产品记录
      const shipmentRecord = await prisma.shipmentRecord.findUnique({
        where: { id: shipmentRecordId },
        include: {
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
              operator: true,
            },
          },
          shipmentProducts: {
            take: 1, // 只取第一个产品记录
            include: {
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
                },
              },
            },
          },
        },
      });

      if (!shipmentRecord || shipmentRecord.shipmentProducts.length === 0) {
        return NextResponse.json({ message: 'Delivery record not found' }, { status: 404 });
      }

      const firstProduct = shipmentRecord.shipmentProducts[0];

      // 转换为旧格式
      const compatibleRecord = {
        id: `${shipmentRecord.id}-${firstProduct.id}`,
        shopId: shipmentRecord.shopId,
        productId: firstProduct.productId,
        totalBoxes: firstProduct.totalBoxes,
        fbaShipmentCode: firstProduct.fbaShipmentCode,
        fbaWarehouseCode: firstProduct.fbaWarehouseCode,
        country: shipmentRecord.country,
        channel: shipmentRecord.channel,
        forwarderId: firstProduct.forwarderId,
        shippingChannel: shipmentRecord.shippingChannel,
        warehouseShippingDeadline: shipmentRecord.warehouseShippingDeadline,
        warehouseReceiptDeadline: shipmentRecord.warehouseReceiptDeadline,
        shippingDetails: shipmentRecord.shippingDetails,
        date: shipmentRecord.date,
        status: shipmentRecord.status,
        operatorId: shipmentRecord.operatorId,
        createdAt: shipmentRecord.createdAt,
        updatedAt: shipmentRecord.updatedAt,
        shop: shipmentRecord.shop,
        product: firstProduct.product,
        forwarder: firstProduct.forwarder,
        operator: shipmentRecord.operator,
      };

      return NextResponse.json({
        success: true,
        data: compatibleRecord,
      });
    }
  } catch (error) {
    console.error('Get delivery record error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// 更新发货记录 (兼容旧API格式)
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

    // 解析复合ID
    const [shipmentRecordId, productRecordId] = params.id.includes('-')
      ? params.id.split('-')
      : [params.id, null];

    // 检查记录是否存在
    const existingRecord = await prisma.shipmentRecord.findUnique({
      where: { id: shipmentRecordId },
      include: {
        shipmentProducts: true,
      },
    });

    if (!existingRecord) {
      return NextResponse.json({ message: 'Delivery record not found' }, { status: 404 });
    }

    // 使用事务更新记录
    const result = await prisma.$transaction(async (tx) => {
      // 构建主表更新数据
      const shipmentUpdateData: any = {};
      if (shopId !== undefined) shipmentUpdateData.shopId = shopId;
      if (country !== undefined) shipmentUpdateData.country = country || null;
      if (channel !== undefined) shipmentUpdateData.channel = channel || null;
      if (shippingChannel !== undefined)
        shipmentUpdateData.shippingChannel = shippingChannel || null;
      if (warehouseShippingDeadline !== undefined) {
        shipmentUpdateData.warehouseShippingDeadline = warehouseShippingDeadline
          ? new Date(warehouseShippingDeadline)
          : null;
      }
      if (warehouseReceiptDeadline !== undefined) {
        shipmentUpdateData.warehouseReceiptDeadline = warehouseReceiptDeadline
          ? new Date(warehouseReceiptDeadline)
          : null;
      }
      if (shippingDetails !== undefined)
        shipmentUpdateData.shippingDetails = shippingDetails || null;
      if (date !== undefined) shipmentUpdateData.date = new Date(date);
      if (status !== undefined) shipmentUpdateData.status = status;

      // 更新发货记录主表
      const updatedShipmentRecord = await tx.shipmentRecord.update({
        where: { id: shipmentRecordId },
        data: shipmentUpdateData,
      });

      // 更新产品明细
      if (
        productRecordId &&
        (productId !== undefined ||
          forwarderId !== undefined ||
          totalBoxes !== undefined ||
          fbaShipmentCode !== undefined ||
          fbaWarehouseCode !== undefined)
      ) {
        const productUpdateData: any = {};
        if (productId !== undefined) productUpdateData.productId = productId;
        if (forwarderId !== undefined) productUpdateData.forwarderId = forwarderId;
        if (totalBoxes !== undefined) {
          if (totalBoxes <= 0) {
            throw new Error('Total boxes must be greater than 0');
          }
          productUpdateData.totalBoxes = parseInt(totalBoxes);
        }
        if (fbaShipmentCode !== undefined)
          productUpdateData.fbaShipmentCode = fbaShipmentCode || null;
        if (fbaWarehouseCode !== undefined)
          productUpdateData.fbaWarehouseCode = fbaWarehouseCode || null;

        await tx.shipmentProductRecord.update({
          where: { id: productRecordId },
          data: productUpdateData,
        });
      }

      return updatedShipmentRecord;
    });

    // 获取完整的更新后记录
    const fullRecord = await prisma.shipmentRecord.findUnique({
      where: { id: shipmentRecordId },
      include: {
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
            operator: true,
          },
        },
        shipmentProducts: {
          include: {
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
        },
      },
    });

    // 找到对应的产品记录
    const targetProduct = productRecordId
      ? fullRecord!.shipmentProducts.find((p) => p.id === productRecordId)
      : fullRecord!.shipmentProducts[0];

    if (!targetProduct) {
      return NextResponse.json({ message: 'Product record not found' }, { status: 404 });
    }

    // 转换为旧格式
    const compatibleRecord = {
      id: `${fullRecord!.id}-${targetProduct.id}`,
      shopId: fullRecord!.shopId,
      productId: targetProduct.productId,
      totalBoxes: targetProduct.totalBoxes,
      fbaShipmentCode: targetProduct.fbaShipmentCode,
      fbaWarehouseCode: targetProduct.fbaWarehouseCode,
      country: fullRecord!.country,
      channel: fullRecord!.channel,
      forwarderId: targetProduct.forwarderId,
      shippingChannel: fullRecord!.shippingChannel,
      warehouseShippingDeadline: fullRecord!.warehouseShippingDeadline,
      warehouseReceiptDeadline: fullRecord!.warehouseReceiptDeadline,
      shippingDetails: fullRecord!.shippingDetails,
      date: fullRecord!.date,
      status: fullRecord!.status,
      operatorId: fullRecord!.operatorId,
      createdAt: fullRecord!.createdAt,
      updatedAt: fullRecord!.updatedAt,
      shop: fullRecord!.shop,
      product: targetProduct.product,
      forwarder: targetProduct.forwarder,
      operator: fullRecord!.operator,
    };

    return NextResponse.json({
      code: 0,
      msg: '更新发货记录成功',
      data: compatibleRecord,
    });
  } catch (error) {
    console.error('Update delivery record error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// 删除发货记录 (兼容旧API格式)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 解析复合ID
    const [shipmentRecordId, productRecordId] = params.id.includes('-')
      ? params.id.split('-')
      : [params.id, null];

    // 检查记录是否存在
    const existingRecord = await prisma.shipmentRecord.findUnique({
      where: { id: shipmentRecordId },
      include: {
        shipmentProducts: true,
      },
    });

    if (!existingRecord) {
      return NextResponse.json({ message: 'Delivery record not found' }, { status: 404 });
    }

    // 检查是否可以删除（只有准备中或已取消状态可以删除）
    if (!['PREPARING', 'CANCELLED'].includes(existingRecord.status)) {
      return NextResponse.json(
        { message: 'Cannot delete delivery record in current status' },
        { status: 400 }
      );
    }

    if (productRecordId) {
      // 如果是复合ID，只删除指定的产品记录
      await prisma.shipmentProductRecord.delete({
        where: { id: productRecordId },
      });

      // 如果删除后没有产品记录了，删除整个发货记录
      const remainingProducts = await prisma.shipmentProductRecord.count({
        where: { shipmentRecordId: shipmentRecordId },
      });

      if (remainingProducts === 0) {
        await prisma.shipmentRecord.delete({
          where: { id: shipmentRecordId },
        });
      }
    } else {
      // 如果是简单ID，删除整个发货记录和所有产品记录
      await prisma.$transaction(async (tx) => {
        await tx.shipmentProductRecord.deleteMany({
          where: { shipmentRecordId: shipmentRecordId },
        });

        await tx.shipmentRecord.delete({
          where: { id: shipmentRecordId },
        });
      });
    }

    return NextResponse.json({
      code: 0,
      msg: '删除发货记录成功',
    });
  } catch (error) {
    console.error('Delete delivery record error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
