// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// 获取供应商详情
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ code: 400, msg: '供应商ID不能为空' }, { status: 400 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ code: 404, msg: '供应商不存在' }, { status: 404 });
    }

    return NextResponse.json({
      code: 200,
      msg: '获取供应商详情成功',
      data: supplier,
    });
  } catch (error) {
    console.error('获取供应商详情失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
});

// 更新供应商
export const PUT = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ code: 400, msg: '供应商ID不能为空' }, { status: 400 });
    }

    const body = await request.json();
    const {
      nickname,
      avatarUrl,
      contactPerson,
      contactPhone,
      companyName,
      creditCode,
      bankName,
      bankAccount,
      bankAddress,
      productionDays,
      deliveryDays,
      remark,
    } = body;

    // 检查供应商是否存在
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return NextResponse.json({ code: 404, msg: '供应商不存在' }, { status: 404 });
    }

    // 如果昵称发生变化，检查新昵称是否已被其他供应商使用
    if (nickname && nickname !== existingSupplier.nickname) {
      const duplicateSupplier = await prisma.supplier.findFirst({
        where: {
          nickname,
          id: { not: id },
        },
      });

      if (duplicateSupplier) {
        return NextResponse.json({ code: 400, msg: '供应商昵称已存在' }, { status: 400 });
      }
    }

    // 如果信用代码发生变化，检查是否重复
    if (creditCode && creditCode !== existingSupplier.creditCode) {
      const duplicateCreditCode = await prisma.supplier.findFirst({
        where: {
          creditCode,
          id: { not: id },
        },
      });

      if (duplicateCreditCode) {
        return NextResponse.json({ code: 400, msg: '统一社会信用代码已存在' }, { status: 400 });
      }
    }

    // 更新供应商
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(nickname && { nickname }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(contactPerson && { contactPerson }),
        ...(contactPhone && { contactPhone }),
        ...(companyName && { companyName }),
        ...(creditCode !== undefined && { creditCode }),
        ...(bankName !== undefined && { bankName }),
        ...(bankAccount !== undefined && { bankAccount }),
        ...(bankAddress !== undefined && { bankAddress }),
        ...(productionDays !== undefined && { productionDays }),
        ...(deliveryDays !== undefined && { deliveryDays }),
        ...(remark !== undefined && { remark }),
      },
      include: {
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
      msg: '供应商更新成功',
      data: supplier,
    });
  } catch (error) {
    console.error('更新供应商失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
});

// 删除供应商
export const DELETE = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ code: 400, msg: '供应商ID不能为空' }, { status: 400 });
    }

    // 检查供应商是否存在
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return NextResponse.json({ code: 404, msg: '供应商不存在' }, { status: 404 });
    }

    // 检查供应商是否有关联数据
    const relatedData = await prisma.purchaseOrder.findFirst({
      where: { supplierId: id },
    });

    if (relatedData) {
      return NextResponse.json(
        { code: 400, msg: '该供应商有关联的采购订单，无法删除' },
        { status: 400 }
      );
    }

    // 删除供应商
    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json({
      code: 200,
      msg: '供应商删除成功',
      data: null,
    });
  } catch (error) {
    console.error('删除供应商失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
});
