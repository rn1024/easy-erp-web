import { BasePage } from './BasePage'

export class FinancePage extends BasePage {
  constructor() {
    super()
    this.selectors = {
      ...this.selectors,
      // 财务报表
      reportTable: '.ant-table-tbody',
      revenueChart: '.revenue-chart',
      expenseChart: '.expense-chart',
      profitChart: '.profit-chart',
      cashFlowChart: '.cash-flow-chart',
      
      // 收入管理
      revenueTable: '.revenue-table',
      revenueFilter: '.revenue-filter',
      revenueDatePicker: '.ant-picker-range',
      revenueCategorySelect: '.ant-select-selector',
      revenueSourceSelect: '.ant-select-selector',
      
      // 成本管理
      costTable: '.cost-table',
      costFilter: '.cost-filter',
      costCategorySelect: '.ant-select-selector',
      costDepartmentSelect: '.ant-select-selector',
      costProjectSelect: '.ant-select-selector',
      
      // 利润分析
      profitAnalysis: '.profit-analysis',
      profitMarginChart: '.profit-margin-chart',
      productProfitChart: '.product-profit-chart',
      customerProfitChart: '.customer-profit-chart',
      
      // 现金流管理
      cashFlowTable: '.cash-flow-table',
      cashFlowFilter: '.cash-flow-filter',
      cashFlowProjection: '.cash-flow-projection',
      cashFlowAlert: '.cash-flow-alert',
      
      // 应收应付
      receivablesTable: '.receivables-table',
      payablesTable: '.payables-table',
      agingReport: '.aging-report',
      collectionReport: '.collection-report',
      
      // 预算管理
      budgetTable: '.budget-table',
      budgetCreateButton: 'button:contains("创建预算")',
      budgetEditButton: 'button:contains("编辑预算")',
      budgetApproveButton: 'button:contains("审批预算")',
      budgetVarianceButton: 'button:contains("预算差异")',
      
      // 财务凭证
      voucherTable: '.voucher-table',
      voucherCreateButton: 'button:contains("创建凭证")',
      voucherApproveButton: 'button:contains("审批凭证")',
      voucherPostButton: 'button:contains("过账凭证")',
      
      // 税务管理
      taxTable: '.tax-table',
      taxReturnButton: 'button:contains("税务申报")',
      taxCalculationButton: 'button:contains("税务计算")',
      taxReportButton: 'button:contains("税务报告")',
      
      // 财务报表
      balanceSheet: '.balance-sheet',
      incomeStatement: '.income-statement',
      cashFlowStatement: '.cash-flow-statement',
      customReportButton: 'button:contains("自定义报表")',
      
      // 搜索和筛选
      searchInput: 'input[placeholder*="搜索"]',
      dateRangePicker: '.ant-picker-range',
      categorySelect: '.ant-select-selector',
      statusSelect: '.ant-select-selector',
      
      // 操作按钮
      viewButton: '.view-button',
      editButton: '.edit-button',
      deleteButton: '.delete-button',
      approveButton: '.approve-button',
      rejectButton: '.reject-button',
      exportButton: 'button:contains("导出")',
      printButton: 'button:contains("打印")',
      
      // 统计面板
      financialDashboard: '.financial-dashboard',
      kpiCards: '.kpi-card',
      trendChart: '.trend-chart',
      comparisonChart: '.comparison-chart',
      
      // 预警系统
      financialAlert: '.financial-alert',
      budgetAlert: '.budget-alert',
      cashAlert: '.cash-alert',
      overdueAlert: '.overdue-alert',
      
      // 模态框表单
      amountInput: 'input[name="amount"]',
      descriptionInput: 'input[name="description"]',
      categoryInput: 'input[name="category"]',
      dateInput: 'input[name="date"]',
      accountInput: 'input[name="account"]',
      projectInput: 'input[name="project"]',
      departmentInput: 'input[name="department"]',
      taxRateInput: 'input[name="taxRate"]',
      noteTextarea: 'textarea[name="note"]',
      
      // 审批流程
      approvalModal: '.approval-modal',
      approvalComment: 'textarea[name="approvalComment"]',
      approvalStatus: '.approval-status',
      
      // 对账管理
      reconciliationTable: '.reconciliation-table',
      matchButton: 'button:contains("匹配")',
      unmatchButton: 'button:contains("不匹配")',
      adjustButton: 'button:contains("调整")'
    }
  }

  // 导航到财务模块
  navigateToFinance() {
    cy.visit('/finance')
    return this
  }

  navigateToRevenue() {
    cy.visit('/finance/revenue')
    return this
  }

  navigateToCosts() {
    cy.visit('/finance/costs')
    return this
  }

