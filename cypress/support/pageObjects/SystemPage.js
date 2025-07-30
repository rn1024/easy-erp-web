import { BasePage } from './BasePage'

export class SystemPage extends BasePage {
  constructor() {
    super()
    this.selectors = {
      ...this.selectors,
      // 用户管理
      userTable: '.user-table',
      userSearchInput: 'input[placeholder*="搜索用户"]',
      createUserButton: 'button:contains("创建用户")',
      importUsersButton: 'button:contains("批量导入")',
      exportUsersButton: 'button:contains("导出用户")',
      
      // 角色管理
      roleTable: '.role-table',
      createRoleButton: 'button:contains("创建角色")',
      rolePermissionsButton: 'button:contains("权限设置")',
      assignRoleButton: 'button:contains("分配角色")',
      
      // 权限管理
      permissionTable: '.permission-table',
      permissionTree: '.permission-tree',
      savePermissionsButton: 'button:contains("保存权限")',
      resetPermissionsButton: 'button:contains("重置权限")',
      
      // 系统设置
      systemSettings: '.system-settings',
      generalSettings: '.general-settings',
      notificationSettings: '.notification-settings',
      emailSettings: '.email-settings',
      apiSettings: '.api-settings',
      
      // 数据管理
      backupButton: 'button:contains("数据备份")',
      restoreButton: 'button:contains("数据恢复")',
      cleanupButton: 'button:contains("数据清理")',
      exportButton: 'button:contains("数据导出")',
      importButton: 'button:contains("数据导入")',
      
      // 日志管理
      logTable: '.log-table',
      logSearchInput: 'input[placeholder*="搜索日志"]',
      logLevelSelect: '.ant-select-selector',
      logExportButton: 'button:contains("导出日志")',
      logClearButton: 'button:contains("清理日志")',
      
      // 审计管理
      auditTable: '.audit-table',
      auditFilter: '.audit-filter',
      auditReportButton: 'button:contains("生成审计报告")',
      auditTrailButton: 'button:contains("查看审计轨迹")',
      
      // 系统监控
      dashboardMetrics: '.dashboard-metrics',
      systemHealth: '.system-health',
      performanceChart: '.performance-chart',
      resourceUsage: '.resource-usage',
      
      // 通知管理
      notificationTable: '.notification-table',
      createNotificationButton: 'button:contains("创建通知")',
      notificationTemplateButton: 'button:contains("通知模板")',
      
      // 集成管理
      integrationTable: '.integration-table',
      addIntegrationButton: 'button:contains("添加集成")',
      testIntegrationButton: 'button:contains("测试集成")',
      configureIntegrationButton: 'button:contains("配置集成")',
      
      // 表单字段
      usernameInput: 'input[name="username"]',
      emailInput: 'input[name="email"]',
      phoneInput: 'input[name="phone"]',
      roleInput: 'input[name="role"]',
      departmentInput: 'input[name="department"]',
      statusSelect: '.ant-select-selector',
      
      // 角色表单
      roleNameInput: 'input[name="roleName"]',
      roleDescriptionInput: 'textarea[name="roleDescription"]',
      
      // 设置表单
      settingNameInput: 'input[name="settingName"]',
      settingValueInput: 'input[name="settingValue"]',
      settingDescriptionInput: 'textarea[name="settingDescription"]',
      
      // 操作按钮
      editButton: '.edit-button',
      deleteButton: '.delete-button',
      deactivateButton: '.deactivate-button',
      activateButton: '.activate-button',
      resetPasswordButton: '.reset-password-button',
      
      // 状态指示器
      statusActive: '.status-active',
      statusInactive: '.status-inactive',
      statusPending: '.status-pending',
      
      // 系统信息
      systemInfo: '.system-info',
      versionInfo: '.version-info',
      licenseInfo: '.license-info',
      
      // 文件上传
      uploadArea: '.upload-area',
      fileInput: 'input[type="file"]',
      
      // 备份和恢复
      backupList: '.backup-list',
      restoreModal: '.restore-modal',
      backupStatus: '.backup-status',
      
      // 监控面板
      cpuUsage: '.cpu-usage',
      memoryUsage: '.memory-usage',
      diskUsage: '.disk-usage',
      networkUsage: '.network-usage',
      
      // 搜索和筛选
      searchButton: 'button[type="submit"]',
      resetButton: 'button:contains("重置")',
      filterButton: 'button:contains("筛选")',
      
      // 分页
      pagination: '.ant-pagination',
      pageSize: '.ant-pagination-options-size-changer'
    }
  }

