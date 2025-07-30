import { BasePage } from './BasePage'

export class ResponsivePage extends BasePage {
  constructor() {
    super()
    this.selectors = {
      ...this.selectors,
      // 响应式容器
      responsiveContainer: '.responsive-container',
      mobileView: '.mobile-view',
      tabletView: '.tablet-view',
      desktopView: '.desktop-view',
      
      // 导航元素
      sidebar: '.sidebar',
      bottomNav: '.bottom-nav',
      menuToggle: '.menu-toggle',
      navToggle: '.nav-toggle',
      
      // 表格响应式
      responsiveTable: '.responsive-table',
      tableCards: '.table-cards',
      tableCard: '.table-card',
      
      // 表单响应式
      responsiveForm: '.responsive-form',
      formRow: '.form-row',
      formInput: '.form-input',
      formActions: '.form-actions',
      
      // 图表响应式
      chartContainer: '.chart-container',
      chartResponsive: '.chart-responsive',
      chartLegend: '.chart-legend',
      chartTooltip: '.chart-tooltip',
      
      // 布局元素
      contentArea: '.content-area',
      sidebarMenu: '.sidebar-menu',
      breadcrumb: '.breadcrumb',
      pagination: '.pagination',
      
      // 断点指示器
      breakpointIndicator: '.breakpoint-indicator',
      deviceType: '.device-type',
      viewportSize: '.viewport-size',
      
      // 响应式工具类
      hiddenMobile: '.hidden-mobile',
      hiddenTablet: '.hidden-tablet',
      hiddenDesktop: '.hidden-desktop',
      visibleMobile: '.visible-mobile',
      visibleTablet: '.visible-tablet',
      visibleDesktop: '.visible-desktop'
    }
  }

  // 设备视口设置
  setViewport(device) {
    const viewports = {
      desktop: { width: 1920, height: 1080 },
      tablet: { width: 768, height: 1024 },
      mobile: { width: 375, height: 667 }
    }
    
    cy.viewport(viewports[device].width, viewports[device].height)
    return this
  }

  testAllViewports(callback) {
    const devices = ['desktop', 'tablet', 'mobile']
    
    devices.forEach(device => {
      this.setViewport(device)
      callback(device)
    })
    
    return this
  }

  // 响应式布局验证
  verifyResponsiveLayout() {
    return this.testAllViewports((device) => {
      cy.get(this.selectors.responsiveContainer)
        .should('have.class', `${device}-view`)
        .should('have.attr', 'data-device', device)
    })
  }

  verifyNavigation(device) {
    switch (device) {
      case 'desktop':
        cy.get(this.selectors.sidebar).should('be.visible')
        cy.get(this.selectors.bottomNav).should('not.be.visible')
        break
      case 'tablet':
        cy.get(this.selectors.sidebar).should('not.be.visible')
        cy.get(this.selectors.menuToggle).should('be.visible')
        break
      case 'mobile':
        cy.get(this.selectors.sidebar).should('not.be.visible')
        cy.get(this.selectors.bottomNav).should('be.visible')
        break
    }
    return this
  }

  // 表格响应式验证
  verifyTableResponsive(device) {
    switch (device) {
      case 'desktop':
        cy.get(this.selectors.responsiveTable).should('be.visible')
        cy.get(this.selectors.tableCards).should('not.be.visible')
        break
      case 'tablet':
      case 'mobile':
        cy.get(this.selectors.tableCards).should('be.visible')
        cy.get(this.selectors.tableCard).should('have.length.greaterThan', 0)
        break
    }
    return this
  }

  verifyTableColumns(device) {
    cy.get('.ant-table-thead th').then(($columns) => {
      const columnCount = $columns.length
      
      switch (device) {
        case 'desktop':
          expect(columnCount).to.be.greaterThan(6)
          break
        case 'tablet':
          expect(columnCount).to.be.within(4, 6)
          break
        case 'mobile':
          expect(columnCount).to.be.lessThan(4)
          break
      }
    })
    return this
  }

  // 表单响应式验证
  verifyFormLayout(device) {
    switch (device) {
      case 'desktop':
        cy.get(this.selectors.formRow).should('have.css', 'display', 'flex')
        break
      case 'tablet':
      case 'mobile':
        cy.get(this.selectors.formRow).should('have.css', 'display', 'block')
        break
    }
    return this
  }

