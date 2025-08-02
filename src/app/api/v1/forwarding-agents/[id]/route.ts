// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// 获取货代详情
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ code: 400, msg: '货代ID不能为空' }, { status: 400 });
    }

    const forwarder = await prisma.forwarder.findUnique({
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

    if (!forwarder) {
      return NextResponse.json({ code: 404, msg: '货代不存在' }, { status: 404 });
    }

    return NextResponse.json({
      code: 0,
      msg: '获取货代详情成功',
      data: forwarder,
    });
  } catch (error) {
    console.error('获取货代详情失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
});

// 更新货代
export const PUT = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ code: 400, msg: '货代ID不能为空' }, { status: 400 });
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
      remark,
    } = body;

    // 检查货代是否存在
    const existingForwarder = await prisma.forwarder.findUnique({
      where: { id },
    });

    if (!existingForwarder) {
      return NextResponse.json({ code: 404, msg: '货代不存在' }, { status: 404 });
    }

    // 如果昵称发生变化，检查新昵称是否已被其他货代使用
    if (nickname && nickname !== existingForwarder.nickname) {
      const duplicateForwarder = await prisma.forwarder.findFirst({
        where: {
          nickname,
          id: { not: id },
        },
      });

      if (duplicateForwarder) {
        return NextResponse.json({ code: 400, msg: '货代昵称已存在' }, { status: 400 });
      }
    }

    // 如果信用代码发生变化，检查是否重复
    if (creditCode && creditCode !== existingForwarder.creditCode) {
      const duplicateCreditCode = await prisma.forwarder.findFirst({
        where: {
          creditCode,
          id: { not: id },
        },
      });

      if (duplicateCreditCode) {
        return NextResponse.json({ code: 400, msg: '统一社会信用代码已存在' }, { status: 400 });
      }
    }

    // 更新货代
    const forwarder = await prisma.forwarder.update({
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
      code: 0,
      msg: '货代更新成功',
      data: forwarder,
    });
  } catch (error) {
    console.error('更新货代失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
});

// 删除货代
export const DELETE = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ code: 400, msg: '货代ID不能为空' }, { status: 400 });
    }

    // 检查货代是否存在
    const existingForwarder = await prisma.forwarder.findUnique({
      where: { id },
    });

    if (!existingForwarder) {
      return NextResponse.json({ code: 404, msg: '货代不存在' }, { status: 404 });
    }

    // 检查货代是否有关联数据
    const relatedData = await prisma.shipmentProductRecord.findFirst({
      where: { forwarderId: id },
    });

    if (relatedData) {
      return NextResponse.json(
        { code: 400, msg: '该货代有关联的发货记录，无法删除' },
        { status: 400 }
      );
    }

    // 删除货代
    await prisma.forwarder.delete({
      where: { id },
    });

    return NextResponse.json({
      code: 0,
      msg: '货代删除成功',
      data: null,
    });
  } catch (error) {
    console.error('删除货代失败:', error);
    return NextResponse.json({ code: 500, msg: '服务器内部错误' }, { status: 500 });
  }
});
