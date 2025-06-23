import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRequestToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 获取仓库任务列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const categoryId = searchParams.get('categoryId');
    const productId = searchParams.get('productId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

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

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // 执行查询
    const [tasks, total] = await Promise.all([
      prisma.warehouseTask.findMany({
        where,
        include: {
          shop: {
            select: { id: true, shopName: true, shopCode: true },
          },
          category: {
            select: { id: true, categoryName: true },
          },
          product: {
            select: { id: true, code: true, specification: true, sku: true },
          },
          operator: {
            select: { id: true, username: true, realName: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.warehouseTask.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        list: tasks,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get warehouse tasks error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// 创建仓库任务
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { shopId, categoryId, productId, totalQuantity, type, progress = 0 } = body;

    // 数据验证
    if (!shopId || !categoryId || !productId || !totalQuantity || !type) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (totalQuantity <= 0) {
      return NextResponse.json(
        { message: 'Total quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // 验证关联数据是否存在
    const [shop, category, product] = await Promise.all([
      prisma.shop.findUnique({ where: { id: shopId } }),
      prisma.productCategory.findUnique({ where: { id: categoryId } }),
      prisma.productInfo.findUnique({ where: { id: productId } }),
    ]);

    if (!shop) {
      return NextResponse.json({ message: 'Shop not found' }, { status: 404 });
    }

    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // 创建仓库任务
    const task = await prisma.warehouseTask.create({
      data: {
        shopId,
        categoryId,
        productId,
        totalQuantity,
        progress,
        type,
        status: 'PENDING',
        operatorId: user.id,
      },
      include: {
        shop: {
          select: { id: true, shopName: true, shopCode: true },
        },
        category: {
          select: { id: true, categoryName: true },
        },
        product: {
          select: { id: true, code: true, specification: true, sku: true },
        },
        operator: {
          select: { id: true, username: true, realName: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Create warehouse task error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
