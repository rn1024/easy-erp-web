import { BasePage } from './BasePage'

export class DeliveryPage extends BasePage {
  constructor() {
    super()
    this.selectors = {
      ...this.selectors,
      // 发货记录列表
      deliveryTable: '.ant-table-tbody',
      searchInput: 'input[placeholder="搜索发货编号或客户"]',
      searchButton: 'button[type="submit"]',
      statusSelect: '.ant-select-selector',
      customerSelect: '.ant-select-selector',
      forwarderSelect: '.ant-select-selector',
      dateRangePicker: '.ant-picker-range',
      createButton: 'button:contains("新建发货")',
      batchShipButton: 'button:contains("批量发货")',
      batchPrintButton: 'button:contains("批量打印")',
      
      // 发货操作按钮
      updateTrackingButton: '.update-tracking-button',
      confirmReceiptButton: '.confirm-receipt-button',
      rejectReceiptButton: '.reject-receipt-button',
      markExceptionButton: '.mark-exception-button',
      resolveExceptionButton: '.resolve-exception-button',
      calculateFreightButton: '.calculate-freight-button',
      confirmFreightButton: '.confirm-freight-button',
      viewButton: '.view-button',
      editButton: '.edit-button',
      deleteButton: '.delete-button',
      
      // 创建发货表单
      customerSelect: '.ant-select-selector',
      deliveryAddressInput: 'input[name="deliveryAddress"]',
      contactPersonInput: 'input[name="contactPerson"]',
      contactPhoneInput: 'input[name="contactPhone"]',
      forwarderSelect: '.ant-select-selector',
      warehouseSelect: '.ant-select-selector',
      shipTimePicker: 'input[placeholder="选择发货时间"]',
      estimatedDeliveryTimePicker: 'input[placeholder="选择到达时间"]',
      transportTypeSelect: '.ant-select-selector',
      specialRequirementsTextarea: 'textarea[name="specialRequirements"]',
      deliveryNumberInput: 'input[name="deliveryNumber"]',
      
      // 物流跟踪表单
      trackingNumberInput: 'input[name="trackingNumber"]',
      currentStatusSelect: '.ant-select-selector',
      currentLocationInput: 'input[name="currentLocation"]',
      updateTimePicker: 'input[name="updateTime"]',
      trackingRemarkTextarea: 'textarea[name="trackingRemark"]',
      
      // 收货确认表单
      actualReceivedQuantityInput: 'input[name="actualReceivedQuantity"]',
      damagedQuantityInput: 'input[name="damagedQuantity"]',
      missingQuantityInput: 'input[name="missingQuantity"]',
      receiptRemarkTextarea: 'textarea[name="receiptRemark"]',
      actualDeliveryTimePicker: 'input[name="actualDeliveryTime"]',
      signatoryNameInput: 'input[name="signatoryName"]',
      signatoryPhoneInput: 'input[name="signatoryPhone"]',
      differenceReasonTextarea: 'textarea[name="differenceReason"]',
      handlingMethodSelect: '.ant-select-selector',
      
      // 异常处理表单
      exceptionTypeSelect: '.ant-select-selector',
      exceptionDescriptionTextarea: 'textarea[name="exceptionDescription"]',
      resolutionDescriptionTextarea: 'textarea[name="resolutionDescription"]',
      newEstimatedDeliveryTimePicker: 'input[name="newEstimatedDeliveryTime"]',
      
      // 运费管理表单
      actualWeightInput: 'input[name="actualWeight"]',
      actualVolumeInput: 'input[name="actualVolume"]',
      actualFreightInput: 'input[name="actualFreight"]',
      freightPaymentMethodSelect: '.ant-select-selector',
      
      // 状态标识
      pendingStatus: '.status-pending',
      shippedStatus: '.status-shipped',
      inTransitStatus: '.status-in-transit',
      deliveredStatus: '.status-delivered',
      exceptionStatus: '.status-exception',
      
      // 预警标识
      overdueDelivery: '.overdue-delivery',
      arrivingSoon: '.arriving-soon',
      exceptionDelivery: '.exception-delivery',
      urgentDelivery: '.urgent-delivery',
      notificationBadge: '.notification-badge',
      alertMessage: '.alert-message',
      
      // 统计面板
      statisticsPanel: '.delivery-statistics',
      trendChart: '.delivery-trend-chart',
      forwarderAnalysis: '.forwarder-analysis',
      regionStats: '.region-delivery-stats',
      
      // 地址选择器
      provinceCascader: '.ant-cascader-picker',
      cityCascader: '.ant-cascader-picker',
      districtCascader: '.ant-cascader-picker',
      
      // 产品选择
      addProductButton: 'button:contains("添加产品")',
      productQuantityInput: 'input[name="quantity"]',
      productWeightInput: 'input[name="weight"]',
      productVolumeInput: 'input[name="volume"]',
      freightCalculateButton: '.freight-calculate',
      freightAmount: '.freight-amount',
      freightResult: '.freight-result'
    }
  }

