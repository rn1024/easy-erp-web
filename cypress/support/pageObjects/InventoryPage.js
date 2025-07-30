import { BasePage } from './BasePage'

export class InventoryPage extends BasePage {
  constructor() {
    super()
    this.selectors = {
      ...this.selectors,
      // 库存列表
      inventoryTable: '.ant-table-tbody',
      searchInput: 'input[placeholder="搜索产品名称或SKU"]',
      searchButton: 'button[type="submit"]',
      statusSelect: '.ant-select-selector',
      categorySelect: '.ant-select-selector',
      createButton: 'button:contains("新建库存")',
      stocktakeButton: 'button:contains("新建盘点")',
      importButton: 'button:contains("导入")',
      exportButton: 'button:contains("导出")',
      
      // 库存操作按钮
      adjustButton: '.adjust-button',
      stocktakeBtn: '.stocktake-button',
      historyButton: '.history-button',
      warningSettingsButton: '.warning-settings-button',
      viewButton: '.view-button',
      
      // 库存表单
      productSelect: '.ant-select-selector',
      currentStockInput: 'input[name="currentStock"]',
      availableStockInput: 'input[name="availableStock"]',
      reservedStockInput: 'input[name="reservedStock"]',
      safetyStockInput: 'input[name="safetyStock"]',
      locationInput: 'input[name="location"]',
      remarkTextarea: 'textarea[name="remark"]',
      
      // 库存调整表单
      adjustTypeSelect: '.ant-select-selector',
      quantityInput: 'input[name="quantity"]',
      reasonTextarea: 'textarea[name="reason"]',
      
      // 盘点表单
      actualCountInput: 'input[name="actualCount"]',
      stocktakeRemarkTextarea: 'textarea[name="remark"]',
      
      // 预警设置
      warningStockInput: 'input[name="warningStock"]',
      dangerStockInput: 'input[name="dangerStock"]',
      
      // 历史记录
      historyModal: '.inventory-history-modal',
      historyTable: '.ant-table-tbody',
      
      // 统计面板
      statisticsPanel: '.inventory-statistics',
      trendChart: '.inventory-trend-chart',
      distributionChart: '.inventory-distribution-chart',
      
      // 盘点任务
      stocktakeTaskTable: '.ant-table-tbody',
      startStocktake: '.start-stocktake',
      completeStocktake: '.complete-stocktake',
      viewDifference: '.view-difference',
      
      // 库存状态标识
      normalStatus: '.stock-status-normal',
      warningStatus: '.stock-status-warning',
      dangerStatus: '.stock-status-danger',
      warningBadge: '.warning-badge',
      dangerBadge: '.danger-badge'
    }
  }

  // 搜索库存
  searchInventory(keyword) {
    cy.get(this.selectors.searchInput).clear().type(keyword)
    cy.get(this.selectors.searchButton).click()
    return this
  }

  // 筛选库存
  filterInventory(filters) {
    if (filters.status) {
      cy.get(this.selectors.statusSelect).first().click()
      cy.contains(filters.status).click()
    }
    if (filters.category) {
      cy.get(this.selectors.categorySelect).last().click()
      cy.contains(filters.category).click()
    }
    return this
  }

  // 创建新库存
  createInventory(inventoryData) {
    cy.get(this.selectors.createButton).click()
    this.waitForModal()
    
    // 选择产品
    cy.get(this.selectors.productSelect).contains('请选择产品').click()
    cy.contains(inventoryData.productName).click()

    // 填写库存信息
    cy.get(this.selectors.currentStockInput).type(inventoryData.currentStock)
    cy.get(this.selectors.availableStockInput).type(inventoryData.availableStock)
    if (inventoryData.reservedStock) {
      cy.get(this.selectors.reservedStockInput).type(inventoryData.reservedStock)
    }
    cy.get(this.selectors.safetyStockInput).type(inventoryData.safetyStock)
    if (inventoryData.location) {
      cy.get(this.selectors.locationInput).type(inventoryData.location)
    }
    if (inventoryData.remark) {
      cy.get(this.selectors.remarkTextarea).type(inventoryData.remark)
    }

    // 提交表单
    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('createInventory')
    
    return this
  }

