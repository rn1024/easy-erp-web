// 自定义Cypress命令

// 登录命令
Cypress.Commands.add('login', (username, password) => {
  cy.session([username, password], () => {
    cy.visit('/login')
    cy.get('input[name="username"]').type(username)
    cy.get('input[name="password"]').type(password)
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/dashboard')
  })
})

// 管理员登录
Cypress.Commands.add('loginAsAdmin', () => {
  cy.login(Cypress.env('adminUser'), Cypress.env('adminPassword'))
})

// 采购经理登录
Cypress.Commands.add('loginAsPurchaseManager', () => {
  cy.login(Cypress.env('purchaseManagerUser'), Cypress.env('purchaseManagerPassword'))
})

// 仓库管理员登录
Cypress.Commands.add('loginAsWarehouseAdmin', () => {
  cy.login(Cypress.env('warehouseAdminUser'), Cypress.env('warehouseAdminPassword'))
})

// 财务人员登录
Cypress.Commands.add('loginAsFinanceUser', () => {
  cy.login(Cypress.env('financeUser'), Cypress.env('financePassword'))
})

// 等待加载完成
Cypress.Commands.add('waitForLoading', () => {
  cy.get('.ant-spin').should('not.exist')
  cy.get('.loading').should('not.exist')
})

// 等待API响应
Cypress.Commands.add('waitForApi', (alias) => {
  cy.wait(`@${alias}`).then((interception) => {
    expect(interception.response.statusCode).to.be.oneOf([200, 201])
  })
})

// 选择下拉框选项
Cypress.Commands.add('selectDropdownOption', (selector, optionText) => {
  cy.get(selector).click()
  cy.contains('.ant-select-item-option-content', optionText).click()
})

// 上传文件
Cypress.Commands.add('uploadFile', (selector, filePath) => {
  cy.get(selector).selectFile(filePath, { force: true })
})

// 清除并输入文本
Cypress.Commands.add('clearAndType', (selector, text) => {
  cy.get(selector).clear().type(text)
})

// 验证成功消息
Cypress.Commands.add('verifySuccessMessage', (message) => {
  cy.contains('.ant-message-success', message).should('be.visible')
})

// 验证错误消息
Cypress.Commands.add('verifyErrorMessage', (message) => {
  cy.contains('.ant-message-error', message).should('be.visible')
})

// 验证页面标题
Cypress.Commands.add('verifyPageTitle', (title) => {
  cy.get('h1').should('contain', title)
})

// 验证URL包含
Cypress.Commands.add('verifyUrlContains', (urlPart) => {
  cy.url().should('include', urlPart)
})

// 点击按钮并等待
Cypress.Commands.add('clickAndWait', (buttonText, apiAlias) => {
  cy.contains('button', buttonText).click()
  if (apiAlias) {
    cy.waitForApi(apiAlias)
  }
})

// 表格操作
Cypress.Commands.add('findTableRow', (searchText) => {
  return cy.get('.ant-table-row').contains(searchText).parent()
})

Cypress.Commands.add('clickTableAction', (searchText, actionText) => {
  cy.findTableRow(searchText).find(`button:contains("${actionText}")`).click()
})

// 模态框操作
Cypress.Commands.add('closeModal', () => {
  cy.get('.ant-modal-close').click()
})

Cypress.Commands.add('confirmModalAction', (actionText) => {
  cy.get('.ant-modal-footer').contains('button', actionText).click()
})

// 表单验证
Cypress.Commands.add('verifyFormValidation', (fieldName, errorMessage) => {
  cy.contains('.ant-form-item-explain-error', errorMessage).should('be.visible')
})

// 数据验证
Cypress.Commands.add('verifyDataInTable', (columnIndex, expectedValue) => {
  cy.get('.ant-table-row').first().find('td').eq(columnIndex).should('contain', expectedValue)
})

// 分页操作
Cypress.Commands.add('goToPage', (pageNumber) => {
  cy.get('.ant-pagination').contains(pageNumber).click()
})

Cypress.Commands.add('verifyPagination', (totalText) => {
  cy.get('.ant-pagination-total-text').should('contain', totalText)
})

// 搜索操作
Cypress.Commands.add('searchAndVerify', (searchTerm, expectedCount) => {
  cy.get('input[placeholder*="搜索"]').type(searchTerm)
  cy.get('.search-button').click()
  if (expectedCount) {
    cy.get('.ant-table-row').should('have.length', expectedCount)
  }
})

// 日期选择器
Cypress.Commands.add('selectDate', (selector, date) => {
  cy.get(selector).click()
  cy.get('.ant-picker-input input').clear().type(date)
  cy.get('.ant-picker-ok').click()
})

// 文件下载验证
Cypress.Commands.add('verifyFileDownload', (fileName) => {
  cy.readFile(`cypress/downloads/${fileName}`).should('exist')
})

// 权限验证
Cypress.Commands.add('verifyPermissionDenied', (url) => {
  cy.visit(url, { failOnStatusCode: false })
  cy.contains('403').should('be.visible')
})

// 响应式测试
Cypress.Commands.add('testResponsive', (viewport, callback) => {
  cy.viewport(viewport.width, viewport.height)
  callback()
})

// 性能测试
Cypress.Commands.add('measurePerformance', (action, threshold = 3000) => {
  const startTime = Date.now()
  action()
  cy.then(() => {
    const endTime = Date.now()
    const duration = endTime - startTime
    expect(duration).to.be.lessThan(threshold)
  })
})