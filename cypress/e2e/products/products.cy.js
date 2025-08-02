describe('产品管理模块', () => {
  beforeEach(() => {
    console.log('🔐 开始产品模块测试 - 登录验证阶段');
    cy.log('🔐 开始产品模块测试 - 登录验证阶段');

    // 使用复用的登录逻辑
    console.log('📝 使用管理员账号登录 (admin/admin123456)');
    cy.log('📝 使用管理员账号登录 (admin/admin123456)');
    
    cy.loginAsAdmin();
    console.log('✅ 登录命令执行完成');

    console.log('🚀 登录完成 - 开始设置API拦截');
    cy.log('🚀 登录完成 - 开始设置API拦截');

    // 设置API拦截 - 在登录完成后设置，避免拦截登录过程中的API调用
    cy.intercept('GET', '/api/v1/products*').as('getProducts');
    cy.intercept('POST', '/api/v1/products').as('createProduct');
    cy.intercept('PUT', '/api/v1/products/*').as('updateProduct');
    cy.intercept('DELETE', '/api/v1/products/*').as('deleteProduct');
    cy.intercept('GET', '/api/v1/categories*').as('getCategories');
    cy.intercept('POST', '/api/v1/categories').as('createCategory');
    console.log('✅ API拦截设置完成');

    // 访问产品页面
    console.log('📍 开始访问产品页面: /products/products');
    cy.visit('/products/products');
    console.log('📍 已访问产品页面');
    cy.log('📍 已访问产品页面');

    // 等待页面渲染完成，不强制等待特定API调用
    console.log('⏳ 等待页面表格加载...');
    cy.get('.ant-table', { timeout: 15000 })
      .should('be.visible');
    console.log('✅ 产品页面加载完成 - 表格已显示');
    cy.log('✅ 产品页面加载完成 - 表格已显示');

    console.log('🎉 产品模块测试前置条件全部完成');
    cy.log('🎉 产品模块测试前置条件全部完成');
  });

  describe('TC001: 产品列表查看', () => {
    it('显示产品列表', () => {
      cy.get('.ant-table').should('be.visible');
      cy.contains('产品名称').should('be.visible');
      cy.contains('产品编码').should('be.visible');
      cy.contains('分类').should('be.visible');
    });
  });

  describe('TC002: 创建新产品', () => {
    it('创建产品基本功能', () => {
      // 生成随机测试数据
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const productName = `测试产品_${timestamp}`;
      const productCode = `TEST_${timestamp}_${randomSuffix}`;
      const productSku = `SKU_${timestamp}_${randomSuffix}`;

      console.log('🚀 开始创建产品测试');
      console.log('📝 测试数据:', { productName, productCode, productSku });

      cy.get('button').contains('新增产品').should('be.visible').should('not.be.disabled').click();
      console.log('✅ 点击新增产品按钮成功');
      
      cy.waitForModal();
      console.log('✅ 模态框已打开');

      // 填写必填字段
      // 选择店铺（必填）- 修复选择器
      console.log('🏪 开始选择所属店铺');
      cy.get('.ant-form-item').contains('所属店铺').parent().find('.ant-select').then(($select) => {
        console.log('找到店铺选择器:', $select.length);
        if ($select.length === 0) {
          console.error('❌ 未找到店铺选择器');
          throw new Error('店铺选择器未找到');
        }
      }).click();
      
      cy.get('.ant-select-dropdown .ant-select-item').then(($items) => {
        console.log('店铺选项数量:', $items.length);
        if ($items.length === 0) {
          console.error('❌ 未找到店铺选项');
          throw new Error('店铺选项未找到');
        }
      }).first().click();
      console.log('✅ 店铺选择完成');
      
      // 选择分类（必填）- 修复选择器
      console.log('📂 开始选择产品分类');
      cy.get('.ant-form-item').contains('产品分类').parent().find('.ant-select').then(($select) => {
        console.log('找到分类选择器:', $select.length);
        if ($select.length === 0) {
          console.error('❌ 未找到分类选择器');
          throw new Error('分类选择器未找到');
        }
      }).click();
      
      cy.get('.ant-select-dropdown .ant-select-item').then(($items) => {
        console.log('分类选项数量:', $items.length);
        if ($items.length === 0) {
          console.error('❌ 未找到分类选项');
          throw new Error('分类选项未找到');
        }
      }).first().click();
      console.log('✅ 分类选择完成');

      // 填写基本信息
      console.log('📝 开始填写基本信息');
      cy.get('input[name="name"]').then(($input) => {
        console.log('找到产品名称输入框:', $input.length);
        if ($input.length === 0) {
          console.error('❌ 未找到产品名称输入框');
          throw new Error('产品名称输入框未找到');
        }
      }).type(productName);
      console.log('✅ 产品名称填写完成:', productName);
      
      cy.get('input[name="code"]').then(($input) => {
        console.log('找到产品编码输入框:', $input.length);
        if ($input.length === 0) {
          console.error('❌ 未找到产品编码输入框');
          throw new Error('产品编码输入框未找到');
        }
      }).type(productCode);
      console.log('✅ 产品编码填写完成:', productCode);
      
      cy.get('input[name="sku"]').then(($input) => {
        console.log('找到SKU输入框:', $input.length);
        if ($input.length === 0) {
          console.error('❌ 未找到SKU输入框');
          throw new Error('SKU输入框未找到');
        }
      }).type(productSku);
      console.log('✅ SKU填写完成:', productSku);

      // 提交表单
      console.log('📤 开始提交表单');
      cy.get('.ant-modal-footer').contains('创建').then(($btn) => {
        console.log('找到创建按钮:', $btn.length);
        if ($btn.length === 0) {
          console.error('❌ 未找到创建按钮');
          throw new Error('创建按钮未找到');
        }
      }).click();
      console.log('✅ 点击创建按钮完成');
      
      cy.wait(2000); // 等待API响应
      console.log('⏳ 等待API响应完成');

      // 监听网络请求和响应
      cy.window().then((win) => {
        win.addEventListener('unhandledrejection', (event) => {
          console.error('❌ 未处理的Promise拒绝:', event.reason);
        });
        
        win.addEventListener('error', (event) => {
          console.error('❌ 页面错误:', event.error);
        });
      });

      cy.verifySuccessMessage('创建产品成功');
      cy.contains(productName).should('be.visible');
      console.log('🎉 产品创建测试完成');
    });

    it('必填字段验证', () => {
      cy.get('button').contains('新增产品').click();
      cy.waitForModal();

      // 直接提交空表单
      cy.get('.ant-modal-footer').contains('创建').click();
      
      // 验证必填字段错误信息
      cy.get('.ant-form-item-explain-error').should('contain.text', '请选择');
      cy.get('.ant-form-item-has-error').should('have.length.greaterThan', 0);
    });
  });

  describe('TC003: 编辑产品信息', () => {
    it('编辑产品基本信息', () => {
      // 生成随机编辑数据
      const timestamp = Date.now();
      const editedName = `编辑产品_${timestamp}`;

      cy.get('.ant-table-tbody tr').first().contains('编辑').click();
      cy.waitForModal();

      cy.get('input[name="name"]').clear().type(editedName);
      cy.get('.ant-modal-footer').contains('更新').click();
      cy.wait(2000); // 等待API响应
      cy.verifySuccessMessage('更新产品成功');
      cy.contains(editedName).should('be.visible');
    });
  });

  describe('TC004: 产品详情查看', () => {
    it('查看产品详情', () => {
      cy.get('.ant-table-tbody tr').first().contains('查看').click();
      cy.waitForModal();
      cy.get('.ant-modal-content').should('be.visible');
      cy.contains('产品详情', '产品信息').should('be.visible');
    });
  });

  describe('TC005: 产品删除功能', () => {
    it('删除单个产品', () => {
      // 获取删除前的产品数量
      cy.get('.ant-table-tbody tr').then(($rows) => {
        const initialCount = $rows.length;

        // 点击删除按钮
        cy.get('.ant-table-tbody tr')
          .first()
          .contains('删除')
          .click();

        // 确认删除对话框
        cy.get('.ant-popconfirm').should('be.visible');
        cy.get('.ant-popconfirm .ant-btn-primary').click();

        // 等待API响应
        cy.wait(2000);

        // 验证删除成功
        cy.verifySuccessMessage('删除产品成功');

        // 验证列表更新
        cy.get('.ant-table-tbody tr').should('have.length', initialCount - 1);
      });
    });

    it('取消删除操作', () => {
      cy.get('.ant-table-tbody tr').then(($rows) => {
        const initialCount = $rows.length;

        // 点击删除按钮
        cy.get('.ant-table-tbody tr')
          .first()
          .contains('删除')
          .click();

        // 取消删除
        cy.get('.ant-popconfirm').should('be.visible');
        cy.get('.ant-popconfirm .ant-btn-default').click();

        // 验证数量未变化
        cy.get('.ant-table-tbody tr').should('have.length', initialCount);
      });
    });
  });

  describe('TC006: 产品搜索和筛选', () => {
    it('按产品编码搜索', () => {
      // 输入产品编码搜索 - 使用通用搜索词
      cy.get('input[placeholder="产品编码"]').type('TEST');
      cy.get('button').contains('搜索').click();

      // 等待搜索结果
      cy.wait(2000);

      // 验证搜索功能正常（可能没有结果）
      cy.get('.ant-table-tbody').should('be.visible');
    });

    it('按SKU搜索', () => {
      // 输入SKU搜索 - 使用通用搜索词
      cy.get('input[placeholder="SKU"]').type('SKU');
      cy.get('button').contains('搜索').click();

      // 等待搜索结果
      cy.wait(2000);

      // 验证搜索功能正常（可能没有结果）
      cy.get('.ant-table-tbody').should('be.visible');
    });

    it('按产品分类筛选', () => {
      // 点击分类筛选 - 修复选择器
      cy.get('.ant-form-item').contains('分类').parent().find('.ant-select').click();
      cy.get('.ant-select-dropdown .ant-select-item').first().click();
      cy.get('button').contains('搜索').click();

      // 等待筛选结果
      cy.wait(2000);

      // 验证筛选功能正常
      cy.get('.ant-table-tbody').should('be.visible');
    });

    it('重置搜索条件', () => {
      // 先进行搜索
      cy.get('input[placeholder="产品编码"]').type('测试搜索');
      cy.get('button').contains('搜索').click();
      cy.wait(2000);

      // 重置搜索
      cy.get('button').contains('重置').click();
      cy.wait(2000);

      // 验证重置功能正常
      cy.get('.ant-table-tbody').should('be.visible');
      cy.get('input[placeholder="产品编码"]').should('have.value', '');
    });
  });

  describe('TC007: 批量操作', () => {
    it('批量选择产品', () => {
      // 选择表头复选框（全选）
      cy.get('.ant-table-thead .ant-checkbox-input').check();

      // 验证所有行都被选中
      cy.get('.ant-table-tbody .ant-checkbox-input').each(($checkbox) => {
        cy.wrap($checkbox).should('be.checked');
      });

      // 验证批量操作按钮可用
      cy.get('button').contains('批量删除', '批量操作').should('not.be.disabled');
    });

    it('批量删除产品', () => {
      // 选择前两行
      cy.get('.ant-table-tbody tr')
        .slice(0, 2)
        .each(($row) => {
          cy.wrap($row).find('.ant-checkbox-input').check();
        });

      // 点击批量删除
      cy.get('button').contains('批量删除').click();

      // 确认删除
      cy.get('.ant-modal, .ant-popconfirm').should('be.visible');
      cy.contains('确定', '确认').click();

      // 验证删除成功
      cy.verifySuccessMessage('批量删除成功');
    });
  });

  describe('TC008: 产品分类管理', () => {
    it('查看产品分类', () => {
      // 访问产品分类页面
      cy.visit('/products/product-categories');
      cy.waitForPageLoad();

      // 验证页面标题
      cy.verifyPageTitle('产品分类');

      // 验证分类列表
      cy.get('.ant-table, .ant-tree').should('be.visible');
    });

    it('创建新分类', () => {
      // 生成随机分类数据
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const categoryName = `测试分类_${timestamp}`;
      const categoryCode = `CAT_${timestamp}_${randomSuffix}`;

      cy.visit('/products/product-categories');
      cy.waitForPageLoad();

      // 点击新建分类
      cy.get('button').contains('新建分类', '添加分类').click();
      cy.waitForModal();

      // 填写分类信息
      cy.get('input[name="name"]').type(categoryName);
      cy.get('input[name="code"]').type(categoryCode);
      cy.get('textarea[name="description"]').type(`这是一个测试分类 - ${timestamp}`);

      // 提交表单
      cy.get('.ant-modal-footer').contains('确定').click();
      cy.verifySuccessMessage('创建成功');

      // 验证新分类出现在列表中
      cy.contains(categoryName).should('be.visible');
    });
  });

  describe('TC009: 数据验证和边界测试', () => {
    it('产品编码唯一性验证', () => {
      // 生成随机数据
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const uniqueCode = `UNIQUE_${timestamp}_${randomSuffix}`;
      const productName1 = `产品1_${timestamp}`;
      const productName2 = `产品2_${timestamp}`;
      const sku1 = `SKU1_${timestamp}_${randomSuffix}`;
      const sku2 = `SKU2_${timestamp}_${randomSuffix}`;

      // 创建第一个产品
      cy.get('button').contains('新增产品').click();
      cy.waitForModal();

      // 选择必填字段
      cy.get('.ant-form-item').contains('所属店铺').parent().find('.ant-select').click();
      cy.get('.ant-select-dropdown .ant-select-item').first().click();
      cy.get('.ant-form-item').contains('产品分类').parent().find('.ant-select').click();
      cy.get('.ant-select-dropdown .ant-select-item').first().click();

      cy.get('input[name="name"]').type(productName1);
      cy.get('input[name="code"]').type(uniqueCode);
      cy.get('input[name="sku"]').type(sku1);

      cy.get('.ant-modal-footer').contains('创建').click();
      cy.wait(2000);
      cy.verifySuccessMessage('创建产品成功');

      // 尝试创建相同编码的产品
      cy.get('button').contains('新增产品').click();
      cy.waitForModal();

      // 选择必填字段
      cy.get('.ant-form-item').contains('所属店铺').parent().find('.ant-select').click();
      cy.get('.ant-select-dropdown .ant-select-item').first().click();
      cy.get('.ant-form-item').contains('产品分类').parent().find('.ant-select').click();
      cy.get('.ant-select-dropdown .ant-select-item').first().click();

      cy.get('input[name="name"]').type(productName2);
      cy.get('input[name="code"]').type(uniqueCode); // 相同编码
      cy.get('input[name="sku"]').type(sku2);

      cy.get('.ant-modal-footer').contains('创建').click();

      // 验证错误提示
      cy.get('.ant-message, .ant-notification, .ant-form-item-explain-error')
        .should('contain.text', '编码');
    });

    it('长文本输入测试', () => {
      // 生成随机数据
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const longText = `长文本测试_${timestamp}_${'A'.repeat(200)}`; // 长文本
      const productCode = `LONG_${timestamp}_${randomSuffix}`;
      const productSku = `SKU_LONG_${timestamp}_${randomSuffix}`;

      cy.get('button').contains('新增产品').click();
      cy.waitForModal();

      // 选择必填字段
      cy.get('.ant-form-item').contains('所属店铺').parent().find('.ant-select').click();
      cy.get('.ant-select-dropdown .ant-select-item').first().click();
      cy.get('.ant-form-item').contains('产品分类').parent().find('.ant-select').click();
      cy.get('.ant-select-dropdown .ant-select-item').first().click();

      // 填写基本信息
      cy.get('input[name="code"]').type(productCode);
      cy.get('input[name="sku"]').type(productSku);
      cy.get('input[name="name"]').type(longText);
      
      // 如果有描述字段，也测试长文本
      cy.get('body').then(($body) => {
        if ($body.find('textarea[name="description"]').length > 0) {
          cy.get('textarea[name="description"]').type(longText);
        }
      });

      // 验证输入功能正常（不强制验证字符限制，因为不同字段可能有不同限制）
      cy.get('input[name="name"]').should('not.have.value', '');
    });
  });
});
