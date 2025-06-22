import { v4 as uuidv4 } from 'uuid';
import { redisService } from './redis';

// 验证码配置
const CAPTCHA_CONFIG = {
  width: 120,
  height: 40,
  length: 4,
  fontSize: 24,
  expiresIn: 10 * 60, // 10分钟，单位秒（Redis TTL）
};

// Redis键前缀
const CAPTCHA_KEY_PREFIX = 'captcha:';

// 验证码结果接口
export interface CaptchaResult {
  key: string;
  captcha: string; // Base64图片
}

// 简单的验证码生成服务
export class SimpleCaptchaService {
  // 生成随机验证码字符串
  private static generateCode(length: number = CAPTCHA_CONFIG.length): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 生成简单的SVG验证码图片
  private static generateSVGCaptcha(code: string): string {
    const { width, height, fontSize } = CAPTCHA_CONFIG;

    // 生成随机颜色
    const getRandomColor = () => {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F06292'];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    // 生成干扰线
    const generateNoise = () => {
      let noise = '';
      for (let i = 0; i < 3; i++) {
        const x1 = Math.random() * width;
        const y1 = Math.random() * height;
        const x2 = Math.random() * width;
        const y2 = Math.random() * height;
        noise += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${getRandomColor()}" stroke-width="1"/>`;
      }
      return noise;
    };

    // 生成字符位置和样式
    const generateChars = () => {
      let chars = '';
      const charWidth = width / code.length;

      for (let i = 0; i < code.length; i++) {
        const x = charWidth * i + charWidth / 2;
        const y = height / 2 + fontSize / 3;
        const rotation = (Math.random() - 0.5) * 30; // 随机旋转-15到15度
        const color = getRandomColor();

        chars += `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}"
                   font-weight="bold" fill="${color}" text-anchor="middle"
                   transform="rotate(${rotation} ${x} ${y})">${code[i]}</text>`;
      }
      return chars;
    };

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        ${generateNoise()}
        ${generateChars()}
      </svg>
    `;

    // 转换为Base64
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  // 生成验证码
  static async generateCaptcha(): Promise<CaptchaResult> {
    const code = this.generateCode();
    const key = uuidv4();
    const captchaImage = this.generateSVGCaptcha(code);

    // 存储到Redis，设置过期时间
    const redisKey = `${CAPTCHA_KEY_PREFIX}${key}`;
    await redisService.set(redisKey, { code: code.toLowerCase() }, CAPTCHA_CONFIG.expiresIn);

    console.log('Simple captcha generated successfully:', { key, code });

    return {
      key,
      captcha: captchaImage,
    };
  }

  // 验证验证码
  static async verifyCaptcha(key: string, inputCode: string): Promise<boolean> {
    console.log('Verifying captcha:', { key, inputCode });

    if (!key || !inputCode) {
      console.log('Missing key or inputCode');
      return false;
    }

    const normalizedInput = inputCode.toLowerCase().trim();
    const redisKey = `${CAPTCHA_KEY_PREFIX}${key}`;
    const stored = await redisService.get<{ code: string }>(redisKey);

    console.log('Stored captcha:', stored);
    console.log('Normalized input:', normalizedInput);

    if (!stored) {
      console.log('No stored captcha found for key:', key);
      return false;
    }

    // 验证码匹配
    if (stored.code === normalizedInput) {
      console.log('Captcha verified successfully');
      await redisService.del(redisKey); // 验证成功后立即删除
      return true;
    }

    console.log('Captcha mismatch:', { stored: stored.code, input: normalizedInput });
    return false;
  }

  // 获取验证码统计信息（由于使用Redis TTL，这个方法不再需要清理过期验证码）
  static async getStats(): Promise<{ message: string }> {
    // Redis会自动处理过期的键，所以我们不需要手动清理
    // 这里返回一个简单的状态信息
    return {
      message: 'Captcha service is using Redis for persistent storage with automatic expiration',
    };
  }
}
