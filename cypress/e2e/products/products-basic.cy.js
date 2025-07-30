describe('产品管理模块 - 基础测试', () => {
  beforeEach(() => {
    // 设置API拦截
    cy.intercept('GET', '/api/v1/products*').as('getProducts')
    cy.intercept('POST', '/api/v1/products').as('createProduct')
    cy.intercept('PUT', '/api/v1/products/*').as('updateProduct')
    cy.intercept('DELETE', '/api/v1/products/*').as('deleteProduct')
    
    // 使用可靠的管理员登录
    cy.loginAsAdmin()
    
    // 访问产品页面
    cy.visit('/products/products')
    
    // 等待页面基本加载，使用更宽松的条件
    cy.get('body').should('exist')
    cy.wait(3000) // 给页面更多时间加载
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