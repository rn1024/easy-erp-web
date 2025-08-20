-- 添加 shipmentFile 字段到 shipment_records 表
-- 该字段用于存储发货文件的URL

ALTER TABLE `shipment_records` 
ADD COLUMN `shipmentFile` VARCHAR(191) NULL COMMENT '发货文件URL';