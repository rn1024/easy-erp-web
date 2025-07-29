// Easy ERP Cypress E2E测试套件
// 基于前端路由和组件结构设计的完整测试

describe('Easy ERP E2E测试套件', () => {
  
  // 测试数据
  const testData = {
    admin: {
      username: 'admin@easyerp.com',
      password: 'Admin@123456'
    },
    product: {
      name: 'iPhone 15 Pro Max 测试机',
      code: 'TEST-IP15PM-001',
      sku: 'TEST-SKU-001',
      weight: 221,
      length: 159.9,
      width: 76.7,
      height: 8.25,
      category: '智能手机',
      shop: '智能科技旗舰店'
    },
    inventory: {
      quantity: 500,
      location: 'A区-货架1-层1',
      batchNumber: 'BATCH-2024-TEST-001'
    },
    purchaseOrder: {
      supplier: '深圳华强北电子有限公司',
      totalAmount: 500000,
      deliveryDate: '2024-03-15'
    }
  };

  // 在每个测试前执行
  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.intercept('POST', '/api/v1/auth/login').as('loginRequest');
    cy.intercept('GET', '/api/v1/products').as('getProducts');
    cy.intercept('POST', '/api/v1/products').as('createProduct');
    cy.intercept('GET', '/api/v1/finished-inventory').as('getInventory');
    cy.intercept('POST', '/api/v1/finished-inventory').as('createInventory');
    cy.intercept('GET', '/api/v1/purchase-orders').as('getPurchaseOrders');
    cy.intercept('POST', '/api/v1/purchase-orders').as('createPurchaseOrder');
  });

  describe('认证模块测试', () => {
    it('TC001: 正常登录流程', () => {
      cy.visit('/login');
      cy.get('input[name="username"]').type(testData.admin.username);
      cy.get('input[name="password"]').type(testData.admin.password);
      cy.get('button[type="submit"]').click();
      
      cy.wait('@loginRequest');
      cy.url().should('include', '/dashboard');
      cy.contains('欢迎回来').should('be.visible');
    });

    it('TC002: 登录失败场景', () => {
      cy.visit('/login');
      
      // 错误密码
      cy.get('input[name="username"]').type(testData.admin.username);
      cy.get('input[name="password"]').type('WrongPassword');
      cy.get('button[type="submit"]').click();
      cy.contains('用户名或密码错误').should('be.visible');
      
      // 空值验证
      cy.get('input[name="username"]').clear();
      cy.get('input[name="password"]').clear();
      cy.get('button[type="submit"]').click();
      cy.get('.ant-form-item-explain-error').should('contain', '请输入');
    });

    it('TC003: 退出登录', () => {
      cy.login(testData.admin.username, testData.admin.password);
      cy.visit('/dashboard');
      
      cy.get('.user-dropdown').click();
      cy.contains('退出登录').click();
      cy.url().should('include', '/login');
    });
  });

  describe('产品管理模块测试', () => {
    beforeEach(() => {
      cy.login(testData.admin.username, testData.admin.password);
    });

    it('TC004: 完整产品创建流程', () => {
      cy.visit('/products/products');
      cy.wait('@getProducts');
      
      cy.get('button').contains('新建产品').click();
      
      // 填写基本信息
      cy.get('input[name="name"]').type(testData.product.name);
      cy.get('input[name="code"]').type(testData.product.code);
      cy.get('input[name="sku"]').type(testData.product.sku);
      
      // 选择分类
      cy.get('.product-category-select').click();
      cy.contains(testData.product.category).click();
      
      // 选择店铺
      cy.get('.shop-select').click();
      cy.contains(testData.product.shop).click();
      
      // 填写规格参数
      cy.get('input[name="weight"]').type(testData.product.weight);
      cy.get('input[name="length"]').type(testData.product.length);
      cy.get('input[name="width"]').type(testData.product.width);
      cy.get('input[name="height"]').type(testData.product.height);
      
      // 上传图片
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-product.jpg', { force: true });
      cy.get('.upload-preview').should('be.visible');
      
      // 提交表单
      cy.get('button[type="submit"]').click();
      cy.wait('@createProduct');
      
      cy.contains('创建成功').should('be.visible');
      cy.contains(testData.product.name).should('be.visible');
    });

    it('TC005: 产品搜索与筛选', () => {
      cy.visit('/products/products');
      cy.wait('@getProducts');
      
      // 关键词搜索
      cy.get('input[placeholder="搜索产品"]').type('iPhone');
      cy.get('.search-button').click();
      cy.contains('iPhone').should('be.visible');
      
      // 分类筛选
      cy.get('.category-filter').click();
      cy.contains('智能手机').click();
      cy.get('.ant-table-row').should('have.length.greaterThan', 0);
      
      // 重置筛选
      cy.get('.reset-button').click();
      cy.get('.ant-table-row').should('have.length.greaterThan', 0);
    });

    it('TC006: 产品图片管理', () => {
      cy.visit('/products/products');
      cy.wait('@getProducts');
      
      // 进入产品详情
      cy.contains(testData.product.name).click();
      cy.get('.product-detail-modal').should('be.visible');
      
      // 切换到图片管理
      cy.get('.ant-modal').contains('图片管理').click();
      
      // 上传新图片
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-product-2.jpg', { force: true });
      cy.get('.upload-success').should('be.visible');
      
      // 设置主图
      cy.get('.set-cover-button').first().click();
      cy.contains('设置成功').should('be.visible');
      
      // 删除图片
      cy.get('.delete-image-button').last().click();
      cy.get('.ant-popconfirm').contains('确定').click();
      cy.contains('删除成功').should('be.visible');
    });
  });

  describe('库存管理模块测试', () => {
    beforeEach(() => {
      cy.login(testData.admin.username, testData.admin.password);
    });

    it('TC007: 库存录入与更新', () => {
      cy.visit('/inventory/finished-inventory');
      cy.wait('@getInventory');
      
      cy.get('button').contains('新建库存').click();
      
      // 选择产品
      cy.get('.product-select').click();
      cy.contains(testData.product.name).click();
      
      // 输入库存信息
      cy.get('input[name="quantity"]').type(testData.inventory.quantity);
      cy.get('input[name="location"]').type(testData.inventory.location);
      cy.get('input[name="batch_number"]').type(testData.inventory.batchNumber);
      
      // 提交
      cy.get('button[type="submit"]').click();
      cy.wait('@createInventory');
      
      cy.contains('创建成功').should('be.visible');
      cy.contains(testData.inventory.batchNumber).should('be.visible');
    });

    it('TC008: 库存盘点功能', () => {
      cy.visit('/inventory/finished-inventory');
      cy.wait('@getInventory');
      
      // 选择库存记录
      cy.get('.inventory-row').first().find('.check-inventory-button').click();
      
      // 输入实际盘点数量
      cy.get('input[name="actual_quantity"]').clear().type('495');
      cy.get('textarea[name="notes"]').type('盘点差异处理');
      
      // 确认调整
      cy.get('button').contains('确认调整').click();
      cy.contains('调整成功').should('be.visible');
      
      // 验证数量更新
      cy.get('.inventory-quantity').should('contain', '495');
    });
  });

  describe('采购管理模块测试', () => {
    beforeEach(() => {
      cy.login(testData.admin.username, testData.admin.password);
    });

    it('TC009: 完整采购订单流程', () => {
      cy.visit('/purchase/purchase-orders');
      cy.wait('@getPurchaseOrders');
      
      cy.get('button').contains('新建采购订单').click();
      
      // 选择供应商
      cy.get('.supplier-select').click();
      cy.contains(testData.purchaseOrder.supplier).click();
      
      // 选择店铺
      cy.get('.shop-select').click();
      cy.contains(testData.product.shop).click();
      
      // 添加产品
      cy.get('.add-product-button').click();
      cy.get('.product-select').click();
      cy.contains(testData.product.name).click();
      cy.get('input[name="quantity"]').type('100');
      cy.get('input[name="unit_price"]').type('5000');
      cy.get('button').contains('确定').click();
      
      // 设置交货日期
      cy.get('input[name="delivery_date"]').type('2024-03-15');
      
      // 提交审批
      cy.get('button').contains('提交审批').click();
      cy.wait('@createPurchaseOrder');
      
      cy.contains('创建成功').should('be.visible');
      cy.contains(testData.purchaseOrder.supplier).should('be.visible');
    });

    it('TC010: 订单审批流程', () => {
      cy.visit('/purchase/purchase-orders');
      cy.wait('@getPurchaseOrders');
      
      // 找到待审批订单
      cy.get('.purchase-order-row').contains('待审批').parent().find('.approve-button').click();
      
      // 审批通过
      cy.get('.approval-modal').should('be.visible');
      cy.get('textarea[name="comment"]').type('审批通过');
      cy.get('button').contains('通过').click();
      
      cy.contains('审批成功').should('be.visible');
      cy.contains('已确认').should('be.visible');
    });
  });

  describe('包装任务模块测试', () => {
    beforeEach(() => {
      cy.login(testData.admin.username, testData.admin.password);
    });

    it('TC011: 包装任务创建与执行', () => {
      cy.visit('/warehouse/packaging-tasks');
      
      cy.get('button').contains('新建包装任务').click();
      
      // 填写任务信息
      cy.get('input[name="name"]').type('iPhone春节礼品包装');
      cy.get('.shop-select').click();
      cy.contains(testData.product.shop).click();
      
      // 选择产品
      cy.get('.product-select').click();
      cy.contains(testData.product.name).click();
      cy.get('input[name="quantity"]').type('50');
      
      // 分配操作员
      cy.get('.operator-select').click();
      cy.contains('张包装').click();
      
      // 创建任务
      cy.get('button[type="submit"]').click();
      cy.contains('创建成功').should('be.visible');
      
      // 开始任务
      cy.get('.packaging-task-row').first().find('.start-button').click();
      cy.contains('进行中').should('be.visible');
      
      // 更新进度
      cy.get('.progress-slider').invoke('val', 75).trigger('change');
      cy.get('button').contains('更新进度').click();
      cy.contains('75%').should('be.visible');
      
      // 完成任务
      cy.get('.complete-button').click();
      cy.contains('已完成').should('be.visible');
    });
  });

  describe('运输管理模块测试', () => {
    beforeEach(() => {
      cy.login(testData.admin.username, testData.admin.password);
    });

    it('TC012: 运输记录创建', () => {
      cy.visit('/delivery/delivery-records');
      
      cy.get('button').contains('新建运输记录').click();
      
      // 填写运输信息
      cy.get('input[name="shipment_number"]').type('SHIP-TEST-001');
      cy.get('.forwarder-select').click();
      cy.contains('顺丰国际物流').click();
      cy.get('input[name="channel"]').type('空运FBA专线');
      cy.get('input[name="destination"]').type('美国亚马逊FBA仓库');
      cy.get('input[name="fba_shipment_code"]').type('FBA123456789');
      
      // 添加产品
      cy.get('.add-product-button').click();
      cy.get('.product-select').click();
      cy.contains(testData.product.name).click();
      cy.get('input[name="quantity"]').type('100');
      cy.get('button').contains('确定').click();
      
      // 提交
      cy.get('button[type="submit"]').click();
      cy.contains('创建成功').should('be.visible');
    });
  });

  describe('响应式设计测试', () => {
    const viewports = [
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 667 }
    ];

    viewports.forEach(viewport => {
      it(`TC013: ${viewport.name}端响应式测试`, () => {
        cy.viewport(viewport.width, viewport.height);
        cy.login(testData.admin.username, testData.admin.password);
        
        // 测试产品列表页面
        cy.visit('/products/products');
        cy.wait('@getProducts');
        
        // 验证表格显示
        if (viewport.name === 'mobile') {
          cy.get('.mobile-table').should('be.visible');
        } else {
          cy.get('.ant-table').should('be.visible');
        }
        
        // 验证搜索功能
        cy.get('input[placeholder="搜索产品"]').should('be.visible');
        
        // 验证按钮可点击
        cy.get('button').contains('新建产品').should('be.visible').click();
        cy.get('.ant-modal').should('be.visible');
      });
    });
  });

  describe('权限控制测试', () => {
    it('TC014: 角色权限验证', () => {
      // 测试仓库管理员权限
      cy.login(testData.warehouseAdmin.username, testData.warehouseAdmin.password);
      
      // 验证可见菜单
      cy.get('.menu-item').contains('库存管理').should('be.visible');
      cy.get('.menu-item').contains('包装任务').should('be.visible');
      
      // 验证不可见菜单
      cy.get('.menu-item').contains('采购管理').should('not.exist');
      cy.get('.menu-item').contains('财务管理').should('not.exist');
      
      // 测试越权访问
      cy.visit('/purchase/purchase-orders', { failOnStatusCode: false });
      cy.contains('403').should('be.visible');
    });
  });

  describe('表单验证测试', () => {
    beforeEach(() => {
      cy.login(testData.admin.username, testData.admin.password);
    });

    it('TC015: 产品创建表单验证', () => {
      cy.visit('/products/products');
      cy.get('button').contains('新建产品').click();
      
      // 提交空表单
      cy.get('button[type="submit"]').click();
      
      // 验证必填字段提示
      cy.contains('请输入产品名称').should('be.visible');
      cy.contains('请输入产品代码').should('be.visible');
      cy.contains('请输入SKU').should('be.visible');
      
      // 验证数字字段
      cy.get('input[name="weight"]').type('abc');
      cy.contains('请输入数字').should('be.visible');
      
      // 验证长度限制
      cy.get('input[name="name"]').type('a'.repeat(100));
      cy.contains('最多50个字符').should('be.visible');
    });
  });

  describe('性能测试', () => {
    it('TC016: 大数据量加载性能', () => {
      cy.login(testData.admin.username, testData.admin.password);
      
      // 测试产品列表加载
      cy.visit('/products/products');
      cy.wait('@getProducts').then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
        expect(interception.duration).to.be.lessThan(3000);
      });
      
      // 测试搜索响应
      cy.get('input[placeholder="搜索产品"]').type('iPhone');
      cy.get('.search-button').click();
      cy.get('.ant-table-row').should('have.length.greaterThan', 0);
    });
  });

  describe('错误处理测试', () => {
    beforeEach(() => {
      cy.login(testData.admin.username, testData.admin.password);
    });

    it('TC017: 网络错误处理', () => {
      // 模拟网络错误
      cy.intercept('GET', '/api/v1/products', { forceNetworkError: true }).as('networkError');
      
      cy.visit('/products/products');
      cy.wait('@networkError');
      
      cy.contains('网络错误').should('be.visible');
      cy.get('.retry-button').should('be.visible').click();
    });

    it('TC018: 服务器错误处理', () => {
      // 模拟500错误
      cy.intercept('GET', '/api/v1/products', {
        statusCode: 500,
        body: { message: '服务器内部错误' }
      }).as('serverError');
      
      cy.visit('/products/products');
      cy.wait('@serverError');
      
      cy.contains('服务器错误').should('be.visible');
      cy.get('.back-button').should('be.visible');
    });
  });

  describe('端到端业务流程测试', () => {
    it('TC019: 完整业务流程测试', () => {
      cy.login(testData.admin.username, testData.admin.password);
      
      // 1. 创建产品
      cy.visit('/products/products');
      cy.get('button').contains('新建产品').click();
      cy.get('input[name="name"]').type('完整流程测试产品');
      cy.get('input[name="code"]').type('E2E-TEST-001');
      cy.get('input[name="sku"]').type('E2E-SKU-001');
      cy.get('.product-category-select').click();
      cy.contains('智能手机').click();
      cy.get('.shop-select').click();
      cy.contains('智能科技旗舰店').click();
      cy.get('button[type="submit"]').click();
      cy.wait('@createProduct');
      
      // 2. 创建库存
      cy.visit('/inventory/finished-inventory');
      cy.get('button').contains('新建库存').click();
      cy.get('.product-select').click();
      cy.contains('完整流程测试产品').click();
      cy.get('input[name="quantity"]').type('100');
      cy.get('input[name="location"]').type('E2E测试位置');
      cy.get('button[type="submit"]').click();
      cy.wait('@createInventory');
      
      // 3. 创建采购订单
      cy.visit('/purchase/purchase-orders');
      cy.get('button').contains('新建采购订单').click();
      cy.get('.supplier-select').click();
      cy.contains('深圳华强北电子有限公司').click();
      cy.get('.shop-select').click();
      cy.contains('智能科技旗舰店').click();
      cy.get('.add-product-button').click();
      cy.get('.product-select').click();
      cy.contains('完整流程测试产品').click();
      cy.get('input[name="quantity"]').type('50');
      cy.get('input[name="unit_price"]').type('5000');
      cy.get('button').contains('确定').click();
      cy.get('button[type="submit"]').click();
      cy.wait('@createPurchaseOrder');
      
      // 4. 验证流程完整性
      cy.contains('创建成功').should('be.visible');
      cy.visit('/dashboard');
      cy.contains('完整流程测试产品').should('be.visible');
    });
  });
});

// 自定义命令
Cypress.Commands.add('login', (username, password) => {
  cy.session([username, password], () => {
    cy.visit('/login');
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});

// 测试配置
Cypress.config('defaultCommandTimeout', 10000);
Cypress.config('requestTimeout', 10000);
Cypress.config('responseTimeout', 10000);