  navigateToProfit() {
    cy.visit('/finance/profit')
    return this
  }

  navigateToCashFlow() {
    cy.visit('/finance/cash-flow')
    return this
  }

  navigateToBudget() {
    cy.visit('/finance/budget')
    return this
  }

  navigateToReports() {
    cy.visit('/finance/reports')
    return this
  }

  navigateToTax() {
    cy.visit('/finance/tax')
    return this
  }

  // 收入管理
  searchRevenue(keyword) {
    cy.get(this.selectors.searchInput).clear().type(keyword)
    cy.get(this.selectors.searchButton).click()
    return this
  }

  filterRevenue(filters) {
    if (filters.dateRange) {
      cy.get(this.selectors.revenueDatePicker).click()
      cy.contains(filters.dateRange.start).click()
      cy.contains(filters.dateRange.end).click()
    }
    if (filters.category) {
      cy.get(this.selectors.revenueCategorySelect).click()
      cy.contains(filters.category).click()
    }
    if (filters.source) {
      cy.get(this.selectors.revenueSourceSelect).click()
      cy.contains(filters.source).click()
    }
    return this
  }

  createRevenueRecord(revenueData) {
    cy.get('button').contains('新增收入').click()
    this.waitForModal()

    cy.get(this.selectors.amountInput).type(revenueData.amount)
    cy.get(this.selectors.descriptionInput).type(revenueData.description)
    cy.get(this.selectors.categoryInput).type(revenueData.category)
    
    if (revenueData.date) {
      cy.get(this.selectors.dateInput).click()
      cy.contains(revenueData.date).click()
    }
    
    if (revenueData.project) {
      cy.get(this.selectors.projectInput).type(revenueData.project)
    }

    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('createRevenueRecord')
    return this
  }

  // 成本管理
  createCostRecord(costData) {
    cy.get('button').contains('新增成本').click()
    this.waitForModal()

    cy.get(this.selectors.amountInput).type(costData.amount)
    cy.get(this.selectors.descriptionInput).type(costData.description)
    cy.get(this.selectors.categoryInput).type(costData.category)
    
    if (costData.department) {
      cy.get(this.selectors.departmentInput).type(costData.department)
    }
    
    if (costData.project) {
      cy.get(this.selectors.projectInput).type(costData.project)
    }

    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('createCostRecord')
    return this
  }

  // 预算管理
  createBudget(budgetData) {
    cy.get(this.selectors.budgetCreateButton).click()
    this.waitForModal()

    cy.get(this.selectors.descriptionInput).type(budgetData.name)
    cy.get(this.selectors.amountInput).type(budgetData.amount)
    
    if (budgetData.category) {
      cy.get(this.selectors.categoryInput).type(budgetData.category)
    }
    
    if (budgetData.period) {
      cy.get('.ant-select-selector').contains('预算期间').click()
      cy.contains(budgetData.period).click()
    }

    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('createBudget')
    return this
  }

  approveBudget(budgetId) {
    cy.get('.ant-table-tbody tr').contains(budgetId).parent().find(this.selectors.approveButton).click()
    this.waitForModal()
    
    cy.get(this.selectors.approvalComment).type('预算审批通过')
    cy.get('.ant-modal-footer').contains('通过').click()
    this.waitForApi('approveBudget')
    return this
  }

  // 现金流管理
  createCashFlowRecord(flowData) {
    cy.get('button').contains('新增现金流').click()
    this.waitForModal()

    cy.get(this.selectors.amountInput).type(flowData.amount)
    cy.get(this.selectors.descriptionInput).type(flowData.description)
    
    if (flowData.type) {
      cy.get('.ant-select-selector').contains('现金流类型').click()
      cy.contains(flowData.type).click()
    }

    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('createCashFlowRecord')
    return this
  }

  // 应收应付管理
  createReceivable(receivableData) {
    cy.get('button').contains('新增应收').click()
    this.waitForModal()

    cy.get(this.selectors.amountInput).type(receivableData.amount)
    cy.get(this.selectors.descriptionInput).type(receivableData.description)
    cy.get('.ant-select-selector').contains('客户').click()
    cy.contains(receivableData.customer).click()

    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('createReceivable')
    return this
  }

  createPayable(payableData) {
    cy.get('button').contains('新增应付').click()
    this.waitForModal()

    cy.get(this.selectors.amountInput).type(payableData.amount)
    cy.get(this.selectors.descriptionInput).type(payableData.description)
    cy.get('.ant-select-selector').contains('供应商').click()
    cy.contains(payableData.supplier).click()

    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('createPayable')
    return this
  }

