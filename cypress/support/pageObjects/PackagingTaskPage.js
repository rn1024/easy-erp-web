import { BasePage } from './BasePage'

export class PackagingTaskPage extends BasePage {
  constructor() {
    super()
    this.selectors = {
      ...this.selectors,
      // 包装任务列表
      taskTable: '.ant-table-tbody',
      searchInput: 'input[placeholder="搜索任务编号或产品名称"]',
      searchButton: 'button[type="submit"]',
      statusSelect: '.ant-select-selector',
      prioritySelect: '.ant-select-selector',
      createButton: 'button:contains("新建包装任务")',
      batchAssignButton: 'button:contains("批量分配")',
      batchStartButton: 'button:contains("批量开始")',
      
      // 任务操作按钮
      startButton: '.start-button',
      updateProgressButton: '.update-progress-button',
      completeButton: '.complete-button',
      pauseButton: '.pause-button',
      resumeButton: '.resume-button',
      qualityCheckButton: '.quality-check-button',
      reportIssueButton: '.report-issue-button',
      viewButton: '.view-button',
      editButton: '.edit-button',
      deleteButton: '.delete-button',
      
      // 创建任务表单
      productSelect: '.ant-select-selector',
      quantityInput: 'input[name="quantity"]',
      packagingSpecSelect: '.ant-select-selector',
      prioritySelect: '.ant-select-selector',
      assigneeSelect: '.ant-select-selector',
      dueDatePicker: 'input[placeholder="选择日期"]',
      specialRequirementsTextarea: 'textarea[name="specialRequirements"]',
      taskNumberInput: 'input[name="taskNumber"]',
      
      // 进度更新表单
      completedQuantityInput: 'input[name="completedQuantity"]',
      progressRemarkTextarea: 'textarea[name="progressRemark"]',
      progressPercent: '.progress-percent',
      
      // 完成表单
      actualQuantityInput: 'input[name="actualQuantity"]',
      damagedQuantityInput: 'input[name="damagedQuantity"]',
      completionRemarkTextarea: 'textarea[name="completionRemark"]',
      completionPhotoUpload: 'input[type="file"]',
      
      // 问题报告表单
      issueTypeSelect: '.ant-select-selector',
      issueDescriptionTextarea: 'textarea[name="issueDescription"]',
      urgencySelect: '.ant-select-selector',
      failedReasonTextarea: 'textarea[name="failedReason"]',
      handlingMethodSelect: '.ant-select-selector',
      
      // 质量检查表单
      checkQuantityInput: 'input[name="checkedQuantity"]',
      passedQuantityInput: 'input[name="passedQuantity"]',
      failedQuantityInput: 'input[name="failedQuantity"]',
      checkRemarkTextarea: 'textarea[name="checkRemark"]',
      
      // 状态标识
      pendingStatus: '.status-pending',
      processingStatus: '.status-processing',
      completedStatus: '.status-completed',
      pausedStatus: '.status-paused',
      cancelledStatus: '.status-cancelled',
      
      // 优先级标识
      highPriority: '.priority-high',
      mediumPriority: '.priority-medium',
      lowPriority: '.priority-low',
      
      // 提醒标识
      expiringSoon: '.expiring-soon',
      overdueTask: '.overdue-task',
      notificationBadge: '.notification-badge',
      urgentBadge: '.urgent-badge',
      
      // 统计面板
      statisticsPanel: '.packaging-statistics',
      efficiencyChart: '.packaging-efficiency-chart',
      employeeStats: '.employee-packaging-stats',
      productStats: '.product-packaging-stats',
      
      // 资源管理
      materialsButton: 'button:contains("包装材料")',
      equipmentButton: 'button:contains("设备状态")',
      materialTable: '.packaging-material-table',
      equipmentTable: '.equipment-status-table',
      requestMaterialButton: 'button:contains("申请材料")',
      
      // 批量操作
      selectAllCheckbox: '.ant-table-thead .ant-checkbox-input',
      batchUpdatePriorityButton: 'button:contains("批量更新优先级")',
      
      // 筛选器
      statusFilter: '.ant-select-selector',
      priorityFilter: '.ant-select-selector',
      assigneeFilter: '.ant-select-selector',
      dateRangePicker: '.ant-picker-range'
    }
  }

  // 搜索包装任务
  searchTasks(keyword) {
    cy.get(this.selectors.searchInput).clear().type(keyword)
    cy.get(this.selectors.searchButton).click()
    return this
  }

