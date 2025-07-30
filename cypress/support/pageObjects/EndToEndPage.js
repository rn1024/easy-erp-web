import { BasePage } from './BasePage'

export class EndToEndPage extends BasePage {
  constructor() {
    super()
    this.selectors = {
      ...this.selectors,
      // 订单到现金流程
      salesOrderTable: '.sales-order-table',
      customerTable: '.customer-table',
      deliveryTable: '.delivery-table',
      receivablesTable: '.receivables-table',
      
      // 采购到付款流程
      purchaseRequestTable: '.purchase-request-table',
      purchaseOrderTable: '.purchase-order-table',
      supplierTable: '.supplier-table',
      payablesTable: '.payables-table',
      
      // 库存管理
      inventoryTable: '.inventory-table',
      stockMovementTable: '.stock-movement-table',
      
      // 流程状态
      processStatus: '.process-status',
      progressBar: '.progress-bar',
      timeline: '.timeline',
      
      // 操作按钮
      createFlowButton: 'button:contains("创建流程")',
      executeStepButton: 'button:contains("执行步骤")',
      validateStepButton: 'button:contains("验证步骤")',
      completeFlowButton: 'button:contains("完成流程")',
      
      // 数据验证
      validationResults: '.validation-results',
      errorMessages: '.error-messages',
      successMessages: '.success-messages',
      
      // 流程监控
      flowMonitor: '.flow-monitor',
      stepStatus: '.step-status',
      executionTime: '.execution-time',
      
      // 异常处理
      exceptionHandler: '.exception-handler',
      rollbackButton: 'button:contains("回滚")',
      retryButton: 'button:contains("重试")',
      skipButton: 'button:contains("跳过")',
      
      // 权限验证
      permissionCheck: '.permission-check',
      accessDenied: '.access-denied',
      permissionRequired: '.permission-required'
    }
  }

  // 订单到现金流程
  navigateToOrderToCash() {
    cy.visit('/e2e/order-to-cash')
    return this
  }

  startOrderToCashFlow(customerData, productData) {
    cy.get(this.selectors.createFlowButton).click()
    this.waitForModal()
    
    // 填写客户信息
    cy.get('input[name="customerName"]').type(customerData.name)
    cy.get('input[name="customerEmail"]').type(customerData.email)
    cy.get('input[name="customerPhone"]').type(customerData.phone)
    
    // 填写产品信息
    cy.get('input[name="productName"]').type(productData.name)
    cy.get('input[name="quantity"]').type(productData.quantity)
    cy.get('input[name="unitPrice"]').type(productData.price)
    
    cy.get('.ant-modal-footer').contains('开始流程').click()
    this.waitForApi('startOrderToCashFlow')
    return this
  }

  executeOrderStep(stepName) {
    cy.get('.step-item').contains(stepName).parent().find(this.selectors.executeStepButton).click()
    this.waitForApi(`execute${stepName.replace(/\s+/g, '')}`)
    return this
  }

  validateOrderStep(stepName) {
    cy.get('.step-item').contains(stepName).parent().find(this.selectors.validateStepButton).click()
    this.waitForApi(`validate${stepName.replace(/\s+/g, '')}`)
    return this
  }

  // 采购到付款流程
  navigateToProcureToPay() {
    cy.visit('/e2e/procure-to-pay')
    return this
  }

  startProcureToPayFlow(supplierData, productData) {
    cy.get(this.selectors.createFlowButton).click()
    this.waitForModal()
    
    // 填写供应商信息
    cy.get('input[name="supplierName"]').type(supplierData.name)
    cy.get('input[name="supplierEmail"]').type(supplierData.email)
    cy.get('input[name="supplierPhone"]').type(supplierData.phone)
    
    // 填写产品信息
    cy.get('input[name="productName"]').type(productData.name)
    cy.get('input[name="quantity"]').type(productData.quantity)
    cy.get('input[name="unitPrice"]').type(productData.price)
    
    cy.get('.ant-modal-footer').contains('开始流程').click()
    this.waitForApi('startProcureToPayFlow')
    return this
  }

  executeProcureStep(stepName) {
    cy.get('.step-item').contains(stepName).parent().find(this.selectors.executeStepButton).click()
    this.waitForApi(`execute${stepName.replace(/\s+/g, '')}`)
    return this
  }

  validateProcureStep(stepName) {
    cy.get('.step-item').contains(stepName).parent().find(this.selectors.validateStepButton).click()
    this.waitForApi(`validate${stepName.replace(/\s+/g, '')}`)
    return this
  }

  // 库存验证
  verifyInventory(productName, expectedQuantity) {
    cy.visit('/inventory')
    cy.get('input[placeholder*="搜索产品"]').type(productName)
    cy.get('button[type="submit"]').click()
    
    cy.get('.ant-table-tbody tr').first().within(() => {
      cy.get('td').eq(3).should('contain', expectedQuantity)
    })
    return this
  }

  verifyStockMovement(productName, movementType) {
    cy.visit('/inventory/movements')
    cy.get('input[placeholder*="搜索产品"]').type(productName)
    cy.get('button[type="submit"]').click()
    
    cy.get('.ant-table-tbody tr').first().within(() => {
      cy.get('td').eq(2).should('contain', movementType)
    })
    return this
  }

  // 财务验证
  verifyFinancialTransaction(transactionType, amount) {
    cy.visit('/finance/transactions')
    cy.get('.ant-table-tbody tr').first().within(() => {
      cy.get('td').eq(1).should('contain', transactionType)
      cy.get('td').eq(2).should('contain', amount)
    })
    return this
  }

