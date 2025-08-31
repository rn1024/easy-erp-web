import { prisma } from './db';
import crypto from 'crypto';

export interface ShareConfig {
  expiresIn: number; // 有效期（小时）
  extractCode?: string | null; // 提取码（可选，null表示不使用提取码，undefined表示系统自动生成）
  accessLimit?: number; // 访问限制（可选）
}

export interface ShareLinkInfo {
  shareCode: string;
  extractCode: string | null;
  shareUrl: string;
  expiresAt: Date;
  accessLimit?: number;
}

export interface ShareVerifyResult {
  success: boolean;
  purchaseOrderId?: string;
  message?: string;
  shareInfo?: ShareLinkInfo;
  userToken?: string; // 新增：用户标识token
}

export interface UserAccessInfo {
  userToken: string;
  ipAddress: string;
  userAgent: string;
  shareCode: string;
  firstAccessAt: Date;
  lastAccessAt: Date;
  accessCount: number;
}

export class SupplyShareManager {
  private static readonly SHARE_CODE_LENGTH = 16;
  private static readonly EXTRACT_CODE_LENGTH = 4;
  private static readonly USER_TOKEN_LENGTH = 32;
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  /**
   * 生成分享链接 - 修改为每次都生成新的分享码
   */
  static async generateShareLink(
    purchaseOrderId: string,
    config: ShareConfig
  ): Promise<ShareLinkInfo> {
    // 生成新的分享码和提取码
    const shareCode = this.generateRandomCode(this.SHARE_CODE_LENGTH);
    const extractCode = config.extractCode === null ? null : (config.extractCode || this.generateRandomCode(this.EXTRACT_CODE_LENGTH));
    const expiresAt = new Date(Date.now() + config.expiresIn * 60 * 60 * 1000);

    // 创建新的分享链接记录
    const shareLink = await prisma.supplyShareLink.create({
      data: {
        purchaseOrderId,
        shareCode,
        extractCode,
        expiresAt,
        accessLimit: config.accessLimit,
        status: 'active',
        accessCount: 0,
        uniqueUserCount: 0, // 新增：唯一用户计数
      },
    });

    return {
      shareCode: shareLink.shareCode,
      extractCode: shareLink.extractCode,
      shareUrl: `${this.BASE_URL}/supply/${shareLink.shareCode}`,
      expiresAt: shareLink.expiresAt,
      accessLimit: shareLink.accessLimit || undefined,
    };
  }

  /**
   * 验证分享链接访问 - 新增基于token的用户识别
   */
  static async verifyShareAccess(
    shareCode: string,
    extractCode?: string,
    ipAddress?: string,
    userAgent?: string
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

    // 生成用户标识
    const userFingerprint = this.generateUserFingerprint(ipAddress || '', userAgent || '');
    const userToken = this.generateRandomCode(this.USER_TOKEN_LENGTH);

    // 检查是否为新用户
    const existingAccess = await prisma.supplyShareAccess.findFirst({
      where: {
        shareCode,
        userFingerprint,
      },
    });

    let currentUniqueUserCount = shareLink.uniqueUserCount || 0;

    if (!existingAccess) {
      // 新用户，检查访问限制
      if (shareLink.accessLimit && currentUniqueUserCount >= shareLink.accessLimit) {
        return {
          success: false,
          message: '访问人数已达上限',
        };
      }

      // 记录新用户访问
      await this.recordUserAccess(
        shareCode,
        userToken,
        userFingerprint,
        ipAddress || '',
        userAgent || ''
      );

      // 更新唯一用户计数
      currentUniqueUserCount += 1;
    } else {
      // 已存在用户，更新访问记录
      await this.updateUserAccess(existingAccess.id, userToken);
    }

    // 更新分享链接统计
    await prisma.supplyShareLink.update({
      where: { shareCode },
      data: {
        accessCount: {
          increment: 1,
        },
        uniqueUserCount: currentUniqueUserCount,
      },
    });

    return {
      success: true,
      purchaseOrderId: shareLink.purchaseOrderId,
      userToken, // 返回用户token用于后续请求
      shareInfo: {
        shareCode: shareLink.shareCode,
        extractCode: shareLink.extractCode,
        shareUrl: `${this.BASE_URL}/supply/${shareLink.shareCode}`,
        expiresAt: shareLink.expiresAt,
        accessLimit: shareLink.accessLimit || undefined,
      },
    };
  }

