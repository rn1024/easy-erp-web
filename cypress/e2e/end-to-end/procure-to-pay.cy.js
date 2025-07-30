describe('端到端业务流程测试 - 采购到付款流程', () => {
  const testData = {
    supplier: '富士康科技',
    product: 'iPhone 15 Pro Max',
    quantity: 200,
    unitPrice: 6999,
    totalAmount: 1399800
  }

  beforeEach(() => {
    cy.loginAsAdmin()
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