  // 用户管理
  navigateToUsers() {
    cy.visit('/system/users')
    return this
  }

  navigateToRoles() {
    cy.visit('/system/roles')
    return this
  }

  navigateToPermissions() {
    cy.visit('/system/permissions')
    return this
  }

  navigateToSettings() {
    cy.visit('/system/settings')
    return this
  }

  navigateToLogs() {
    cy.visit('/system/logs')
    return this
  }

  navigateToAudit() {
    cy.visit('/system/audit')
    return this
  }

  navigateToMonitoring() {
    cy.visit('/system/monitoring')
    return this
  }

  navigateToIntegrations() {
    cy.visit('/system/integrations')
    return this
  }

  // 用户管理
  searchUsers(keyword) {
    cy.get(this.selectors.userSearchInput).clear().type(keyword)
    cy.get(this.selectors.searchButton).click()
    return this
  }

  createUser(userData) {
    cy.get(this.selectors.createUserButton).click()
    this.waitForModal()

    cy.get(this.selectors.usernameInput).type(userData.username)
    cy.get(this.selectors.emailInput).type(userData.email)
    cy.get(this.selectors.phoneInput).type(userData.phone)
    cy.get('.ant-select-selector').contains('角色').click()
    cy.contains(userData.role).click()
    cy.get('.ant-select-selector').contains('部门').click()
    cy.contains(userData.department).click()
    cy.get('.ant-select-selector').contains('状态').click()
    cy.contains('启用').click()

    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('createUser')
    return this
  }

  editUser(userId, updates) {
    cy.get('.ant-table-tbody tr').contains(userId).parent().find(this.selectors.editButton).click()
    this.waitForModal()

    Object.keys(updates).forEach(key => {
      const inputName = `${key}Input`
      if (this.selectors[inputName]) {
        cy.get(this.selectors[inputName]).clear().type(updates[key])
      }
    })

    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('updateUser')
    return this
  }

  deactivateUser(userId) {
    cy.get('.ant-table-tbody tr').contains(userId).parent().find(this.selectors.deactivateButton).click()
    cy.get('.ant-popconfirm').contains('确定').click()
    this.waitForApi('deactivateUser')
    return this
  }

  resetPassword(userId) {
    cy.get('.ant-table-tbody tr').contains(userId).parent().find(this.selectors.resetPasswordButton).click()
    cy.get('.ant-popconfirm').contains('确定').click()
    this.waitForApi('resetPassword')
    return this
  }

  // 角色管理
  createRole(roleData) {
    cy.get(this.selectors.createRoleButton).click()
    this.waitForModal()

    cy.get(this.selectors.roleNameInput).type(roleData.name)
    cy.get(this.selectors.roleDescriptionInput).type(roleData.description)
    
    if (roleData.permissions) {
      roleData.permissions.forEach(permission => {
        cy.get('.ant-checkbox-group').contains(permission).click()
      })
    }

    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('createRole')
    return this
  }

  assignRoleToUser(userId, roleName) {
    cy.get('.ant-table-tbody tr').contains(userId).parent().find(this.selectors.assignRoleButton).click()
    this.waitForModal()

    cy.get('.ant-select-selector').contains('选择角色').click()
    cy.contains(roleName).click()
    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('assignRole')
    return this
  }

