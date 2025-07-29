// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// supportFile configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global test configuration
beforeEach(() => {
  // 清除本地存储
  cy.clearLocalStorage()
  
  // 设置默认视图
  cy.viewport(1920, 1080)
  
  // 禁用动画以提高测试稳定性
  cy.on('window:before:load', (win) => {
    win.caches?.keys?.().then(keys => keys.forEach(key => win.caches.delete(key)))
  })
})

// 全局错误处理
Cypress.on('uncaught:exception', (err, runnable) => {
  // 返回false以防止Cypress失败
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  if (err.message.includes('ResizeObserver loop completed with undelivered notifications')) {
    return false
  }
  return false
})

// 全局API拦截设置
beforeEach(() => {
  // 设置默认API拦截
  cy.intercept('GET', '/api/v1/auth/captcha').as('getCaptcha')
  cy.intercept('POST', '/api/v1/auth/login').as('loginRequest')
  cy.intercept('GET', '/api/v1/me').as('getUserInfo')
})

// 测试清理
afterEach(() => {
  // 清理测试会话
  cy.window().then((win) => {
    win.sessionStorage.clear()
  })
})