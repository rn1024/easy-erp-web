# 数据模型文档

## 核心数据实体

### 1. 产品实体 (Product)

#### 基础信息
- **id**: 产品唯一标识
- **name**: 产品名称
- **code**: 产品代码
- **sku**: 库存单位
- **asin**: Amazon标准识别号
- **description**: 产品描述
- **specification**: 产品规格
- **colors**: 颜色规格
- **weight**: 产品重量
- **length**: 产品长度
- **width**: 产品宽度
- **height**: 产品高度

#### 包装信息
- **inner_box_length**: 内箱长度
- **inner_box_width**: 内箱宽度
- **inner_box_height**: 内箱高度
- **outer_box_length**: 外箱长度
- **outer_box_width**: 外箱宽度
- **outer_box_height**: 外箱高度
- **package_weight**: 包装重量
- **box_type**: 箱型
- **pack_quantity**: 每箱数量

#### 关联信息
- **category_id**: 分类ID
- **shop_id**: 店铺ID
- **created_at**: 创建时间
- **updated_at**: 更新时间

### 2. 产品分类 (ProductCategory)
- **id**: 分类ID
- **name**: 分类名称
- **description**: 分类描述
- **parent_id**: 父分类ID
- **sort_order**: 排序顺序
- **created_at**: 创建时间

### 3. 库存实体 (Inventory)

#### 成品库存 (FinishedInventory)
- **id**: 库存ID
- **product_id**: 产品ID
- **shop_id**: 店铺ID
- **quantity**: 库存数量
- **location**: 存储位置
- **weight**: 重量信息
- **batch_number**: 批次号
- **created_at**: 创建时间
- **updated_at**: 更新时间

#### 备件库存 (SpareInventory)
- **id**: 备件ID
- **name**: 备件名称
- **specification**: 规格描述
- **quantity**: 数量
- **location**: 存储位置
- **min_quantity**: 最低库存
- **created_at**: 创建时间

### 4. 采购实体 (Purchase)

#### 采购订单 (PurchaseOrder)
- **id**: 订单ID
- **order_number**: 订单编号
- **supplier_id**: 供应商ID
- **shop_id**: 店铺ID
- **status**: 订单状态
- **total_amount**: 总金额
- **tax_amount**: 税费
- **discount_amount**: 折扣金额
- **delivery_date**: 交货日期
- **urgent**: 是否紧急
- **notes**: 备注信息
- **share_code**: 共享码
- **created_at**: 创建时间
- **updated_at**: 更新时间

#### 采购订单项目 (PurchaseOrderItem)
- **id**: 项目ID
- **purchase_order_id**: 采购订单ID
- **product_id**: 产品ID
- **quantity**: 数量
- **unit_price**: 单价
- **total_price**: 总价
- **notes**: 备注

#### 供应记录 (SupplyRecord)
- **id**: 供应记录ID
- **purchase_order_id**: 采购订单ID
- **supplier_id**: 供应商ID
- **unit_price**: 供应商报价
- **delivery_time**: 交货时间
- **status**: 状态
- **created_at**: 创建时间

### 5. 供应商实体 (Supplier)
- **id**: 供应商ID
- **name**: 供应商名称
- **contact_person**: 联系人
- **phone**: 电话
- **email**: 邮箱
- **address**: 地址
- **bank_name**: 开户银行
- **bank_account**: 银行账号
- **tax_code**: 税号
- **credit_code**: 信用代码
- **payment_terms**: 付款条件
- **production_cycle**: 生产周期
- **delivery_time**: 交货时间
- **avatar**: 头像/标识
- **notes**: 备注
- **created_at**: 创建时间

### 6. 货代实体 (ForwardingAgent)
- **id**: 货代ID
- **name**: 货代名称
- **contact_person**: 联系人
- **phone**: 电话
- **email**: 邮箱
- **address**: 地址
- **service_type**: 服务类型
- **notes**: 备注
- **created_at**: 创建时间

### 7. 店铺实体 (Shop)
- **id**: 店铺ID
- **name**: 店铺名称
- **code**: 店铺代码
- **contact_person**: 负责人
- **phone**: 联系电话
- **address**: 地址
- **notes**: 备注
- **created_at**: 创建时间

### 8. 包装任务实体 (PackagingTask)
- **id**: 任务ID
- **name**: 任务名称
- **product_items**: 产品项目列表
- **shop_id**: 店铺ID
- **operator**: 操作员
- **progress**: 进度百分比
- **status**: 任务状态
- **notes**: 备注
- **created_at**: 创建时间
- **updated_at**: 更新时间

### 9. 运输实体 (Shipment)

#### 运输记录 (ShipmentRecord)
- **id**: 运输ID
- **shipment_number**: 运输编号
- **forwarder_id**: 货代ID
- **channel**: 运输渠道
- **destination**: 目的地
- **status**: 运输状态
- **fba_shipment_code**: FBA运输代码
- **warehouse_deadline**: 仓库截止日期
- **country**: 国家
- **notes**: 备注
- **created_at**: 创建时间
- **updated_at**: 更新时间