  // 权限管理
  setRolePermissions(roleName, permissions) {
    cy.get('.ant-table-tbody tr').contains(roleName).parent().find(this.selectors.rolePermissionsButton).click()
    this.waitForModal()

    // 清除所有权限
    cy.get('.ant-tree-checkbox').uncheck({ force: true })
    
    // 设置新权限
    permissions.forEach(permission => {
      cy.get('.ant-tree-node-content-wrapper').contains(permission).parent().find('.ant-tree-checkbox').click()
    })

    cy.get(this.selectors.savePermissionsButton).click()
    this.waitForApi('savePermissions')
    return this
  }

  // 系统设置
  updateSetting(settingName, value) {
    cy.get('.settings-form').contains(settingName).parent().find('input').clear().type(value)
    cy.get('.settings-form').contains('保存设置').click()
    this.waitForApi('updateSetting')
    return this
  }

  bulkUpdateSettings(settings) {
    Object.keys(settings).forEach(key => {
      cy.get(`input[name="${key}"]`).clear().type(settings[key])
    })
    cy.get('button').contains('保存所有设置').click()
    this.waitForApi('updateSettings')
    return this
  }

  // 数据管理
  createBackup(backupName) {
    cy.get(this.selectors.backupButton).click()
    this.waitForModal()

    cy.get('input[name="backupName"]').type(backupName)
    cy.get('.ant-select-selector').contains('备份类型').click()
    cy.contains('完整备份').click()
    cy.get('.ant-modal-footer').contains('开始备份').click()
    this.waitForApi('createBackup')
    return this
  }

  restoreBackup(backupId) {
    cy.get('.backup-list').contains(backupId).parent().find(this.selectors.restoreButton).click()
    this.waitForModal()

    cy.get('.ant-popconfirm').contains('确定').click()
    this.waitForApi('restoreBackup')
    return this
  }

  cleanupData(cleanupType) {
    cy.get(this.selectors.cleanupButton).click()
    this.waitForModal()

    cy.get('.ant-select-selector').contains('清理类型').click()
    cy.contains(cleanupType).click()
    cy.get('.ant-modal-footer').contains('开始清理').click()
    this.waitForApi('cleanupData')
    return this
  }

  exportData(exportType) {
    cy.get(this.selectors.exportButton).click()
    cy.get('.ant-dropdown-menu').contains(exportType).click()
    this.waitForApi('exportData')
    return this
  }

  importData(filePath, importType) {
    cy.get(this.selectors.importButton).click()
    this.waitForModal()

    cy.get('.ant-select-selector').contains('导入类型').click()
    cy.contains(importType).click()
    cy.get(this.selectors.fileInput).attachFile(filePath)
    cy.get('.ant-modal-footer').contains('开始导入').click()
    this.waitForApi('importData')
    return this
  }

  // 日志管理
  searchLogs(keyword) {
    cy.get(this.selectors.logSearchInput).clear().type(keyword)
    cy.get(this.selectors.searchButton).click()
    return this
  }

  filterLogs(filters) {
    if (filters.level) {
      cy.get(this.selectors.logLevelSelect).click()
      cy.contains(filters.level).click()
    }
    if (filters.dateRange) {
      cy.get('.ant-picker-range').click()
      cy.contains(filters.dateRange.start).click()
      cy.contains(filters.dateRange.end).click()
    }
    return this
  }

  exportLogs() {
    cy.get(this.selectors.logExportButton).click()
    this.waitForApi('exportLogs')
    return this
  }

  clearLogs(logType) {
    cy.get('.log-type-selector').contains(logType).parent().find(this.selectors.logClearButton).click()
    cy.get('.ant-popconfirm').contains('确定').click()
    this.waitForApi('clearLogs')
    return this
  }

  // 审计管理
  generateAuditReport(reportType) {
    cy.get(this.selectors.auditReportButton).click()
    this.waitForModal()

    cy.get('.ant-select-selector').contains('报告类型').click()
    cy.contains(reportType).click()
    cy.get('.ant-modal-footer').contains('生成报告').click()
    this.waitForApi('generateAuditReport')
    return this
  }

  viewAuditTrail(userId) {
    cy.get('.ant-table-tbody tr').contains(userId).parent().find(this.selectors.auditTrailButton).click()
    this.waitForModal()
    return this
  }