  // 报表生成
  generateReport(reportType) {
    cy.get('button').contains('生成报表').click()
    this.waitForModal()

    cy.get('.ant-select-selector').contains('报表类型').click()
    cy.contains(reportType).click()

    cy.get('.ant-modal-footer').contains('生成').click()
    this.waitForApi('generateReport')
    return this
  }

  generateCustomReport(customData) {
    cy.get(this.selectors.customReportButton).click()
    this.waitForModal()

    cy.get('.ant-select-selector').contains('报表类型').click()
    cy.contains(customData.type).click()
    
    if (customData.dateRange) {
      cy.get('.ant-picker-range').click()
      cy.contains(customData.dateRange.start).click()
      cy.contains(customData.dateRange.end).click()
    }

    cy.get('.ant-modal-footer').contains('生成').click()
    this.waitForApi('generateCustomReport')
    return this
  }

  // 税务管理
  calculateTax(taxData) {
    cy.get(this.selectors.taxCalculationButton).click()
    this.waitForModal()

    cy.get(this.selectors.amountInput).type(taxData.amount)
    cy.get(this.selectors.taxRateInput).type(taxData.taxRate)
    
    if (taxData.category) {
      cy.get('.ant-select-selector').contains('税种').click()
      cy.contains(taxData.category).click()
    }

    cy.get('button').contains('计算').click()
    this.waitForApi('calculateTax')
    return this
  }

  generateTaxReturn() {
    cy.get(this.selectors.taxReturnButton).click()
    this.waitForModal()

    cy.get('.ant-select-selector').contains('申报期间').click()
    cy.contains('本月').click()

    cy.get('.ant-modal-footer').contains('生成').click()
    this.waitForApi('generateTaxReturn')
    return this
  }

  // 对账管理
  reconcileTransaction(transactionId) {
    cy.get('.ant-table-tbody tr').contains(transactionId).parent().find(this.selectors.matchButton).click()
    this.waitForModal()

    cy.get('.ant-select-selector').contains('匹配规则').click()
    cy.contains('自动匹配').click()

    cy.get('.ant-modal-footer').contains('匹配').click()
    this.waitForApi('reconcileTransaction')
    return this
  }

  // 统计分析
  viewFinancialDashboard() {
    cy.get(this.selectors.financialDashboard).should('be.visible')
    return this
  }

  viewKPICards() {
    cy.get(this.selectors.kpiCards).should('be.visible')
    return this
  }

  viewTrendChart() {
    cy.get(this.selectors.trendChart).should('be.visible')
    return this
  }

  viewComparisonChart() {
    cy.get(this.selectors.comparisonChart).should('be.visible')
    return this
  }

  // 预警系统
  checkFinancialAlerts() {
    cy.get(this.selectors.financialAlert).should('be.visible')
    return this
  }

  checkBudgetAlerts() {
    cy.get(this.selectors.budgetAlert).should('be.visible')
    return this
  }

  checkCashAlerts() {
    cy.get(this.selectors.cashAlert).should('be.visible')
    return this
  }

  checkOverdueAlerts() {
    cy.get(this.selectors.overdueAlert).should('be.visible')
    return this
  }

  // 数据导出
  exportFinancialData(exportType) {
    cy.get(this.selectors.exportButton).click()
    cy.get('.ant-dropdown-menu').contains(exportType).click()
    this.waitForApi('exportFinancialData')
    return this
  }

  // 验证功能
  verifyRevenueExists(revenueSource) {
    cy.contains(revenueSource).should('be.visible')
    return this
  }

  verifyCostExists(costCategory) {
    cy.contains(costCategory).should('be.visible')
    return this
  }

  verifyBudgetVariance(budgetId, expectedVariance) {
    cy.get('.ant-table-tbody tr').contains(budgetId).parent().should('contain', expectedVariance)
    return this
  }

  verifyCashFlowBalance(expectedBalance) {
    cy.get('.cash-flow-balance').should('contain', expectedBalance)
    return this
  }

  verifyProfitMargin(expectedMargin) {
    cy.get('.profit-margin').should('contain', expectedMargin)
    return this
  }

  // 权限验证
  verifyFinancePermissions(role) {
    switch(role) {
      case 'admin':
        cy.get('button').contains('新增收入').should('be.visible')
        cy.get('button').contains('新增成本').should('be.visible')
        cy.get('button').contains('创建预算').should('be.visible')
        break
      case 'finance':
        cy.get('button').contains('新增收入').should('be.visible')
        cy.get('button').contains('新增成本').should('be.visible')
        cy.get('button').contains('生成报表').should('be.visible')
        break
      case 'manager':
        cy.get('button').contains('查看报表').should('be.visible')
        cy.get('button').contains('预算审批').should('be.visible')
        break
      default:
        cy.get('button').contains('查看报表').should('be.visible')
    }
    return this
  }
}