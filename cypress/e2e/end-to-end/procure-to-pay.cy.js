describe('端到端业务流程测试 - 采购到付款流程', () => {
  const testData = {
    supplier: '富士康科技',
    product: 'iPhone 15 Pro Max',
    quantity: 200,
    unitPrice: 6999,
    totalAmount: 1399800
  }

  beforeEach(() => {
    cy.log('🔐 开始采购到付款流程测试 - 登录验证阶段')
    
    // 设置API拦截 - 添加Mock响应数据
    cy.intercept('GET', '/api/v1/purchase/orders*').as('getPurchaseOrders')
    
    cy.intercept('POST', '/api/v1/orders/purchase').as('createPurchaseOrder')
    
    cy.intercept('GET', '/api/v1/purchase/deliveries*').as('getPurchaseDeliveries')
    
    cy.intercept('POST', '/api/v1/purchase/deliveries').as('confirmPurchaseDelivery')
    
    cy.intercept('GET', '/api/v1/suppliers*').as('getSuppliers')
    
    cy.intercept('GET', '/api/v1/products*').as('getProducts')
    
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
        cy.log('🚀 登录验证完成 - 采购到付款流程测试前置条件已准备')
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

  describe('E2E-004: 核心采购到付款流程', () => {
    it('采购到付款核心流程', () => {
      // 1. 创建采购订单
      cy.visit('/purchase/orders')
      cy.get('button').contains('创建订单').click()
      cy.waitForModal()
      
      // 选择供应商和产品
      cy.get('.ant-select-selector').contains('选择供应商').click()
      cy.contains(testData.supplier).click()
      
      cy.get('button').contains('添加产品').click()
      cy.waitForModal()
      cy.get('.ant-table-tbody tr').first().find('input[type="checkbox"]').check()
      cy.get('.ant-modal-footer').contains('确定').click()
      
      // 设置数量和价格
      cy.get('input[name="quantity"]').clear().type(testData.quantity)
      cy.get('input[name="unitPrice"]').clear().type(testData.unitPrice)
      
      cy.get('.ant-modal-footer').contains('创建订单').click()
      cy.waitForApi('createPurchaseOrder')
      cy.verifySuccessMessage('采购订单创建成功')
      
      // 2. 确认收货
      cy.visit('/purchase/deliveries')
      cy.get('button').contains('创建收货单').click()
      cy.waitForModal()
      
      cy.get('.ant-select-selector').contains('选择采购订单').click()
      cy.contains(testData.supplier).parent().click()
      
      cy.get('input[name="receivedQuantity"]').type(testData.quantity)
      cy.get('.ant-modal-footer').contains('确认收货').click()
      cy.waitForApi('confirmPurchaseDelivery')
      cy.verifySuccessMessage('收货确认成功')
      
      // 3. 记录付款
      cy.visit('/finance/payables')
      cy.get('.ant-table-tbody tr').first().find('.pay-button').click()
      cy.waitForModal()
      
      cy.get('input[name="paidAmount"]').type(testData.totalAmount)
      cy.get('.ant-modal-footer').contains('确认付款').click()
      cy.waitForApi('recordPayment')
      cy.verifySuccessMessage('付款记录成功')
    })
  })
})