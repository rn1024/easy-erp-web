// 自定义Cypress命令

// 管理员登录命令 - 基于成功的登录测试逻辑
Cypress.Commands.add('loginAsAdmin', () => {
  cy.session(['admin', 'login'], () => {
    let captchaData = null;

    cy.log('📝 开始管理员登录流程');

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

    // 监听登录请求（不拦截，让它正常调用后端）
    cy.intercept('POST', '**/auth/login').as('loginRequest');

    cy.visit('/login');
    cy.log('📍 已访问登录页面');

    // 等待初始验证码加载
    cy.wait('@getCaptcha');
    cy.get('img[alt=""]').should('be.visible');
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
      });

      cy.log('✅ 登录API调用完成');

      // 等待自动跳转到dashboard页面
      cy.url().should('include', '/dashboard', { timeout: 10000 });
      cy.log('✅ 已跳转到dashboard页面');

      // 验证dashboard页面内容
      cy.wait(3000); // 等待页面完全加载和token保存
      cy.get('body').should('not.be.empty');
      cy.log('✅ dashboard页面内容已加载');

      // 额外等待确保tokenManager完成数据保存
      cy.wait(2000);
      cy.log('⏳ 等待tokenManager完成数据保存');

      // 验证用户认证状态 - 检查store2保存的数据
      cy.window().then((win) => {
        // store2默认使用localStorage，但可能有前缀
        const token = win.localStorage.getItem('token') || win.localStorage.getItem('store2_token');
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

// 等待加载完成
Cypress.Commands.add('waitForLoading', () => {
  // 等待所有加载指示器消失
  cy.get('.ant-spin', { timeout: 30000 }).should('not.exist');
  cy.get('.loading', { timeout: 30000 }).should('not.exist');
  // 等待页面内容加载
  cy.get('body').should('not.be.empty');
  // 等待React应用完全渲染
  cy.wait(2000);
});

// 等待页面完全加载
Cypress.Commands.add('waitForPageLoad', () => {
  // 等待页面基本结构加载
  cy.get('body').should('exist');
  // 等待页面内容加载，使用更宽松的选择器
  cy.get('body').should('not.be.empty');
  // 等待React应用渲染
  cy.wait(3000);
});

// 等待模态框出现
Cypress.Commands.add('waitForModal', () => {
  cy.get('.ant-modal', { timeout: 10000 }).should('be.visible');
  cy.get('.ant-modal-content').should('be.visible');
});

// 等待API响应
Cypress.Commands.add('waitForApi', (alias) => {
  cy.wait(`@${alias}`).then((interception) => {
    expect(interception.response.statusCode).to.be.oneOf([200, 201]);
  });
});

// 选择下拉框选项
Cypress.Commands.add('selectDropdownOption', (selector, optionText) => {
  cy.get(selector).click();
  cy.contains('.ant-select-item-option-content', optionText).click();
});

// 上传文件
Cypress.Commands.add('uploadFile', (selector, filePath) => {
  cy.get(selector).selectFile(filePath, { force: true });
});

// 清除并输入文本
Cypress.Commands.add('clearAndType', (selector, text) => {
  cy.get(selector).clear().type(text);
});

// 验证成功消息
Cypress.Commands.add('verifySuccessMessage', (message) => {
  cy.contains('.ant-message-success', message).should('be.visible');
});

// 验证错误消息
Cypress.Commands.add('verifyErrorMessage', (message) => {
  cy.contains('.ant-message-error', message).should('be.visible');
});

// 验证页面标题
Cypress.Commands.add('verifyPageTitle', (title) => {
  cy.get('h1').should('contain', title);
});

// 验证URL包含
Cypress.Commands.add('verifyUrlContains', (urlPart) => {
  cy.url().should('include', urlPart);
});

// 点击按钮并等待
Cypress.Commands.add('clickAndWait', (buttonText, apiAlias) => {
  cy.contains('button', buttonText).click();
  if (apiAlias) {
    cy.waitForApi(apiAlias);
  }
});

// 表格操作
Cypress.Commands.add('findTableRow', (searchText) => {
  return cy.get('.ant-table-row').contains(searchText).parent();
});

Cypress.Commands.add('clickTableAction', (searchText, actionText) => {
  cy.findTableRow(searchText).find(`button:contains("${actionText}")`).click();
});

// 等待模态框消失
Cypress.Commands.add('waitForModalClose', () => {
  cy.get('.ant-modal').should('not.exist');
});

// 模态框操作
Cypress.Commands.add('closeModal', () => {
  cy.get('.ant-modal-close').click();
});

Cypress.Commands.add('confirmModalAction', (actionText) => {
  cy.get('.ant-modal-footer').contains('button', actionText).click();
});

// 表单验证
Cypress.Commands.add('verifyFormValidation', (fieldName, errorMessage) => {
  cy.contains('.ant-form-item-explain-error', errorMessage).should('be.visible');
});

// 数据验证
Cypress.Commands.add('verifyDataInTable', (columnIndex, expectedValue) => {
  cy.get('.ant-table-row').first().find('td').eq(columnIndex).should('contain', expectedValue);
});

// 分页操作
Cypress.Commands.add('goToPage', (pageNumber) => {
  cy.get('.ant-pagination').contains(pageNumber).click();
});

Cypress.Commands.add('verifyPagination', (totalText) => {
  cy.get('.ant-pagination-total-text').should('contain', totalText);
});

// 搜索操作
Cypress.Commands.add('searchAndVerify', (searchTerm, expectedCount) => {
  cy.get('input[placeholder*="搜索"]').type(searchTerm);
  cy.get('.search-button').click();
  if (expectedCount) {
    cy.get('.ant-table-row').should('have.length', expectedCount);
  }
});

// 日期选择器
Cypress.Commands.add('selectDate', (selector, date) => {
  cy.get(selector).click();
  cy.get('.ant-picker-input input').clear().type(date);
  cy.get('.ant-picker-ok').click();
});

// 文件下载验证
Cypress.Commands.add('verifyFileDownload', (fileName) => {
  cy.readFile(`cypress/downloads/${fileName}`).should('exist');
});

// 权限验证
Cypress.Commands.add('verifyPermissionDenied', (url) => {
  cy.visit(url, { failOnStatusCode: false });
  cy.contains('403').should('be.visible');
});

// 响应式测试
Cypress.Commands.add('testResponsive', (viewport, callback) => {
  cy.viewport(viewport.width, viewport.height);
  callback();
});

// 性能测试
Cypress.Commands.add('measurePerformance', (action, threshold = 3000) => {
  const startTime = Date.now();
  action();
  cy.then(() => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    expect(duration).to.be.lessThan(threshold);
  });
});

// 测试数据创建命令 - 核心功能
Cypress.Commands.add('createTestProduct', (productName) => {
  cy.request({
    method: 'POST',
    url: '/api/products',
    body: {
      name: productName,
      code: `TEST-${Date.now()}`,
      sku: `TEST-SKU-${Date.now()}`,
      categoryId: 1,
      shopId: 1,
      weight: 100,
      length: 10,
      width: 10,
      height: 5,
    },
  });
});

// 文件下载验证
Cypress.Commands.add('verifyDownload', (fileName) => {
  const downloadsFolder = Cypress.config('downloadsFolder');
  cy.readFile(`${downloadsFolder}/${fileName}`).should('exist');
});