  // 筛选包装任务
  filterTasks(filters) {
    if (filters.status) {
      cy.get(this.selectors.statusFilter).first().click()
      cy.contains(filters.status).click()
    }
    if (filters.priority) {
      cy.get(this.selectors.priorityFilter).eq(1).click()
      cy.contains(filters.priority).click()
    }
    if (filters.assignee) {
      cy.get(this.selectors.assigneeFilter).last().click()
      cy.contains(filters.assignee).click()
    }
    return this
  }

  // 创建包装任务
  createPackagingTask(taskData) {
    cy.get(this.selectors.createButton).click()
    this.waitForModal()

    // 选择产品
    cy.get(this.selectors.productSelect).contains('请选择产品').click()
    cy.contains(taskData.productName).click()

    // 填写数量
    cy.get(this.selectors.quantityInput).type(taskData.quantity)

    // 选择包装规格
    if (taskData.packagingSpec) {
      cy.get(this.selectors.packagingSpecSelect).contains('请选择包装规格').click()
      cy.contains(taskData.packagingSpec).click()
    }

    // 设置优先级
    if (taskData.priority) {
      cy.get(this.selectors.prioritySelect).contains('请选择优先级').click()
      cy.contains(taskData.priority).click()
    }

    // 分配负责人
    if (taskData.assignee) {
      cy.get(this.selectors.assigneeSelect).contains('请选择负责人').click()
      cy.contains(taskData.assignee).click()
    }

    // 设置截止日期
    if (taskData.dueDate) {
      cy.get(this.selectors.dueDatePicker).click()
      cy.contains(taskData.dueDate).click()
    }

    // 填写特殊要求
    if (taskData.specialRequirements) {
      cy.get(this.selectors.specialRequirementsTextarea).type(taskData.specialRequirements)
    }

    // 提交表单
    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('createPackagingTask')

    return this
  }

