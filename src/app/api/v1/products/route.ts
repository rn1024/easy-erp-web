// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRequestToken } from '@/lib/auth';

// GET /api/v1/products - 获取产品列表
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
    const code = searchParams.get('code');
    const sku = searchParams.get('sku');

    // 构建查询条件
    const where: any = {};
    if (shopId) {
      where.shopId = shopId;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (code) {
      where.code = {
        contains: code,
      };
    }
    if (sku) {
      where.sku = {
        contains: sku,
      };
    }

    // 获取总数
    const total = await prisma.productInfo.count({ where });

    // 获取分页数据
    const products = await prisma.productInfo.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        createdAt: 'desc',
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
        operator: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            finishedInventory: true,
            spareInventory: true,
          },
        },
      },
    });

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: {
        list: products,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取产品列表失败:', error);
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

// POST /api/v1/products - 创建产品
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
      code,
      specification,
      color,
      setQuantity = 1,
      internalSize,
      externalSize,
      weight,
      sku,
      label,
      codeFileUrl,
      imageUrl,
      styleInfo,
      accessoryInfo,
      remark,
    } = body;

    // 验证必填字段
    if (!shopId || !categoryId || !code || !sku) {
      return NextResponse.json(
        { code: 400, msg: '店铺、分类、产品编码和SKU不能为空', data: null },
        { status: 400 }
      );
    }

    // 检查SKU是否已存在
    const existingProduct = await prisma.productInfo.findUnique({
      where: { sku },
    });

    if (existingProduct) {
      return NextResponse.json({ code: 400, msg: 'SKU已存在', data: null }, { status: 400 });
    }

    // 检查店铺和分类是否存在
    const [shop, category] = await Promise.all([
      prisma.shop.findUnique({ where: { id: shopId } }),
      prisma.productCategory.findUnique({ where: { id: categoryId } }),
    ]);

    if (!shop) {
      return NextResponse.json({ code: 400, msg: '店铺不存在', data: null }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ code: 400, msg: '产品分类不存在', data: null }, { status: 400 });
    }

    // 创建产品
    const product = await prisma.productInfo.create({
      data: {
        shopId,
        categoryId,
        code,
        specification,
        color,
        setQuantity,
        internalSize,
        externalSize,
        weight: weight ? parseFloat(weight) : null,
        sku,
        label,
        codeFileUrl,
        imageUrl,
        styleInfo,
        accessoryInfo,
        remark,
        operatorId: tokenPayload.id,
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
        operator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      code: 200,
      msg: '创建成功',
      data: product,
    });
  } catch (error) {
    console.error('创建产品失败:', error);
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
