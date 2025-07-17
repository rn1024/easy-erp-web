-- 安全地添加 finalAmount 字段到 purchase_orders 表
-- 步骤1: 添加可空的 finalAmount 列
ALTER TABLE
  `purchase_orders`
ADD
  COLUMN `finalAmount` DECIMAL(12, 2) NULL;

-- 步骤2: 为现有记录填充默认值（使用 totalAmount 作为初始值）
UPDATE
  `purchase_orders`
SET
  `finalAmount` = `totalAmount`
WHERE
  `finalAmount` IS NULL;

-- 步骤3: 将列设置为 NOT NULL（现在所有记录都有值了）
ALTER TABLE
  `purchase_orders`
MODIFY
  COLUMN `finalAmount` DECIMAL(12, 2) NOT NULL;