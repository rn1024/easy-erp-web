describe('产品管理模块 - 基础测试', () => {
  beforeEach(() => {
    cy.log('🔐 开始产品基础模块测试 - 登录验证阶段')
    
    // 设置API拦截 - 添加Mock响应数据
    cy.intercept('GET', '/api/v1/products*').as('getProducts')
    
    cy.intercept('POST', '/api/v1/products').as('createProduct')
    
    cy.intercept('PUT', '/api/v1/products/*').as('updateProduct')
    
    cy.intercept('DELETE', '/api/v1/products/*').as('deleteProduct')
    
    cy.intercept('GET', '/api/v1/categories*').as('getCategories')
    
    // 使用详细日志记录登录过程
    cy.log('📝 尝试使用管理员账号登录 (admin/admin123456)')
    
    cy.loginAsAdmin()
      .then(() => {
        cy.log('✅ 登录成功 - 正在进行登录验证')
        
        // 验证登录状态
        cy.url().should('include', '/dashboard')
          .then((url) => {
            cy.log(`✅ 已跳转到dashboard页面: ${url}`)
          })
        
        cy.get('body').should('not.be.empty')
          .then(() => {
            cy.log('✅ 页面内容加载完成')
          })
        
        // 验证用户认证状态
        cy.window().then((win) => {
          const token = win.localStorage.getItem('token')
          const user = win.localStorage.getItem('user')
          if (token && user) {
            cy.log(`✅ 认证信息已保存 - Token: ${token.substring(0, 20)}...`)
            cy.log(`✅ 用户信息: ${user}`)
          } else {
            cy.log('❌ 认证信息未正确保存')
            throw new Error('登录验证失败 - 认证信息未保存')
          }
        })
      })
      .then(() => {
        cy.log('🚀 登录验证完成 - 开始访问产品页面')
        
        // 访问产品页面
        cy.visit('/products/products')
        cy.log('📍 已访问产品页面')
        
        // 等待API调用完成
        cy.wait('@getProducts')
          .then((interception) => {
            const status = interception.response?.statusCode || 'unknown'
            cy.log(`✅ 产品API调用完成 - 状态码: ${status}`)
            if (interception.response?.statusCode >= 400) {
              throw new Error(`产品API调用失败 - 状态码: ${status}`)
            }
          })
        
        cy.wait('@getCategories')
          .then((interception) => {
            const status = interception.response?.statusCode || 'unknown'
            cy.log(`✅ 分类API调用完成 - 状态码: ${status}`)
            if (interception.response?.statusCode >= 400) {
              throw new Error(`分类API调用失败 - 状态码: ${status}`)
            }
          })
        
        // 等待页面渲染完成
        cy.get('.ant-table', { timeout: 15000 }).should('be.visible')
          .then(() => {
            cy.log('✅ 产品页面加载完成 - 表格已显示')
          })
      })
      .then(() => {
        cy.log('🎉 产品基础模块测试前置条件全部完成')
      })
      .should(() => {
        // 确保所有前置条件都满足
        cy.window().then((win) => {
          const token = win.localStorage.getItem('token')
          if (!token) {
            throw new Error('❌ 登录验证失败 - 未检测到有效token')
          }
        })
      })
  })

  describe('TC001: 基础页面验证', () => {
    it('应该能够访问产品管理页面', () => {
      // 验证URL正确
      cy.url().should('include', '/products/products')
      
      // 验证页面基本元素存在
      cy.get('body').should('be.visible')
      
      // 等待页面完全加载
      cy.get('.ant-layout, main, [data-testid]', { timeout: 10000 }).should('exist')
      
      // 验证是否有表格或列表容器
      cy.get('.ant-table, .ant-list, .product-list', { timeout: 10000 }).should('exist')
    })

    it('应该显示页面标题', () => {
      // 查找可能的标题元素
      cy.get('h1, h2, h3, .page-title, .ant-page-header-heading-title', { timeout: 10000 })
        .should('exist')
        .and('be.visible')
    })
  })

  describe('TC002: 产品列表验证', () => {
    it('应该显示产品列表', () => {
      // 等待数据加载
      cy.wait('@getProducts', { timeout: 15000 })
      
      // 验证表格存在
      cy.get('.ant-table', { timeout: 10000 }).should('be.visible')
      
      // 验证表格有内容或显示空状态
      cy.get('.ant-table-tbody, .ant-empty').should('exist')
    })
  })

  describe('TC003: 新建产品按钮', () => {
    it('应该能找到新建产品按钮', () => {
      // 查找新建按钮（多种可能的文本和选择器）
      cy.get('button, .ant-btn', { timeout: 10000 })
        .contains(/新建|添加|创建|新增/)
        .should('be.visible')
        .and('not.be.disabled')
    })

    it('点击新建按钮应该打开模态框', () => {
      // 点击新建按钮
      cy.get('button, .ant-btn')
        .contains(/新建|添加|创建|新增/)
        .click()
      
      // 验证模态框或新页面打开
      cy.get('.ant-modal, .ant-drawer, [role="dialog"]', { timeout: 10000 })
        .should('be.visible')
    })
  })
})