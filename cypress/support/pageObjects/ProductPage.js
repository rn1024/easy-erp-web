import { BasePage } from './BasePage'

export class ProductPage extends BasePage {
  constructor() {
    super()
    this.selectors = {
      ...this.selectors,
      // 产品列表
      productTable: '.ant-table-tbody',
      searchInput: 'input[placeholder="搜索产品名称或编码"]',
      searchButton: 'button[type="submit"]',
      categorySelect: '.ant-select-selector',
      shopSelect: '.ant-select-selector',
      createButton: 'button:contains("新建产品")',
      importButton: 'button:contains("导入")',
      exportButton: 'button:contains("导出")',
      
      // 产品操作按钮
      editButton: '.edit-button',
      viewButton: '.view-button',
      deleteButton: '.delete-button',
      batchEditButton: 'button:contains("批量编辑")',
      batchDeleteButton: 'button:contains("批量删除")',
      
      // 产品表单
      nameInput: 'input[name="name"]',
      codeInput: 'input[name="code"]',
      skuInput: 'input[name="sku"]',
      asinInput: 'input[name="asin"]',
      descriptionTextarea: 'textarea[name="description"]',
      specificationTextarea: 'textarea[name="specification"]',
      colorsInput: 'input[name="colors"]',
      weightInput: 'input[name="weight"]',
      lengthInput: 'input[name="length"]',
      widthInput: 'input[name="width"]',
      heightInput: 'input[name="height"]',
      
      // 包装信息
      innerBoxLength: 'input[name="innerBoxLength"]',
      innerBoxWidth: 'input[name="innerBoxWidth"]',
      innerBoxHeight: 'input[name="innerBoxHeight"]',
      outerBoxLength: 'input[name="outerBoxLength"]',
      outerBoxWidth: 'input[name="outerBoxWidth"]',
      outerBoxHeight: 'input[name="outerBoxHeight"]',
      packageWeight: 'input[name="packageWeight"]',
      boxType: 'input[name="boxType"]',
      packQuantity: 'input[name="packQuantity"]',
      
      // 图片上传
      imageUpload: 'input[type="file"]',
      imagePreview: '.ant-upload-list-item',
      removeImage: '.anticon-delete',
      
      // 详情模态框
      detailModal: '.product-detail-modal',
      detailTabs: '.ant-tabs-tab',
      basicInfoTab: '.ant-tabs-tab:contains("基本信息")',
      packageInfoTab: '.ant-tabs-tab:contains("包装信息")',
      imageInfoTab: '.ant-tabs-tab:contains("图片信息")',
      inventoryInfoTab: '.ant-tabs-tab:contains("库存信息")',
      historyTab: '.ant-tabs-tab:contains("操作记录")',
      
      // 分页
      pagination: '.ant-pagination',
      pageSizeSelect: '.ant-pagination-options-size-changer',
      
      // 确认对话框
      confirmDelete: '.ant-popconfirm .ant-btn-primary',
      cancelDelete: '.ant-popconfirm .ant-btn-default'
    }
  }

  // 搜索产品
  searchProducts(keyword) {
    cy.get(this.selectors.searchInput).clear().type(keyword)
    cy.get(this.selectors.searchButton).click()
    return this
  }

  // 筛选产品
  filterProducts(filters) {
    if (filters.category) {
      cy.get(this.selectors.categorySelect).first().click()
      cy.contains(filters.category).click()
    }
    if (filters.shop) {
      cy.get(this.selectors.shopSelect).last().click()
      cy.contains(filters.shop).click()
    }
    return this
  }

  // 创建新产品
  createProduct(productData) {
    cy.get(this.selectors.createButton).click()
    this.waitForModal()
    
    // 填写基本信息
    cy.get(this.selectors.nameInput).type(productData.name)
    cy.get(this.selectors.codeInput).type(productData.code)
    cy.get(this.selectors.skuInput).type(productData.sku)
    if (productData.asin) {
      cy.get(this.selectors.asinInput).type(productData.asin)
    }
    cy.get(this.selectors.descriptionTextarea).type(productData.description)
    if (productData.specification) {
      cy.get(this.selectors.specificationTextarea).type(productData.specification)
    }
    cy.get(this.selectors.colorsInput).type(productData.colors)

    // 选择分类和店铺
    if (productData.category) {
      cy.get('.ant-select-selector').contains('请选择分类').click()
      cy.contains(productData.category).click()
    }
    if (productData.shop) {
      cy.get('.ant-select-selector').contains('请选择店铺').click()
      cy.contains(productData.shop).click()
    }

    // 填写包装信息
    cy.get(this.selectors.weightInput).type(productData.weight)
    cy.get(this.selectors.lengthInput).type(productData.length)
    cy.get(this.selectors.widthInput).type(productData.width)
    cy.get(this.selectors.heightInput).type(productData.height)
    
    if (productData.innerBox) {
      cy.get(this.selectors.innerBoxLength).type(productData.innerBox.length)
      cy.get(this.selectors.innerBoxWidth).type(productData.innerBox.width)
      cy.get(this.selectors.innerBoxHeight).type(productData.innerBox.height)
    }
    
    if (productData.outerBox) {
      cy.get(this.selectors.outerBoxLength).type(productData.outerBox.length)
      cy.get(this.selectors.outerBoxWidth).type(productData.outerBox.width)
      cy.get(this.selectors.outerBoxHeight).type(productData.outerBox.height)
    }
    
    cy.get(this.selectors.packageWeight).type(productData.packageWeight)
    cy.get(this.selectors.boxType).type(productData.boxType)
    cy.get(this.selectors.packQuantity).type(productData.packQuantity)

    // 提交表单
    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('createProduct')
    
    return this
  }

