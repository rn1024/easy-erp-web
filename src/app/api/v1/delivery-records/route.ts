import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRequestToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 获取发货记录列表
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const productId = searchParams.get('productId');
    const forwarderId = searchParams.get('forwarderId');
    const status = searchParams.get('status');
    const country = searchParams.get('country');
    const channel = searchParams.get('channel');
    const fbaShipmentCode = searchParams.get('fbaShipmentCode');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // 构建查询条件
    const where: any = {};

    if (shopId) {
      where.shopId = shopId;
    }

    if (productId) {
      where.productId = productId;
    }

    if (forwarderId) {
      where.forwarderId = forwarderId;
    }

    if (status) {
      where.status = status;
    }

    if (country) {
      where.country = {
        contains: country,
        mode: 'insensitive',
      };
    }

    if (channel) {
      where.channel = {
        contains: channel,
        mode: 'insensitive',
      };
    }

    if (fbaShipmentCode) {
      where.fbaShipmentCode = {
        contains: fbaShipmentCode,
        mode: 'insensitive',
      };
    }

    // 执行查询
    const [records, total] = await Promise.all([
      prisma.deliveryRecord.findMany({
        where,
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
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.deliveryRecord.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
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
    const record = await prisma.deliveryRecord.create({
      data: {
        shopId,
        productId,
        totalBoxes,
        fbaShipmentCode,
        fbaWarehouseCode,
        country,
        channel,
        forwarderId,
        shippingChannel,
        warehouseShippingDeadline: warehouseShippingDeadline
          ? new Date(warehouseShippingDeadline)
          : null,
        warehouseReceiptDeadline: warehouseReceiptDeadline
          ? new Date(warehouseReceiptDeadline)
          : null,
        shippingDetails,
        date: new Date(date),
        status: 'PREPARING',
        operatorId: user.id,
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
      data: record,
    });
  } catch (error) {
    console.error('Create delivery record error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
