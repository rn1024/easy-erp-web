describe('产品管理模块', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.visit('/products/products')
  })

  describe('TC001: 产品列表查看', () => {
    it('显示产品列表', () => {
      cy.verifyPageTitle('产品管理')
      cy.get('.ant-table').should('be.visible')
      cy.contains('产品名称').should('be.visible')
      cy.contains('产品编码').should('be.visible')
      cy.contains('分类').should('be.visible')
    })
  })

  describe('TC002: 创建新产品', () => {
    it('创建产品基本功能', () => {
      cy.get('button').contains('新建产品').click()
      cy.waitForModal()
      
      // 填写基本信息
      cy.get('input[name="name"]').type('测试产品')
      cy.get('input[name="code"]').type('TEST001')
      cy.get('input[name="sku"]').type('SKU-TEST-001')
      
      // 选择分类
      cy.get('.ant-select-selector').contains('请选择分类').click()
      cy.contains('智能家居').click()
      
      // 提交表单
      cy.get('.ant-modal-footer').contains('确定').click()
      cy.waitForApi('createProduct')
      
      cy.verifySuccessMessage('创建成功')
      cy.contains('测试产品').should('be.visible')
    })

    it('必填字段验证', () => {
      cy.get('button').contains('新建产品').click()
      cy.waitForModal()
      
      cy.get('.ant-modal-footer').contains('确定').click()
      cy.verifyFormValidation('name', '请输入产品名称')
      cy.verifyFormValidation('code', '请输入产品编码')
    })
  })

  describe('TC003: 编辑产品信息', () => {
    it('编辑产品基本信息', () => {
      cy.get('.ant-table-tbody tr').first().find('.edit-button').click()
      cy.waitForModal()

      cy.get('input[name="name"]').clear().type('编辑后的产品名称')
      cy.get('.ant-modal-footer').contains('确定').click()
      cy.waitForApi('updateProduct')
      cy.verifySuccessMessage('更新成功')
    })
  })

  describe('TC004: 产品详情查看', () => {
    it('查看产品详情', () => {
      cy.get('.ant-table-tbody tr').first().find('.view-button').click()
      cy.waitForModal()
      cy.contains('产品详情').should('be.visible')
      cy.contains('基本信息').should('be.visible')
    })
  })


})