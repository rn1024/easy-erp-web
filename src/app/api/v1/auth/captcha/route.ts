import { NextRequest, NextResponse } from 'next/server';

import { redisService } from '@/lib/redis';

// 生成随机验证码
function generateCaptcha(): string {
  // 简单的4位数字验证码
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// 生成随机key
function generateKey(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function GET(request: NextRequest) {
  try {
    const captchaCode = generateCaptcha();
    const key = generateKey();

    // 将验证码存储到Redis，有效期5分钟
    await redisService.set(`captcha:${key}`, { code: captchaCode.toLowerCase() }, 300);

    // 返回验证码信息
    return NextResponse.json({
      code: 0,
      msg: '验证码生成成功',
      data: {
        key,
        captcha: captchaCode,
        // 在测试环境中直接返回验证码，生产环境应该返回图片
        image: `data:image/svg+xml;base64,${Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40">
            <text x="20" y="25" font-family="Arial" font-size="20" fill="black">${captchaCode}</text>
          </svg>`
        ).toString('base64')}`,
      },
    });
  } catch (error: any) {
    console.error('Captcha generation error:', error);
    return NextResponse.json({ code: 1, msg: '验证码生成失败', data: null }, { status: 500 });
  }
}
