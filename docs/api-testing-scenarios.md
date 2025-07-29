# API接口测试场景完整指南

## 认证API测试

### 登录接口测试
```json
// 正常登录测试数据
{
  "username": "admin@easyerp.com",
  "password": "Admin@123456",
  "captcha": "1234"
}

// 错误密码测试数据
{
  "username": "admin@easyerp.com",
  "password": "WrongPassword",
  "captcha": "1234"
}

// 空值测试数据
{
  "username": "",
  "password": "",
  "captcha": ""
}

// SQL注入测试数据
{
  "username": "admin' OR '1'='1",
  "password": "password' OR '1'='1",
  "captcha": "1234"
}
```

### Token刷新测试
```json
// 正常刷新
{
  "refresh_token": "valid_refresh_token_here"
}

// 过期刷新
{
  "refresh_token": "expired_refresh_token_here"
}

// 无效刷新
{
  "refresh_token": "invalid_refresh_token_here"
}
```

## 产品管理API测试

### 产品创建测试数据
```json
// 完整产品数据
{
  "name": "测试产品完整数据",
  "code": "TEST-COMPLETE-001",
  "sku": "TEST-COMP-SKU-001",
  "asin": "B0TEST12345",
  "description": "这是一个包含所有字段的测试产品",
  "specification": "测试规格信息",
  "colors": "红色,蓝色,绿色",
  "weight": 1.5,
  "length": 15.5,
  "width": 8.2,
  "height": 3.1,
  "inner_box_length": 20,
  "inner_box_width": 15,
  "inner_box_height": 10,
  "outer_box_length": 50,
  "outer_box_width": 40,
  "outer_box_height": 30,
  "package_weight": 2.5,
  "box_type": "标准纸箱",
  "pack_quantity": 50,
  "category_id": 1,
  "shop_id": 1
}

// 最小产品数据
{
  "name": "测试最小产品",
  "code": "TEST-MIN-001",
  "sku": "TEST-MIN-SKU-001",
  "category_id": 1,
  "shop_id": 1
}

// 边界值测试
{
  "name": "测试边界值产品",
  "code": "TEST-EDGE-001",
  "sku": "TEST-EDGE-VERY-LONG-SKU-NUMBER-001",
  "weight": 999.999,
  "length": 999.999,
  "width": 999.999,
  "height": 999.999,
  "category_id": 1,
  "shop_id": 1
}
```

### 产品更新测试数据
```json
// 部分字段更新
{
  "name": "更新后的产品名称",
  "price": 2999.99,
  "description": "更新后的产品描述"
}

// 所有字段更新
{
  "name": "完整更新测试产品",
  "code": "TEST-UPDATE-001",
  "sku": "TEST-UPD-SKU-001",
  "description": "完整更新后的描述",
  "weight": 2.0,
  "length": 20.0,
  "width": 10.0,
  "height": 5.0,
  "category_id": 2,
  "shop_id": 2
}
```

### 产品搜索测试数据
```
# 搜索关键词测试
GET /api/v1/products?search=iPhone
GET /api/v1/products?search=小米
GET /api/v1/products?search=非存在产品
GET /api/v1/products?search=

# 分页测试
GET /api/v1/products?page=1&limit=10
GET /api/v1/products?page=2&limit=5
GET /api/v1/products?page=999&limit=50

# 排序测试
GET /api/v1/products?sort=created_at&order=desc
GET /api/v1/products?sort=name&order=asc
GET /api/v1/products?sort=price&order=desc

# 复合筛选测试
GET /api/v1/products?category_id=1&shop_id=1
GET /api/v1/products?search=iPhone&category_id=1&limit=5
GET /api/v1/products?date_from=2024-01-01&date_to=2024-01-31
```

## 库存管理API测试

### 成品库存创建测试数据
```json
// 正常库存记录
{
  "product_id": 1,
  "shop_id": 1,
  "quantity": 100,
  "location": "A区-货架1-层1",
  "weight": 150.5,
  "batch_number": "BATCH-2024-001"
}

// 边界值测试
{
  "product_id": 1,
  "shop_id": 1,
  "quantity": 999999,
  "location": "这是一个超长的库位信息测试字符串1234567890",
  "weight": 999999.999,
  "batch_number": "BATCH-2024-999999"
}

// 零库存测试
{
  "product_id": 1,
  "shop_id": 1,
  "quantity": 0,
  "location": "零库存测试位置",
  "weight": 0,
  "batch_number": "BATCH-ZERO-001"
}
```