  // 编辑产品
  editProduct(rowIndex, updates) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.editButton).click()
    this.waitForModal()

    Object.keys(updates).forEach(key => {
      const selector = this.selectors[`${key}Input`] || this.selectors[`${key}Textarea`]
      if (selector) {
        cy.get(selector).clear().type(updates[key])
      }
    })

    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('updateProduct')
    
    return this
  }

  // 查看产品详情
  viewProductDetails(rowIndex) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.viewButton).click()
    this.waitForModal()
    return this
  }

  // 删除产品
  deleteProduct(rowIndex, confirm = true) {
    cy.get('.ant-table-tbody tr').eq(rowIndex).find(this.selectors.deleteButton).click()
    
    if (confirm) {
      cy.get(this.selectors.confirmDelete).click()
      this.waitForApi('deleteProduct')
    } else {
      cy.get(this.selectors.cancelDelete).click()
    }
    
    return this
  }

  // 批量操作
  selectProducts(indices) {
    indices.forEach(index => {
      cy.get('.ant-table-tbody tr').eq(index).find('.ant-checkbox-input').click()
    })
    return this
  }

  batchDelete() {
    cy.get(this.selectors.batchDeleteButton).click()
    cy.get(this.selectors.confirmDelete).click()
    this.waitForApi('batchDeleteProducts')
    return this
  }

  // 上传产品图片
  uploadImages(imagePaths) {
    if (Array.isArray(imagePaths)) {
      cy.get(this.selectors.imageUpload).attachFile(imagePaths)
    } else {
      cy.get(this.selectors.imageUpload).attachFile(imagePaths)
    }
    this.waitForApi('uploadImage')
    return this
  }

  // 验证产品存在
  verifyProductExists(productName) {
    cy.contains(productName).should('be.visible')
    return this
  }

  // 验证产品不存在
  verifyProductNotExists(productName) {
    cy.contains(productName).should('not.exist')
    return this
  }

  // 获取产品数量
  getProductCount() {
    return cy.get('.ant-table-tbody tr').its('length')
  }

  // 切换到指定标签页
  switchTab(tabName) {
    cy.contains('.ant-tabs-tab', tabName).click()
    return this
  }

  // 分页操作
  goToPage(pageNumber) {
    cy.get('.ant-pagination-item').contains(pageNumber).click()
    this.waitForApi('getProducts')
    return this
  }

  // 设置每页显示数量
  setPageSize(size) {
    cy.get(this.selectors.pageSizeSelect).click()
    cy.contains(`${size} 条/页`).click()
    this.waitForApi('getProducts')
    return this
  }

  // 验证表格数据
  verifyTableData(expectedData) {
    expectedData.forEach((row, index) => {
      cy.get('.ant-table-tbody tr').eq(index).within(() => {
        if (row.name) cy.contains(row.name).should('be.visible')
        if (row.code) cy.contains(row.code).should('be.visible')
        if (row.category) cy.contains(row.category).should('be.visible')
        if (row.shop) cy.contains(row.shop).should('be.visible')
      })
    })
    return this
  }

  // 导出产品
  exportProducts() {
    cy.get(this.selectors.exportButton).click()
    this.waitForApi('exportProducts')
    return this
  }

  // 导入产品
  importProducts(filePath) {
    cy.get(this.selectors.importButton).click()
    this.waitForModal()
    cy.get('input[type="file"]').attachFile(filePath)
    cy.get('.ant-modal-footer').contains('确定').click()
    this.waitForApi('importProducts')
    return this
  }

  // 清除筛选条件
  clearFilters() {
    cy.get('button').contains('重置').click()
    this.waitForApi('getProducts')
    return this
  }

  // 验证列表为空
  verifyEmptyList() {
    cy.contains('暂无数据').should('be.visible')
    return this
  }

  // 验证加载状态
  verifyLoading() {
    cy.get('.ant-spin-spinning').should('be.visible')
    return this
  }

  // 验证加载完成
  verifyLoaded() {
    cy.get('.ant-spin-spinning').should('not.exist')
    return this
  }
}