  verifyAccountBalance(accountName, expectedBalance) {
    cy.visit('/finance/accounts')
    cy.get('.ant-table-tbody tr').contains(accountName).parent().within(() => {
      cy.get('td').last().should('contain', expectedBalance)
    })
    return this
  }

  // 流程状态验证
  verifyFlowStatus(flowName, expectedStatus) {
    cy.get('.flow-status').should('contain', flowName)
    cy.get('.status-badge').should('contain', expectedStatus)
    return this
  }

  verifyStepCompletion(stepName) {
    cy.get('.step-item').contains(stepName).parent().within(() => {
      cy.get('.step-icon').should('have.class', 'completed')
    })
    return this
  }

  // 异常处理
  handleException(stepName, exceptionType) {
    cy.get('.step-item').contains(stepName).parent().find(this.selectors.exceptionHandler).click()
    cy.waitForModal()
    
    cy.get('.ant-select-selector').contains('异常类型').click()
    cy.contains(exceptionType).click()
    
    cy.get('textarea[name="exceptionNote"]').type(`处理${exceptionType}异常`)
    
    cy.get('.ant-modal-footer').contains('处理异常').click()
    this.waitForApi('handleException')
    return this
  }

  rollbackFlow(flowName) {
    cy.get('.flow-item').contains(flowName).parent().find(this.selectors.rollbackButton).click()
    cy.get('.ant-popconfirm').contains('确定').click()
    this.waitForApi('rollbackFlow')
    return this
  }

  retryStep(stepName) {
    cy.get('.step-item').contains(stepName).parent().find(this.selectors.retryButton).click()
    this.waitForApi('retryStep')
    return this
  }

  // 权限验证
  verifyRolePermission(role, expectedPermissions) {
    cy.get('.role-permissions').contains(role).parent().within(() => {
      expectedPermissions.forEach(permission => {
        cy.get('.permission-item').should('contain', permission)
      })
    })
    return this
  }

  checkAccessRestriction(resource, role) {
    cy.visit(resource)
    cy.get('.access-check').then(($el) => {
      if ($el.hasClass('access-denied')) {
        cy.get('.permission-required').should('contain', role)
      } else {
        cy.get('.permission-granted').should('contain', role)
      }
    })
    return this
  }

  // 性能监控
  measureFlowExecutionTime(flowName) {
    cy.get('.flow-monitor').contains(flowName).parent().within(() => {
      cy.get('.execution-time').invoke('text').then((timeText) => {
        const executionTime = parseInt(timeText)
        cy.wrap(executionTime).should('be.lessThan', 300000) // 5分钟
      })
    })
    return this
  }

  // 数据一致性验证
  verifyDataConsistency() {
    // 验证订单数据一致性
    cy.get('.consistency-check').contains('订单数据一致性').should('be.visible')
    
    // 验证库存数据一致性
    cy.get('.consistency-check').contains('库存数据一致性').should('be.visible')
    
    // 验证财务数据一致性
    cy.get('.consistency-check').contains('财务数据一致性').should('be.visible')
    
    return this
  }

  // 批量流程验证
  executeBatchFlow(flowType, batchData) {
    cy.get('.batch-flow').contains(flowType).parent().find('.execute-batch').click()
    cy.waitForModal()
    
    batchData.forEach((data, index) => {
      cy.get(`input[name="batchItem${index}"]`).type(data.key)
      cy.get(`input[name="batchValue${index}"]`).type(data.value)
    })
    
    cy.get('.ant-modal-footer').contains('执行批量').click()
    this.waitForApi('executeBatchFlow')
    return this
  }

  // 报告生成
  generateFlowReport(flowName) {
    cy.get('.flow-report').contains(flowName).parent().find('.generate-report').click()
    this.waitForApi('generateFlowReport')
    
    cy.verifyDownload(`${flowName}-report.pdf`)
    return this
  }

  // 清理流程数据
  cleanupFlowData(flowName) {
    cy.get('.flow-cleanup').contains(flowName).parent().find('.cleanup-button').click()
    cy.get('.ant-popconfirm').contains('确定').click()
    this.waitForApi('cleanupFlowData')
    return this
  }

  // 验证功能
  verifyFlowSuccess(flowName) {
    cy.get('.flow-result').contains(flowName).parent().within(() => {
      cy.get('.success-indicator').should('be.visible')
    })
    return this
  }

  verifyFlowError(flowName, expectedError) {
    cy.get('.flow-result').contains(flowName).parent().within(() => {
      cy.get('.error-message').should('contain', expectedError)
    })
    return this
  }

  verifyStepData(stepName, expectedData) {
    cy.get('.step-data').contains(stepName).parent().within(() => {
      Object.keys(expectedData).forEach(key => {
        cy.get(`.${key}`).should('contain', expectedData[key])
      })
    })
    return this
  }

  // 实时流程监控
  monitorRealTimeFlow(flowId) {
    cy.visit(`/e2e/monitor/${flowId}`)
    
    cy.get('.real-time-monitor').should('be.visible')
    cy.get('.current-step').should('be.visible')
    cy.get('.progress-percentage').should('be.visible')
    
    return this
  }

  // 流程性能分析
  analyzeFlowPerformance(flowName) {
    cy.visit('/e2e/performance')
    
    cy.get('.performance-dashboard').should('be.visible')
    cy.get('.flow-stats').contains(flowName).should('be.visible')
    
    return this
  }
}