### 库存更新测试数据
```json
// 增加库存
{
  "quantity": 200,
  "operation": "increase",
  "notes": "采购入库增加库存"
}

// 减少库存
{
  "quantity": 50,
  "operation": "decrease",
  "notes": "销售出库减少库存"
}

// 库存调整
{
  "quantity": 150,
  "operation": "adjust",
  "notes": "盘点差异调整"
}
```

## 采购管理API测试

### 采购订单创建测试数据
```json
// 标准采购订单
{
  "supplier_id": 1,
  "shop_id": 1,
  "total_amount": 50000,
  "tax_amount": 6500,
  "discount_amount": 1000,
  "delivery_date": "2024-03-15",
  "urgent": false,
  "notes": "标准采购订单测试",
  "items": [
    {
      "product_id": 1,
      "quantity": 100,
      "unit_price": 500,
      "total_price": 50000,
      "notes": "第一批采购"
    }
  ]
}

// 紧急采购订单
{
  "supplier_id": 2,
  "shop_id": 1,
  "total_amount": 100000,
  "tax_amount": 13000,
  "discount_amount": 0,
  "delivery_date": "2024-02-20",
  "urgent": true,
  "notes": "紧急采购订单测试",
  "items": [
    {
      "product_id": 1,
      "quantity": 200,
      "unit_price": 500,
      "total_price": 100000,
      "notes": "紧急补货"
    }
  ]
}

// 多产品采购订单
{
  "supplier_id": 1,
  "shop_id": 1,
  "total_amount": 150000,
  "tax_amount": 19500,
  "discount_amount": 2000,
  "delivery_date": "2024-03-30",
  "urgent": false,
  "notes": "多产品采购订单测试",
  "items": [
    {
      "product_id": 1,
      "quantity": 100,
      "unit_price": 500,
      "total_price": 50000,
      "notes": "产品1采购"
    },
    {
      "product_id": 2,
      "quantity": 200,
      "unit_price": 500,
      "total_price": 100000,
      "notes": "产品2采购"
    }
  ]
}
```

### 订单审批测试数据
```json
// 审批通过
{
  "action": "approve",
  "comment": "审批通过，可以执行采购",
  "approver_id": 1
}

// 审批拒绝
{
  "action": "reject",
  "comment": "库存充足，暂缓采购",
  "approver_id": 1
}

// 需要修改
{
  "action": "request_modification",
  "comment": "价格偏高，请重新议价",
  "approver_id": 1
}
```

### 订单共享测试数据
```json
// 创建共享链接
{
  "expired_at": "2024-03-01T00:00:00Z",
  "permissions": ["view", "quote"]
}

// 供应商报价数据
{
  "unit_price": 480,
  "delivery_time": "7-10个工作日",
  "notes": "供应商报价备注信息"
}
```

## 供应商管理API测试

### 供应商创建测试数据
```json
// 完整供应商信息
{
  "name": "测试供应商完整信息",
  "contact_person": "张经理",
  "phone": "138-0013-8000",
  "email": "test.supplier@example.com",
  "address": "深圳市南山区科技园测试大厦",
  "bank_name": "中国工商银行深圳科技园支行",
  "bank_account": "6222024000123456789",
  "tax_code": "91440300MA5TEST123",
  "credit_code": "91440300MA5TEST123",
  "payment_terms": "30天账期",
  "production_cycle": "7-15个工作日",
  "delivery_time": "3-5个工作日",
  "notes": "这是一个完整的测试供应商信息"
}

// 最小供应商信息
{
  "name": "测试最小供应商",
  "contact_person": "测试联系人",
  "phone": "138-0000-0000",
  "email": "min.test@example.com"
}

// 边界值测试
{
  "name": "测试超长供应商名称这是一个超过50个字符的供应商名称测试",
  "contact_person": "测试超长联系人姓名这是一个超过20个字符的姓名测试",
  "phone": "138-0013-8000-12345-67890",
  "email": "very.long.email.address.for.testing.purpose@example.com",
  "address": "这是一个超长的地址信息测试字符串，包含详细的道路、门牌号、楼层、房间号等信息，用于测试地址字段的最大长度限制"
}
```

