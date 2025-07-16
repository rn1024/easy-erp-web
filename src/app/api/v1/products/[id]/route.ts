import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 获取产品信息详情
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

    const product = await prisma.productInfo.findUnique({
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
        operator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ code: 404, msg: '产品信息不存在' }, { status: 404 });
    }

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: product,
    });
  } catch (error) {
    console.error('获取产品信息详情失败:', error);
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

// 更新产品信息
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { id } = params;
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

    if (!id) {
      return NextResponse.json({ code: 400, msg: '缺少必要参数' }, { status: 400 });
    }

    // 检查产品是否存在
    const existingProduct = await prisma.productInfo.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ code: 404, msg: '产品信息不存在' }, { status: 404 });
    }

    // 如果要更新关联数据，验证其是否存在
    if (shopId || categoryId) {
      const [shop, category] = await Promise.all([
        shopId ? prisma.shop.findUnique({ where: { id: shopId } }) : null,
        categoryId ? prisma.productCategory.findUnique({ where: { id: categoryId } }) : null,
      ]);

      if (shopId && !shop) {
        return NextResponse.json({ code: 400, msg: '店铺不存在' }, { status: 400 });
      }

      if (categoryId && !category) {
        return NextResponse.json({ code: 400, msg: '产品分类不存在' }, { status: 400 });
      }
    }

    // 如果要更新SKU，检查是否与其他产品冲突
    if (sku && sku !== existingProduct.sku) {
      const skuConflict = await prisma.productInfo.findUnique({
        where: { sku },
      });

      if (skuConflict) {
        return NextResponse.json({ code: 400, msg: 'SKU已存在' }, { status: 400 });
      }
    }

    // 更新产品信息
    const product = await prisma.productInfo.update({
      where: { id },
      data: {
        ...(shopId && { shopId }),
        ...(categoryId && { categoryId }),
        ...(code && { code }),
        ...(specification !== undefined && { specification }),
        ...(color !== undefined && { color }),
        ...(setQuantity !== undefined && { setQuantity }),
        ...(internalSize !== undefined && { internalSize }),
        ...(externalSize !== undefined && { externalSize }),
        ...(weight !== undefined && { weight: weight ? parseFloat(weight) : null }),
        ...(sku && { sku }),
        ...(label !== undefined && { label }),
        ...(codeFileUrl !== undefined && { codeFileUrl }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(styleInfo !== undefined && { styleInfo }),
        ...(accessoryInfo !== undefined && { accessoryInfo }),
        ...(remark !== undefined && { remark }),
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
      msg: '更新成功',
      data: product,
    });
  } catch (error) {
    console.error('更新产品信息失败:', error);
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

// 删除产品信息
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

    // 检查产品是否存在
    const existingProduct = await prisma.productInfo.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ code: 404, msg: '产品信息不存在' }, { status: 404 });
    }

    // 检查是否有相关业务数据
    const [finishedInventoryCount, spareInventoryCount, purchaseOrderItemCount] = await Promise.all(
      [
        prisma.finishedInventory.count({ where: { productId: id } }),
        prisma.spareInventory.count({ where: { productId: id } }),
        prisma.productItem.count({
          where: {
            productId: id,
            relatedType: 'PURCHASE_ORDER',
          },
        }),
      ]
    );

    if (finishedInventoryCount > 0 || spareInventoryCount > 0 || purchaseOrderItemCount > 0) {
      return NextResponse.json(
        { code: 400, msg: '该产品存在相关业务数据，无法删除' },
        { status: 400 }
      );
    }

    // 删除产品信息
    await prisma.productInfo.delete({
      where: { id },
    });

    return NextResponse.json({
      code: 200,
      msg: '删除成功',
      data: null,
    });
  } catch (error) {
    console.error('删除产品信息失败:', error);
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
