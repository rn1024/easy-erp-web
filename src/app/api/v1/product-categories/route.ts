// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/v1/product-categories - 获取产品分类列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const name = searchParams.get('name');

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};
    if (name) {
      where.name = {
        contains: name,
      };
    }

    // 获取产品分类列表和总数
    const [categories, total] = await Promise.all([
      prisma.productCategory.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.productCategory.count({ where }),
    ]);

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: {
        list: categories,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取产品分类列表失败:', error);
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

// POST /api/v1/product-categories - 创建产品分类
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    // 验证必填字段
    if (!name) {
      return NextResponse.json({ code: 400, msg: '分类名称不能为空' }, { status: 400 });
    }

    // 检查分类名称是否已存在
    const existingCategory = await prisma.productCategory.findFirst({
      where: {
        name: {
          equals: name.trim(),
        },
      },
    });

    if (existingCategory) {
      return NextResponse.json({ code: 400, msg: '分类名称已存在' }, { status: 400 });
    }

    // 创建产品分类
    const category = await prisma.productCategory.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json({
      code: 200,
      msg: '创建成功',
      data: category,
    });
  } catch (error) {
    console.error('创建产品分类失败:', error);
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
