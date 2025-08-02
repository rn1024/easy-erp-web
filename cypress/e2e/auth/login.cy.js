describe('认证模块 - 登录功能', () => {
  beforeEach(() => {
    cy.log('🔐 开始登录功能测试 - 清理环境');
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.log('✅ 环境清理完成');
  });

  describe('TC001: 管理员登录', () => {
    it('调试DOM结构', () => {
      cy.log('🔍 开始调试登录页面DOM结构');

      // 访问登录页面
      cy.visit('/login');

      // 等待页面加载完成
      cy.get('form')
        .should('be.visible')
        .then(() => {
          return true;
        });
      cy.log('✅ 登录表单已加载');

      // 调试：打印所有input元素
      cy.get('input').then(($inputs) => {
        const inputCount = $inputs.length;
        $inputs.each((index, input) => {
          console.log(
            `Input ${index}: name=${input.name}, id=${input.id}, class=${input.className}`
          );
        });
        return inputCount;
      });
      cy.log('🔍 输入框调试信息已输出到控制台');

      // 调试：查找用户名输入框的多种可能选择器
      cy.get('body').then(($body) => {
        // 尝试不同的选择器
        const selectors = [
          'input[name="username"]',
          'input[id*="username"]',
          'input[placeholder*="账号"]',
          'input[placeholder*="用户名"]',
          '.ant-input',
          'form input:first',
        ];

        const results = [];
        selectors.forEach((selector) => {
          const found = $body.find(selector).length;
          results.push(`选择器 "${selector}" 找到 ${found} 个元素`);
          console.log(`选择器 "${selector}" 找到 ${found} 个元素`);
        });
        return results;
      });
      cy.log('🔍 选择器调试信息已输出到控制台');
    });

    it('管理员成功登录', () => {
      let captchaData = null;

      cy.log('📝 开始管理员登录测试');

      // 拦截验证码请求
      cy.intercept('GET', '**/auth/verifycode', (req) => {
        console.log('📸 捕获验证码请求');
        req.continue((res) => {
          if (res.body && res.body.data) {
            captchaData = res.body.data;
            console.log(`✅ 验证码数据获取成功: ${captchaData.text}`);
          }
        });
      }).as('getCaptcha');
      cy.log('📸 验证码拦截器已设置');

      // 监听登录请求（不拦截，让它正常调用后端）
      cy.intercept('POST', '**/auth/login').as('loginRequest');
      cy.log('🔗 登录请求监听器已设置');

      cy.visit('/login');
      cy.log('📍 已访问登录页面');

      // 等待初始验证码加载
      cy.wait('@getCaptcha').then((interception) => {
        const status = interception.response?.statusCode || 'unknown';
        return status;
      });
      cy.log('✅ 验证码API调用完成');

      cy.get('img[alt=""]')
        .should('be.visible')
        .then(() => {
          return true;
        });
      cy.log('✅ 验证码图片已显示');

      // 点击验证码图片刷新，触发新的验证码请求
      cy.get('img[alt=""]').first().click();
      cy.log('🔄 已刷新验证码');

      // 等待新的验证码请求完成
      cy.wait('@getCaptcha');

      // 使用最新拦截到的验证码数据
      cy.then(() => {
        cy.log('🔑 开始填写登录表单');
        cy.wrap(captchaData).should('not.be.null');
        cy.wrap(captchaData.key).should('exist');

        // 填写登录表单 - 使用更通用的选择器
        cy.get('.ant-form-item').eq(0).find('input').clear().type('admin');
        cy.get('.ant-form-item').eq(1).find('input').clear().type('admin123456');
        cy.get('.ant-form-item').eq(2).find('input').clear().type(captchaData.text);

        cy.log('✅ 登录表单填写完成');

        // 点击登录按钮 - 查找包含登录文本的按钮
        cy.get('button').contains('登录').should('be.visible').click();
        cy.log('🚀 已点击登录按钮');

        // 添加短暂等待确保点击事件被处理
        cy.wait(500);

        // 等待登录请求完成
        cy.wait('@loginRequest').then((interception) => {
          const status = interception.response?.statusCode || 'unknown';
          const responseBody = interception.response?.body;

          console.log('登录请求响应:', {
            status,
            body: responseBody,
          });

          if (interception.response?.statusCode >= 400) {
            throw new Error(`登录API调用失败 - 状态码: ${status}`);
          }

          // 检查响应体中的code字段
          if (responseBody && responseBody.code !== 0) {
            throw new Error(`登录失败 - 错误信息: ${responseBody.msg || '未知错误'}`);
          }

          return status;
        });

        cy.log('✅ 登录API调用完成');

        // 等待自动跳转到dashboard页面
        cy.url()
          .should('include', '/dashboard', { timeout: 10000 })
          .then((url) => {
            return url;
          });
        cy.log('✅ 已跳转到dashboard页面');

        // 验证dashboard页面内容
        cy.wait(3000); // 等待页面完全加载和token保存
        cy.get('body')
          .should('not.be.empty')
          .then(() => {
            return true;
          });
        cy.log('✅ dashboard页面内容已加载');

        // 额外等待确保tokenManager完成数据保存
        cy.wait(2000);
        cy.log('⏳ 等待tokenManager完成数据保存');

        // 验证用户认证状态 - 检查store2保存的数据
        cy.window().then((win) => {
          // store2默认使用localStorage，但可能有前缀
          const token =
            win.localStorage.getItem('token') || win.localStorage.getItem('store2_token');
          const user = win.localStorage.getItem('user') || win.localStorage.getItem('store2_user');

          // 也检查所有localStorage keys，看看实际的存储格式
          const allKeys = Object.keys(win.localStorage);
          console.log('所有localStorage keys:', allKeys);

          // 查找包含token或user的key
          const tokenKey = allKeys.find((key) => key.includes('token') || key === 'token');
          const userKey = allKeys.find((key) => key.includes('user') || key === 'user');

          const actualToken = tokenKey ? win.localStorage.getItem(tokenKey) : null;
          const actualUser = userKey ? win.localStorage.getItem(userKey) : null;

          if (actualToken && actualUser) {
            cy.log(`✅ 登录成功 - Token已保存: ${actualToken.substring(0, 20)}...`);
            cy.log(`✅ 用户信息已保存: ${actualUser}`);
          } else {
            cy.log('❌ 登录验证失败 - 认证信息未保存');
            cy.log(`Token key: ${tokenKey}, value: ${actualToken}`);
            cy.log(`User key: ${userKey}, value: ${actualUser}`);
            throw new Error('登录验证失败 - 认证信息未保存');
          }
        });

        // 验证页面有内容加载
        cy.get('body').then(($body) => {
          const bodyText = $body.text();
          expect(bodyText.length).to.be.greaterThan(0);
          cy.log(`✅ 页面内容验证完成 - 文本长度: ${bodyText.length}`);
        });
      });
    });
  });
});