## 运输管理API测试

### 运输记录创建测试数据
```json
// 标准运输记录
{
  "shipment_number": "SHIP-TEST-001",
  "forwarder_id": 1,
  "channel": "空运",
  "destination": "美国亚马逊FBA仓库",
  "fba_shipment_code": "FBA123456789",
  "warehouse_deadline": "2024-03-10",
  "country": "美国",
  "notes": "标准FBA运输测试",
  "products": [
    {
      "product_id": 1,
      "quantity": 100,
      "weight": 50.5,
      "notes": "第一批运输"
    }
  ]
}

// 国内运输记录
{
  "shipment_number": "SHIP-TEST-002",
  "forwarder_id": 2,
  "channel": "陆运",
  "destination": "北京仓库",
  "country": "中国",
  "notes": "国内仓库调拨测试",
  "products": [
    {
      "product_id": 2,
      "quantity": 200,
      "weight": 100.0,
      "notes": "北京分仓补货"
    }
  ]
}
```

## 财务管理API测试

### 财务报告创建测试数据
```json
// 标准财务报告
{
  "report_name": "2024年3月测试店铺财务报告",
  "month": "2024-03",
  "shop_id": 1,
  "total_revenue": 1000000,
  "product_cost": 600000,
  "shipping_cost": 50000,
  "marketing_cost": 150000,
  "operating_cost": 100000,
  "net_profit": 100000,
  "profit_margin": 10.0,
  "inventory_turnover": 3.5,
  "acos": 15.0,
  "roas": 6.67,
  "cash_flow": 800000,
  "notes": "3月份测试财务数据"
}

// 极端值测试
{
  "report_name": "极端值测试财务报告",
  "month": "2024-03",
  "shop_id": 1,
  "total_revenue": 999999999,
  "product_cost": 888888888,
  "shipping_cost": 77777777,
  "marketing_cost": 66666666,
  "operating_cost": 55555555,
  "net_profit": 111111111,
  "profit_margin": 99.99,
  "inventory_turnover": 999.99,
  "acos": 99.99,
  "roas": 999.99,
  "cash_flow": 999999999,
  "notes": "极端数值测试"
}
```

## 错误处理测试场景

### 400 Bad Request测试
```json
// 缺少必填字段
{
  "name": "测试产品",
  // 缺少必填的code字段
}

// 数据类型错误
{
  "name": "测试产品",
  "code": "TEST-001",
  "weight": "不是数字",
  "price": "无效价格"
}

// 数据格式错误
{
  "name": "测试产品",
  "code": "TEST-001",
  "delivery_date": "2024-13-45"  // 无效日期
}
```

### 401 Unauthorized测试
```
# 无Token访问
GET /api/v1/products
Headers: {}  // 缺少Authorization头

# 无效Token访问
GET /api/v1/products
Headers: { "Authorization": "Bearer invalid_token" }

# 过期Token访问
GET /api/v1/products
Headers: { "Authorization": "Bearer expired_token" }
```

### 403 Forbidden测试
```
# 无权限操作
POST /api/v1/products
Headers: { "Authorization": "Bearer user_token" }  // 普通用户token
Body: { /* 产品数据 */ }

# 跨店铺操作
PUT /api/v1/products/1
Headers: { "Authorization": "Bearer other_shop_token" }
Body: { /* 更新数据 */ }
```

### 404 Not Found测试
```
# 访问不存在的资源
GET /api/v1/products/99999
GET /api/v1/suppliers/88888
PUT /api/v1/purchase-orders/77777
DELETE /api/v1/finished-inventory/66666
```

