-- 添加 asin 字段到 product_info 表
-- 此字段用于存储 Amazon Standard Identification Number
ALTER TABLE
  `product_info`
ADD
  COLUMN `asin` VARCHAR(191) NULL;