describe('采购管理模块 - 采购订单测试', () => {
  beforeEach(() => {
    cy.log('🔐 开始采购模块测试 - 登录验证阶段')
    
    // 设置API拦截 - 添加Mock响应数据
    cy.intercept('GET', '/api/v1/purchase-orders*').as('getPurchaseOrders')
    
    cy.intercept('POST', '/api/v1/purchase-orders').as('createPurchaseOrder')
    
    cy.intercept('PUT', '/api/v1/purchase-orders/*/approve').as('approvePurchaseOrder')
    
    cy.intercept('PUT', '/api/v1/purchase-orders/*/reject').as('rejectPurchaseOrder')
    
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
        cy.log('🚀 登录验证完成 - 开始访问采购订单页面')
        
        // 访问采购订单页面
        cy.visit('/purchase/purchase-orders')
        cy.log('📍 已访问采购订单页面')
        
        // 等待API调用完成
        cy.wait('@getPurchaseOrders')
          .then((interception) => {
            const status = interception.response?.statusCode || 'unknown'
            cy.log(`✅ 采购订单API调用完成 - 状态码: ${status}`)
            if (interception.response?.statusCode >= 400) {
              throw new Error(`采购订单API调用失败 - 状态码: ${status}`)
            }
          })
        
        cy.wait('@getSuppliers')
          .then((interception) => {
            const status = interception.response?.statusCode || 'unknown'
            cy.log(`✅ 供应商API调用完成 - 状态码: ${status}`)
            if (interception.response?.statusCode >= 400) {
              throw new Error(`供应商API调用失败 - 状态码: ${status}`)
            }
          })
        
        cy.wait('@getProducts')
          .then((interception) => {
            const status = interception.response?.statusCode || 'unknown'
            cy.log(`✅ 产品API调用完成 - 状态码: ${status}`)
            if (interception.response?.statusCode >= 400) {
              throw new Error(`产品API调用失败 - 状态码: ${status}`)
            }
          })
        
        // 等待页面渲染完成
        cy.get('.ant-table', { timeout: 15000 }).should('be.visible')
          .then(() => {
            cy.log('✅ 采购订单页面加载完成 - 表格已显示')
          })
      })
      .then(() => {
        cy.log('🎉 采购模块测试前置条件全部完成')
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