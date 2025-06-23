# 简易ERP系统数据库设计

## 概述

本文档详细描述了简易ERP系统的数据库设计，涵盖了用户管理、供应链、库存、财务等核心业务模块。数据库设计遵循规范化原则，确保数据一致性和系统扩展性。

## 技术架构

- **数据库系统**: MySQL 8.0+
- **ORM框架**: Prisma
- **时间字段**: 统一使用 `DateTime` 类型
- **主键策略**: 自增整型ID
- **外键约束**: 确保数据完整性

## 数据表设计

### 1. 账号管理模块

#### 1.1 账号表 (account)

| 字段名        | 类型                      | 约束                        | 描述         |
| ------------- | ------------------------- | --------------------------- | ------------ |
| id            | INT                       | PRIMARY KEY, AUTO_INCREMENT | 主键ID       |
| avatar_url    | VARCHAR(500)              | NULL                        | 头像地址     |
| nickname      | VARCHAR(100)              | NOT NULL                    | 昵称         |
| role          | VARCHAR(50)               | NOT NULL                    | 角色         |
| online_status | ENUM('online', 'offline') | DEFAULT 'offline'           | 在线状态     |
| login_time    | DATETIME                  | NULL                        | 最后登录时间 |
| created_at    | DATETIME                  | NOT NULL                    | 创建时间     |
| updated_at    | DATETIME                  | NOT NULL                    | 更新时间     |

**索引设计:**

- 主键索引: `id`
- 唯一索引: `nickname`
- 普通索引: `role`, `online_status`

### 2. 店铺管理模块

#### 2.1 店铺表 (shop)

| 字段名             | 类型         | 约束                        | 描述     |
| ------------------ | ------------ | --------------------------- | -------- |
| id                 | INT          | PRIMARY KEY, AUTO_INCREMENT | 主键ID   |
| nickname           | VARCHAR(100) | NOT NULL                    | 店铺昵称 |
| avatar_url         | VARCHAR(500) | NULL                        | 头像地址 |
| responsible_person | VARCHAR(100) | NOT NULL                    | 负责人   |
| remark             | TEXT         | NULL                        | 备注     |
| created_at         | DATETIME     | NOT NULL                    | 创建时间 |
| updated_at         | DATETIME     | NOT NULL                    | 更新时间 |

**索引设计:**

- 主键索引: `id`
- 唯一索引: `nickname`
- 普通索引: `responsible_person`

### 3. 供应链管理模块

#### 3.1 供应商表 (supplier)

| 字段名          | 类型         | 约束                        | 描述             |
| --------------- | ------------ | --------------------------- | ---------------- |
| id              | INT          | PRIMARY KEY, AUTO_INCREMENT | 主键ID           |
| avatar_url      | VARCHAR(500) | NULL                        | 头像地址         |
| nickname        | VARCHAR(100) | NOT NULL                    | 昵称             |
| contact_person  | VARCHAR(100) | NOT NULL                    | 联系人           |
| contact_phone   | VARCHAR(50)  | NOT NULL                    | 联系电话         |
| company_name    | VARCHAR(200) | NOT NULL                    | 公司名称         |
| credit_code     | VARCHAR(50)  | UNIQUE                      | 统一社会信用代码 |
| bank_name       | VARCHAR(200) | NULL                        | 开户行           |
| bank_account    | VARCHAR(100) | NULL                        | 开户账号         |
| bank_address    | VARCHAR(500) | NULL                        | 开户地址         |
| production_days | INT          | DEFAULT 0                   | 生产预计时间(天) |
| delivery_days   | INT          | DEFAULT 0                   | 送货预计时间(天) |
| remark          | TEXT         | NULL                        | 备注             |
| created_at      | DATETIME     | NOT NULL                    | 创建时间         |
| updated_at      | DATETIME     | NOT NULL                    | 更新时间         |

**索引设计:**

- 主键索引: `id`
- 唯一索引: `credit_code`
- 普通索引: `nickname`, `company_name`

