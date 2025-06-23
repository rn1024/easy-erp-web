// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRequestToken } from '@/lib/auth';

// GET /api/v1/product-categories/[id] - 获取产品分类详情
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证用户权限
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { id } = params;

    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            finishedInventory: true,
            spareInventory: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ code: 404, msg: '产品分类不存在', data: null }, { status: 404 });
    }

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: category,
    });
  } catch (error) {
    console.error('获取产品分类详情失败:', error);
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

// PUT /api/v1/product-categories/[id] - 更新产品分类
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证用户权限
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { name } = body;

    // 验证必填字段
    if (!name) {
      return NextResponse.json({ code: 400, msg: '分类名称不能为空', data: null }, { status: 400 });
    }

    // 检查分类是否存在
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ code: 404, msg: '产品分类不存在', data: null }, { status: 404 });
    }

    // 检查新名称是否与其他分类重复
    if (name !== existingCategory.name) {
      const duplicateCategory = await prisma.productCategory.findUnique({
        where: { name },
      });

      if (duplicateCategory) {
        return NextResponse.json({ code: 400, msg: '分类名称已存在', data: null }, { status: 400 });
      }
    }

    // 更新产品分类
    const updatedCategory = await prisma.productCategory.update({
      where: { id },
      data: {
        name,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return NextResponse.json({
      code: 200,
      msg: '更新成功',
      data: updatedCategory,
    });
  } catch (error) {
    console.error('更新产品分类失败:', error);
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

// DELETE /api/v1/product-categories/[id] - 删除产品分类
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证用户权限
    const tokenPayload = verifyRequestToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { id } = params;

    // 检查分类是否存在
    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ code: 404, msg: '产品分类不存在', data: null }, { status: 404 });
    }

    // 检查是否有关联产品
    if (category._count.products > 0) {
      return NextResponse.json(
        { code: 400, msg: '该分类下还有产品，无法删除', data: null },
        { status: 400 }
      );
    }

    // 删除产品分类
    await prisma.productCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      code: 200,
      msg: '删除成功',
      data: null,
    });
  } catch (error) {
    console.error('删除产品分类失败:', error);
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
