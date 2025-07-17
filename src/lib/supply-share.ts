import { prisma } from './db';
import crypto from 'crypto';

export interface ShareConfig {
  expiresIn: number; // 有效期（小时）
  extractCode?: string; // 提取码（可选，系统会自动生成）
  accessLimit?: number; // 访问限制（可选）
}

export interface ShareLinkInfo {
  shareCode: string;
  extractCode: string;
  shareUrl: string;
  expiresAt: Date;
  accessLimit?: number;
}

export interface ShareVerifyResult {
  success: boolean;
  purchaseOrderId?: string;
  message?: string;
  shareInfo?: ShareLinkInfo;
}

export class SupplyShareManager {
  private static readonly SHARE_CODE_LENGTH = 16;
  private static readonly EXTRACT_CODE_LENGTH = 4;
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  /**
   * 生成分享链接
   */
  static async generateShareLink(
    purchaseOrderId: string,
    config: ShareConfig
  ): Promise<ShareLinkInfo> {
    // 检查是否已存在有效的分享链接
    const existing = await prisma.supplyShareLink.findUnique({
      where: { purchaseOrderId },
    });

    if (existing && existing.status === 'active' && existing.expiresAt > new Date()) {
      // 返回现有的分享链接信息
      return {
        shareCode: existing.shareCode,
        extractCode: existing.extractCode || '',
        shareUrl: `${this.BASE_URL}/supply/${existing.shareCode}`,
        expiresAt: existing.expiresAt,
        accessLimit: existing.accessLimit || undefined,
      };
    }

    // 生成新的分享码和提取码
    const shareCode = this.generateRandomCode(this.SHARE_CODE_LENGTH);
    const extractCode = config.extractCode || this.generateRandomCode(this.EXTRACT_CODE_LENGTH);
    const expiresAt = new Date(Date.now() + config.expiresIn * 60 * 60 * 1000);

    // 创建或更新分享链接记录
    const shareLink = await prisma.supplyShareLink.upsert({
      where: { purchaseOrderId },
      create: {
        purchaseOrderId,
        shareCode,
        extractCode,
        expiresAt,
        accessLimit: config.accessLimit,
        status: 'active',
      },
      update: {
        shareCode,
        extractCode,
        expiresAt,
        accessLimit: config.accessLimit,
        status: 'active',
        accessCount: 0, // 重置访问计数
      },
    });

    return {
      shareCode: shareLink.shareCode,
      extractCode: shareLink.extractCode || '',
      shareUrl: `${this.BASE_URL}/supply/${shareLink.shareCode}`,
      expiresAt: shareLink.expiresAt,
      accessLimit: shareLink.accessLimit || undefined,
    };
  }

  /**
   * 验证分享链接访问
   */
  static async verifyShareAccess(
    shareCode: string,
    extractCode?: string
  ): Promise<ShareVerifyResult> {
    const shareLink = await prisma.supplyShareLink.findUnique({
      where: { shareCode },
    });

    if (!shareLink) {
      return {
        success: false,
        message: '分享链接不存在',
      };
    }

    if (shareLink.status !== 'active') {
      return {
        success: false,
        message: '分享链接已失效',
      };
    }

    if (shareLink.expiresAt < new Date()) {
      return {
        success: false,
        message: '分享链接已过期',
      };
    }

    // 验证提取码
    if (shareLink.extractCode && shareLink.extractCode !== extractCode) {
      return {
        success: false,
        message: '提取码错误',
      };
    }

    // 检查访问限制
    if (shareLink.accessLimit && shareLink.accessCount >= shareLink.accessLimit) {
      return {
        success: false,
        message: '访问次数已达上限',
      };
    }

    // 记录访问
    await this.recordAccess(shareCode);

    return {
      success: true,
      purchaseOrderId: shareLink.purchaseOrderId,
      shareInfo: {
        shareCode: shareLink.shareCode,
        extractCode: shareLink.extractCode || '',
        shareUrl: `${this.BASE_URL}/supply/${shareLink.shareCode}`,
        expiresAt: shareLink.expiresAt,
        accessLimit: shareLink.accessLimit || undefined,
      },
    };
  }

  /**
   * 记录访问次数
   */
  static async recordAccess(shareCode: string): Promise<void> {
    await prisma.supplyShareLink.update({
      where: { shareCode },
      data: {
        accessCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * 获取分享链接信息
   */
  static async getShareInfo(purchaseOrderId: string): Promise<ShareLinkInfo | null> {
    const shareLink = await prisma.supplyShareLink.findUnique({
      where: { purchaseOrderId },
    });

    if (!shareLink || shareLink.status !== 'active') {
      return null;
    }

    return {
      shareCode: shareLink.shareCode,
      extractCode: shareLink.extractCode || '',
      shareUrl: `${this.BASE_URL}/supply/${shareLink.shareCode}`,
      expiresAt: shareLink.expiresAt,
      accessLimit: shareLink.accessLimit || undefined,
    };
  }

  /**
   * 禁用分享链接
   */
  static async disableShareLink(purchaseOrderId: string): Promise<boolean> {
    try {
      await prisma.supplyShareLink.update({
        where: { purchaseOrderId },
        data: { status: 'disabled' },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 生成随机码
   */
  private static generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 生成分享文案（类似百度网盘）
   */
  static generateShareText(shareInfo: ShareLinkInfo, orderNumber: string): string {
    const expireText = shareInfo.expiresAt.toLocaleDateString('zh-CN');
    return `通过ERP系统分享的采购订单供货记录：${orderNumber}
链接: ${shareInfo.shareUrl}${shareInfo.extractCode ? ` 提取码: ${shareInfo.extractCode}` : ''}
有效期至: ${expireText}
--来自ERP管理系统的分享`;
  }
}
