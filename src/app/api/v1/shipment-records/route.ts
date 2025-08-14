import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

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
    const status = searchParams.get('status');
    const country = searchParams.get('country');
    const channel = searchParams.get('channel');
    const shippingChannel = searchParams.get('shippingChannel');

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
    if (channel) {
      where.channel = {
        contains: channel,
      };
    }
    if (shippingChannel) {
      where.shippingChannel = {
        contains: shippingChannel,
      };
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
          shipmentFiles: {
            include: {
              fileUpload: {
                select: {
                  id: true,
                  originalName: true,
                  fileName: true,
                  fileUrl: true,
                  fileSize: true,
                  fileType: true,
                  category: true,
                  createdAt: true,
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
    console.error('Get shipment records error:', error);
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
      country,
      channel,
      shippingChannel,
      warehouseShippingDeadline,
      warehouseReceiptDeadline,
      shippingDetails,
      date,
      products,
      shipmentFiles,
    } = body;

    // 数据验证
    if (!shopId || !date || !products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // 验证产品数据
    for (const product of products) {
      if (!product.productId || !product.totalBoxes || product.totalBoxes <= 0) {
        return NextResponse.json({ message: 'Invalid product data' }, { status: 400 });
      }
    }

    // 验证关联数据是否存在
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      return NextResponse.json({ message: 'Shop not found' }, { status: 404 });
    }

    // 验证所有产品和货代是否存在
    const productIds = products.map((p) => p.productId);
    const forwarderIds = products.map((p) => p.forwarderId).filter(Boolean); // 过滤空值

    // 验证文件是否存在
    let foundFiles: any[] = [];
    if (shipmentFiles && Array.isArray(shipmentFiles) && shipmentFiles.length > 0) {
      const fileIds = shipmentFiles.map((f) => f.id || f.fileUploadId).filter(Boolean);
      if (fileIds.length > 0) {
        foundFiles = await prisma.fileUpload.findMany({ where: { id: { in: fileIds } } });
        if (foundFiles.length !== fileIds.length) {
          return NextResponse.json({ message: 'Some files not found' }, { status: 404 });
        }
      }
    }

    const [foundProducts, foundForwarders] = await Promise.all([
      prisma.productInfo.findMany({ where: { id: { in: productIds } } }),
      forwarderIds.length > 0
        ? prisma.forwarder.findMany({ where: { id: { in: forwarderIds } } })
        : Promise.resolve([]),
    ]);

    if (foundProducts.length !== productIds.length) {
      return NextResponse.json({ message: 'Some products not found' }, { status: 404 });
    }

    if (forwarderIds.length > 0 && foundForwarders.length !== forwarderIds.length) {
      return NextResponse.json({ message: 'Some forwarders not found' }, { status: 404 });
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
      const shipmentProducts = await Promise.all(
        products.map((product) =>
          tx.shipmentProductRecord.create({
            data: {
              shipmentRecordId: shipmentRecord.id,
              productId: product.productId,
              forwarderId: product.forwarderId || null,
              totalBoxes: parseInt(product.totalBoxes),
              fbaShipmentCode: product.fbaShipmentCode || null,
              fbaWarehouseCode: product.fbaWarehouseCode || null,
            },
          })
        )
      );

      // 创建文件关联记录
      let shipmentFileRecords: any[] = [];
      if (foundFiles.length > 0) {
        shipmentFileRecords = await Promise.all(
          foundFiles.map((file) =>
            tx.shipmentRecordFile.create({
              data: {
                shipmentRecordId: shipmentRecord.id,
                fileUploadId: file.id,
              },
            })
          )
        );
      }

      return { shipmentRecord, shipmentProducts, shipmentFileRecords };
    });

    // 获取完整的记录信息
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
        shipmentFiles: {
          include: {
            fileUpload: {
              select: {
                id: true,
                originalName: true,
                fileName: true,
                fileUrl: true,
                fileSize: true,
                fileType: true,
                category: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      code: 0,
      msg: '创建发货记录成功',
      data: fullRecord,
    });
  } catch (error) {
    console.error('Create shipment record error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