#### 3.2 货代表 (forwarder)

| 字段名         | 类型         | 约束                        | 描述             |
| -------------- | ------------ | --------------------------- | ---------------- |
| id             | INT          | PRIMARY KEY, AUTO_INCREMENT | 主键ID           |
| avatar_url     | VARCHAR(500) | NULL                        | 头像地址         |
| nickname       | VARCHAR(100) | NOT NULL                    | 昵称             |
| contact_person | VARCHAR(100) | NOT NULL                    | 联系人           |
| contact_phone  | VARCHAR(50)  | NOT NULL                    | 联系电话         |
| company_name   | VARCHAR(200) | NOT NULL                    | 公司名称         |
| credit_code    | VARCHAR(50)  | UNIQUE                      | 统一社会信用代码 |
| bank_name      | VARCHAR(200) | NULL                        | 开户行           |
| bank_account   | VARCHAR(100) | NULL                        | 开户账号         |
| bank_address   | VARCHAR(500) | NULL                        | 开户地址         |
| remark         | TEXT         | NULL                        | 备注             |
| created_at     | DATETIME     | NOT NULL                    | 创建时间         |
| updated_at     | DATETIME     | NOT NULL                    | 更新时间         |

**索引设计:**

- 主键索引: `id`
- 唯一索引: `credit_code`
- 普通索引: `nickname`, `company_name`

### 4. 产品管理模块

#### 4.1 产品分类表 (product_category)

| 字段名     | 类型         | 约束                        | 描述     |
| ---------- | ------------ | --------------------------- | -------- |
| id         | INT          | PRIMARY KEY, AUTO_INCREMENT | 主键ID   |
| name       | VARCHAR(100) | NOT NULL                    | 分类名称 |
| created_at | DATETIME     | NOT NULL                    | 创建时间 |
| updated_at | DATETIME     | NOT NULL                    | 更新时间 |

**索引设计:**

- 主键索引: `id`
- 唯一索引: `name`

#### 4.2 产品信息表 (product_info)

| 字段名         | 类型          | 约束                        | 描述            |
| -------------- | ------------- | --------------------------- | --------------- |
| id             | INT           | PRIMARY KEY, AUTO_INCREMENT | 主键ID          |
| shop_id        | INT           | NOT NULL                    | 店铺ID (外键)   |
| category_id    | INT           | NOT NULL                    | 分类ID (外键)   |
| code           | VARCHAR(100)  | NOT NULL                    | 编码            |
| specification  | VARCHAR(500)  | NULL                        | 规格            |
| color          | VARCHAR(50)   | NULL                        | 颜色            |
| set_quantity   | INT           | DEFAULT 1                   | 套装数量        |
| internal_size  | VARCHAR(100)  | NULL                        | 内尺寸          |
| external_size  | VARCHAR(100)  | NULL                        | 外尺寸          |
| weight         | DECIMAL(10,2) | NULL                        | 重量(kg)        |
| sku            | VARCHAR(100)  | UNIQUE                      | SKU编码         |
| label          | VARCHAR(200)  | NULL                        | 商品标签        |
| code_file_url  | VARCHAR(500)  | NULL                        | 商品编码文件PDF |
| image_url      | VARCHAR(500)  | NULL                        | 图片地址        |
| style_info     | TEXT          | NULL                        | 款式信息        |
| accessory_info | TEXT          | NULL                        | 配件信息        |
| remark         | TEXT          | NULL                        | 备注            |
| created_at     | DATETIME      | NOT NULL                    | 创建时间        |
| updated_at     | DATETIME      | NOT NULL                    | 更新时间        |

**外键约束:**

- `shop_id` REFERENCES `shop(id)`
- `category_id` REFERENCES `product_category(id)`

**索引设计:**

- 主键索引: `id`
- 唯一索引: `sku`
- 普通索引: `shop_id`, `category_id`, `code`

### 5. 库存管理模块

