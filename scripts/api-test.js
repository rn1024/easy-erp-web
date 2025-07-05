const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// 测试配置
const testConfig = {
  timeout: 10000,
  maxRetries: 3,
};

// 测试数据
const testData = {
  login: {
    username: 'admin',
    password: 'admin123',
  },
  role: {
    name: '测试角色',
    description: '测试角色描述',
    permissions: ['READ_USER', 'WRITE_USER'],
  },
  shop: {
    name: '测试店铺',
    description: '测试店铺描述',
    address: '测试地址',
    contactPhone: '13800138000',
  },
  supplier: {
    name: '测试供应商',
    contactPerson: '张三',
    phone: '13800138001',
    email: 'test@supplier.com',
    address: '供应商地址',
  },
  forwarding: {
    name: '测试货代',
    contactPerson: '李四',
    phone: '13800138002',
    email: 'test@forwarding.com',
    address: '货代地址',
  },
  productCategory: {
    name: '测试产品分类',
    code: 'TEST_CAT_001',
  },
  product: {
    name: '测试产品',
    code: 'TEST_PROD_001',
    specification: '测试规格',
    unit: '个',
    purchasePrice: 100.0,
    salePrice: 150.0,
  },
  purchaseOrder: {
    orderNumber: 'PO' + Date.now(),
    totalAmount: 1000.0,
    status: 'PENDING',
    notes: '测试采购订单',
  },
  warehouseTask: {
    taskNumber: 'WT' + Date.now(),
    type: 'INBOUND',
    status: 'PENDING',
    notes: '测试仓库任务',
  },
  deliveryRecord: {
    trackingNumber: 'TR' + Date.now(),
    totalBoxes: 5,
    status: 'PENDING',
    fbaShipmentCode: 'FBA001',
    country: 'US',
    channel: 'AIR',
  },
  finishedInventory: {
    quantity: 100,
    reservedQuantity: 10,
    availableQuantity: 90,
    location: 'A-01-001',
  },
  spareInventory: {
    quantity: 50,
    reservedQuantity: 5,
    availableQuantity: 45,
    location: 'B-01-001',
  },
};

// 全局变量存储认证token和创建的资源ID
let authToken = '';
let createdResources = {};

