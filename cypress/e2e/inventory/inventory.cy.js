describe('库存管理模块', () => {
  beforeEach(() => {
    cy.log('🔐 开始库存模块测试 - 登录验证阶段')
    
    // 设置API拦截 - 添加Mock响应数据
    cy.intercept('GET', '/api/v1/inventory*').as('getInventory')
    
    cy.intercept('POST', '/api/v1/inventory/adjust').as('adjustInventory')
    
    cy.intercept('GET', '/api/v1/inventory/filter*').as('filterInventory')
    
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
        cy.log('🚀 登录验证完成 - 开始访问库存页面')
        
        // 访问库存页面
        cy.visit('/inventory/finished-inventory')
        cy.log('📍 已访问库存页面')
        
        // 等待API调用完成
        cy.wait('@getInventory')
          .then((interception) => {
            const status = interception.response?.statusCode || 'unknown'
            cy.log(`✅ 库存API调用完成 - 状态码: ${status}`)
            if (interception.response?.statusCode >= 400) {
              throw new Error(`库存API调用失败 - 状态码: ${status}`)
            }
          })
        
        // 等待页面渲染完成
        cy.get('.ant-table', { timeout: 15000 }).should('be.visible')
          .then(() => {
            cy.log('✅ 库存页面加载完成 - 表格已显示')
          })
      })
      .then(() => {
        cy.log('🎉 库存模块测试前置条件全部完成')
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