  // 搜索发货记录
  searchDeliveries(keyword) {
    cy.get(this.selectors.searchInput).clear().type(keyword)
    cy.get(this.selectors.searchButton).click()
    return this
  }

  // 筛选发货记录
  filterDeliveries(filters) {
    if (filters.status) {
      cy.get(this.selectors.statusSelect).first().click()
      cy.contains(filters.status).click()
    }
    if (filters.customer) {
      cy.get(this.selectors.customerSelect).eq(1).click()
      cy.contains(filters.customer).click()
    }
    if (filters.forwarder) {
      cy.get(this.selectors.forwarderSelect).last().click()
      cy.contains(filters.forwarder).click()
    }
    if (filters.dateRange) {
      cy.get(this.selectors.dateRangePicker).click()
      cy.contains(filters.dateRange.start).click()
      cy.contains(filters.dateRange.end).click()
    }
    return this
  }

  // 创建发货记录
  createDelivery(deliveryData) {
    cy.get(this.selectors.createButton).click()
    this.waitForModal()

    // 选择客户
    cy.get(this.selectors.customerSelect).contains('请选择客户').click()
    cy.contains(deliveryData.customer).click()

    // 填写收货信息
    cy.get(this.selectors.deliveryAddressInput).type(deliveryData.address)
    cy.get(this.selectors.contactPersonInput).type(deliveryData.contactPerson)
    cy.get(this.selectors.contactPhoneInput).type(deliveryData.contactPhone)

    // 选择物流服务商
    cy.get(this.selectors.forwarderSelect).contains('请选择物流服务商').click()
    cy.contains(deliveryData.forwarder).click()

    // 选择发货仓库
    if (deliveryData.warehouse) {
      cy.get(this.selectors.warehouseSelect).contains('请选择发货仓库').click()
      cy.contains(deliveryData.warehouse).click()
    }

    // 添加产品
    if (deliveryData.products) {
      cy.get(this.selectors.addProductButton).click()
      this.waitForModal()
      
      deliveryData.products.forEach((product, index) => {
        cy.get('.ant-table-tbody tr').eq(index).find('.ant-checkbox-input').click()
      })
      cy.get('.ant-modal-footer').contains('确定').click()

      // 填写产品数量
      deliveryData.products.forEach((product, index) => {
        cy.get('input[name="quantity"]').eq(index).clear().type(product.quantity)
      })
    }

    // 设置时间
    if (deliveryData.shipTime) {
      cy.get(this.selectors.shipTimePicker).click()
      cy.contains(deliveryData.shipTime).click()
    }
    if (deliveryData.estimatedDeliveryTime) {
      cy.get(this.selectors.estimatedDeliveryTimePicker).click()
      cy.contains(deliveryData.estimatedDeliveryTime).click()
    }

    // 选择运输方式
    if (deliveryData.transportType) {
      cy.get(this.selectors.transportTypeSelect).contains('请选择运输方式').click()
      cy.contains(deliveryData.transportType).click()
    }

    // 填写特殊要求
    if (deliveryData.specialRequirements) {
      cy.get(this.selectors.specialRequirementsTextarea).type(deliveryData.specialRequirements)
    }

    // 计算运费
    if (deliveryData.weight && deliveryData.volume) {
      cy.get(this.selectors.productWeightInput).type(deliveryData.weight)
      cy.get(this.selectors.productVolumeInput).type(deliveryData.volume)
      cy.get(this.selectors.freightCalculateButton).click()
      this.waitForApi('calculateFreight')
    }

    // 提交表单
    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('createDeliveryRecord')

    return this
  }

