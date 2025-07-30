describe('采购管理模块 - 采购订单测试', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.visit('/purchase/purchase-orders')
  })

  describe('TC031: 核心采购功能', () => {
    it('显示采购订单列表', () => {
      cy.verifyPageTitle('采购订单')
      cy.get('.ant-table').should('be.visible')
      cy.contains('订单编号').should('be.visible')
      cy.contains('供应商').should('be.visible')
      cy.contains('订单金额').should('be.visible')
      cy.contains('订单状态').should('be.visible')
    })

  describe('TC032: 创建采购订单', () => {
    it('创建采购订单', () => {
      cy.get('button').contains('新建采购订单').click()
      cy.waitForModal()

      // 选择供应商
      cy.get('.ant-select-selector').contains('请选择供应商').click()
      cy.contains('深圳华强北电子有限公司').click()

      // 选择采购产品
      cy.get('button').contains('添加产品').click()
      cy.waitForModal()
      cy.get('.ant-table-tbody tr').first().find('.ant-checkbox-input').click()
      cy.get('.ant-modal-footer').contains('确定').click()

      // 填写采购数量和价格
      cy.get('input[name="quantity"]').first().clear().type('100')
      cy.get('input[name="price"]').first().clear().type('5999')

      // 提交订单
      cy.get('.ant-modal-footer').contains('确定').click()
      cy.waitForApi('createPurchaseOrder')
      cy.verifySuccessMessage('创建成功')
    })

    it('必填字段验证', () => {
      cy.get('button').contains('新建采购订单').click()
      cy.waitForModal()
      cy.get('.ant-modal-footer').contains('确定').click()
      
      cy.verifyFormValidation('supplierId', '请选择供应商')
    })
  })

  describe('TC033: 采购订单审批', () => {
    beforeEach(() => {
      cy.createTestPurchaseOrder('pending_approval')
      cy.reload()
    })

    it('审批采购订单', () => {
      cy.get('.ant-table-tbody tr').first().find('.approve-button').click()
      cy.waitForModal()
      cy.contains('审批采购订单').should('be.visible')

      // 填写审批意见
      cy.get('textarea[name="approvalRemark"]').type('同意采购申请')

      cy.get('.ant-modal-footer').contains('同意').click()
      cy.waitForApi('approvePurchaseOrder')
      cy.verifySuccessMessage('审批成功')
    })

    it('拒绝采购订单', () => {
      cy.get('.ant-table-tbody tr').first().find('.reject-button').click()
      cy.waitForModal()

      // 填写拒绝原因
      cy.get('textarea[name="rejectionReason"]').type('预算不足，暂缓采购')

      cy.get('.ant-modal-footer').contains('拒绝').click()
      cy.waitForApi('rejectPurchaseOrder')
      cy.verifySuccessMessage('已拒绝')
    })
  })
})
})