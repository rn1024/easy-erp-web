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
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        entityResources: {
          where: {
            entityType: 'PRODUCT_INFO'
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        costs: {
          orderBy: {
            createdAt: 'asc'
          }
        },
      },
    });

    if (!product) {
      return NextResponse.json({ code: 404, msg: '产品信息不存在' }, { status: 404 });
    }

    // 为产品添加 accessoryImages 字段映射
    const productWithAccessoryImages = {
      ...product,
      accessoryImages: product.entityResources || []
    };

    return NextResponse.json({
      code: 0,
      msg: '产品更新成功',
      data: productWithAccessoryImages,
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
      name,
      specification,
      color,
      setQuantity,
      internalSize,
      externalSize,
      weight,
      sku,
      asin,

      codeFileUrl,
      styleInfo,
      accessoryInfo,
      remark,
      // 新增包装相关字段
      packageType,
      packageOuterSize,
      packageInnerSize,
      packageWeight,
      outerBoxSize,
      // 新增标签文件字段
      labelFileUrl,
      // 产品图片数据
      productImages,
      // 配件图片资源
      accessoryImages,
      // 产品成本数据
      costs,
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

    // 使用事务处理产品信息更新和EntityResource同步
    const product = await prisma.$transaction(async (tx) => {
      // 更新产品信息
      const updatedProduct = await tx.productInfo.update({
        where: { id },
        data: {
          ...(shopId && { shopId }),
          ...(categoryId && { categoryId }),
          ...(code && { code }),
          ...(name !== undefined && { name }),
          ...(specification !== undefined && { specification }),
          ...(color !== undefined && { color }),
          ...(setQuantity !== undefined && { setQuantity }),
          ...(internalSize !== undefined && { internalSize }),
          ...(externalSize !== undefined && { externalSize }),
          ...(weight !== undefined && { weight: weight ? parseFloat(weight) : null }),
          ...(sku && { sku }),
          ...(asin !== undefined && { asin }),

          ...(codeFileUrl !== undefined && { codeFileUrl }),
          ...(styleInfo !== undefined && { styleInfo }),
          ...(accessoryInfo !== undefined && { accessoryInfo }),
          ...(remark !== undefined && { remark }),
          // 新增包装相关字段
          ...(packageType !== undefined && { packageType }),
          ...(packageOuterSize !== undefined && { packageOuterSize }),
          ...(packageInnerSize !== undefined && { packageInnerSize }),
          ...(packageWeight !== undefined && { packageWeight }),
          ...(outerBoxSize !== undefined && { outerBoxSize }),
          // 新增标签文件字段
          ...(labelFileUrl !== undefined && { labelFileUrl }),
        },
      });

      // 处理产品图片
      if (productImages !== undefined) {
        // 删除现有的产品图片
        await tx.productImage.deleteMany({
          where: {
            productId: id,
          },
        });

        // 添加新的产品图片
        if (productImages && productImages.length > 0) {
          await tx.productImage.createMany({
            data: productImages.map((image: any, index: number) => ({
              productId: id,
              imageUrl: image.imageUrl,
              fileName: image.fileName || null,
              fileSize: image.fileSize || 0,
              sortOrder: image.sortOrder || index + 1,
              isCover: image.isCover || false,
            })),
          });
        }
      }

      // 处理配件图片资源
      if (accessoryImages !== undefined) {
        // 删除现有的配件图片资源
        await tx.entityResource.deleteMany({
          where: {
            entityType: 'PRODUCT_INFO',
            entityId: id,
          },
        });

        // 添加新的配件图片资源
        if (accessoryImages && accessoryImages.length > 0) {
          await tx.entityResource.createMany({
            data: accessoryImages.map((image: any) => ({
              entityType: 'PRODUCT_INFO',
              entityId: id,
              resourceUrl: image.resourceUrl,
              fileName: image.fileName || null,
            })),
          });
        }
      }

      // 处理产品成本数据
      if (costs !== undefined) {
        // 删除现有的成本数据
        await tx.productCost.deleteMany({
          where: {
            productId: id,
          },
        });

        // 添加新的成本数据
        if (costs && costs.length > 0) {
          await tx.productCost.createMany({
            data: costs.map((cost: any) => ({
              productId: id,
              costInfo: cost.costInfo || '',
              price: cost.price || '',
              unit: cost.unit || '',
              supplier: cost.supplier || '',
            })),
          });
        }
      }

      return updatedProduct;
    });

    // 获取完整的产品信息（包含关联数据）
    const productWithRelations = await prisma.productInfo.findUnique({
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
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        entityResources: {
          where: {
            entityType: 'PRODUCT_INFO'
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        costs: {
          orderBy: {
            createdAt: 'asc'
          }
        },
      },
    });

    // 为产品添加 accessoryImages 字段映射
    const productWithAccessoryImages = {
      ...productWithRelations,
      accessoryImages: productWithRelations?.entityResources || []
    };

    return NextResponse.json({
      code: 0,
      msg: '更新成功',
      data: productWithAccessoryImages,
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
      code: 0,
      msg: '产品删除成功',
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
