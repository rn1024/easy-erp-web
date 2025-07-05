import store2 from 'store2';
import axios from './index';

interface TokenData {
  token: string;
  refreshToken: string;
  user: any;
  roles: any[];
  permissions: string[];
}

interface RefreshResponse {
  code: number;
  msg: string;
  data: TokenData;
}

class TokenManager {
  private refreshPromise: Promise<string> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  /**
   * 解析JWT token获取payload
   */
  private parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to parse JWT:', error);
      return null;
    }
  }

  /**
   * 检查token是否即将过期（在过期前5分钟开始刷新）
   */
  private isTokenExpiringSoon(token: string): boolean {
    const payload = this.parseJWT(token);
    if (!payload || !payload.exp) {
      return true;
    }

    const expirationTime = payload.exp * 1000; // 转换为毫秒
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5分钟

    return expirationTime - currentTime < fiveMinutes;
  }

  /**
   * 检查token是否已过期
   */
  private isTokenExpired(token: string): boolean {
    const payload = this.parseJWT(token);
    if (!payload || !payload.exp) {
      return true;
    }

    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();

    return currentTime >= expirationTime;
  }

  /**
   * 计算下次刷新的时间
   */
  private getRefreshTime(token: string): number {
    const payload = this.parseJWT(token);
    if (!payload || !payload.exp) {
      return 0;
    }

    const expirationTime = payload.exp * 1000;
    const fiveMinutes = 5 * 60 * 1000;

    return Math.max(0, expirationTime - Date.now() - fiveMinutes);
  }

  /**
   * 刷新token
   */
  private async refreshAccessToken(): Promise<string> {
    // 如果已经有刷新请求在进行中，等待它完成
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = store2.get('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.performRefresh(refreshToken);

    try {
      const newAccessToken = await this.refreshPromise;
      return newAccessToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * 执行刷新请求
   */
  private async performRefresh(refreshToken: string): Promise<string> {
    try {
      const response = await axios<RefreshResponse>('/auth/refresh', {
        method: 'POST',
        data: { refreshToken },
        // 不要在这个请求中使用Authorization header，避免循环
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.code === 0) {
        const {
          token,
          refreshToken: newRefreshToken,
          user,
          roles,
          permissions,
        } = response.data.data;

        // 更新存储的数据
        store2.set('token', token);
        store2.set('refreshToken', newRefreshToken);
        store2.set('user', user);
        store2.set('roles', roles);
        store2.set('permissions', permissions);

        console.log('Token refreshed successfully');

        // 设置下次自动刷新
        this.scheduleNextRefresh(token);

        return token;
      } else {
        throw new Error(response.data.msg || 'Token refresh failed');
      }
    } catch (error: any) {
      console.error('Token refresh failed:', error);

      // 刷新失败，清除所有token并重定向到登录页面
      this.clearTokens();

      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      }

      throw error;
    }
  }

  /**
   * 设置自动刷新定时器
   */
  private scheduleNextRefresh(token: string): void {
    // 清除现有定时器
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const refreshTime = this.getRefreshTime(token);

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshAccessToken().catch((error) => {
          console.error('Automatic token refresh failed:', error);
        });
      }, refreshTime);

      console.log(`Next token refresh scheduled in ${Math.round(refreshTime / 60000)} minutes`);
    }
  }

  /**
   * 获取有效的access token
   */
  public async getValidToken(): Promise<string | null> {
    try {
      const token = store2.get('token');

      if (!token) {
        return null;
      }

      // 如果token已过期，尝试刷新
      if (this.isTokenExpired(token)) {
        console.log('Token expired, attempting to refresh...');
        return await this.refreshAccessToken();
      }

      // 如果token即将过期，主动刷新
      if (this.isTokenExpiringSoon(token)) {
        console.log('Token expiring soon, refreshing...');
        // 异步刷新，不阻塞当前请求
        this.refreshAccessToken().catch((error) => {
          console.error('Proactive token refresh failed:', error);
        });
      }

      return token;
    } catch (error) {
      console.error('Failed to get valid token:', error);
      return null;
    }
  }

  /**
   * 初始化token管理器
   */
  public initialize(): void {
    const token = store2.get('token');

    if (token && !this.isTokenExpired(token)) {
      // 设置自动刷新定时器
      this.scheduleNextRefresh(token);
    }
  }

  /**
   * 手动刷新token
   */
  public async refreshToken(): Promise<boolean> {
    try {
      await this.refreshAccessToken();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 清除所有tokens
   */
  public clearTokens(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    store2.remove('token');
    store2.remove('refreshToken');
    store2.remove('user');
    store2.remove('roles');
    store2.remove('permissions');

    console.log('Tokens cleared from localStorage');
  }

  /**
   * 存储新的token数据
   */
  public storeTokens(data: TokenData): void {
    store2.set('token', data.token);
    store2.set('refreshToken', data.refreshToken);
    store2.set('user', data.user);
    store2.set('roles', data.roles);
    store2.set('permissions', data.permissions);

    console.log('Token stored to localStorage');

    // 设置自动刷新
    this.scheduleNextRefresh(data.token);
  }
}

// 创建单例实例
export const tokenManager = new TokenManager();

// 默认导出
export default tokenManager;