  // 系统监控
  viewSystemHealth() {
    cy.get(this.selectors.systemHealth).should('be.visible')
    return this
  }

  viewPerformanceMetrics() {
    cy.get(this.selectors.performanceChart).should('be.visible')
    return this
  }

  viewResourceUsage() {
    cy.get(this.selectors.resourceUsage).should('be.visible')
    return this
  }

  // 通知管理
  createNotification(notificationData) {
    cy.get(this.selectors.createNotificationButton).click()
    this.waitForModal()

    cy.get('input[name="title"]').type(notificationData.title)
    cy.get('textarea[name="content"]').type(notificationData.content)
    cy.get('.ant-select-selector').contains('通知类型').click()
    cy.contains(notificationData.type).click()
    
    if (notificationData.recipients) {
      notificationData.recipients.forEach(recipient => {
        cy.get('.ant-select-selector').contains('接收人').click()
        cy.contains(recipient).click()
      })
    }

    cy.get('.ant-modal-footer').contains('发送通知').click()
    this.waitForApi('createNotification')
    return this
  }

  // 集成管理
  addIntegration(integrationData) {
    cy.get(this.selectors.addIntegrationButton).click()
    this.waitForModal()

    cy.get('input[name="integrationName"]').type(integrationData.name)
    cy.get('.ant-select-selector').contains('集成类型').click()
    cy.contains(integrationData.type).click()
    cy.get('input[name="endpoint"]').type(integrationData.endpoint)
    cy.get('input[name="apiKey"]').type(integrationData.apiKey)

    cy.get('.ant-modal-footer').contains('添加集成').click()
    this.waitForApi('addIntegration')
    return this
  }

  testIntegration(integrationName) {
    cy.get('.ant-table-tbody tr').contains(integrationName).parent().find(this.selectors.testIntegrationButton).click()
    this.waitForApi('testIntegration')
    return this
  }

  configureIntegration(integrationName, config) {
    cy.get('.ant-table-tbody tr').contains(integrationName).parent().find(this.selectors.configureIntegrationButton).click()
    this.waitForModal()

    Object.keys(config).forEach(key => {
      cy.get(`input[name="${key}"]`).clear().type(config[key])
    })

    cy.get('.ant-modal-footer').contains('保存配置').click()
    this.waitForApi('configureIntegration')
    return this
  }

  // 验证功能
  verifyUserExists(username) {
    cy.contains(username).should('be.visible')
    return this
  }

  verifyUserNotExists(username) {
    cy.contains(username).should('not.exist')
    return this
  }

  verifyRoleExists(roleName) {
    cy.contains(roleName).should('be.visible')
    return this
  }

  verifyPermissionExists(permission) {
    cy.contains(permission).should('be.visible')
    return this
  }

  verifySystemHealth() {
    cy.get('.system-status').should('contain', '正常')
    return this
  }

  verifyBackupExists(backupName) {
    cy.get('.backup-list').should('contain', backupName)
    return this
  }

  verifyLogExists(logMessage) {
    cy.get('.log-table').should('contain', logMessage)
    return this
  }

  verifyIntegrationStatus(integrationName, status) {
    cy.get('.ant-table-tbody tr').contains(integrationName).parent().should('contain', status)
    return this
  }

  // 权限验证
  verifySystemPermissions(role) {
    switch(role) {
      case 'admin':
        cy.get('button').contains('创建用户').should('be.visible')
        cy.get('button').contains('创建角色').should('be.visible')
        cy.get('button').contains('数据备份').should('be.visible')
        break
      case 'system_admin':
        cy.get('button').contains('创建用户').should('be.visible')
        cy.get('button').contains('系统设置').should('be.visible')
        cy.get('button').contains('数据备份').should('be.visible')
        break
      case 'security_admin':
        cy.get('button').contains('权限设置').should('be.visible')
        cy.get('button').contains('审计管理').should('be.visible')
        cy.get('button').contains('系统监控').should('be.visible')
        break
      default:
        cy.get('button').contains('查看用户').should('be.visible')
    }
    return this
  }
}