### 422 Unprocessable Entity测试
```json
// 违反业务规则
{
  "supplier_id": 999,  // 不存在的供应商
  "product_id": 888,   // 不存在的产品
  "quantity": -100,    // 负数数量
  "unit_price": -50    // 负数价格
}

// 数据验证失败
{
  "email": "invalid-email-format",
  "phone": "invalid-phone-number",
  "date": "2024-02-30"  // 不存在的日期
}
```

## 性能测试数据

### 大数据量测试
```json
// 批量创建产品
[
  {
    "name": "批量测试产品001",
    "code": "BATCH-001",
    "sku": "BATCH-SKU-001",
    "category_id": 1,
    "shop_id": 1
  },
  // ... 重复1000次
]

// 批量创建库存记录
[
  {
    "product_id": 1,
    "shop_id": 1,
    "quantity": 100,
    "location": "A区-001"
  },
  // ... 重复5000次
]
```

### 并发测试数据
```bash
# 并发登录测试
POST /api/v1/auth/login
并发数: 50
间隔时间: 100ms

# 并发创建订单
POST /api/v1/purchase-orders
并发数: 20
测试数据: 不同用户的订单数据

# 并发库存更新
PUT /api/v1/finished-inventory/{id}
并发数: 30
测试数据: 不同库存记录的更新
```

## API测试脚本模板

### 自动化测试脚本
```javascript
// 产品API测试套件
const productAPITests = {
  // 创建产品测试
  createProduct: {
    url: '/api/v1/products',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer valid_token',
      'Content-Type': 'application/json'
    },
    body: {
      name: 'API测试产品',
      code: 'API-TEST-001',
      sku: 'API-SKU-001',
      category_id: 1,
      shop_id: 1
    },
    expectedStatus: 201,
    expectedResponse: {
      code: 200,
      message: 'success',
      data: {
        id: 'number',
        name: 'API测试产品'
      }
    }
  },

  // 获取产品列表测试
  getProducts: {
    url: '/api/v1/products?page=1&limit=10',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer valid_token'
    },
    expectedStatus: 200,
    expectedResponse: {
      code: 200,
      data: {
        items: 'array',
        total: 'number',
        page: 'number',
        limit: 'number'
      }
    }
  }
};

// 批量测试执行
const runBatchTests = async () => {
  const testCases = [
    // 正常流程测试
    { name: '正常登录', data: normalLoginData },
    { name: '创建产品', data: createProductData },
    { name: '创建库存', data: createInventoryData },
    { name: '创建订单', data: createOrderData },
    
    // 异常流程测试
    { name: '错误密码登录', data: wrongPasswordData },
    { name: '无效Token访问', data: invalidTokenData },
    { name: '越权操作', data: unauthorizedData },
    { name: '无效数据提交', data: invalidData }
  ];
  
  for (const testCase of testCases) {
    console.log(`执行测试: ${testCase.name}`);
    // 执行测试逻辑
  }
};
```

## 测试环境配置

### 测试环境变量
```bash
# API测试环境配置
TEST_BASE_URL=http://localhost:3000
TEST_ADMIN_USERNAME=admin@easyerp.com
TEST_ADMIN_PASSWORD=Admin@123456
TEST_USER_USERNAME=user@easyerp.com
TEST_USER_PASSWORD=User@123456

# 性能测试配置
PERF_CONCURRENT_USERS=50
PERF_TEST_DURATION=300s
PERF_RAMP_UP_TIME=30s
```

### 测试数据库配置
```sql
-- 创建测试数据库
CREATE DATABASE easyerp_test;
USE easyerp_test;

-- 插入测试基础数据
INSERT INTO shops (name, code, contact_person, phone, address) VALUES
('测试店铺1', 'TEST001', '测试负责人1', '138-0001-0001', '测试地址1'),
('测试店铺2', 'TEST002', '测试负责人2', '138-0002-0002', '测试地址2');

INSERT INTO product_categories (name, description) VALUES
('测试分类1', '测试分类描述1'),
('测试分类2', '测试分类描述2');

INSERT INTO suppliers (name, contact_person, phone, email) VALUES
('测试供应商1', '联系人1', '138-0003-0003', 'test1@supplier.com'),
('测试供应商2', '联系人2', '138-0004-0004', 'test2@supplier.com');
```