  /**
   * 记录用户访问信息
   */
  private static async recordUserAccess(
    shareCode: string,
    userToken: string,
    userFingerprint: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await prisma.supplyShareAccess.create({
      data: {
        shareCode,
        userToken,
        userFingerprint,
        ipAddress,
        userAgent,
        firstAccessAt: new Date(),
        lastAccessAt: new Date(),
        accessCount: 1,
      },
    });
  }

  /**
   * 更新用户访问信息
   */
  private static async updateUserAccess(accessId: string, newUserToken: string): Promise<void> {
    await prisma.supplyShareAccess.update({
      where: { id: accessId },
      data: {
        userToken: newUserToken,
        lastAccessAt: new Date(),
        accessCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * 生成用户指纹（基于IP+UserAgent）
   */
  private static generateUserFingerprint(ipAddress: string, userAgent: string): string {
    const combined = `${ipAddress}|${userAgent}`;
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * 验证用户token（用于后续API调用）
   */
  static async verifyUserToken(shareCode: string, userToken: string): Promise<boolean> {
    const access = await prisma.supplyShareAccess.findFirst({
      where: {
        shareCode,
        userToken,
      },
    });

    return !!access;
  }

  /**
   * 获取分享链接访问统计
   */
  static async getAccessStatistics(shareCode: string): Promise<{
    totalAccess: number;
    uniqueUsers: number;
    accessLimit?: number;
    accessList: UserAccessInfo[];
  }> {
    const shareLink = await prisma.supplyShareLink.findUnique({
      where: { shareCode },
    });

    if (!shareLink) {
      return {
        totalAccess: 0,
        uniqueUsers: 0,
        accessList: [],
      };
    }

    const accessRecords = await prisma.supplyShareAccess.findMany({
      where: { shareCode },
      orderBy: { firstAccessAt: 'desc' },
    });

    const accessList: UserAccessInfo[] = accessRecords.map((record) => ({
      userToken: record.userToken,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      shareCode: record.shareCode,
      firstAccessAt: record.firstAccessAt,
      lastAccessAt: record.lastAccessAt,
      accessCount: record.accessCount,
    }));

    return {
      totalAccess: shareLink.accessCount || 0,
      uniqueUsers: shareLink.uniqueUserCount || 0,
      accessLimit: shareLink.accessLimit || undefined,
      accessList,
    };
  }

  /**
   * 获取分享历史列表
   */
  static async getShareHistory(): Promise<
    Array<{
      id: string;
      shareCode: string;
      purchaseOrderId: string;
      orderNumber?: string;
      createdBy?: string;
      expiresAt: Date;
      status: string;
      accessCount: number;
      uniqueUserCount: number;
      accessLimit?: number;
      createdAt: Date;
    }>
  > {
    const shareLinks = await prisma.supplyShareLink.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // 获取关联的采购订单信息
    const purchaseOrderIds = shareLinks.map((link) => link.purchaseOrderId);
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { id: { in: purchaseOrderIds } },
      include: {
        operator: {
          select: { name: true, operator: true },
        },
      },
    });

    const orderMap = new Map(purchaseOrders.map((order) => [order.id, order]));

    return shareLinks.map((link) => {
      const order = orderMap.get(link.purchaseOrderId);
      return {
        id: link.id,
        shareCode: link.shareCode,
        purchaseOrderId: link.purchaseOrderId,
        orderNumber: order?.orderNumber,
        createdBy: order?.operator?.operator || order?.operator?.name,
        expiresAt: link.expiresAt,
        status: link.status,
        accessCount: link.accessCount || 0,
        uniqueUserCount: link.uniqueUserCount || 0,
        accessLimit: link.accessLimit || undefined,
        createdAt: link.createdAt,
      };
    });
  }

  /**
   * 记录访问次数 - 保留原有方法兼容性，但标记为废弃
   * @deprecated 使用 verifyShareAccess 的新版本
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
    const shareLink = await prisma.supplyShareLink.findFirst({
      where: {
        purchaseOrderId,
        status: 'active',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!shareLink) {
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
      await prisma.supplyShareLink.updateMany({
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
