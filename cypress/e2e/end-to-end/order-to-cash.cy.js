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
    cy.loginAsAdmin()
  })

  describe('订单到现金流程', () => {
    it('完整的订单到现金业务流程', () => {
      // 1. 创建销售订单
      cy.visit('/orders/sales')
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