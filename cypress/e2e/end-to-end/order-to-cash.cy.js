describe('端到端业务流程测试', () => {
  const testData = {
    customer: '智能科技旗舰店',
    product: 'iPhone 15 Pro Max',
    quantity: 10,
    unitPrice: 8999,
    totalAmount: 89990,
    supplier: '苹果供应商',
    purchasePrice: 7500
  }

  beforeEach(() => {
    cy.log('🔐 开始端到端业务流程测试 - 登录验证阶段')
    
    // 设置API拦截 - 添加Mock响应数据
    cy.intercept('GET', '/api/v1/orders/sales*').as('getSalesOrders')
    
    cy.intercept('POST', '/api/v1/orders/sales').as('createSalesOrder')
    
    cy.intercept('GET', '/api/v1/orders/purchase*').as('getPurchaseOrders')
    
    cy.intercept('POST', '/api/v1/orders/purchase').as('createPurchaseOrder')
    
    cy.intercept('GET', '/api/v1/delivery*').as('getDeliveryRecords')
    
    cy.intercept('POST', '/api/v1/delivery').as('createDeliveryRecord')
    
    cy.intercept('GET', '/api/v1/finance/receivables*').as('getReceivables')
    
    cy.intercept('POST', '/api/v1/finance/receivables').as('createReceivable')
    
    cy.intercept('POST', '/api/v1/finance/receivables/*/collect').as('recordCollection')
    
    cy.intercept('GET', '/api/v1/finance/payables*').as('getPayables')
    
    cy.intercept('POST', '/api/v1/finance/payables').as('createPayable')
    
    cy.intercept('POST', '/api/v1/finance/payables/*/pay').as('recordPayment')
    
    cy.intercept('POST', '/api/v1/receiving').as('confirmReceiving')
    
    cy.intercept('GET', '/api/v1/customers*').as('getCustomers')
    
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
        cy.log('🚀 登录验证完成 - 端到端测试前置条件已准备')
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

  describe('订单到现金流程', () => {
    it('完整的订单到现金业务流程', () => {
      // 1. 创建销售订单
      cy.visit('/orders/sales')
      cy.get('body').should('exist')
      cy.wait(3000)
      cy.get('button').contains('创建订单').click()
      cy.waitForModal()
      
      // 选择客户和产品
      cy.get('.ant-select-selector').contains('选择客户').click()
      cy.contains(testData.customer).click()
      
      cy.get('button').contains('添加产品').click()
      cy.waitForModal()
      cy.get('input[placeholder*="搜索产品"]').type(testData.product)
      cy.contains(testData.product).parent().find('input[type="checkbox"]').check()
      cy.get('.ant-modal-footer').contains('确定').click()
      
      cy.get('input[name="quantity"]').clear().type(testData.quantity)
      cy.get('input[name="unitPrice"]').clear().type(testData.unitPrice)
      
      cy.get('.ant-modal-footer').contains('创建订单').click()
      cy.waitForApi('createSalesOrder')
      cy.verifySuccessMessage('销售订单创建成功')
      
      // 2. 确认发货
      cy.visit('/delivery/records')
      cy.get('body').should('exist')
      cy.wait(3000)
      cy.get('button').contains('创建发货单').click()
      cy.waitForModal()
      
      cy.get('.ant-select-selector').contains('选择订单').click()
      cy.contains(testData.customer).parent().click()
      
      cy.get('input[name="trackingNumber"]').type('SF' + Date.now())
      cy.get('.ant-modal-footer').contains('创建发货单').click()
      cy.waitForApi('createDeliveryRecord')
      cy.verifySuccessMessage('发货单创建成功')
      
      // 3. 记录收款
      cy.visit('/finance/receivables')
      cy.get('body').should('exist')
      cy.wait(3000)
      cy.get('button').contains('新增应收').click()
      cy.waitForModal()
      
      cy.get('.ant-select-selector').contains('选择客户').click()
      cy.contains(testData.customer).click()
      
      cy.get('input[name="amount"]').type(testData.totalAmount)
      cy.get('.ant-modal-footer').contains('确定').click()
      cy.waitForApi('createReceivable')
      
      cy.get('.ant-table-tbody tr').first().find('.collect-button').click()
      cy.waitForModal()
      
      cy.get('input[name="receivedAmount"]').type(testData.totalAmount)
      cy.get('.ant-modal-footer').contains('确认收款').click()
      cy.waitForApi('recordCollection')
      cy.verifySuccessMessage('收款记录成功')
    })
  })

  describe('采购到付款流程', () => {
    it('完整的采购到付款业务流程', () => {
      // 1. 创建采购订单
      cy.visit('/orders/purchase')
      cy.get('body').should('exist')
      cy.wait(3000)
      cy.get('button').contains('创建采购订单').click()
      cy.waitForModal()
      
      // 选择供应商和产品
      cy.get('.ant-select-selector').contains('选择供应商').click()
      cy.contains(testData.supplier).click()
      
      cy.get('button').contains('添加产品').click()
      cy.waitForModal()
      cy.get('input[placeholder*="搜索产品"]').type(testData.product)
      cy.contains(testData.product).parent().find('input[type="checkbox"]').check()
      cy.get('.ant-modal-footer').contains('确定').click()
      
      cy.get('input[name="quantity"]').clear().type(testData.quantity)
      cy.get('input[name="unitPrice"]').clear().type(testData.purchasePrice)
      
      cy.get('.ant-modal-footer').contains('创建订单').click()
      cy.waitForApi('createPurchaseOrder')
      cy.verifySuccessMessage('采购订单创建成功')
      
      // 2. 确认收货
      cy.visit('/receiving/records')
      cy.get('body').should('exist')
      cy.wait(3000)
      cy.get('button').contains('创建收货单').click()
      cy.waitForModal()
      
      cy.get('.ant-select-selector').contains('选择采购订单').click()
      cy.contains(testData.supplier).parent().click()
      
      cy.get('input[name="receivedQuantity"]').type(testData.quantity)
      cy.get('.ant-modal-footer').contains('确认收货').click()
      cy.waitForApi('confirmReceiving')
      cy.verifySuccessMessage('收货确认成功')
      
      // 3. 记录付款
      cy.visit('/finance/payables')
      cy.get('body').should('exist')
      cy.wait(3000)
      cy.get('button').contains('新增应付').click()
      cy.waitForModal()
      
      cy.get('.ant-select-selector').contains('选择供应商').click()
      cy.contains(testData.supplier).click()
      
      const totalPayable = testData.quantity * testData.purchasePrice
      cy.get('input[name="amount"]').type(totalPayable)
      cy.get('.ant-modal-footer').contains('确定').click()
      cy.waitForApi('createPayable')
      
      cy.get('.ant-table-tbody tr').first().find('.pay-button').click()
      cy.waitForModal()
      
      cy.get('input[name="paidAmount"]').type(totalPayable)
      cy.get('.ant-modal-footer').contains('确认付款').click()
      cy.waitForApi('recordPayment')
      cy.verifySuccessMessage('付款记录成功')
    })
  })
})