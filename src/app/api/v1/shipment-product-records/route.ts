import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 获取发货产品记录列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const shipmentRecordId = searchParams.get('shipmentRecordId');
    const productId = searchParams.get('productId');
    const forwarderId = searchParams.get('forwarderId');
    const fbaShipmentCode = searchParams.get('fbaShipmentCode');

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};
    if (shipmentRecordId) where.shipmentRecordId = shipmentRecordId;
    if (productId) where.productId = productId;
    if (forwarderId) where.forwarderId = forwarderId;
    if (fbaShipmentCode) {
      where.fbaShipmentCode = {
        contains: fbaShipmentCode,
      };
    }

    // 获取产品记录列表和总数
    const [records, total] = await Promise.all([
      prisma.shipmentProductRecord.findMany({
        where,
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
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.shipmentProductRecord.count({ where }),
    ]);

    return NextResponse.json({
      code: 0,
      msg: '获取发货产品记录列表成功',
      data: {
        list: records,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get shipment product records error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// 创建发货产品记录
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      shipmentRecordId,
      productId,
      forwarderId,
      totalBoxes,
      fbaShipmentCode,
      fbaWarehouseCode,
    } = body;

    // 数据验证
    if (!shipmentRecordId || !productId || !totalBoxes || totalBoxes <= 0) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // 验证关联数据是否存在
    const [shipmentRecord, product] = await Promise.all([
      prisma.shipmentRecord.findUnique({ where: { id: shipmentRecordId } }),
      prisma.productInfo.findUnique({ where: { id: productId } }),
    ]);

    let forwarder = null;
    if (forwarderId) {
      forwarder = await prisma.forwarder.findUnique({ where: { id: forwarderId } });
    }

    if (!shipmentRecord) {
      return NextResponse.json({ message: 'Shipment record not found' }, { status: 404 });
    }

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    if (forwarderId && !forwarder) {
      return NextResponse.json({ message: 'Forwarder not found' }, { status: 404 });
    }

    // 创建产品记录
    const productRecord = await prisma.shipmentProductRecord.create({
      data: {
        shipmentRecordId,
        productId,
        forwarderId: forwarderId || null,
        totalBoxes: parseInt(totalBoxes),
        fbaShipmentCode: fbaShipmentCode || null,
        fbaWarehouseCode: fbaWarehouseCode || null,
      },
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
      msg: '创建发货产品记录成功',
      data: productRecord,
    });
  } catch (error) {
    console.error('Create shipment product record error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
