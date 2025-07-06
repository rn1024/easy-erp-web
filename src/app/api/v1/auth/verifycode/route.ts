import { NextRequest, NextResponse } from 'next/server';
import { SimpleCaptchaService } from '@/lib/simple-captcha';
import { ApiResponse } from '@/lib/middleware';

// 禁用Next.js缓存，确保每次都生成新的验证码
export const dynamic = 'force-dynamic';

// GET /api/v1/auth/verifycode - 获取验证码
export async function GET(request: NextRequest) {
  try {
    // 使用简化的验证码服务生成验证码
    const result = await SimpleCaptchaService.generateCaptcha();

    console.log('Captcha generated successfully:', { key: result.key });

    return ApiResponse.success(
      {
        key: result.key,
        captcha: result.captcha,
      },
      '验证码生成成功'
    );
  } catch (error) {
    console.error('Generate captcha error:', error);
    return ApiResponse.serverError('验证码生成失败');
  }
}
