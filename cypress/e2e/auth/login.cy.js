describe('认证模块 - 登录功能', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  describe('TC001: 管理员登录', () => {
    it('调试DOM结构', () => {
      // 访问登录页面
      cy.visit('/login')
      
      // 等待页面加载完成
      cy.get('form').should('be.visible')
      
      // 调试：打印所有input元素
      cy.get('input').then(($inputs) => {
        $inputs.each((index, input) => {
          cy.log(`Input ${index}: name=${input.name}, id=${input.id}, class=${input.className}`)
        })
      })
      
      // 调试：查找用户名输入框的多种可能选择器
      cy.get('body').then(() => {
        // 尝试不同的选择器
        const selectors = [
          'input[name="username"]',
          'input[id*="username"]',
          'input[placeholder*="账号"]',
          'input[placeholder*="用户名"]',
          '.ant-input',
          'form input:first'
        ]
        
        selectors.forEach(selector => {
          cy.get('body').then($body => {
            const found = $body.find(selector).length
            cy.log(`选择器 "${selector}" 找到 ${found} 个元素`)
          })
        })
      })
    })
    
    it('管理员成功登录', () => {
      let captchaData = null
      
      // 拦截验证码请求
      cy.intercept('GET', '**/auth/verifycode', (req) => {
        req.continue((res) => {
          if (res.body && res.body.data) {
            captchaData = res.body.data
          }
        })
      }).as('getCaptcha')
      
      // 拦截登录请求
      cy.intercept('POST', '**/auth/login', {
        statusCode: 200,
        body: {
          code: 0,
          msg: '登录成功',
          data: {
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
            user: {
              id: 1,
              username: 'admin',
              name: '管理员',
              email: 'admin@example.com'
            },
            roles: ['admin'],
            permissions: ['*']
          }
        }
      }).as('loginRequest')
      
      cy.visit('/login')
      
      // 等待初始验证码加载
      cy.wait('@getCaptcha')
      cy.get('img[alt=""]').should('be.visible')
       
      // 点击验证码图片刷新，触发新的验证码请求
      cy.get('img[alt=""]').first().click()
      
      // 等待新的验证码请求完成
      cy.wait('@getCaptcha')
      
      // 使用最新拦截到的验证码数据
       cy.then(() => {
         cy.wrap(captchaData).should('not.be.null')
         cy.wrap(captchaData.key).should('exist')
         
        // 填写登录表单 - 使用更通用的选择器
        cy.get('.ant-form-item').eq(0).find('input').clear().type('admin')
        cy.get('.ant-form-item').eq(1).find('input').clear().type('123456')
        cy.get('.ant-form-item').eq(2).find('input').clear().type(captchaData.text)

        // 点击登录按钮
        cy.get('button.ant-btn-primary').contains('登录').click()

        // 等待登录请求完成
        cy.wait('@loginRequest')
         
        // 等待自动跳转到dashboard页面
        cy.url().should('include', '/dashboard', { timeout: 10000 })
         
        // 验证dashboard页面内容
        cy.wait(2000) // 等待页面完全加载
        cy.get('body').should('not.be.empty')
        
        // 验证页面有内容加载
        cy.get('body').then(($body) => {
          const bodyText = $body.text()
          expect(bodyText.length).to.be.greaterThan(0)
        })
      })
    })
  })
})