  verifyFormFields(device) {
    cy.get(this.selectors.formInput).then(($fields) => {
      $fields.each((index, field) => {
        const width = Cypress.$(field).width()
        
        switch (device) {
          case 'desktop':
            expect(width).to.be.greaterThan(200)
            break
          case 'tablet':
            expect(width).to.be.within(150, 300)
            break
          case 'mobile':
            expect(width).to.be.lessThan(350)
            break
        }
      })
    })
    return this
  }

  verifyFormActions(device) {
    switch (device) {
      case 'desktop':
        cy.get(this.selectors.formActions).should('have.css', 'text-align', 'right')
        break
      case 'tablet':
        cy.get(this.selectors.formActions).should('have.css', 'text-align', 'center')
        break
      case 'mobile':
        cy.get(this.selectors.formActions).should('have.css', 'text-align', 'center')
        cy.get('.form-buttons').should('have.css', 'display', 'block')
        break
    }
    return this
  }

  // 图表响应式验证
  verifyChartResponsive(device) {
    cy.get(this.selectors.chartContainer).then(($containers) => {
      $containers.each((index, container) => {
        const width = Cypress.$(container).width()
        
        switch (device) {
          case 'desktop':
            expect(width).to.be.greaterThan(400)
            break
          case 'tablet':
            expect(width).to.be.within(300, 768)
            break
          case 'mobile':
            expect(width).to.be.lessThan(375)
            break
        }
      })
    })
    return this
  }

  verifyChartLegend(device) {
    switch (device) {
      case 'mobile':
        cy.get(this.selectors.chartLegend).should('not.be.visible')
        break
      default:
        cy.get(this.selectors.chartLegend).should('be.visible')
        break
    }
    return this
  }

  verifyChartTooltip(device) {
    cy.get(this.selectors.chartResponsive).trigger('mouseenter')
    cy.get(this.selectors.chartTooltip).should('be.visible')
    
    if (device === 'mobile') {
      cy.get(this.selectors.chartResponsive).trigger('touchstart')
      cy.get(this.selectors.chartTooltip).should('be.visible')
    }
    
    return this
  }

  // 断点测试
  testBreakpoints() {
    const breakpoints = [1920, 1200, 992, 768, 576, 375]
    
    breakpoints.forEach(breakpoint => {
      cy.viewport(breakpoint, 800)
      cy.get(this.selectors.breakpointIndicator)
        .should('have.attr', 'data-breakpoint', breakpoint)
    })
    
    return this
  }

  testOrientation() {
    // 测试横屏
    cy.viewport(1024, 768)
    cy.get(this.selectors.deviceType).should('contain', 'landscape')
    
    // 测试竖屏
    cy.viewport(768, 1024)
    cy.get(this.selectors.deviceType).should('contain', 'portrait')
    
    return this
  }

  // 隐藏/显示元素验证
  verifyHiddenElements(device) {
    const hiddenSelectors = {
      mobile: this.selectors.hiddenMobile,
      tablet: this.selectors.hiddenTablet,
      desktop: this.selectors.hiddenDesktop
    }
    
    Object.keys(hiddenSelectors).forEach(key => {
      if (key === device) {
        cy.get(hiddenSelectors[key]).should('not.be.visible')
      } else {
        cy.get(hiddenSelectors[key]).should('be.visible')
      }
    })
    
    return this
  }

  verifyVisibleElements(device) {
    const visibleSelectors = {
      mobile: this.selectors.visibleMobile,
      tablet: this.selectors.visibleTablet,
      desktop: this.selectors.visibleDesktop
    }
    
    Object.keys(visibleSelectors).forEach(key => {
      if (key === device) {
        cy.get(visibleSelectors[key]).should('be.visible')
      } else {
        cy.get(visibleSelectors[key]).should('not.be.visible')
      }
    })
    
    return this
  }

  // 导航菜单验证
  toggleSidebar() {
    cy.get(this.selectors.menuToggle).click()
    return this
  }