#### 5.1 成品库存表 (finished_inventory)

| 字段名         | 类型          | 约束                        | 描述          |
| -------------- | ------------- | --------------------------- | ------------- |
| id             | INT           | PRIMARY KEY, AUTO_INCREMENT | 主键ID        |
| shop_id        | INT           | NOT NULL                    | 店铺ID (外键) |
| category_id    | INT           | NOT NULL                    | 分类ID (外键) |
| product_id     | INT           | NOT NULL                    | 产品ID (外键) |
| box_size       | VARCHAR(100)  | NULL                        | 外箱尺寸      |
| pack_quantity  | INT           | DEFAULT 1                   | 装箱数量      |
| weight         | DECIMAL(10,2) | NULL                        | 重量(kg)      |
| location       | VARCHAR(100)  | NULL                        | 货位          |
| stock_quantity | INT           | DEFAULT 0                   | 库存数量      |
| created_at     | DATETIME      | NOT NULL                    | 创建时间      |
| updated_at     | DATETIME      | NOT NULL                    | 更新时间      |

**外键约束:**

- `shop_id` REFERENCES `shop(id)`
- `category_id` REFERENCES `product_category(id)`
- `product_id` REFERENCES `product_info(id)`

**索引设计:**

- 主键索引: `id`
- 复合索引: `shop_id, product_id`
- 普通索引: `location`

#### 5.2 散件库存表 (spare_inventory)

| 字段名      | 类型         | 约束                        | 描述          |
| ----------- | ------------ | --------------------------- | ------------- |
| id          | INT          | PRIMARY KEY, AUTO_INCREMENT | 主键ID        |
| shop_id     | INT          | NOT NULL                    | 店铺ID (外键) |
| category_id | INT          | NOT NULL                    | 分类ID (外键) |
| product_id  | INT          | NOT NULL                    | 产品ID (外键) |
| spare_type  | VARCHAR(100) | NOT NULL                    | 散件类型      |
| location    | VARCHAR(100) | NULL                        | 货位          |
| quantity    | INT          | DEFAULT 0                   | 数量          |
| created_at  | DATETIME     | NOT NULL                    | 创建时间      |
| updated_at  | DATETIME     | NOT NULL                    | 更新时间      |

**外键约束:**

- `shop_id` REFERENCES `shop(id)`
- `category_id` REFERENCES `product_category(id)`
- `product_id` REFERENCES `product_info(id)`

**索引设计:**

- 主键索引: `id`
- 复合索引: `shop_id, product_id, spare_type`

### 6. 采购管理模块

#### 6.1 采购订单表 (purchase_order)

| 字段名       | 类型                                                                           | 约束                        | 描述            |
| ------------ | ------------------------------------------------------------------------------ | --------------------------- | --------------- |
| id           | INT                                                                            | PRIMARY KEY, AUTO_INCREMENT | 主键ID          |
| shop_id      | INT                                                                            | NOT NULL                    | 店铺ID (外键)   |
| supplier_id  | INT                                                                            | NOT NULL                    | 供应商ID (外键) |
| product_id   | INT                                                                            | NOT NULL                    | 产品ID (外键)   |
| quantity     | INT                                                                            | NOT NULL                    | 数量            |
| total_amount | DECIMAL(12,2)                                                                  | NOT NULL                    | 金额合计        |
| status       | ENUM('pending', 'confirmed', 'production', 'shipped', 'received', 'cancelled') | DEFAULT 'pending'           | 订单状态        |
| urgent       | BOOLEAN                                                                        | DEFAULT FALSE               | 是否急单        |
| remark       | TEXT                                                                           | NULL                        | 备注            |
| created_at   | DATETIME                                                                       | NOT NULL                    | 创建时间        |
| updated_at   | DATETIME                                                                       | NOT NULL                    | 更新时间        |

**外键约束:**

- `shop_id` REFERENCES `shop(id)`
- `supplier_id` REFERENCES `supplier(id)`
- `product_id` REFERENCES `product_info(id)`

