// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/v1/products - 获取产品列表
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
    const code = searchParams.get('code');
    const sku = searchParams.get('sku');

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};
    if (shopId) where.shopId = shopId;
    if (categoryId) where.categoryId = categoryId;
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

    // 获取产品信息列表和总数
    const [products, total] = await Promise.all([
      prisma.productInfo.findMany({
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
      prisma.productInfo.count({ where }),
    ]);

    return NextResponse.json({
      code: 0,
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
    console.error('获取产品信息列表失败:', error);
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
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const body = await request.json();
    const {
      shopId,
      categoryId,
      code,
      specification,
      color,
      setQuantity,
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
      return NextResponse.json({ code: 400, msg: '缺少必要参数' }, { status: 400 });
    }

    // 验证关联数据是否存在
    const [shop, category] = await Promise.all([
      prisma.shop.findUnique({ where: { id: shopId } }),
      prisma.productCategory.findUnique({ where: { id: categoryId } }),
    ]);

    if (!shop) {
      return NextResponse.json({ code: 400, msg: '店铺不存在' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ code: 400, msg: '产品分类不存在' }, { status: 400 });
    }

    // 检查SKU是否已存在
    const existingProduct = await prisma.productInfo.findUnique({
      where: { sku },
    });

    if (existingProduct) {
      return NextResponse.json({ code: 400, msg: 'SKU已存在' }, { status: 400 });
    }

    // 创建产品信息
    const product = await prisma.productInfo.create({
      data: {
        shopId,
        categoryId,
        code,
        specification: specification || null,
        color: color || null,
        setQuantity: setQuantity || 1,
        internalSize: internalSize || null,
        externalSize: externalSize || null,
        weight: weight ? parseFloat(weight) : null,
        sku,
        label: label || null,
        codeFileUrl: codeFileUrl || null,
        imageUrl: imageUrl || null,
        styleInfo: styleInfo || null,
        accessoryInfo: accessoryInfo || null,
        remark: remark || null,
        operatorId: user.id,
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
      code: 0,
      msg: '创建成功',
      data: product,
    });
  } catch (error) {
    console.error('创建产品信息失败:', error);
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
