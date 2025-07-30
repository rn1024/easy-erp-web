describe('库存管理模块', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.visit('/inventory/finished-inventory')
    cy.waitForPageLoad()
  })

  describe('TC001: 核心库存功能', () => {
    it('库存列表正常显示', () => {
      cy.verifyPageTitle('成品库存')
      cy.get('.ant-table').should('be.visible')
      cy.contains('产品名称').should('be.visible')
      cy.contains('当前库存').should('be.visible')
      cy.contains('库存状态').should('be.visible')
    })

    it('库存状态标识', () => {
      cy.get('.stock-status-normal').should('exist')
      cy.get('.stock-status-warning').should('exist')
      cy.get('.stock-status-danger').should('exist')
    })

    it('库存筛选功能', () => {
      cy.get('.ant-select-selector').contains('库存状态').click()
      cy.contains('库存不足').click()
      cy.waitForApi('filterInventory')
      cy.get('.ant-table-tbody tr').should('have.length.greaterThan', 0)
    })
  })



  describe('TC002: 库存调整', () => {
    it('库存入库操作', () => {
      cy.get('.ant-table-tbody tr').first().find('.adjust-button').click()
      cy.waitForModal()
      cy.contains('库存调整').should('be.visible')

      cy.get('.ant-select-selector').contains('调整类型').click()
      cy.contains('入库').click()
      cy.get('input[name="quantity"]').type('50')
      cy.get('textarea[name="reason"]').type('新采购入库')

      cy.get('.ant-modal-footer').contains('确定').click()
      cy.waitForApi('adjustInventory')
      cy.verifySuccessMessage('库存调整成功')
    })

    it('库存出库操作', () => {
      cy.get('.ant-table-tbody tr').first().find('.adjust-button').click()
      cy.waitForModal()

      cy.get('.ant-select-selector').contains('调整类型').click()
      cy.contains('出库').click()
      cy.get('input[name="quantity"]').type('30')
      cy.get('textarea[name="reason"]').type('销售出库')

      cy.get('.ant-modal-footer').contains('确定').click()
      cy.waitForApi('adjustInventory')
      cy.verifySuccessMessage('库存调整成功')
    })
  })












})