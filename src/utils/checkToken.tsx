import Base64 from 'crypto-js/enc-base64';
import Utf8 from 'crypto-js/enc-utf8';
import store from 'store2';

// 检查 Token 是否有效
export function checkToken(redirect: string = encodeURIComponent(window.location.href)) {
  if (store.has('token')) {
    // 获取 payload
    const [, payload] = store.get('token').split('.');

    if (payload) {
      // 获取 exp
      const { exp } = JSON.parse(Utf8.stringify(Base64.parse(payload)));

      // Token 有效
      if (exp > Date.now() / 1000) {
        // 且在登录页则跳转到dashboard
        if (window.location.pathname.startsWith('/login')) {
          window.location.href = '/dashboard';
        }

        return;
      }
    }
  }

  // Token 无效且在登录页则返回
  if (window.location.pathname.startsWith('/login')) {
    return;
  }

  window.location.href = '/login?redirect=' + redirect;
}
