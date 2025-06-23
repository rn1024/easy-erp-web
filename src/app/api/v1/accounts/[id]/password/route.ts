import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// PUT /api/v1/accounts/[id]/password - 修改账户密码
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { old_password, new_password } = body;

    // 验证必填字段
    if (!old_password || !new_password) {
      return NextResponse.json(
        {
          code: 1,
          msg: '缺少必填字段',
          data: null,
        },
        { status: 400 }
      );
    }

    // 检查新密码长度
    if (new_password.length < 6) {
      return NextResponse.json(
        {
          code: 1,
          msg: '新密码长度至少6位',
          data: null,
        },
        { status: 400 }
      );
    }

    // 检查账户是否存在
    const existingAccount = await prisma.account.findUnique({
      where: { id },
    });

    if (!existingAccount) {
      return NextResponse.json(
        {
          code: 1,
          msg: '账户不存在',
          data: null,
        },
        { status: 404 }
      );
    }

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(old_password, existingAccount.password);
    if (!isOldPasswordValid) {
      return NextResponse.json(
        {
          code: 1,
          msg: '旧密码错误',
          data: null,
        },
        { status: 400 }
      );
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(new_password, 12);

    // 更新密码
    await prisma.account.update({
      where: { id },
      data: {
        password: hashedNewPassword,
      },
    });

    return NextResponse.json({
      code: 0,
      msg: '密码修改成功',
      data: null,
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    return NextResponse.json(
      {
        code: 1,
        msg: '服务器内部错误',
        data: null,
      },
      { status: 500 }
    );
  }
}
