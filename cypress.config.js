import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1920,
    viewportHeight: 1080,
    video: false,
    screenshot: true,
    defaultCommandTimeout: 30000,
    requestTimeout: 30000,
    responseTimeout: 30000,
    pageLoadTimeout: 30000,
    retries: {
      runMode: 2,
      openMode: 0
    },
    chromeWebSecurity: false,
    env: {
      adminUser: 'admin',
      adminPassword: 'admin123456',
      apiBaseUrl: 'http://localhost:3000/api/v1'
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