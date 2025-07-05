'use client';

import { useState, useEffect, useCallback } from 'react';
import store2 from 'store2';

interface TokenInfo {
  isValid: boolean;
  isExpiring: boolean;
  timeUntilExpiry: number;
  user: any;
}

export const useToken = () => {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    isValid: false,
    isExpiring: false,
    timeUntilExpiry: 0,
    user: null,
  });

  const parseJWT = useCallback((token: string): any => {
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
      return null;
    }
  }, []);

  const updateTokenInfo = useCallback(() => {
    const token = store2.get('token');
    const user = store2.get('user');

    if (!token) {
      setTokenInfo({
        isValid: false,
        isExpiring: false,
        timeUntilExpiry: 0,
        user: null,
      });
      return;
    }

    const payload = parseJWT(token);
    if (!payload || !payload.exp) {
      setTokenInfo({
        isValid: false,
        isExpiring: false,
        timeUntilExpiry: 0,
        user: null,
      });
      return;
    }

    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    const fiveMinutes = 5 * 60 * 1000;

    setTokenInfo({
      isValid: timeUntilExpiry > 0,
      isExpiring: timeUntilExpiry > 0 && timeUntilExpiry < fiveMinutes,
      timeUntilExpiry: Math.max(0, timeUntilExpiry),
      user,
    });
  }, [parseJWT]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const { tokenManager } = await import('@/services/token');
      return await tokenManager.refreshToken();
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const { tokenManager } = await import('@/services/token');
      tokenManager.clearTokens();

      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  useEffect(() => {
    // 初始更新
    updateTokenInfo();

    // 定期更新token信息
    const interval = setInterval(updateTokenInfo, 60000); // 每分钟检查一次

    // 监听localStorage变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        updateTokenInfo();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, [updateTokenInfo]);

  return {
    ...tokenInfo,
    refreshToken,
    logout,
    updateTokenInfo,
  };
};