  verifySidebarVisibility(device) {
    switch (device) {
      case 'desktop':
        cy.get(this.selectors.sidebar).should('be.visible')
        break
      case 'tablet':
        cy.get(this.selectors.sidebar).should('not.be.visible')
        this.toggleSidebar()
        cy.get(this.selectors.sidebar).should('be.visible')
        break
      case 'mobile':
        cy.get(this.selectors.sidebar).should('not.be.visible')
        break
    }
    return this
  }

  // 触摸操作支持
  testTouchActions() {
    cy.viewport(375, 667)
    
    // 测试滑动
    cy.get('.swipe-container').trigger('touchstart', { clientX: 300, clientY: 200 })
    cy.get('.swipe-container').trigger('touchmove', { clientX: 200, clientY: 200 })
    cy.get('.swipe-container').trigger('touchend', { clientX: 200, clientY: 200 })
    
    // 测试捏合缩放
    cy.get('.pinch-container').trigger('touchstart', { touches: [
      { clientX: 200, clientY: 200 },
      { clientX: 300, clientY: 300 }
    ]})
    
    return this
  }

  // 性能测试
  measureResponsivePerformance(device) {
    const startTime = Date.now()
    
    cy.visit('/dashboard')
    cy.get('.dashboard-content').should('be.visible')
    
    cy.then(() => {
      const loadTime = Date.now() - startTime
      
      // 不同设备的性能基准
      const benchmarks = {
        desktop: 1000,
        tablet: 1500,
        mobile: 2000
      }
      
      expect(loadTime).to.be.lessThan(benchmarks[device])
    })
    
    return this
  }

  // 字体大小验证
  verifyFontSize(device) {
    const fontSizes = {
      desktop: '14px',
      tablet: '13px',
      mobile: '12px'
    }
    
    cy.get('body').should('have.css', 'font-size', fontSizes[device])
    return this
  }

  // 图片响应式加载
  verifyImageResponsive(device) {
    cy.get('.responsive-image').then(($imgs) => {
      $imgs.each((index, img) => {
        const src = Cypress.$(img).attr('src')
        
        switch (device) {
          case 'desktop':
            expect(src).to.include('large')
            break
          case 'tablet':
            expect(src).to.include('medium')
            break
          case 'mobile':
            expect(src).to.include('small')
            break
        }
      })
    })
    
    return this
  }

  // 懒加载验证
  verifyLazyLoading(device) {
    cy.scrollTo('bottom')
    cy.get('.lazy-loaded').should('be.visible')
    
    if (device === 'mobile') {
      // 移动端可能需要更多滚动
      cy.scrollTo('bottom', { ensureScrollable: false })
    }
    
    return this
  }

  // 综合响应式测试
  runComprehensiveResponsiveTest() {
    const devices = ['desktop', 'tablet', 'mobile']
    
    devices.forEach(device => {
      this.setViewport(device)
      
      // 验证基本布局
      this.verifyResponsiveLayout()
      this.verifyNavigation(device)
      
      // 验证表格
      this.verifyTableResponsive(device)
      this.verifyTableColumns(device)
      
      // 验证表单
      this.verifyFormLayout(device)
      this.verifyFormFields(device)
      
      // 验证图表
      this.verifyChartResponsive(device)
      this.verifyChartLegend(device)
      
      // 验证性能
      this.measureResponsivePerformance(device)
    })
    
    return this
  }

  // 生成响应式测试报告
  generateResponsiveReport() {
    cy.get('.responsive-report').click()
    this.waitForApi('generateResponsiveReport')
    
    cy.verifyDownload('responsive-test-report.pdf')
    return this
  }

  // 验证断点响应
  testBreakpointResponse(breakpoint) {
    cy.viewport(breakpoint, 800)
    cy.get(this.selectors.breakpointIndicator)
      .should('have.attr', 'data-breakpoint', breakpoint)
      .should('be.visible')
    
    return this
  }

  // 验证内容重排
  verifyContentReflow(device) {
    cy.get('.content-flow').then(($flow) => {
      const flowDirection = $flow.css('flex-direction')
      
      switch (device) {
        case 'desktop':
          expect(flowDirection).to.equal('row')
          break
        case 'tablet':
        case 'mobile':
          expect(flowDirection).to.equal('column')
          break
      }
    })
    
    return this
  }
}