  // 库存调整
  adjustInventory(rowIndex, adjustData) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.adjustButton).click()
    this.waitForModal()

    // 选择调整类型
    cy.get(this.selectors.adjustTypeSelect).contains('调整类型').click()
    cy.contains(adjustData.type).click()

    // 填写调整信息
    cy.get(this.selectors.quantityInput).type(adjustData.quantity)
    cy.get(this.selectors.reasonTextarea).type(adjustData.reason)

    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('adjustInventory')
    
    return this
  }

  // 库存盘点
  stocktake(rowIndex, actualCount, remark = '') {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.stocktakeBtn).click()
    this.waitForModal()

    // 填写盘点信息
    cy.get(this.selectors.actualCountInput).type(actualCount)
    if (remark) {
      cy.get(this.selectors.stocktakeRemarkTextarea).type(remark)
    }

    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('stocktakeInventory')
    
    return this
  }

  // 设置库存预警
  setWarningSettings(rowIndex, warningData) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.warningSettingsButton).click()
    this.waitForModal()

    if (warningData.safetyStock) {
      cy.get(this.selectors.safetyStockInput).clear().type(warningData.safetyStock)
    }
    if (warningData.warningStock) {
      cy.get(this.selectors.warningStockInput).clear().type(warningData.warningStock)
    }
    if (warningData.dangerStock) {
      cy.get(this.selectors.dangerStockInput).clear().type(warningData.dangerStock)
    }

    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('updateWarningSettings')
    
    return this
  }

  // 查看库存历史
  viewHistory(rowIndex) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.historyButton).click()
    this.waitForModal()
    return this
  }

  // 查看库存详情
  viewDetails(rowIndex) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.viewButton).click()
    this.waitForModal()
    return this
  }

  // 获取库存状态
  getStockStatus(rowIndex) {
    return cy.get('.ant-table-tbody tr').eq(rowIndex).find('.stock-status')
  }

  // 验证库存数量
  verifyStockQuantity(rowIndex, expectedStock) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).within(() => {
      cy.get('.current-stock').should('contain', expectedStock)
    })
    return this
  }

  // 验证库存状态
  verifyStockStatus(rowIndex, expectedStatus) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).within(() => {
      cy.contains(expectedStatus).should('be.visible')
    })
    return this
  }

  // 验证预警标识
  verifyWarningBadge(rowIndex, shouldExist = true) {
    if (shouldExist) {
      cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.warningBadge).should('be.visible')
    } else {
      cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.warningBadge).should('not.exist')
    }
    return this
  }

  // 创建盘点任务
  createStocktakeTask(taskData) {
    cy.get(this.selectors.stocktakeButton).click()
    this.waitForModal()

    // 选择盘点范围
    cy.get('.ant-select-selector').contains('盘点范围').click()
    cy.contains(taskData.scope).click()

    // 设置盘点日期
    if (taskData.date) {
      cy.get('input[placeholder="选择日期"]').click()
      cy.contains(taskData.date).click()
    } else {
      cy.get('.ant-picker-today-btn').click()
    }

    // 提交表单
    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('createStocktakeTask')
    
    return this
  }

  // 开始盘点
  startStocktake(rowIndex) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.startStocktake).click()
    this.waitForModal()
    return this
  }

  // 完成盘点
  completeStocktake(rowIndex, actualCount, remark = '') {
    this.startStocktake(rowIndex)

    cy.get(this.selectors.actualCountInput).type(actualCount)
    if (remark) {
      cy.get(this.selectors.stocktakeRemarkTextarea).type(remark)
    }

    cy.get('.ant-modal-footer').contains('完成盘点').click()
    this.waitForApi('completeStocktake')
    
    return this
  }

  // 查看盘点差异
  viewStocktakeDifference(rowIndex) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.viewDifference).click()
    this.waitForModal()
    return this
  }

  // 验证库存统计数据
  verifyStatistics(expectedStats) {
    cy.get(this.selectors.statisticsPanel).within(() => {
      if (expectedStats.totalValue) {
        cy.contains('总库存价值').parent().should('contain', expectedStats.totalValue)
      }
      if (expectedStats.turnoverRate) {
        cy.contains('库存周转率').parent().should('contain', expectedStats.turnoverRate)
      }
      if (expectedStats.warningCount) {
        cy.contains('预警产品数量').parent().should('contain', expectedStats.warningCount)
      }
      if (expectedStats.outOfStockCount) {
        cy.contains('缺货产品数量').parent().should('contain', expectedStats.outOfStockCount)
      }
    })
    return this
  }

  // 导出库存数据
  exportInventory() {
    cy.get(this.selectors.exportButton).click()
    this.waitForApi('exportInventory')
    return this
  }

  // 导入库存数据
  importInventory(filePath) {
    cy.get(this.selectors.importButton).click()
    this.waitForModal()
    cy.get('input[type="file"]').attachFile(filePath)
    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('importInventory')
    return this
  }

  // 清除筛选条件
  clearFilters() {
    cy.get('button').contains('重置').click()
    this.waitForApi('getInventory')
    return this
  }

  // 验证库存是否存在
  verifyInventoryExists(productName) {
    cy.contains(productName).should('be.visible')
    return this
  }

  // 验证库存不存在
  verifyInventoryNotExists(productName) {
    cy.contains(productName).should('not.exist')
    return this
  }

  // 获取库存数量
  getInventoryCount() {
    return cy.get('.ant-table-tbody tr').its('length')
  }

  // 验证库存列表为空
  verifyEmptyInventory() {
    cy.contains('暂无数据').should('be.visible')
    return this
  }

  // 验证库存加载状态
  verifyLoading() {
    cy.get('.ant-spin-spinning').should('be.visible')
    return this
  }

  // 验证库存加载完成
  verifyLoaded() {
    cy.get('.ant-spin-spinning').should('not.exist')
    return this
  }

  // 按库存状态筛选
  filterByStatus(status) {
    cy.get(this.selectors.statusSelect).first().click()
    cy.contains(status).click()
    this.waitForApi('filterInventory')
    return this
  }

  // 按库存预警筛选
  filterByWarning() {
    cy.get('button').contains('查看预警').click()
    this.waitForApi('getWarningInventory')
    return this
  }

  // 批量操作
  selectInventories(indices) {
    indices.forEach(index => {
      cy.get('.ant-table-tbody tr').eq(index).find('.ant-checkbox-input').click()
    })
    return this
  }

  batchWarningSettings(warningData) {
    cy.get('button').contains('批量预警设置').click()
    this.waitForModal()

    if (warningData.safetyStock) {
      cy.get(this.selectors.safetyStockInput).type(warningData.safetyStock)
    }
    if (warningData.warningStock) {
      cy.get(this.selectors.warningStockInput).type(warningData.warningStock)
    }
    if (warningData.dangerStock) {
      cy.get(this.selectors.dangerStockInput).type(warningData.dangerStock)
    }

    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('batchUpdateWarningSettings')
    
    return this
  }
}