  // 更新物流信息
  updateTracking(rowIndex, trackingData) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.updateTrackingButton).click()
    this.waitForModal()

    if (trackingData.trackingNumber) {
      cy.get(this.selectors.trackingNumberInput).type(trackingData.trackingNumber)
    }
    if (trackingData.currentStatus) {
      cy.get(this.selectors.currentStatusSelect).contains('请选择当前状态').click()
      cy.contains(trackingData.currentStatus).click()
    }
    if (trackingData.currentLocation) {
      cy.get(this.selectors.currentLocationInput).type(trackingData.currentLocation)
    }
    if (trackingData.updateTime) {
      cy.get(this.selectors.updateTimePicker).click()
      cy.contains(trackingData.updateTime).click()
    }
    if (trackingData.remark) {
      cy.get(this.selectors.trackingRemarkTextarea).type(trackingData.remark)
    }

    cy.get('.ant-modal-footer').contains('更新').click()
    this.waitForApi('updateTrackingInfo')
    return this
  }

  // 确认收货
  confirmReceipt(rowIndex, receiptData) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.confirmReceiptButton).click()
    this.waitForModal()

    cy.get(this.selectors.actualReceivedQuantityInput).type(receiptData.actualReceivedQuantity)
    if (receiptData.damagedQuantity) {
      cy.get(this.selectors.damagedQuantityInput).type(receiptData.damagedQuantity)
    }
    if (receiptData.missingQuantity) {
      cy.get(this.selectors.missingQuantityInput).type(receiptData.missingQuantity)
    }
    if (receiptData.remark) {
      cy.get(this.selectors.receiptRemarkTextarea).type(receiptData.remark)
    }
    if (receiptData.actualDeliveryTime) {
      cy.get(this.selectors.actualDeliveryTimePicker).click()
      cy.contains(receiptData.actualDeliveryTime).click()
    }
    if (receiptData.signatoryName) {
      cy.get(this.selectors.signatoryNameInput).type(receiptData.signatoryName)
    }
    if (receiptData.signatoryPhone) {
      cy.get(this.selectors.signatoryPhoneInput).type(receiptData.signatoryPhone)
    }

    cy.get('.ant-modal-footer').contains('确认收货').click()
    this.waitForApi('confirmDeliveryReceipt')
    return this
  }

  // 标记异常
  markException(rowIndex, exceptionData) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.markExceptionButton).click()
    this.waitForModal()

    cy.get(this.selectors.exceptionTypeSelect).contains('异常类型').click()
    cy.contains(exceptionData.type).click()

    cy.get(this.selectors.exceptionDescriptionTextarea).type(exceptionData.description)

    if (exceptionData.photo) {
      cy.get('input[type="file"]').attachFile(exceptionData.photo)
      this.waitForApi('uploadExceptionPhoto')
    }

    cy.get('.ant-modal-footer').contains('提交').click()
    this.waitForApi('markDeliveryException')
    return this
  }

  // 处理异常
  resolveException(rowIndex, resolutionData) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.resolveExceptionButton).click()
    this.waitForModal()

    cy.get(this.selectors.resolutionDescriptionTextarea).type(resolutionData.description)

    if (resolutionData.newEstimatedDeliveryTime) {
      cy.get(this.selectors.newEstimatedDeliveryTimePicker).click()
      cy.contains(resolutionData.newEstimatedDeliveryTime).click()
    }

    cy.get('.ant-modal-footer').contains('确认恢复').click()
    this.waitForApi('resolveDeliveryException')
    return this
  }

  // 计算运费
  calculateFreight(rowIndex, freightData) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.calculateFreightButton).click()
    this.waitForModal()

    cy.get(this.selectors.actualWeightInput).type(freightData.weight)
    cy.get(this.selectors.actualVolumeInput).type(freightData.volume)

    if (freightData.destination) {
      cy.get(this.selectors.provinceCascader).click()
      cy.contains(freightData.destination.province).click()
      cy.contains(freightData.destination.city).click()
    }

    cy.get(this.selectors.freightCalculateButton).click()
    this.waitForApi('calculateFreight')
    return this
  }

  // 确认运费
  confirmFreight(rowIndex, freightData) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.confirmFreightButton).click()
    this.waitForModal()

    cy.get(this.selectors.actualFreightInput).type(freightData.actualFreight)

    if (freightData.paymentMethod) {
      cy.get(this.selectors.freightPaymentMethodSelect).contains('支付方式').click()
      cy.contains(freightData.paymentMethod).click()
    }

    cy.get('.ant-modal-footer').contains('确认').click()
    this.waitForApi('confirmFreight')
    return this
  }

  // 批量发货
  batchShip(deliveries, shipData) {
    deliveries.forEach(index => {
      cy.get('.ant-table-tbody tr').eq(index).find('.ant-checkbox-input').click()
    })

    cy.get(this.selectors.batchShipButton).click()
    this.waitForModal()

    if (shipData.actualShipTime) {
      cy.get(this.selectors.shipTimePicker).click()
      cy.contains(shipData.actualShipTime).click()
    }

    if (shipData.trackingNumbers) {
      cy.get('input[name="trackingNumbers"]').type(shipData.trackingNumbers.join(', '))
    }

    cy.get('.ant-modal-footer').contains('确认发货').click()
    this.waitForApi('batchShipDelivery')
    return this
  }

  // 批量打印
  batchPrint(deliveries) {
    deliveries.forEach(index => {
      cy.get('.ant-table-tbody tr').eq(index).find('.ant-checkbox-input').click()
    })

    cy.get(this.selectors.batchPrintButton).click()
    this.waitForApi('batchPrintDeliveryNotes')
    return this
  }

  // 验证发货状态
  verifyDeliveryStatus(rowIndex, expectedStatus) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).within(() => {
      cy.contains(expectedStatus).should('be.visible')
    })
    return this
  }

  // 验证物流信息
  verifyTrackingInfo(rowIndex, trackingNumber) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).within(() => {
      cy.contains(trackingNumber).should('be.visible')
    })
    return this
  }

  // 查看发货详情
  viewDeliveryDetails(rowIndex) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.viewButton).click()
    this.waitForModal()
    return this
  }

  // 编辑发货记录
  editDelivery(rowIndex, updates) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.editButton).click()
    this.waitForModal()

    Object.keys(updates).forEach(key => {
      const inputName = `${key}Input`
      if (this.selectors[inputName]) {
        cy.get(this.selectors[inputName]).clear().type(updates[key])
      }
    })

    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('updateDeliveryRecord')
    return this
  }

  // 删除发货记录
  deleteDelivery(rowIndex) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.deleteButton).click()
    cy.get('.ant-popconfirm').contains('确定').click()
    this.waitForApi('deleteDeliveryRecord')
    return this
  }

  // 查看统计面板
  viewStatistics() {
    cy.get(this.selectors.statisticsPanel).should('be.visible')
    return this
  }

  // 查看发货趋势
  viewTrendChart() {
    cy.get(this.selectors.trendChart).should('be.visible')
    return this
  }

  // 查看物流商分析
  viewForwarderAnalysis() {
    cy.get(this.selectors.forwarderAnalysis).should('be.visible')
    return this
  }

  // 查看地区统计
  viewRegionStats() {
    cy.get(this.selectors.regionStats).should('be.visible')
    return this
  }

  // 导出发货报告
  exportDeliveryReport() {
    cy.get('button').contains('导出报告').click()
    this.waitForApi('exportDeliveryReport')
    return this
  }

  // 清除筛选条件
  clearFilters() {
    cy.get('button').contains('重置').click()
    this.waitForApi('getDeliveryRecords')
    return this
  }

  // 验证提醒标识
  verifyUrgentDelivery(rowIndex) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.urgentDelivery).should('be.visible')
    return this
  }

  // 验证异常标识
  verifyExceptionDelivery(rowIndex) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.exceptionDelivery).should('be.visible')
    return this
  }

  // 获取发货数量
  getDeliveryCount() {
    return cy.get('.ant-table-tbody tr').its('length')
  }

  // 验证发货记录存在
  verifyDeliveryExists(deliveryNumber) {
    cy.contains(deliveryNumber).should('be.visible')
    return this
  }

  // 验证发货记录不存在
  verifyDeliveryNotExists(deliveryNumber) {
    cy.contains(deliveryNumber).should('not.exist')
    return this
  }
}