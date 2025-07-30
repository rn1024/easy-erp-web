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

    // 在开发环境下，为了方便测试，可以返回验证码文本
    const isDevelopment = process.env.NODE_ENV === 'development';
    const responseData: any = {
      key: result.key,
      captcha: result.captcha,
    };

    // 开发环境下添加验证码文本用于测试
    if (isDevelopment) {
      // 从Redis中获取验证码文本
      const { redisService } = await import('@/lib/redis');
      const redisKey = `captcha:${result.key}`;
      const stored = await redisService.get<{ code: string }>(redisKey);
      if (stored) {
        responseData.text = stored.code; // 返回验证码文本（小写，与存储格式一致）
      }
    }

    return ApiResponse.success(
      responseData,
      '验证码生成成功'
    );
  } catch (error) {
    console.error('Generate captcha error:', error);
    return ApiResponse.serverError('验证码生成失败');
  }
}