**索引设计:**

- 主键索引: `id`
- 复合索引: `shop_id, status`
- 普通索引: `supplier_id`, `urgent`

### 7. 财务管理模块

#### 7.1 财务报表表 (financial_report)

| 字段名       | 类型       | 约束                        | 描述               |
| ------------ | ---------- | --------------------------- | ------------------ |
| id           | INT        | PRIMARY KEY, AUTO_INCREMENT | 主键ID             |
| shop_id      | INT        | NOT NULL                    | 店铺ID (外键)      |
| report_month | VARCHAR(7) | NOT NULL                    | 报表月份 (YYYY-MM) |
| details      | JSON       | NULL                        | 报表明细JSON格式   |
| created_at   | DATETIME   | NOT NULL                    | 创建时间           |
| updated_at   | DATETIME   | NOT NULL                    | 更新时间           |

**外键约束:**

- `shop_id` REFERENCES `shop(id)`

**索引设计:**

- 主键索引: `id`
- 复合唯一索引: `shop_id, report_month`

### 8. 仓库作业模块

#### 8.1 仓库任务表 (warehouse_task)

| 字段名         | 类型                                                     | 约束                        | 描述          |
| -------------- | -------------------------------------------------------- | --------------------------- | ------------- |
| id             | INT                                                      | PRIMARY KEY, AUTO_INCREMENT | 主键ID        |
| shop_id        | INT                                                      | NOT NULL                    | 店铺ID (外键) |
| category_id    | INT                                                      | NOT NULL                    | 分类ID (外键) |
| product_id     | INT                                                      | NOT NULL                    | 产品ID (外键) |
| total_quantity | INT                                                      | NOT NULL                    | 总数量        |
| progress       | DECIMAL(5,2)                                             | DEFAULT 0.00                | 进度(%)       |
| status         | ENUM('pending', 'in_progress', 'completed', 'cancelled') | DEFAULT 'pending'           | 状态          |
| type           | ENUM('packaging', 'shipping')                            | NOT NULL                    | 任务类型      |
| created_at     | DATETIME                                                 | NOT NULL                    | 创建时间      |
| updated_at     | DATETIME                                                 | NOT NULL                    | 更新时间      |

**外键约束:**

- `shop_id` REFERENCES `shop(id)`
- `category_id` REFERENCES `product_category(id)`
- `product_id` REFERENCES `product_info(id)`

**索引设计:**

- 主键索引: `id`
- 复合索引: `shop_id, status`, `type, status`

#### 8.2 发货记录表 (delivery_record)

| 字段名                      | 类型                                                                 | 约束                        | 描述              |
| --------------------------- | -------------------------------------------------------------------- | --------------------------- | ----------------- |
| id                          | INT                                                                  | PRIMARY KEY, AUTO_INCREMENT | 主键ID            |
| shop_id                     | INT                                                                  | NOT NULL                    | 店铺ID (外键)     |
| product_id                  | INT                                                                  | NOT NULL                    | 产品ID (外键)     |
| total_boxes                 | INT                                                                  | NOT NULL                    | 总箱数            |
| fba_shipment_code           | VARCHAR(100)                                                         | NULL                        | FBA货件编码       |
| fba_warehouse_code          | VARCHAR(100)                                                         | NULL                        | FBA仓库编码       |
| country                     | VARCHAR(50)                                                          | NULL                        | 国家              |
| channel                     | VARCHAR(100)                                                         | NULL                        | 渠道              |
| forwarder_id                | INT                                                                  | NOT NULL                    | 货代公司ID (外键) |
| shipping_channel            | VARCHAR(100)                                                         | NULL                        | 运输渠道          |
| warehouse_shipping_deadline | DATE                                                                 | NULL                        | 仓库发货截止期限  |
| warehouse_receipt_deadline  | DATE                                                                 | NULL                        | 进仓收货期限      |
| shipping_details            | TEXT                                                                 | NULL                        | 头程物流详情      |
| date                        | DATE                                                                 | NOT NULL                    | 日期              |
| status                      | ENUM('preparing', 'shipped', 'in_transit', 'delivered', 'cancelled') | DEFAULT 'preparing'         | 状态              |
| created_at                  | DATETIME                                                             | NOT NULL                    | 创建时间          |
| updated_at                  | DATETIME                                                             | NOT NULL                    | 更新时间          |