  // 开始任务
  startTask(rowIndex) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.startButton).click()
    cy.get('.ant-popconfirm').contains('确定').click()
    this.waitForApi('startPackagingTask')
    return this
  }

  // 更新进度
  updateProgress(rowIndex, completedQuantity, remark = '') {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.updateProgressButton).click()
    this.waitForModal()

    cy.get(this.selectors.completedQuantityInput).type(completedQuantity)
    if (remark) {
      cy.get(this.selectors.progressRemarkTextarea).type(remark)
    }

    cy.get('.ant-modal-footer').contains('更新').click()
    this.waitForApi('updatePackagingProgress')
    return this
  }

  // 完成任务
  completeTask(rowIndex, actualQuantity, damagedQuantity = 0, remark = '') {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.completeButton).click()
    this.waitForModal()

    cy.get(this.selectors.actualQuantityInput).type(actualQuantity)
    cy.get(this.selectors.damagedQuantityInput).type(damagedQuantity)
    if (remark) {
      cy.get(this.selectors.completionRemarkTextarea).type(remark)
    }

    // 上传完成照片
    cy.get(this.selectors.completionPhotoUpload).attachFile('packaging/completed-package.jpg')
    this.waitForApi('uploadCompletionPhoto')

    cy.get('.ant-modal-footer').contains('确认完成').click()
    this.waitForApi('completePackagingTask')
    return this
  }

  // 暂停任务
  pauseTask(rowIndex, reason) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.pauseButton).click()
    this.waitForModal()

    cy.get(this.selectors.pauseReasonTextarea).type(reason)
    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('pausePackagingTask')
    return this
  }

  // 恢复任务
  resumeTask(rowIndex) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.resumeButton).click()
    cy.get('.ant-popconfirm').contains('确定').click()
    this.waitForApi('resumePackagingTask')
    return this
  }

  // 质量检查
  qualityCheck(rowIndex, checkData) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.qualityCheckButton).click()
    this.waitForModal()

    cy.get(this.selectors.checkQuantityInput).type(checkData.checkedQuantity)
    cy.get(this.selectors.passedQuantityInput).type(checkData.passedQuantity)
    if (checkData.failedQuantity) {
      cy.get(this.selectors.failedQuantityInput).type(checkData.failedQuantity)
    }

    if (checkData.remark) {
      cy.get(this.selectors.checkRemarkTextarea).type(checkData.remark)
    }

    cy.get('.ant-modal-footer').contains('提交检查').click()
    this.waitForApi('submitQualityCheck')
    return this
  }

  // 报告问题
  reportIssue(rowIndex, issueData) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.reportIssueButton).click()
    this.waitForModal()

    cy.get(this.selectors.issueTypeSelect).contains('问题类型').click()
    cy.contains(issueData.type).click()

    cy.get(this.selectors.issueDescriptionTextarea).type(issueData.description)

    if (issueData.urgency) {
      cy.get(this.selectors.urgencySelect).contains('紧急程度').click()
      cy.contains(issueData.urgency).click()
    }

    cy.get('.ant-modal-footer').contains('提交').click()
    this.waitForApi('reportPackagingIssue')
    return this
  }

  // 批量分配任务
  batchAssignTasks(taskIndices, assignee, dueDate) {
    taskIndices.forEach(index => {
      cy.get('.ant-table-tbody tr').eq(index).find('.ant-checkbox-input').click()
    })

    cy.get(this.selectors.batchAssignButton).click()
    this.waitForModal()

    cy.get(this.selectors.assigneeSelect).contains('请选择负责人').click()
    cy.contains(assignee).click()

    if (dueDate) {
      cy.get(this.selectors.dueDatePicker).click()
      cy.contains(dueDate).click()
    }

    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('batchAssignTasks')
    return this
  }

  // 批量更新优先级
  batchUpdatePriority(taskIndices, priority) {
    taskIndices.forEach(index => {
      cy.get('.ant-table-tbody tr').eq(index).find('.ant-checkbox-input').click()
    })

    cy.get(this.selectors.batchUpdatePriorityButton).click()
    this.waitForModal()

    cy.get(this.selectors.prioritySelect).contains('请选择优先级').click()
    cy.contains(priority).click()

    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('batchUpdatePriority')
    return this
  }

  // 查看任务详情
  viewTaskDetails(rowIndex) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.viewButton).click()
    this.waitForModal()
    return this
  }

  // 编辑任务
  editTask(rowIndex, updates) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.editButton).click()
    this.waitForModal()

    Object.keys(updates).forEach(key => {
      const inputName = `${key}Input`
      if (this.selectors[inputName]) {
        cy.get(this.selectors[inputName]).clear().type(updates[key])
      }
    })

    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('updatePackagingTask')
    return this
  }

  // 删除任务
  deleteTask(rowIndex) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.deleteButton).click()
    cy.get('.ant-popconfirm').contains('确定').click()
    this.waitForApi('deletePackagingTask')
    return this
  }

  // 验证任务状态
  verifyTaskStatus(rowIndex, expectedStatus) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).within(() => {
      cy.contains(expectedStatus).should('be.visible')
    })
    return this
  }

  // 验证任务优先级
  verifyTaskPriority(rowIndex, expectedPriority) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).within(() => {
      cy.contains(expectedPriority).should('be.visible')
    })
    return this
  }

  // 验证任务存在
  verifyTaskExists(taskNumber) {
    cy.contains(taskNumber).should('be.visible')
    return this
  }

  // 获取任务进度
  getTaskProgress(rowIndex) {
    return cy.get('.ant-table-tbody tr').eq(rowIndex).find('.progress-bar')
  }

  // 查看统计面板
  viewStatistics() {
    cy.get(this.selectors.statisticsPanel).should('be.visible')
    return this
  }

  // 查看包装材料
  viewPackagingMaterials() {
    cy.get(this.selectors.materialsButton).click()
    this.waitForLoading()
    return this
  }

  // 查看设备状态
  viewEquipmentStatus() {
    cy.get(this.selectors.equipmentButton).click()
    this.waitForLoading()
    return this
  }

  // 申请包装材料
  requestPackagingMaterial(materialData) {
    this.viewPackagingMaterials()
    cy.get('button').contains('申请材料').click()
    this.waitForModal()

    cy.get('.ant-select-selector').contains('请选择材料').click()
    cy.contains(materialData.name).click()

    cy.get('input[name="requestQuantity"]').type(materialData.quantity)
    cy.get('textarea[name="requestReason"]').type(materialData.reason)

    cy.get('.ant-modal-footer').contains('提交申请').click()
    this.waitForApi('requestPackagingMaterial')
    return this
  }

  // 导出包装任务
  exportPackagingTasks() {
    cy.get('button').contains('导出').click()
    this.waitForApi('exportPackagingTasks')
    return this
  }

  // 清除筛选条件
  clearFilters() {
    cy.get('button').contains('重置').click()
    this.waitForApi('getPackagingTasks')
    return this
  }

  // 验证提醒标识
  verifyUrgentTask(rowIndex) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.urgentBadge).should('be.visible')
    return this
  }

  // 验证过期任务
  verifyOverdueTask(rowIndex) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.overdueTask).should('be.visible')
    return this
  }
}