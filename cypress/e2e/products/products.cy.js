describe('产品管理模块', () => {
  beforeEach(() => {
    // 设置API拦截
    cy.intercept('GET', '/api/v1/products*').as('getProducts')
    cy.intercept('POST', '/api/v1/products').as('createProduct')
    cy.intercept('PUT', '/api/v1/products/*').as('updateProduct')
    cy.intercept('DELETE', '/api/v1/products/*').as('deleteProduct')
    cy.intercept('GET', '/api/v1/categories*').as('getCategories')
    cy.intercept('POST', '/api/v1/categories').as('createCategory')
    
    // 使用可靠的管理员登录
    cy.loginAsAdmin()
    
    // 访问产品页面
    cy.visit('/products/products')
    
    // 等待页面基本加载
    cy.get('body').should('exist')
    cy.wait(3000)
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

  describe('TC005: 产品删除功能', () => {
    it('删除单个产品', () => {
      // 获取删除前的产品数量
      cy.get('.ant-table-tbody tr').then(($rows) => {
        const initialCount = $rows.length
        
        // 点击删除按钮
        cy.get('.ant-table-tbody tr').first().find('.delete-button, [title="删除"], .ant-btn-danger').click()
        
        // 确认删除对话框
        cy.get('.ant-popconfirm, .ant-modal').should('be.visible')
        cy.contains('确定', '确认', '删除').click()
        
        // 等待API响应
        cy.waitForApi('deleteProduct')
        
        // 验证删除成功
        cy.verifySuccessMessage('删除成功')
        
        // 验证列表更新
        cy.get('.ant-table-tbody tr').should('have.length', initialCount - 1)
      })
    })

    it('取消删除操作', () => {
      cy.get('.ant-table-tbody tr').then(($rows) => {
        const initialCount = $rows.length
        
        // 点击删除按钮
        cy.get('.ant-table-tbody tr').first().find('.delete-button, [title="删除"], .ant-btn-danger').click()
        
        // 取消删除
        cy.get('.ant-popconfirm, .ant-modal').should('be.visible')
        cy.contains('取消').click()
        
        // 验证数量未变化
        cy.get('.ant-table-tbody tr').should('have.length', initialCount)
      })
    })
  })

  describe('TC006: 产品搜索和筛选', () => {
    it('按产品名称搜索', () => {
      // 输入搜索关键词
      cy.get('input[placeholder*="搜索"], input[placeholder*="产品名称"], .ant-input-search input').type('iPhone')
      cy.get('.ant-input-search-button, button[type="submit"]').click()
      
      // 等待搜索结果
      cy.wait('@getProducts')
      
      // 验证搜索结果
      cy.get('.ant-table-tbody tr').each(($row) => {
        cy.wrap($row).should('contain.text', 'iPhone')
      })
    })

    it('按产品分类筛选', () => {
      // 点击分类筛选
      cy.get('.ant-select-selector').contains('全部分类', '请选择分类').click()
      cy.contains('.ant-select-item', '智能手机').click()
      
      // 等待筛选结果
      cy.wait('@getProducts')
      
      // 验证筛选结果
      cy.get('.ant-table-tbody tr').should('have.length.greaterThan', 0)
      cy.get('.ant-table-tbody tr').each(($row) => {
        cy.wrap($row).should('contain.text', '智能手机')
      })
    })

    it('清空搜索条件', () => {
      // 先进行搜索
      cy.get('input[placeholder*="搜索"], .ant-input-search input').type('测试')
      cy.get('.ant-input-search-button, button[type="submit"]').click()
      cy.wait('@getProducts')
      
      // 清空搜索
      cy.get('.ant-input-clear-icon, .ant-input-suffix .anticon-close-circle').click()
      cy.wait('@getProducts')
      
      // 验证显示所有产品
      cy.get('.ant-table-tbody tr').should('have.length.greaterThan', 0)
    })
  })

  describe('TC007: 批量操作', () => {
    it('批量选择产品', () => {
      // 选择表头复选框（全选）
      cy.get('.ant-table-thead .ant-checkbox-input').check()
      
      // 验证所有行都被选中
      cy.get('.ant-table-tbody .ant-checkbox-input').each(($checkbox) => {
        cy.wrap($checkbox).should('be.checked')
      })
      
      // 验证批量操作按钮可用
      cy.get('button').contains('批量删除', '批量操作').should('not.be.disabled')
    })

    it('批量删除产品', () => {
      // 选择前两行
      cy.get('.ant-table-tbody tr').slice(0, 2).each(($row) => {
        cy.wrap($row).find('.ant-checkbox-input').check()
      })
      
      // 点击批量删除
      cy.get('button').contains('批量删除').click()
      
      // 确认删除
      cy.get('.ant-modal, .ant-popconfirm').should('be.visible')
      cy.contains('确定', '确认').click()
      
      // 验证删除成功
      cy.verifySuccessMessage('批量删除成功')
    })
  })

  describe('TC008: 产品分类管理', () => {
    it('查看产品分类', () => {
      // 访问产品分类页面
      cy.visit('/products/product-categories')
      cy.waitForPageLoad()
      
      // 验证页面标题
      cy.verifyPageTitle('产品分类')
      
      // 验证分类列表
      cy.get('.ant-table, .ant-tree').should('be.visible')
    })

    it('创建新分类', () => {
      cy.visit('/products/product-categories')
      cy.waitForPageLoad()
      
      // 点击新建分类
      cy.get('button').contains('新建分类', '添加分类').click()
      cy.waitForModal()
      
      // 填写分类信息
      cy.get('input[name="name"]').type('测试分类')
      cy.get('input[name="code"]').type('TEST_CATEGORY')
      cy.get('textarea[name="description"]').type('这是一个测试分类')
      
      // 提交表单
      cy.get('.ant-modal-footer').contains('确定').click()
      cy.verifySuccessMessage('创建成功')
      
      // 验证新分类出现在列表中
      cy.contains('测试分类').should('be.visible')
    })
  })

  describe('TC009: 数据验证和边界测试', () => {
    it('产品编码唯一性验证', () => {
      // 创建第一个产品
      cy.get('button').contains('新建产品').click()
      cy.waitForModal()
      
      const uniqueCode = 'UNIQUE_' + Date.now()
      cy.get('input[name="name"]').type('产品1')
      cy.get('input[name="code"]').type(uniqueCode)
      cy.get('input[name="sku"]').type('SKU1')
      
      cy.get('.ant-modal-footer').contains('确定').click()
      cy.waitForApi('createProduct')
      cy.verifySuccessMessage('创建成功')
      
      // 尝试创建相同编码的产品
      cy.get('button').contains('新建产品').click()
      cy.waitForModal()
      
      cy.get('input[name="name"]').type('产品2')
      cy.get('input[name="code"]').type(uniqueCode) // 相同编码
      cy.get('input[name="sku"]').type('SKU2')
      
      cy.get('.ant-modal-footer').contains('确定').click()
      
      // 验证错误提示
      cy.contains('编码已存在', '产品编码重复').should('be.visible')
    })

    it('长文本输入测试', () => {
      cy.get('button').contains('新建产品').click()
      cy.waitForModal()
      
      const longText = 'A'.repeat(500) // 500个字符的长文本
      
      cy.get('input[name="name"]').type(longText)
      cy.get('textarea[name="description"]').type(longText)
      
      // 验证字符限制
      cy.get('input[name="name"]').should('have.value', longText.substring(0, 100)) // 假设限制100字符
    })
  })

})