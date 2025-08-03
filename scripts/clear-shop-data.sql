-- 清理店铺相关数据的SQL脚本
-- 注意：这将删除所有店铺相关数据，请确保已备份重要数据

-- 禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 清空所有关联表
TRUNCATE TABLE shipment_records;
TRUNCATE TABLE packaging_tasks;
TRUNCATE TABLE financial_reports;
TRUNCATE TABLE purchase_orders;
TRUNCATE TABLE spare_inventory;
TRUNCATE TABLE finished_inventory;
TRUNCATE TABLE product_info;

-- 清空店铺表
TRUNCATE TABLE shops;

-- 重新启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 重置自增ID
ALTER TABLE shops AUTO_INCREMENT = 1;