const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1920,
    viewportHeight: 1080,
    video: false,
    screenshot: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    retries: {
      runMode: 2,
      openMode: 0
    },
    chromeWebSecurity: false,
    env: {
      adminUser: 'admin@easyerp.com',
      adminPassword: 'Admin@123456',
      purchaseManagerUser: 'purchase.manager@easyerp.com',
      purchaseManagerPassword: 'Purchase@2024',
      warehouseAdminUser: 'warehouse.admin@easyerp.com',
      warehouseAdminPassword: 'Warehouse@2024',
      financeUser: 'finance.user@easyerp.com',
      financePassword: 'Finance@2024'
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js'
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack'
    }
  }
})