import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 获取发货记录详情
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const record = await prisma.shipmentRecord.findUnique({
      where: { id: params.id },
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

    if (!record) {
      return NextResponse.json({ message: 'Shipment record not found' }, { status: 404 });
    }

    return NextResponse.json({
      code: 0,
      msg: '获取发货记录详情成功',
      data: record,
    });
  } catch (error) {
    console.error('Get shipment record error:', error);
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
      country,
      channel,
      shippingChannel,
      warehouseShippingDeadline,
      warehouseReceiptDeadline,
      shippingDetails,
      date,
      status,
      products,
      shipmentFile,
    } = body;

    // 检查记录是否存在
    const existingRecord = await prisma.shipmentRecord.findUnique({
      where: { id: params.id },
      include: {
        shipmentProducts: true,
      },
    });

    if (!existingRecord) {
      return NextResponse.json({ message: 'Shipment record not found' }, { status: 404 });
    }

    // 如果提供了产品数据，验证产品数据
    if (products && Array.isArray(products)) {
      for (const product of products) {
        if (!product.productId || !product.totalBoxes || product.totalBoxes <= 0) {
          return NextResponse.json({ message: 'Invalid product data' }, { status: 400 });
        }
      }

      // 验证所有产品和货代是否存在
      const productIds = products.map((p) => p.productId);
      const forwarderIds = products.map((p) => p.forwarderId).filter(Boolean); // 过滤空值

      // 去重处理
      const uniqueProductIds = [...new Set(productIds)];
      const uniqueForwarderIds = [...new Set(forwarderIds)];

      const [foundProducts, foundForwarders] = await Promise.all([
        prisma.productInfo.findMany({ where: { id: { in: uniqueProductIds } } }),
        uniqueForwarderIds.length > 0
          ? prisma.forwarder.findMany({ where: { id: { in: uniqueForwarderIds } } })
          : Promise.resolve([]),
      ]);

      if (foundProducts.length !== uniqueProductIds.length) {
        return NextResponse.json({ message: 'Some products not found' }, { status: 404 });
      }

      if (uniqueForwarderIds.length > 0 && foundForwarders.length !== uniqueForwarderIds.length) {
        return NextResponse.json({ message: 'Some forwarders not found' }, { status: 404 });
      }
    }

    // 文件URL验证（可选）
    if (shipmentFile && typeof shipmentFile !== 'string') {
      return NextResponse.json({ message: 'Invalid shipment file format' }, { status: 400 });
    }

    // 使用事务更新发货记录和产品明细
    const result = await prisma.$transaction(async (tx) => {
      // 构建更新数据
      const updateData: any = {};
      if (shopId !== undefined) updateData.shopId = shopId;
      if (country !== undefined) updateData.country = country || null;
      if (channel !== undefined) updateData.channel = channel || null;
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
      if (shipmentFile !== undefined) updateData.shipmentFile = shipmentFile || null;

      // 更新发货记录主表
      const updatedRecord = await tx.shipmentRecord.update({
        where: { id: params.id },
        data: updateData,
      });

      // 如果提供了产品数据，更新产品明细
      if (products && Array.isArray(products)) {
        // 删除现有的产品记录
        await tx.shipmentProductRecord.deleteMany({
          where: { shipmentRecordId: params.id },
        });

        // 创建新的产品记录
        if (products.length > 0) {
          await Promise.all(
            products.map((product) =>
              tx.shipmentProductRecord.create({
                data: {
                  shipmentRecordId: params.id,
                  productId: product.productId,
                  forwarderId: product.forwarderId || null,
                  totalBoxes: parseInt(product.totalBoxes),
                  fbaShipmentCode: product.fbaShipmentCode || null,
                  fbaWarehouseCode: product.fbaWarehouseCode || null,
                },
              })
            )
          );
        }
      }



      return updatedRecord;
    });

    // 获取完整的更新后记录
    const fullRecord = await prisma.shipmentRecord.findUnique({
      where: { id: params.id },
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

    return NextResponse.json({
      code: 0,
      msg: '更新发货记录成功',
      data: fullRecord,
    });
  } catch (error) {
    console.error('Update shipment record error:', error);
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
    const existingRecord = await prisma.shipmentRecord.findUnique({
      where: { id: params.id },
    });

    if (!existingRecord) {
      return NextResponse.json({ message: 'Shipment record not found' }, { status: 404 });
    }

    // 检查是否可以删除（只有准备中或已取消状态可以删除）
    if (!['PREPARING', 'CANCELLED'].includes(existingRecord.status)) {
      return NextResponse.json(
        { message: 'Cannot delete shipment record in current status' },
        { status: 400 }
      );
    }

    // 使用事务删除记录和关联的产品明细
    await prisma.$transaction(async (tx) => {
      // 删除产品明细记录（级联删除已在schema中配置）
      await tx.shipmentProductRecord.deleteMany({
        where: { shipmentRecordId: params.id },
      });

      // 删除发货记录
      await tx.shipmentRecord.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({
      code: 0,
      msg: '删除发货记录成功',
    });
  } catch (error) {
    console.error('Delete shipment record error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
