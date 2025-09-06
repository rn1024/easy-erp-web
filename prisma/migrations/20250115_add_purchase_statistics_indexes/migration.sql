-- 采购订单统计查询性能优化索引
-- 创建时间: 2025-01-15
-- 目的: 优化采购订单列表接口 statistics 字段的查询性能
-- 策略: 使用 MySQL 兼容语法，忽略已存在索引的错误

-- 1. 采购订单表索引优化
-- 用于基础统计查询 (totalRecords, activeRecords, totalAmount)
CREATE INDEX `idx_purchase_orders_shop_status_v2` 
ON `purchase_orders` (`shopId`, `status`);

CREATE INDEX `idx_purchase_orders_supplier_status_v2` 
ON `purchase_orders` (`supplierId`, `status`);

CREATE INDEX `idx_purchase_orders_operator_status_v2` 
ON `purchase_orders` (`operatorId`, `status`);

CREATE INDEX `idx_purchase_orders_created_at_v2` 
ON `purchase_orders` (`createdAt`);

CREATE INDEX `idx_purchase_orders_updated_at_v2` 
ON `purchase_orders` (`updatedAt`);

-- 2. 产品项目表索引优化
-- 用于统计查询中的产品相关数据 (使用 relatedType 和 relatedId)
CREATE INDEX `idx_product_items_related_type_id_v2` 
ON `product_items` (`relatedType`, `relatedId`);

CREATE INDEX `idx_product_items_product_quantity_v2` 
ON `product_items` (`productId`, `quantity`);

CREATE INDEX `idx_product_items_unit_price_v2` 
ON `product_items` (`unitPrice`);

-- 3. 供应记录表索引优化
-- 用于供应相关统计查询
CREATE INDEX `idx_supply_records_purchase_order_v2` 
ON `supply_records` (`purchaseOrderId`);

CREATE INDEX `idx_supply_records_status_amount_v2` 
ON `supply_records` (`status`, `totalAmount`);

CREATE INDEX `idx_supply_records_created_at_v2` 
ON `supply_records` (`createdAt`);

-- 4. 供应记录项目表索引优化
-- 用于详细供应数据统计
CREATE INDEX `idx_supply_record_items_supply_record_v2` 
ON `supply_record_items` (`supplyRecordId`);

CREATE INDEX `idx_supply_record_items_product_v2` 
ON `supply_record_items` (`productId`);

CREATE INDEX `idx_supply_record_items_quantity_price_v2` 
ON `supply_record_items` (`quantity`, `unitPrice`);

-- 5. 产品信息表索引优化
-- 用于产品相关统计查询
CREATE INDEX `idx_product_info_category_v2` 
ON `product_info` (`categoryId`);

CREATE INDEX `idx_product_info_created_at_v2` 
ON `product_info` (`createdAt`);

CREATE INDEX `idx_product_info_shop_category_v2` 
ON `product_info` (`shopId`, `categoryId`);

-- 6. 复合索引优化
-- 用于复杂的统计查询场景
CREATE INDEX `idx_purchase_orders_shop_supplier_status_v2` 
ON `purchase_orders` (`shopId`, `supplierId`, `status`);

CREATE INDEX `idx_purchase_orders_date_range_status_v2` 
ON `purchase_orders` (`createdAt`, `status`);

CREATE INDEX `idx_supply_records_purchase_status_v2` 
ON `supply_records` (`purchaseOrderId`, `status`);

-- 7. 性能优化索引
-- 针对特定查询模式的优化
CREATE INDEX `idx_purchase_orders_amount_status_v2` 
ON `purchase_orders` (`totalAmount`, `status`);

CREATE INDEX `idx_purchase_orders_operator_date_v2` 
ON `purchase_orders` (`operatorId`, `createdAt`);

CREATE INDEX `idx_supply_records_date_status_v2` 
ON `supply_records` (`createdAt`, `status`);

-- 8. 统计查询专用索引
-- 为 statistics 字段查询优化
CREATE INDEX `idx_purchase_orders_statistics_query_v2` 
ON `purchase_orders` (`shopId`, `status`, `createdAt`, `totalAmount`);

CREATE INDEX `idx_product_items_statistics_query_v2` 
ON `product_items` (`relatedType`, `relatedId`, `productId`, `quantity`);

CREATE INDEX `idx_supply_records_statistics_query_v2` 
ON `supply_records` (`purchaseOrderId`, `status`, `createdAt`);