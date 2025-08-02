// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/v1/product-categories/[id] - 获取产品分类详情
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

    const category = await prisma.productCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json({ code: 404, msg: '产品分类不存在' }, { status: 404 });
    }

    return NextResponse.json({
      code: 0,
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
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { name } = body;

    if (!id) {
      return NextResponse.json({ code: 400, msg: '缺少必要参数' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ code: 400, msg: '分类名称不能为空' }, { status: 400 });
    }

    // 检查分类是否存在
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ code: 404, msg: '产品分类不存在' }, { status: 404 });
    }

    // 检查名称是否被其他分类使用
    const nameConflict = await prisma.productCategory.findFirst({
      where: {
        id: { not: id },
        name: {
          equals: name.trim(),
        },
      },
    });

    if (nameConflict) {
      return NextResponse.json({ code: 400, msg: '分类名称已存在' }, { status: 400 });
    }

    // 更新产品分类
    const category = await prisma.productCategory.update({
      where: { id },
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json({
      code: 0,
      msg: '更新成功',
      data: category,
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
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ code: 400, msg: '缺少必要参数' }, { status: 400 });
    }

    // 检查分类是否存在
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ code: 404, msg: '产品分类不存在' }, { status: 404 });
    }

    // 检查是否有产品使用此分类
    const productsCount = await prisma.productInfo.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      return NextResponse.json({ code: 400, msg: '该分类下存在产品，无法删除' }, { status: 400 });
    }

    // 删除产品分类
    await prisma.productCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      code: 0,
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