// HTTP客户端配置
const httpClient = axios.create({
  baseURL: BASE_URL,
  timeout: testConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器添加认证头
httpClient.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器处理错误
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(`请求失败: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.error(`状态码: ${error.response?.status}`);
    console.error(`错误信息: ${error.response?.data?.message || error.message}`);
    return Promise.reject(error);
  }
);

// 工具函数
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retry = async (fn, retries = testConfig.maxRetries) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.log(`重试中... 剩余次数: ${retries}`);
      await delay(1000);
      return retry(fn, retries - 1);
    }
    throw error;
  }
};

// 测试用例类
class APITest {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.results = [];
  }

  async run(testFn) {
    console.log(`\n🧪 开始测试: ${this.name}`);
    console.log(`📝 描述: ${this.description}`);

    try {
      await testFn();
      console.log(`✅ 测试通过: ${this.name}`);
      this.results.push({ status: 'PASS', message: '测试通过' });
    } catch (error) {
      console.log(`❌ 测试失败: ${this.name}`);
      console.log(`错误信息: ${error.message}`);
      this.results.push({ status: 'FAIL', message: error.message });
      throw error;
    }
  }
}

// 认证相关测试
const authTests = async () => {
  const test = new APITest('身份验证', '测试登录和token验证功能');

  await test.run(async () => {
    // 测试登录
    console.log('正在测试登录...');
    const loginResponse = await httpClient.post('/auth/login', testData.login);

    if (!loginResponse.data.token) {
      throw new Error('登录响应中缺少token');
    }

    authToken = loginResponse.data.token;
    console.log('✓ 登录成功，获得token');

    // 测试获取当前用户信息
    console.log('正在测试获取用户信息...');
    const meResponse = await httpClient.get('/me');

    if (!meResponse.data.id) {
      throw new Error('用户信息响应格式错误');
    }

    console.log('✓ 成功获取用户信息');
  });
};

// 角色管理测试
const roleTests = async () => {
  const test = new APITest('角色管理', '测试角色的增删改查功能');

  await test.run(async () => {
    // 创建角色
    console.log('正在测试创建角色...');
    const createResponse = await httpClient.post('/roles', testData.role);
    const roleId = createResponse.data.id;
    createdResources.roleId = roleId;
    console.log('✓ 成功创建角色，ID:', roleId);

    // 获取角色列表
    console.log('正在测试获取角色列表...');
    const listResponse = await httpClient.get('/roles');
    if (!Array.isArray(listResponse.data.data)) {
      throw new Error('角色列表响应格式错误');
    }
    console.log('✓ 成功获取角色列表');

    // 获取单个角色
    console.log('正在测试获取单个角色...');
    const getResponse = await httpClient.get(`/roles/${roleId}`);
    if (getResponse.data.id !== roleId) {
      throw new Error('获取的角色ID不匹配');
    }
    console.log('✓ 成功获取单个角色');

    // 更新角色
    console.log('正在测试更新角色...');
    const updateData = { ...testData.role, name: '更新后的角色' };
    await httpClient.put(`/roles/${roleId}`, updateData);
    console.log('✓ 成功更新角色');
  });
};

// 店铺管理测试
const shopTests = async () => {
  const test = new APITest('店铺管理', '测试店铺的增删改查功能');

  await test.run(async () => {
    // 创建店铺
    console.log('正在测试创建店铺...');
    const createResponse = await httpClient.post('/shops', testData.shop);
    const shopId = createResponse.data.id;
    createdResources.shopId = shopId;
    console.log('✓ 成功创建店铺，ID:', shopId);

    // 获取店铺列表
    console.log('正在测试获取店铺列表...');
    const listResponse = await httpClient.get('/shops');
    if (!Array.isArray(listResponse.data.data)) {
      throw new Error('店铺列表响应格式错误');
    }
    console.log('✓ 成功获取店铺列表');

    // 获取单个店铺
    console.log('正在测试获取单个店铺...');
    const getResponse = await httpClient.get(`/shops/${shopId}`);
    if (getResponse.data.id !== shopId) {
      throw new Error('获取的店铺ID不匹配');
    }
    console.log('✓ 成功获取单个店铺');

    // 更新店铺
    console.log('正在测试更新店铺...');
    const updateData = { ...testData.shop, name: '更新后的店铺' };
    await httpClient.put(`/shops/${shopId}`, updateData);
    console.log('✓ 成功更新店铺');
  });
};

// 供应商管理测试
const supplierTests = async () => {
  const test = new APITest('供应商管理', '测试供应商的增删改查功能');

  await test.run(async () => {
    // 创建供应商
    console.log('正在测试创建供应商...');
    const createResponse = await httpClient.post('/suppliers', testData.supplier);
    const supplierId = createResponse.data.id;
    createdResources.supplierId = supplierId;
    console.log('✓ 成功创建供应商，ID:', supplierId);

    // 获取供应商列表
    console.log('正在测试获取供应商列表...');
    const listResponse = await httpClient.get('/suppliers');
    if (!Array.isArray(listResponse.data.data)) {
      throw new Error('供应商列表响应格式错误');
    }
    console.log('✓ 成功获取供应商列表');

    // 获取单个供应商
    console.log('正在测试获取单个供应商...');
    const getResponse = await httpClient.get(`/suppliers/${supplierId}`);
    if (getResponse.data.id !== supplierId) {
      throw new Error('获取的供应商ID不匹配');
    }
    console.log('✓ 成功获取单个供应商');

    // 更新供应商
    console.log('正在测试更新供应商...');
    const updateData = { ...testData.supplier, name: '更新后的供应商' };
    await httpClient.put(`/suppliers/${supplierId}`, updateData);
    console.log('✓ 成功更新供应商');
  });
};

// 货代管理测试
const forwardingTests = async () => {
  const test = new APITest('货代管理', '测试货代的增删改查功能');

  await test.run(async () => {
    // 创建货代
    console.log('正在测试创建货代...');
    const createResponse = await httpClient.post('/forwarding-agents', testData.forwarding);
    const forwardingId = createResponse.data.id;
    createdResources.forwardingId = forwardingId;
    console.log('✓ 成功创建货代，ID:', forwardingId);

    // 获取货代列表
    console.log('正在测试获取货代列表...');
    const listResponse = await httpClient.get('/forwarding-agents');
    if (!Array.isArray(listResponse.data.data)) {
      throw new Error('货代列表响应格式错误');
    }
    console.log('✓ 成功获取货代列表');

    // 获取单个货代
    console.log('正在测试获取单个货代...');
    const getResponse = await httpClient.get(`/forwarding-agents/${forwardingId}`);
    if (getResponse.data.id !== forwardingId) {
      throw new Error('获取的货代ID不匹配');
    }
    console.log('✓ 成功获取单个货代');

    // 更新货代
    console.log('正在测试更新货代...');
    const updateData = { ...testData.forwarding, name: '更新后的货代' };
    await httpClient.put(`/forwarding-agents/${forwardingId}`, updateData);
    console.log('✓ 成功更新货代');
  });
};

// 产品分类测试
const productCategoryTests = async () => {
  const test = new APITest('产品分类管理', '测试产品分类的增删改查功能');

  await test.run(async () => {
    // 创建产品分类
    console.log('正在测试创建产品分类...');
    const createResponse = await httpClient.post('/product-categories', testData.productCategory);
    const categoryId = createResponse.data.id;
    createdResources.categoryId = categoryId;
    console.log('✓ 成功创建产品分类，ID:', categoryId);

    // 获取产品分类列表
    console.log('正在测试获取产品分类列表...');
    const listResponse = await httpClient.get('/product-categories');
    if (!Array.isArray(listResponse.data.data)) {
      throw new Error('产品分类列表响应格式错误');
    }
    console.log('✓ 成功获取产品分类列表');

    // 获取单个产品分类
    console.log('正在测试获取单个产品分类...');
    const getResponse = await httpClient.get(`/product-categories/${categoryId}`);
    if (getResponse.data.id !== categoryId) {
      throw new Error('获取的产品分类ID不匹配');
    }
    console.log('✓ 成功获取单个产品分类');

    // 更新产品分类
    console.log('正在测试更新产品分类...');
    const updateData = { ...testData.productCategory, name: '更新后的分类' };
    await httpClient.put(`/product-categories/${categoryId}`, updateData);
    console.log('✓ 成功更新产品分类');
  });
};

// 产品管理测试
const productTests = async () => {
  const test = new APITest('产品管理', '测试产品的增删改查功能');

  await test.run(async () => {
    // 创建产品
    console.log('正在测试创建产品...');
    const productData = {
      ...testData.product,
      categoryId: createdResources.categoryId,
      supplierId: createdResources.supplierId,
    };
    const createResponse = await httpClient.post('/products', productData);
    const productId = createResponse.data.id;
    createdResources.productId = productId;
    console.log('✓ 成功创建产品，ID:', productId);

    // 获取产品列表
    console.log('正在测试获取产品列表...');
    const listResponse = await httpClient.get('/products');
    if (!Array.isArray(listResponse.data.data)) {
      throw new Error('产品列表响应格式错误');
    }
    console.log('✓ 成功获取产品列表');

    // 获取单个产品
    console.log('正在测试获取单个产品...');
    const getResponse = await httpClient.get(`/products/${productId}`);
    if (getResponse.data.id !== productId) {
      throw new Error('获取的产品ID不匹配');
    }
    console.log('✓ 成功获取单个产品');

    // 更新产品
    console.log('正在测试更新产品...');
    const updateData = { ...productData, name: '更新后的产品' };
    await httpClient.put(`/products/${productId}`, updateData);
    console.log('✓ 成功更新产品');
  });
};

// 采购订单测试
const purchaseOrderTests = async () => {
  const test = new APITest('采购订单管理', '测试采购订单的增删改查功能');

  await test.run(async () => {
    // 创建采购订单
    console.log('正在测试创建采购订单...');
    const orderData = {
      ...testData.purchaseOrder,
      supplierId: createdResources.supplierId,
    };
    const createResponse = await httpClient.post('/purchase-orders', orderData);
    const orderId = createResponse.data.id;
    createdResources.orderId = orderId;
    console.log('✓ 成功创建采购订单，ID:', orderId);

    // 获取采购订单列表
    console.log('正在测试获取采购订单列表...');
    const listResponse = await httpClient.get('/purchase-orders');
    if (!Array.isArray(listResponse.data.data)) {
      throw new Error('采购订单列表响应格式错误');
    }
    console.log('✓ 成功获取采购订单列表');

    // 获取单个采购订单
    console.log('正在测试获取单个采购订单...');
    const getResponse = await httpClient.get(`/purchase-orders/${orderId}`);
    if (getResponse.data.id !== orderId) {
      throw new Error('获取的采购订单ID不匹配');
    }
    console.log('✓ 成功获取单个采购订单');

    // 更新采购订单
    console.log('正在测试更新采购订单...');
    const updateData = { ...orderData, status: 'CONFIRMED' };
    await httpClient.put(`/purchase-orders/${orderId}`, updateData);
    console.log('✓ 成功更新采购订单');
  });
};

// 仓库任务测试
const warehouseTaskTests = async () => {
  const test = new APITest('仓库任务管理', '测试仓库任务的增删改查功能');

  await test.run(async () => {
    // 创建仓库任务
    console.log('正在测试创建仓库任务...');
    const createResponse = await httpClient.post('/warehouse-tasks', testData.warehouseTask);
    const taskId = createResponse.data.id;
    createdResources.taskId = taskId;
    console.log('✓ 成功创建仓库任务，ID:', taskId);

    // 获取仓库任务列表
    console.log('正在测试获取仓库任务列表...');
    const listResponse = await httpClient.get('/warehouse-tasks');
    if (!Array.isArray(listResponse.data.data)) {
      throw new Error('仓库任务列表响应格式错误');
    }
    console.log('✓ 成功获取仓库任务列表');

    // 获取单个仓库任务
    console.log('正在测试获取单个仓库任务...');
    const getResponse = await httpClient.get(`/warehouse-tasks/${taskId}`);
    if (getResponse.data.id !== taskId) {
      throw new Error('获取的仓库任务ID不匹配');
    }
    console.log('✓ 成功获取单个仓库任务');

    // 更新仓库任务
    console.log('正在测试更新仓库任务...');
    const updateData = { ...testData.warehouseTask, status: 'IN_PROGRESS' };
    await httpClient.put(`/warehouse-tasks/${taskId}`, updateData);
    console.log('✓ 成功更新仓库任务');
  });
};

// 发货记录测试
const deliveryRecordTests = async () => {
  const test = new APITest('发货记录管理', '测试发货记录的增删改查功能');

  await test.run(async () => {
    // 创建发货记录
    console.log('正在测试创建发货记录...');
    const deliveryData = {
      ...testData.deliveryRecord,
      shopId: createdResources.shopId,
    };
    const createResponse = await httpClient.post('/delivery-records', deliveryData);
    const deliveryId = createResponse.data.id;
    createdResources.deliveryId = deliveryId;
    console.log('✓ 成功创建发货记录，ID:', deliveryId);

    // 获取发货记录列表
    console.log('正在测试获取发货记录列表...');
    const listResponse = await httpClient.get('/delivery-records');
    if (!Array.isArray(listResponse.data.data)) {
      throw new Error('发货记录列表响应格式错误');
    }
    console.log('✓ 成功获取发货记录列表');

    // 获取单个发货记录
    console.log('正在测试获取单个发货记录...');
    const getResponse = await httpClient.get(`/delivery-records/${deliveryId}`);
    if (getResponse.data.id !== deliveryId) {
      throw new Error('获取的发货记录ID不匹配');
    }
    console.log('✓ 成功获取单个发货记录');

    // 更新发货记录
    console.log('正在测试更新发货记录...');
    const updateData = { ...deliveryData, status: 'SHIPPED' };
    await httpClient.put(`/delivery-records/${deliveryId}`, updateData);
    console.log('✓ 成功更新发货记录');
  });
};

// 库存管理测试
const inventoryTests = async () => {
  const test1 = new APITest('成品库存管理', '测试成品库存的增删改查功能');

  await test1.run(async () => {
    // 创建成品库存
    console.log('正在测试创建成品库存...');
    const finishedData = {
      ...testData.finishedInventory,
      productId: createdResources.productId,
      shopId: createdResources.shopId,
    };
    const createResponse = await httpClient.post('/finished-inventory', finishedData);
    const finishedId = createResponse.data.id;
    createdResources.finishedId = finishedId;
    console.log('✓ 成功创建成品库存，ID:', finishedId);

    // 获取成品库存列表
    console.log('正在测试获取成品库存列表...');
    const listResponse = await httpClient.get('/finished-inventory');
    if (!Array.isArray(listResponse.data.data)) {
      throw new Error('成品库存列表响应格式错误');
    }
    console.log('✓ 成功获取成品库存列表');

    // 获取单个成品库存
    console.log('正在测试获取单个成品库存...');
    const getResponse = await httpClient.get(`/finished-inventory/${finishedId}`);
    if (getResponse.data.id !== finishedId) {
      throw new Error('获取的成品库存ID不匹配');
    }
    console.log('✓ 成功获取单个成品库存');

    // 更新成品库存
    console.log('正在测试更新成品库存...');
    const updateData = { ...finishedData, quantity: 120 };
    await httpClient.put(`/finished-inventory/${finishedId}`, updateData);
    console.log('✓ 成功更新成品库存');
  });

  const test2 = new APITest('散件库存管理', '测试散件库存的增删改查功能');

  await test2.run(async () => {
    // 创建散件库存
    console.log('正在测试创建散件库存...');
    const spareData = {
      ...testData.spareInventory,
      productId: createdResources.productId,
      shopId: createdResources.shopId,
    };
    const createResponse = await httpClient.post('/spare-inventory', spareData);
    const spareId = createResponse.data.id;
    createdResources.spareId = spareId;
    console.log('✓ 成功创建散件库存，ID:', spareId);

    // 获取散件库存列表
    console.log('正在测试获取散件库存列表...');
    const listResponse = await httpClient.get('/spare-inventory');
    if (!Array.isArray(listResponse.data.data)) {
      throw new Error('散件库存列表响应格式错误');
    }
    console.log('✓ 成功获取散件库存列表');

    // 获取单个散件库存
    console.log('正在测试获取单个散件库存...');
    const getResponse = await httpClient.get(`/spare-inventory/${spareId}`);
    if (getResponse.data.id !== spareId) {
      throw new Error('获取的散件库存ID不匹配');
    }
    console.log('✓ 成功获取单个散件库存');

    // 更新散件库存
    console.log('正在测试更新散件库存...');
    const updateData = { ...spareData, quantity: 60 };
    await httpClient.put(`/spare-inventory/${spareId}`, updateData);
    console.log('✓ 成功更新散件库存');
  });
};

// 财务报表测试
const financialReportTests = async () => {
  const test = new APITest('财务报表管理', '测试财务报表的查询功能');

  await test.run(async () => {
    // 获取财务报表列表
    console.log('正在测试获取财务报表列表...');
    const listResponse = await httpClient.get('/financial-reports');
    if (!Array.isArray(listResponse.data.data)) {
      throw new Error('财务报表列表响应格式错误');
    }
    console.log('✓ 成功获取财务报表列表');
  });
};

// 系统日志测试
const logTests = async () => {
  const test = new APITest('系统日志管理', '测试系统日志的查询功能');

  await test.run(async () => {
    // 获取系统日志列表
    console.log('正在测试获取系统日志列表...');
    const listResponse = await httpClient.get('/logs');
    if (!Array.isArray(listResponse.data.data)) {
      throw new Error('系统日志列表响应格式错误');
    }
    console.log('✓ 成功获取系统日志列表');

    // 获取日志统计
    console.log('正在测试获取日志统计...');
    const statsResponse = await httpClient.get('/logs/stats');
    if (!statsResponse.data.total && statsResponse.data.total !== 0) {
      throw new Error('日志统计响应格式错误');
    }
    console.log('✓ 成功获取日志统计');
  });
};

// 权限测试
const permissionTests = async () => {
  const test = new APITest('权限管理', '测试权限列表查询功能');

  await test.run(async () => {
    // 获取权限列表
    console.log('正在测试获取权限列表...');
    const listResponse = await httpClient.get('/permissions');
    if (!Array.isArray(listResponse.data)) {
      throw new Error('权限列表响应格式错误');
    }
    console.log('✓ 成功获取权限列表');
  });
};

// 清理测试数据
const cleanupTests = async () => {
  const test = new APITest('清理测试数据', '删除测试过程中创建的数据');

  await test.run(async () => {
    console.log('正在清理测试数据...');

    // 删除创建的资源（按依赖关系逆序删除）
    const cleanupOrder = [
      { type: 'finished-inventory', id: createdResources.finishedId },
      { type: 'spare-inventory', id: createdResources.spareId },
      { type: 'delivery-records', id: createdResources.deliveryId },
      { type: 'warehouse-tasks', id: createdResources.taskId },
      { type: 'purchase-orders', id: createdResources.orderId },
      { type: 'products', id: createdResources.productId },
      { type: 'product-categories', id: createdResources.categoryId },
      { type: 'forwarding-agents', id: createdResources.forwardingId },
      { type: 'suppliers', id: createdResources.supplierId },
      { type: 'shops', id: createdResources.shopId },
      { type: 'roles', id: createdResources.roleId },
    ];

    for (const resource of cleanupOrder) {
      if (resource.id) {
        try {
          await httpClient.delete(`/${resource.type}/${resource.id}`);
          console.log(`✓ 删除${resource.type}成功: ${resource.id}`);
        } catch (error) {
          console.log(`⚠️ 删除${resource.type}失败: ${error.message}`);
        }
      }
    }

    console.log('✓ 测试数据清理完成');
  });
};

// 主测试函数
const runAllTests = async () => {
  console.log('🚀 开始执行API功能测试...');
  console.log('测试环境:', BASE_URL);
  console.log('='.repeat(60));

  const testSuites = [
    authTests,
    permissionTests,
    roleTests,
    shopTests,
    supplierTests,
    forwardingTests,
    productCategoryTests,
    productTests,
    purchaseOrderTests,
    warehouseTaskTests,
    deliveryRecordTests,
    inventoryTests,
    financialReportTests,
    logTests,
    cleanupTests,
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const testSuite of testSuites) {
    try {
      await testSuite();
      passedTests++;
    } catch (error) {
      failedTests++;
      console.log(`\n❌ 测试套件失败: ${error.message}`);
      // 继续执行其他测试
    }
    console.log('-'.repeat(60));
  }

  // 测试结果汇总
  console.log('\n📊 测试结果汇总');
  console.log('='.repeat(60));
  console.log(`✅ 通过测试: ${passedTests}`);
  console.log(`❌ 失败测试: ${failedTests}`);
  console.log(`📈 成功率: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(2)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 所有API接口测试通过！');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查失败的接口');
  }

  console.log('\n测试完成');
};

// 执行测试
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('测试执行失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  httpClient,
  testData,
};
