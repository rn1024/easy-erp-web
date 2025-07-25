import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 获取散件库存详情
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ code: 400, msg: '缺少必要参数' }, { status: 400 });
    }

    const inventory = await prisma.spareInventory.findUnique({
      where: { id },
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

    if (!inventory) {
      return NextResponse.json({ code: 404, msg: '库存记录不存在' }, { status: 404 });
    }

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: inventory,
    });
  } catch (error) {
    console.error('获取散件库存详情失败:', error);
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

// 更新散件库存
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { shopId, categoryId, productId, spareType, location, quantity } = body;

    if (!id) {
      return NextResponse.json({ code: 400, msg: '缺少必要参数' }, { status: 400 });
    }

    // 检查库存记录是否存在
    const existingInventory = await prisma.spareInventory.findUnique({
      where: { id },
    });

    if (!existingInventory) {
      return NextResponse.json({ code: 404, msg: '库存记录不存在' }, { status: 404 });
    }

    // 如果要更新关联数据，验证其是否存在
    if (shopId || categoryId || productId) {
      const [shop, category, product] = await Promise.all([
        shopId ? prisma.shop.findUnique({ where: { id: shopId } }) : null,
        categoryId ? prisma.productCategory.findUnique({ where: { id: categoryId } }) : null,
        productId ? prisma.productInfo.findUnique({ where: { id: productId } }) : null,
      ]);

      if (shopId && !shop) {
        return NextResponse.json({ code: 400, msg: '店铺不存在' }, { status: 400 });
      }

      if (categoryId && !category) {
        return NextResponse.json({ code: 400, msg: '产品分类不存在' }, { status: 400 });
      }

      if (productId && !product) {
        return NextResponse.json({ code: 400, msg: '产品不存在' }, { status: 400 });
      }
    }

    // 检查是否与其他记录冲突
    const conflictInventory = await prisma.spareInventory.findFirst({
      where: {
        id: { not: id },
        shopId: shopId || existingInventory.shopId,
        productId: productId || existingInventory.productId,
        spareType: spareType !== undefined ? spareType || null : existingInventory.spareType,
        location: location !== undefined ? location || null : existingInventory.location,
      },
    });

    if (conflictInventory) {
      return NextResponse.json(
        { code: 400, msg: '该位置已存在相同的散件库存记录' },
        { status: 400 }
      );
    }

    // 更新库存记录
    const inventory = await prisma.spareInventory.update({
      where: { id },
      data: {
        ...(shopId && { shopId }),
        ...(categoryId && { categoryId }),
        ...(productId && { productId }),
        ...(spareType !== undefined && { spareType: spareType || null }),
        ...(location !== undefined && { location: location || null }),
        ...(quantity !== undefined && { quantity }),
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
      code: 200,
      msg: '更新成功',
      data: inventory,
    });
  } catch (error) {
    console.error('更新散件库存失败:', error);
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

// 删除散件库存
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ code: 400, msg: '缺少必要参数' }, { status: 400 });
    }

    // 检查库存记录是否存在
    const existingInventory = await prisma.spareInventory.findUnique({
      where: { id },
    });

    if (!existingInventory) {
      return NextResponse.json({ code: 404, msg: '库存记录不存在' }, { status: 404 });
    }

    // 删除库存记录
    await prisma.spareInventory.delete({
      where: { id },
    });

    return NextResponse.json({
      code: 200,
      msg: '删除成功',
      data: null,
    });
  } catch (error) {
    console.error('删除散件库存失败:', error);
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
