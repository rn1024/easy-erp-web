// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRequestToken } from '@/lib/auth';

// GET /api/v1/products/[id] - 获取产品详情
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证用户权限
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { id } = params;

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
        finishedInventory: {
          select: {
            id: true,
            boxSize: true,
            packQuantity: true,
            weight: true,
            location: true,
            stockQuantity: true,
          },
        },
        spareInventory: {
          select: {
            id: true,
            spareType: true,
            location: true,
            quantity: true,
          },
        },
        _count: {
          select: {
            purchaseOrders: true,
            warehouseTasks: true,
            deliveryRecords: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ code: 404, msg: '产品不存在', data: null }, { status: 404 });
    }

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: product,
    });
  } catch (error) {
    console.error('获取产品详情失败:', error);
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

// PUT /api/v1/products/[id] - 更新产品
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证用户权限
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
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

    // 检查产品是否存在
    const existingProduct = await prisma.productInfo.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ code: 404, msg: '产品不存在', data: null }, { status: 404 });
    }

    // 验证必填字段
    if (!shopId || !categoryId || !code || !sku) {
      return NextResponse.json(
        { code: 400, msg: '店铺、分类、产品编码和SKU不能为空', data: null },
        { status: 400 }
      );
    }

    // 检查新SKU是否与其他产品重复
    if (sku !== existingProduct.sku) {
      const duplicateProduct = await prisma.productInfo.findUnique({
        where: { sku },
      });

      if (duplicateProduct) {
        return NextResponse.json({ code: 400, msg: 'SKU已存在', data: null }, { status: 400 });
      }
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

    // 更新产品
    const updatedProduct = await prisma.productInfo.update({
      where: { id },
      data: {
        shopId,
        categoryId,
        code,
        specification,
        color,
        setQuantity: setQuantity || 1,
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
        updatedAt: new Date(),
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
      data: updatedProduct,
    });
  } catch (error) {
    console.error('更新产品失败:', error);
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

// DELETE /api/v1/products/[id] - 删除产品
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证用户权限
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { id } = params;

    // 检查产品是否存在并获取关联数据
    const product = await prisma.productInfo.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            finishedInventory: true,
            spareInventory: true,
            purchaseOrders: true,
            warehouseTasks: true,
            deliveryRecords: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ code: 404, msg: '产品不存在', data: null }, { status: 404 });
    }

    // 检查是否有关联数据
    const relatedCount =
      product._count.finishedInventory +
      product._count.spareInventory +
      product._count.purchaseOrders +
      product._count.warehouseTasks +
      product._count.deliveryRecords;

    if (relatedCount > 0) {
      return NextResponse.json(
        { code: 400, msg: '该产品还有关联的库存、订单或任务记录，无法删除', data: null },
        { status: 400 }
      );
    }

    // 删除产品
    await prisma.productInfo.delete({
      where: { id },
    });

    return NextResponse.json({
      code: 200,
      msg: '删除成功',
      data: null,
    });
  } catch (error) {
    console.error('删除产品失败:', error);
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
