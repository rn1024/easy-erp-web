import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 获取发货记录列表 (兼容旧API，转换为新的数据结构)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const shopId = searchParams.get('shopId');
    const forwarderId = searchParams.get('forwarderId');
    const status = searchParams.get('status');
    const fbaShipmentCode = searchParams.get('fbaShipmentCode');
    const country = searchParams.get('country');

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};
    if (shopId) where.shopId = shopId;
    if (status) where.status = status;
    if (country) {
      where.country = {
        contains: country,
      };
    }

    // 如果按货代搜索，需要在产品记录中查找
    let shipmentRecordIds: string[] | undefined = undefined;
    if (forwarderId || fbaShipmentCode) {
      const productWhere: any = {};
      if (forwarderId) productWhere.forwarderId = forwarderId;
      if (fbaShipmentCode) {
        productWhere.fbaShipmentCode = {
          contains: fbaShipmentCode,
        };
      }

      const productRecords = await prisma.shipmentProductRecord.findMany({
        where: productWhere,
        select: { shipmentRecordId: true },
      });

      shipmentRecordIds = [...new Set(productRecords.map((p) => p.shipmentRecordId))];

      if (shipmentRecordIds.length === 0) {
        // 如果没有匹配的产品记录，返回空结果
        return NextResponse.json({
          code: 0,
          msg: '获取发货记录列表成功',
          data: {
            list: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
          },
        });
      }

      where.id = { in: shipmentRecordIds };
    }

    // 获取发货记录列表和总数
    const [records, total] = await Promise.all([
      prisma.shipmentRecord.findMany({
        where,
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
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.shipmentRecord.count({ where }),
    ]);

    // 转换为旧的数据格式以保持兼容性
    const compatibleRecords = records.flatMap((record) =>
      record.shipmentProducts.map((product) => ({
        id: `${record.id}-${product.id}`, // 复合ID
        shopId: record.shopId,
        productId: product.productId,
        totalBoxes: product.totalBoxes,
        fbaShipmentCode: product.fbaShipmentCode,
        fbaWarehouseCode: product.fbaWarehouseCode,
        country: record.country,
        channel: record.channel,
        forwarderId: product.forwarderId,
        shippingChannel: record.shippingChannel,
        warehouseShippingDeadline: record.warehouseShippingDeadline,
        warehouseReceiptDeadline: record.warehouseReceiptDeadline,
        shippingDetails: record.shippingDetails,
        date: record.date,
        status: record.status,
        operatorId: record.operatorId,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        shop: record.shop,
        product: product.product,
        forwarder: product.forwarder,
        operator: record.operator,
      }))
    );

    return NextResponse.json({
      code: 0,
      msg: '获取发货记录列表成功',
      data: {
        list: compatibleRecords,
        total: compatibleRecords.length,
        page,
        pageSize,
        totalPages: Math.ceil(compatibleRecords.length / pageSize),
      },
    });
  } catch (error) {
    console.error('Get delivery records error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// 创建发货记录 (兼容旧API格式，转换为新的数据结构)
export async function POST(request: NextRequest) {
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
    } = body;

    // 数据验证
    if (!shopId || !productId || !totalBoxes || !forwarderId || !date) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (totalBoxes <= 0) {
      return NextResponse.json({ message: 'Total boxes must be greater than 0' }, { status: 400 });
    }

    // 验证关联数据是否存在
    const [shop, product, forwarder] = await Promise.all([
      prisma.shop.findUnique({ where: { id: shopId } }),
      prisma.productInfo.findUnique({ where: { id: productId } }),
      prisma.forwarder.findUnique({ where: { id: forwarderId } }),
    ]);

    if (!shop) {
      return NextResponse.json({ message: 'Shop not found' }, { status: 404 });
    }

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    if (!forwarder) {
      return NextResponse.json({ message: 'Forwarder not found' }, { status: 404 });
    }

    // 使用事务创建发货记录和产品明细
    const result = await prisma.$transaction(async (tx) => {
      // 创建发货记录主表
      const shipmentRecord = await tx.shipmentRecord.create({
        data: {
          shopId,
          country: country || null,
          channel: channel || null,
          shippingChannel: shippingChannel || null,
          warehouseShippingDeadline: warehouseShippingDeadline
            ? new Date(warehouseShippingDeadline)
            : null,
          warehouseReceiptDeadline: warehouseReceiptDeadline
            ? new Date(warehouseReceiptDeadline)
            : null,
          shippingDetails: shippingDetails || null,
          date: new Date(date),
          status: 'PREPARING',
          operatorId: user.id,
        },
      });

      // 创建产品明细记录
      const shipmentProduct = await tx.shipmentProductRecord.create({
        data: {
          shipmentRecordId: shipmentRecord.id,
          productId,
          forwarderId,
          totalBoxes: parseInt(totalBoxes),
          fbaShipmentCode: fbaShipmentCode || null,
          fbaWarehouseCode: fbaWarehouseCode || null,
        },
      });

      return { shipmentRecord, shipmentProduct };
    });

    // 获取完整的记录信息并转换为旧格式
    const fullRecord = await prisma.shipmentRecord.findUnique({
      where: { id: result.shipmentRecord.id },
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

    // 转换为旧格式
    const compatibleRecord = {
      id: `${fullRecord!.id}-${fullRecord!.shipmentProducts[0].id}`,
      shopId: fullRecord!.shopId,
      productId: fullRecord!.shipmentProducts[0].productId,
      totalBoxes: fullRecord!.shipmentProducts[0].totalBoxes,
      fbaShipmentCode: fullRecord!.shipmentProducts[0].fbaShipmentCode,
      fbaWarehouseCode: fullRecord!.shipmentProducts[0].fbaWarehouseCode,
      country: fullRecord!.country,
      channel: fullRecord!.channel,
      forwarderId: fullRecord!.shipmentProducts[0].forwarderId,
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
      product: fullRecord!.shipmentProducts[0].product,
      forwarder: fullRecord!.shipmentProducts[0].forwarder,
      operator: fullRecord!.operator,
    };

    return NextResponse.json({
      code: 0,
      msg: '创建发货记录成功',
      data: compatibleRecord,
    });
  } catch (error) {
    console.error('Create delivery record error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
