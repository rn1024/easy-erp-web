import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 获取发货记录列表
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
    if (forwarderId) where.forwarderId = forwarderId;
    if (status) where.status = status;
    if (fbaShipmentCode) {
      where.fbaShipmentCode = {
        contains: fbaShipmentCode,
      };
    }
    if (country) {
      where.country = {
        contains: country,
      };
    }

    // 获取发货记录列表和总数
    const [records, total] = await Promise.all([
      prisma.deliveryRecord.findMany({
        where,
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
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.deliveryRecord.count({ where }),
    ]);

    return NextResponse.json({
      code: 0,
      msg: '获取发货记录列表成功',
      data: {
        list: records,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get delivery records error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// 创建发货记录
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

    // 创建发货记录
    const deliveryRecord = await prisma.deliveryRecord.create({
      data: {
        shopId,
        productId,
        totalBoxes: parseInt(totalBoxes),
        fbaShipmentCode: fbaShipmentCode || null,
        fbaWarehouseCode: fbaWarehouseCode || null,
        country: country || null,
        channel: channel || null,
        forwarderId,
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
      code: 0,
      msg: '创建发货记录成功',
      data: deliveryRecord,
    });
  } catch (error) {
    console.error('Create delivery record error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
