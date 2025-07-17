-- 完整数据库结构同步迁移
-- 只添加缺失的表和字段，确保生产环境安全
-- 1. 创建审批记录表
CREATE TABLE `approval_records` (
  `id` VARCHAR(191) NOT NULL,
  `entityType` ENUM(
    'PURCHASE_ORDER',
    'SALES_ORDER',
    'INVENTORY_TRANSFER',
    'EXPENSE_REPORT'
  ) NOT NULL,
  `entityId` VARCHAR(191) NOT NULL,
  `entityNumber` VARCHAR(191) NOT NULL,
  `approverId` VARCHAR(191) NOT NULL,
  `fromStatus` VARCHAR(191) NOT NULL,
  `toStatus` VARCHAR(191) NOT NULL,
  `reason` VARCHAR(191) NOT NULL,
  `remark` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `approval_records_entityType_entityId_idx`(`entityType`, `entityId`),
  INDEX `approval_records_entityType_entityNumber_idx`(`entityType`, `entityNumber`),
  INDEX `approval_records_approverId_idx`(`approverId`),
  INDEX `approval_records_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. 创建产品图片表（修复当前500错误的关键表）
CREATE TABLE `product_images` (
  `id` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `imageUrl` VARCHAR(191) NOT NULL,
  `fileName` VARCHAR(191) NOT NULL,
  `fileSize` INTEGER NOT NULL,
  `sortOrder` INTEGER NOT NULL,
  `isCover` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `product_images_productId_idx`(`productId`),
  INDEX `product_images_productId_sortOrder_idx`(`productId`, `sortOrder`),
  INDEX `product_images_productId_isCover_idx`(`productId`, `isCover`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. 创建产品项目表
CREATE TABLE `product_items` (
  `id` VARCHAR(191) NOT NULL,
  `relatedType` VARCHAR(191) NOT NULL,
  `relatedId` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `quantity` INTEGER NOT NULL,
  `unitPrice` DECIMAL(10, 2) NULL,
  `amount` DECIMAL(12, 2) NULL,
  `taxRate` DECIMAL(5, 2) NULL,
  `taxAmount` DECIMAL(12, 2) NULL,
  `totalAmount` DECIMAL(12, 2) NULL,
  `completedQuantity` INTEGER NULL,
  `remark` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `product_items_relatedType_relatedId_idx`(`relatedType`, `relatedId`),
  INDEX `product_items_productId_idx`(`productId`),
  INDEX `product_items_relatedType_relatedId_productId_idx`(`relatedType`, `relatedId`, `productId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. 创建发货记录表
CREATE TABLE `shipment_records` (
  `id` VARCHAR(191) NOT NULL,
  `shopId` VARCHAR(191) NOT NULL,
  `country` VARCHAR(191) NULL,
  `channel` VARCHAR(191) NULL,
  `shippingChannel` VARCHAR(191) NULL,
  `warehouseShippingDeadline` DATE NULL,
  `warehouseReceiptDeadline` DATE NULL,
  `shippingDetails` TEXT NULL,
  `date` DATE NOT NULL,
  `status` ENUM(
    'PREPARING',
    'SHIPPED',
    'IN_TRANSIT',
    'DELIVERED',
    'CANCELLED'
  ) NOT NULL DEFAULT 'PREPARING',
  `operatorId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `shipment_records_shopId_status_idx`(`shopId`, `status`),
  INDEX `shipment_records_date_status_idx`(`date`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. 创建发货产品记录表
CREATE TABLE `shipment_product_records` (
  `id` VARCHAR(191) NOT NULL,
  `shipmentRecordId` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `forwarderId` VARCHAR(191) NULL,
  `totalBoxes` INTEGER NOT NULL,
  `fbaShipmentCode` VARCHAR(191) NULL,
  `fbaWarehouseCode` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `shipment_product_records_shipmentRecordId_idx`(`shipmentRecordId`),
  INDEX `shipment_product_records_productId_idx`(`productId`),
  INDEX `shipment_product_records_forwarderId_idx`(`forwarderId`),
  INDEX `shipment_product_records_fbaShipmentCode_idx`(`fbaShipmentCode`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 6. 创建供应商分享链接表
CREATE TABLE `supply_share_links` (
  `id` VARCHAR(191) NOT NULL,
  `purchaseOrderId` VARCHAR(191) NOT NULL,
  `shareCode` VARCHAR(191) NOT NULL,
  `extractCode` VARCHAR(191) NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `accessLimit` INTEGER NULL,
  `accessCount` INTEGER NOT NULL DEFAULT 0,
  `uniqueUserCount` INTEGER NOT NULL DEFAULT 0,
  `status` VARCHAR(191) NOT NULL DEFAULT 'active',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `supply_share_links_shareCode_key`(`shareCode`),
  INDEX `supply_share_links_shareCode_idx`(`shareCode`),
  INDEX `supply_share_links_purchaseOrderId_idx`(`purchaseOrderId`),
  INDEX `supply_share_links_expiresAt_status_idx`(`expiresAt`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 7. 创建供应商分享访问表
CREATE TABLE `supply_share_access` (
  `id` VARCHAR(191) NOT NULL,
  `shareCode` VARCHAR(191) NOT NULL,
  `userToken` VARCHAR(191) NOT NULL,
  `userFingerprint` VARCHAR(191) NOT NULL,
  `ipAddress` VARCHAR(191) NOT NULL,
  `userAgent` TEXT NOT NULL,
  `firstAccessAt` DATETIME(3) NOT NULL,
  `lastAccessAt` DATETIME(3) NOT NULL,
  `accessCount` INTEGER NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `supply_share_access_shareCode_idx`(`shareCode`),
  INDEX `supply_share_access_userFingerprint_shareCode_idx`(`userFingerprint`, `shareCode`),
  INDEX `supply_share_access_userToken_shareCode_idx`(`userToken`, `shareCode`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 8. 创建供应记录表
CREATE TABLE `supply_records` (
  `id` VARCHAR(191) NOT NULL,
  `purchaseOrderId` VARCHAR(191) NOT NULL,
  `shareCode` VARCHAR(191) NOT NULL,
  `supplierInfo` JSON NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'active',
  `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `remark` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `supply_records_purchaseOrderId_idx`(`purchaseOrderId`),
  INDEX `supply_records_shareCode_idx`(`shareCode`),
  INDEX `supply_records_status_idx`(`status`),
  INDEX `supply_records_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 9. 创建供应记录项目表
CREATE TABLE `supply_record_items` (
  `id` VARCHAR(191) NOT NULL,
  `supplyRecordId` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `quantity` INTEGER NOT NULL,
  `unitPrice` DECIMAL(10, 2) NOT NULL,
  `totalPrice` DECIMAL(12, 2) NOT NULL,
  `remark` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `supply_record_items_supplyRecordId_idx`(`supplyRecordId`),
  INDEX `supply_record_items_productId_idx`(`productId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 10. 安全地添加缺失字段到现有表
-- 添加 asin 字段到 product_info 表（如果还没有的话）
ALTER TABLE
  `product_info`
ADD
  COLUMN IF NOT EXISTS `asin` VARCHAR(191) NULL;

-- 添加必要的字段到 purchase_orders 表（如果还没有的话）
ALTER TABLE
  `purchase_orders`
ADD
  COLUMN IF NOT EXISTS `discountRate` DECIMAL(5, 2) NULL;

ALTER TABLE
  `purchase_orders`
ADD
  COLUMN IF NOT EXISTS `discountAmount` DECIMAL(12, 2) NULL;

-- 修改 logs 表的 operatorAccountId 字段为可空（如果还没有修改的话）
ALTER TABLE
  `logs`
MODIFY
  `operatorAccountId` VARCHAR(191) NULL;