#### 运输产品记录 (ShipmentProductRecord)
- **id**: 记录ID
- **shipment_record_id**: 运输记录ID
- **product_id**: 产品ID
- **quantity**: 数量
- **weight**: 重量
- **notes**: 备注

#### 配送记录 (DeliveryRecord)
- **id**: 配送ID
- **shipment_record_id**: 运输记录ID
- **delivery_date**: 配送日期
- **status**: 配送状态
- **recipient**: 收件人
- **address**: 配送地址
- **notes**: 备注
- **created_at**: 创建时间

### 10. 财务实体 (Financial)

#### 财务报告 (FinancialReport)
- **id**: 报告ID
- **report_name**: 报告名称
- **month**: 报告月份
- **shop_id**: 店铺ID
- **total_revenue**: 总收入
- **product_cost**: 产品成本
- **shipping_cost**: 运输成本
- **marketing_cost**: 营销成本
- **operating_cost**: 运营成本
- **net_profit**: 净利润
- **profit_margin**: 利润率
- **inventory_turnover**: 库存周转率
- **acos**: 广告成本销售比
- **roas**: 广告支出回报率
- **cash_flow**: 现金流
- **notes**: 备注
- **created_at**: 创建时间

### 11. 用户管理实体 (User)

#### 用户账户 (Account)
- **id**: 用户ID
- **username**: 用户名
- **email**: 邮箱
- **phone**: 电话
- **real_name**: 真实姓名
- **avatar**: 头像
- **role_id**: 角色ID
- **status**: 状态
- **last_login**: 最后登录时间
- **created_at**: 创建时间
- **updated_at**: 更新时间

#### 角色 (Role)
- **id**: 角色ID
- **name**: 角色名称
- **description**: 描述
- **permissions**: 权限列表
- **created_at**: 创建时间

#### 权限 (Permission)
- **id**: 权限ID
- **name**: 权限名称
- **code**: 权限代码
- **module**: 所属模块
- **description**: 描述

### 12. 审批实体 (Approval)

#### 审批历史 (ApprovalHistory)
- **id**: 审批ID
- **entity_type**: 实体类型
- **entity_id**: 实体ID
- **action**: 操作类型
- **status**: 审批状态
- **comment**: 审批意见
- **approver_id**: 审批人ID
- **created_at**: 创建时间

### 13. 系统日志实体 (Log)
- **id**: 日志ID
- **user_id**: 用户ID
- **action**: 操作类型
- **entity_type**: 实体类型
- **entity_id**: 实体ID
- **description**: 操作描述
- **ip_address**: IP地址
- **user_agent**: 用户代理
- **created_at**: 创建时间

### 14. 共享实体 (Share)

#### 共享信息 (ShareInfo)
- **share_code**: 共享码
- **entity_type**: 实体类型
- **entity_id**: 实体ID
- **expired_at**: 过期时间
- **created_by**: 创建人
- **created_at**: 创建时间

### 15. 产品项目实体 (ProductItem)
- **id**: 项目ID
- **product_id**: 产品ID
- **name**: 项目名称
- **quantity**: 数量
- **unit**: 单位
- **notes**: 备注
- **created_at**: 创建时间

## 数据关系图

### 主要关系
- **Product** → **ProductCategory** (多对一)
- **Product** → **Shop** (多对一)
- **Inventory** → **Product** (多对一)
- **Inventory** → **Shop** (多对一)
- **PurchaseOrder** → **Supplier** (多对一)
- **PurchaseOrder** → **Shop** (多对一)
- **PurchaseOrderItem** → **PurchaseOrder** (多对一)
- **PurchaseOrderItem** → **Product** (多对一)
- **SupplyRecord** → **PurchaseOrder** (多对一)
- **SupplyRecord** → **Supplier** (多对一)
- **ShipmentRecord** → **ForwardingAgent** (多对一)
- **ShipmentProductRecord** → **ShipmentRecord** (多对一)
- **ShipmentProductRecord** → **Product** (多对一)
- **DeliveryRecord** → **ShipmentRecord** (多对一)
- **FinancialReport** → **Shop** (多对一)
- **Account** → **Role** (多对一)
- **Role** → **Permission** (多对多)
- **PackagingTask** → **Shop** (多对一)

## 状态枚举值

### 订单状态
- `CREATED`: 已创建
- `PENDING`: 待确认
- `CONFIRMED`: 已确认
- `PRODUCTION`: 生产中
- `SHIPPED`: 已发货
- `RECEIVED`: 已收货
- `CANCELLED`: 已取消

### 运输状态
- `PENDING`: 待处理
- `SHIPPED`: 已发货
- `IN_TRANSIT`: 运输中
- `ARRIVED`: 已到达
- `DELIVERED`: 已交付
- `COMPLETED`: 已完成

### 任务状态
- `PENDING`: 待处理
- `IN_PROGRESS`: 进行中
- `COMPLETED`: 已完成
- `CANCELLED`: 已取消

### 用户状态
- `ACTIVE`: 活跃
- `INACTIVE`: 非活跃
- `SUSPENDED`: 暂停

### 审批状态
- `PENDING`: 待审批
- `APPROVED`: 已批准
- `REJECTED`: 已拒绝
- `CANCELLED`: 已取消