**外键约束:**

- `shop_id` REFERENCES `shop(id)`
- `product_id` REFERENCES `product_info(id)`
- `forwarder_id` REFERENCES `forwarder(id)`

**索引设计:**

- 主键索引: `id`
- 复合索引: `shop_id, status`, `date, status`
- 普通索引: `fba_shipment_code`, `forwarder_id`

## 数据关系图

```
account
shop ←→ product_info ←→ product_category
        ↓
        finished_inventory
        spare_inventory
        purchase_order ←→ supplier
        warehouse_task
        delivery_record ←→ forwarder
        financial_report
```

## 业务流程关联

### 采购流程

1. `purchase_order` → `supplier` → `finished_inventory`
2. 采购订单生成 → 供应商生产 → 入库更新库存

### 发货流程

1. `warehouse_task` → `finished_inventory` → `delivery_record`
2. 创建发货任务 → 减少库存 → 生成发货记录

### 财务统计

1. `purchase_order` + `delivery_record` → `financial_report`
2. 采购成本 + 发货收入 → 财务报表

## 数据库设计原则

### 命名规范

- **表名**: 使用小写字母和下划线，复数形式或描述性名词
- **字段名**: 使用小写字母和下划线，见名知义
- **外键字段**: 格式为 `{关联表名}_id`
- **枚举值**: 使用小写字母和下划线

### 数据类型选择

- **ID字段**: 统一使用 `INT AUTO_INCREMENT`
- **时间字段**: 统一使用 `DATETIME`
- **金额字段**: 使用 `DECIMAL(12,2)` 确保精度
- **状态字段**: 使用 `ENUM` 类型限制取值范围
- **备注字段**: 使用 `TEXT` 类型支持长文本

### 约束设计

- **主键约束**: 每个表必须有主键
- **外键约束**: 确保引用完整性
- **唯一约束**: 防止重复数据
- **非空约束**: 关键字段不允许为空
- **默认值**: 为状态字段设置合理默认值

### 索引优化

- **主键索引**: 自动创建
- **外键索引**: 提高关联查询性能
- **业务索引**: 根据查询频率创建
- **复合索引**: 优化多条件查询
- **唯一索引**: 保证数据唯一性

## 性能优化建议

### 查询优化

1. **分页查询**: 使用 `LIMIT` 和 `OFFSET`
2. **索引覆盖**: 避免回表查询
3. **查询缓存**: 缓存频繁查询结果
4. **读写分离**: 主从复制分担查询压力

### 存储优化

1. **分区表**: 按时间或店铺分区存储
2. **归档策略**: 定期归档历史数据
3. **数据压缩**: 压缩存储节省空间

### 扩展性设计

1. **水平分片**: 按店铺ID分片
2. **垂直拆分**: 分离冷热数据
3. **微服务化**: 按业务模块拆分数据库

## 安全考虑

### 数据安全

- **敏感数据加密**: 银行账号等敏感信息加密存储
- **访问控制**: 基于角色的数据访问权限
- **审计日志**: 记录所有数据变更操作
- **备份策略**: 定期备份和恢复测试

### 业务安全

- **并发控制**: 使用锁机制防止数据竞争
- **事务保证**: 确保业务操作的原子性
- **数据校验**: 在应用层和数据库层双重校验

---

**文档版本**: 1.0  
**创建时间**: 2024年12月23日  
**维护者**: ERP系统开发团队  
**更新记录**: 初始版本，包含核心业务模块设计
