import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 获取散件库存列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const shopId = searchParams.get('shopId');
    const categoryId = searchParams.get('categoryId');
    const productId = searchParams.get('productId');
    const spareType = searchParams.get('spareType');
    const location = searchParams.get('location');

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};
    if (shopId) where.shopId = shopId;
    if (categoryId) where.categoryId = categoryId;
    if (productId) where.productId = productId;
    if (spareType) where.spareType = spareType;
    if (location) {
      where.location = {
        contains: location,
      };
    }

    // 获取散件库存列表和总数
    const [inventories, total] = await Promise.all([
      prisma.spareInventory.findMany({
        where,
        include: {
          shop: {
            select: {
              id: true,
              nickname: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
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
        },
        skip,
        take: pageSize,
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      prisma.spareInventory.count({ where }),
    ]);

    return NextResponse.json({
      code: 0,
      msg: '获取成功',
      data: {
        list: inventories,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取散件库存列表失败:', error);
    return NextResponse.json(
      {
        code: 500,
        msg: '服务器内部错误',
        data: null,
      },
      { status: 500 }
    );
  }
}

// 创建散件库存
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const body = await request.json();
    const { shopId, categoryId, productId, spareType, location, quantity } = body;

    // 验证必填字段
    if (!shopId || !categoryId || !productId || !spareType) {
      return NextResponse.json({ code: 400, msg: '缺少必要参数' }, { status: 400 });
    }

    // 验证关联数据是否存在
    const [shop, category, product] = await Promise.all([
      prisma.shop.findUnique({ where: { id: shopId } }),
      prisma.productCategory.findUnique({ where: { id: categoryId } }),
      prisma.productInfo.findUnique({ where: { id: productId } }),
    ]);

    if (!shop) {
      return NextResponse.json({ code: 400, msg: '店铺不存在' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ code: 400, msg: '产品分类不存在' }, { status: 400 });
    }

    if (!product) {
      return NextResponse.json({ code: 400, msg: '产品不存在' }, { status: 400 });
    }

    // 检查是否已存在相同的库存记录
    const existingInventory = await prisma.spareInventory.findFirst({
      where: {
        shopId,
        productId,
        spareType,
        location: location || null,
      },
    });

    if (existingInventory) {
      return NextResponse.json(
        { code: 400, msg: '该位置已存在相同的散件库存记录' },
        { status: 400 }
      );
    }

    // 创建散件库存
    const inventory = await prisma.spareInventory.create({
      data: {
        shopId,
        categoryId,
        productId,
        spareType,
        location: location || null,
        quantity: quantity || 0,
      },
      include: {
        shop: {
          select: {
            id: true,
            nickname: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
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
      },
    });

    return NextResponse.json({
      code: 0,
      msg: '创建成功',
      data: inventory,
    });
  } catch (error) {
    console.error('创建散件库存失败:', error);
    return NextResponse.json(
      {
        code: 500,
        msg: '服务器内部错误',
        data: null,
      },
      { status: 500 }
    );
  }
}
