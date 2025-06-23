// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRequestToken } from '@/lib/auth';

// GET /api/v1/finished-inventory - 获取成品库存列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户权限
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const shopId = searchParams.get('shopId');
    const categoryId = searchParams.get('categoryId');
    const productId = searchParams.get('productId');
    const location = searchParams.get('location');

    // 构建查询条件
    const where: any = {};
    if (shopId) {
      where.shopId = shopId;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (productId) {
      where.productId = productId;
    }
    if (location) {
      where.location = {
        contains: location,
      };
    }

    // 获取总数
    const total = await prisma.finishedInventory.count({ where });

    // 获取列表数据
    const list = await prisma.finishedInventory.findMany({
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
            sku: true,
            specification: true,
            color: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: {
        list,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('Get finished inventory error:', error);
    return NextResponse.json({ code: 500, msg: '服务器错误', data: null }, { status: 500 });
  }
}

// POST /api/v1/finished-inventory - 创建成品库存记录
export async function POST(request: NextRequest) {
  try {
    // 验证用户权限
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const body = await request.json();
    const {
      shopId,
      categoryId,
      productId,
      boxSize,
      packQuantity,
      weight,
      location,
      stockQuantity,
    } = body;

    // 验证必填字段
    if (!shopId || !categoryId || !productId) {
      return NextResponse.json(
        { code: 400, msg: '店铺、分类和产品不能为空', data: null },
        { status: 400 }
      );
    }

    // 检查是否已存在相同配置的库存记录
    const existingInventory = await prisma.finishedInventory.findFirst({
      where: {
        shopId,
        productId,
        boxSize: boxSize || null,
        location: location || null,
      },
    });

    if (existingInventory) {
      return NextResponse.json(
        { code: 400, msg: '相同配置的库存记录已存在', data: null },
        { status: 400 }
      );
    }

    // 创建成品库存记录
    const inventory = await prisma.finishedInventory.create({
      data: {
        shopId,
        categoryId,
        productId,
        boxSize,
        packQuantity: packQuantity || 1,
        weight: weight ? parseFloat(weight) : null,
        location,
        stockQuantity: stockQuantity || 0,
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
            sku: true,
            specification: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({
      code: 200,
      msg: '创建成功',
      data: inventory,
    });
  } catch (error) {
    console.error('Create finished inventory error:', error);
    return NextResponse.json({ code: 500, msg: '服务器错误', data: null }, { status: 500 });
  }
}
