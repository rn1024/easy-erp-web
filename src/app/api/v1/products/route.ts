// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// GET /api/v1/products - 获取产品列表
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    console.log('=== 产品列表API开始 ===');
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const shopId = searchParams.get('shopId');
    const categoryId = searchParams.get('categoryId');
    const code = searchParams.get('code');
    const sku = searchParams.get('sku');
    const asin = searchParams.get('asin');
    
    console.log('查询参数:', { page, pageSize, shopId, categoryId, code, sku, asin });

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
    if (asin) {
      where.asin = {
        contains: asin,
      };
    }

    // 获取产品信息列表和总数
    console.log('数据库查询条件:', where);
    console.log('分页参数:', { skip, take: pageSize });
    
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
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.productInfo.count({ where }),
    ]);
    
    console.log('查询结果:', {
      productsCount: products.length,
      total,
      firstProductCosts: products[0]?.costs || 'no products',
      sampleProduct: products[0] ? {
        id: products[0].id,
        name: products[0].name,
        costsLength: products[0].costs?.length || 0
      } : 'no products'
    });

    // 为每个产品添加 accessoryImages 字段映射
    const productsWithAccessoryImages = products.map(product => ({
      ...product,
      accessoryImages: product.entityResources || []
    }));

    return NextResponse.json({
      code: 0,
      msg: '获取成功',
      data: {
        list: productsWithAccessoryImages,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('=== 产品列表API错误 ===');
    console.error('错误详情:', error);
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'Unknown error');
    console.error('错误消息:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      {
        code: 500,
        msg: '服务器内部错误',
        data: null,
      },
      { status: 500 }
    );
  }
});

// POST /api/v1/products - 创建产品
export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
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

      codeFileUrl,
      imageUrl,
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

    // 验证必填字段
    if (!shopId || !categoryId) {
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

    // 检查SKU是否已存在（仅当SKU不为空时）
    if (sku) {
      const existingProduct = await prisma.productInfo.findUnique({
        where: { sku },
      });

      if (existingProduct) {
        return NextResponse.json({ code: 400, msg: 'SKU已存在' }, { status: 400 });
      }
    }

    // 使用事务创建产品信息和EntityResource
    const product = await prisma.$transaction(async (tx) => {
      // 创建产品信息
      const newProduct = await tx.productInfo.create({
        data: {
          shopId,
          categoryId,
          code,
          name: name || null,
          specification: specification || null,
          color: color || null,
          setQuantity: setQuantity || 1,
          internalSize: internalSize || null,
          externalSize: externalSize || null,
          weight: weight ? parseFloat(weight) : null,
          sku,

          codeFileUrl: codeFileUrl || null,
          styleInfo: styleInfo || null,
          accessoryInfo: accessoryInfo || null,
          remark: remark || null,
          // 新增包装相关字段
          packageType: packageType || null,
          packageOuterSize: packageOuterSize || null,
          packageInnerSize: packageInnerSize || null,
          packageWeight: packageWeight || null,
          outerBoxSize: outerBoxSize || null,
          // 新增标签文件字段
          labelFileUrl: labelFileUrl || null,
          operatorId: user.id,
        },
      });

      // 添加产品图片
      if (productImages && productImages.length > 0) {
        await tx.productImage.createMany({
          data: productImages.map((image: any, index: number) => ({
            productId: newProduct.id,
            imageUrl: image.imageUrl,
            fileName: image.fileName || null,
            fileSize: image.fileSize || 0,
            sortOrder: image.sortOrder || index + 1,
            isCover: image.isCover || false,
          })),
        });
      }

      // 添加配件图片资源
      if (accessoryImages && accessoryImages.length > 0) {
        await tx.entityResource.createMany({
          data: accessoryImages.map((image: any) => ({
            entityType: 'PRODUCT_INFO',
            entityId: newProduct.id,
            resourceUrl: image.resourceUrl,
            fileName: image.fileName || null,
          })),
        });
      }

      // 添加产品成本数据
      if (costs && costs.length > 0) {
        await tx.productCost.createMany({
          data: costs.map((cost: any) => ({
            productId: newProduct.id,
            costInfo: cost.costInfo || '',
            price: cost.price || '',
            unit: cost.unit || '',
            supplier: cost.supplier || '',
          })),
        });
      }

      return newProduct;
    });

    // 获取完整的产品信息（包含关联数据）
    const productWithRelations = await prisma.productInfo.findUnique({
      where: { id: product.id },
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

    return NextResponse.json({
      code: 0,
      msg: '创建成功',
      data: productWithRelations,
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
});
