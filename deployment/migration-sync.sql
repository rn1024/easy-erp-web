-- Migration Sync File
-- Generated at: 2025-09-06T13:07:07.271Z
-- This file contains the current schema state

-- CreateTable
CREATE TABLE `accounts` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `operator` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `accounts_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_records` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` ENUM('PURCHASE_ORDER', 'SALES_ORDER', 'INVENTORY_TRANSFER', 'EXPENSE_REPORT') NOT NULL,
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

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `operator` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `permissions_name_key`(`name`),
    UNIQUE INDEX `permissions_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account_roles` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `account_roles_roleId_fkey`(`roleId`),
    UNIQUE INDEX `account_roles_accountId_roleId_key`(`accountId`, `roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `role_permissions_permissionId_fkey`(`permissionId`),
    UNIQUE INDEX `role_permissions_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logs` (
    `id` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `operation` VARCHAR(191) NOT NULL,
    `operatorAccountId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'SUCCESS',
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shops` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nickname` VARCHAR(191) NOT NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `responsiblePerson` VARCHAR(191) NOT NULL,
    `remark` TEXT NULL,
    `operatorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `shops_nickname_key`(`nickname`),
    INDEX `shops_operatorId_fkey`(`operatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suppliers` (
    `id` VARCHAR(191) NOT NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `nickname` VARCHAR(191) NOT NULL,
    `contactPerson` VARCHAR(191) NOT NULL,
    `contactPhone` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `creditCode` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `bankAccount` VARCHAR(191) NULL,
    `bankAddress` VARCHAR(191) NULL,
    `productionDays` INTEGER NOT NULL DEFAULT 0,
    `deliveryDays` INTEGER NOT NULL DEFAULT 0,
    `remark` TEXT NULL,
    `operatorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `suppliers_nickname_key`(`nickname`),
    UNIQUE INDEX `suppliers_creditCode_key`(`creditCode`),
    INDEX `suppliers_operatorId_fkey`(`operatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forwarders` (
    `id` VARCHAR(191) NOT NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `nickname` VARCHAR(191) NOT NULL,
    `contactPerson` VARCHAR(191) NOT NULL,
    `contactPhone` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `creditCode` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `bankAccount` VARCHAR(191) NULL,
    `bankAddress` VARCHAR(191) NULL,
    `remark` VARCHAR(191) NULL,
    `operatorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `forwarders_nickname_key`(`nickname`),
    UNIQUE INDEX `forwarders_creditCode_key`(`creditCode`),
    INDEX `forwarders_operatorId_fkey`(`operatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `product_categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_info` (
    `id` VARCHAR(191) NOT NULL,
    `shopId` INTEGER NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `specification` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `setQuantity` INTEGER NOT NULL DEFAULT 1,
    `internalSize` VARCHAR(191) NULL,
    `externalSize` VARCHAR(191) NULL,
    `weight` DECIMAL(10, 2) NULL,
    `sku` VARCHAR(191) NULL,
    `label` VARCHAR(191) NULL,
    `codeFileUrl` VARCHAR(191) NULL,
    `styleInfo` TEXT NULL,
    `accessoryInfo` TEXT NULL,
    `remark` VARCHAR(191) NULL,
    `operatorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `asin` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `labelFileUrl` VARCHAR(191) NULL,
    `outerBoxSize` VARCHAR(191) NULL,
    `packageInnerSize` VARCHAR(191) NULL,
    `packageOuterSize` VARCHAR(191) NULL,
    `packageType` VARCHAR(191) NULL,
    `packageWeight` VARCHAR(191) NULL,

    UNIQUE INDEX `product_info_sku_key`(`sku`),
    INDEX `product_info_shopId_idx`(`shopId`),
    INDEX `product_info_categoryId_idx`(`categoryId`),
    INDEX `product_info_code_idx`(`code`),
    INDEX `product_info_operatorId_fkey`(`operatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_costs` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `costInfo` VARCHAR(191) NULL,
    `price` VARCHAR(191) NULL,
    `unit` VARCHAR(191) NULL,
    `supplier` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `product_costs_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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

-- CreateTable
CREATE TABLE `finished_inventory` (
    `id` VARCHAR(191) NOT NULL,
    `shopId` INTEGER NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `boxSize` VARCHAR(191) NULL,
    `packQuantity` INTEGER NOT NULL DEFAULT 1,
    `weight` DECIMAL(10, 2) NULL,
    `location` VARCHAR(191) NULL,
    `stockQuantity` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `finished_inventory_shopId_productId_idx`(`shopId`, `productId`),
    INDEX `finished_inventory_location_idx`(`location`),
    INDEX `finished_inventory_categoryId_fkey`(`categoryId`),
    INDEX `finished_inventory_productId_fkey`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spare_inventory` (
    `id` VARCHAR(191) NOT NULL,
    `shopId` INTEGER NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `spareType` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `spare_inventory_shopId_productId_spareType_idx`(`shopId`, `productId`, `spareType`),
    INDEX `spare_inventory_categoryId_fkey`(`categoryId`),
    INDEX `spare_inventory_productId_fkey`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_orders` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `shopId` INTEGER NOT NULL,
    `supplierId` VARCHAR(191) NOT NULL,
    `totalAmount` DECIMAL(12, 2) NOT NULL,
    `discountRate` DECIMAL(5, 2) NULL,
    `discountAmount` DECIMAL(12, 2) NULL,
    `finalAmount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('CREATED', 'PENDING', 'APPROVED', 'CONFIRMED', 'PRODUCTION', 'SHIPPED', 'RECEIVED', 'CANCELLED') NOT NULL DEFAULT 'CREATED',
    `urgent` BOOLEAN NOT NULL DEFAULT false,
    `remark` VARCHAR(191) NULL,
    `operatorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `purchase_orders_orderNumber_key`(`orderNumber`),
    INDEX `purchase_orders_shopId_status_idx`(`shopId`, `status`),
    INDEX `purchase_orders_supplierId_idx`(`supplierId`),
    INDEX `purchase_orders_urgent_idx`(`urgent`),
    INDEX `purchase_orders_operatorId_fkey`(`operatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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

-- CreateTable
CREATE TABLE `financial_reports` (
    `id` VARCHAR(191) NOT NULL,
    `shopId` INTEGER NOT NULL,
    `reportMonth` VARCHAR(191) NOT NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `financial_reports_shopId_reportMonth_key`(`shopId`, `reportMonth`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `packaging_tasks` (
    `id` VARCHAR(191) NOT NULL,
    `shopId` INTEGER NOT NULL,
    `type` ENUM('PACKAGING') NOT NULL DEFAULT 'PACKAGING',
    `progress` DOUBLE NULL DEFAULT 0,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `operatorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `packaging_tasks_shopId_idx`(`shopId`),
    INDEX `packaging_tasks_status_idx`(`status`),
    INDEX `packaging_tasks_operatorId_idx`(`operatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shipment_records` (
    `id` VARCHAR(191) NOT NULL,
    `shopId` INTEGER NOT NULL,
    `country` VARCHAR(191) NULL,
    `channel` VARCHAR(191) NULL,
    `shippingChannel` VARCHAR(191) NULL,
    `warehouseShippingDeadline` DATE NULL,
    `warehouseReceiptDeadline` DATE NULL,
    `shippingDetails` TEXT NULL,
    `date` DATE NOT NULL,
    `status` ENUM('PREPARING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PREPARING',
    `operatorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `shipmentFile` VARCHAR(191) NULL,

    INDEX `shipment_records_shopId_status_idx`(`shopId`, `status`),
    INDEX `shipment_records_date_status_idx`(`date`, `status`),
    INDEX `shipment_records_operatorId_fkey`(`operatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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

-- CreateTable
CREATE TABLE `supply_share_links` (
    `id` VARCHAR(191) NOT NULL,
    `purchaseOrderId` VARCHAR(191) NOT NULL,
    `shareCode` VARCHAR(191) NOT NULL,
    `extractCode` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `accessLimit` INTEGER NULL,
    `accessCount` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `uniqueUserCount` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `supply_share_links_shareCode_key`(`shareCode`),
    INDEX `supply_share_links_shareCode_idx`(`shareCode`),
    INDEX `supply_share_links_purchaseOrderId_idx`(`purchaseOrderId`),
    INDEX `supply_share_links_expiresAt_status_idx`(`expiresAt`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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

-- CreateTable
CREATE TABLE `supply_records` (
    `id` VARCHAR(191) NOT NULL,
    `purchaseOrderId` VARCHAR(191) NOT NULL,
    `shareCode` VARCHAR(191) NOT NULL,
    `supplierInfo` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `remark` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `supply_records_purchaseOrderId_idx`(`purchaseOrderId`),
    INDEX `supply_records_shareCode_idx`(`shareCode`),
    INDEX `supply_records_status_idx`(`status`),
    INDEX `supply_records_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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

-- CreateTable
CREATE TABLE `export_records` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `downloadUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,
    `exportType` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NULL,
    `filters` JSON NULL,
    `operatorId` VARCHAR(191) NOT NULL,

    INDEX `export_records_operatorId_idx`(`operatorId`),
    INDEX `export_records_status_idx`(`status`),
    INDEX `export_records_exportType_idx`(`exportType`),
    INDEX `export_records_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `file_uploads` (
    `id` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `storage` VARCHAR(191) NOT NULL DEFAULT 'oss',
    `uploaderId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `file_uploads_uploaderId_idx`(`uploaderId`),
    INDEX `file_uploads_category_idx`(`category`),
    INDEX `file_uploads_fileType_idx`(`fileType`),
    INDEX `file_uploads_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entity_resources` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `resourceUrl` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `entity_resources_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `entity_resources_entityId_fkey`(`entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `approval_records` ADD CONSTRAINT `approval_records_approverId_fkey` FOREIGN KEY (`approverId`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_roles` ADD CONSTRAINT `account_roles_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_roles` ADD CONSTRAINT `account_roles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shops` ADD CONSTRAINT `shops_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forwarders` ADD CONSTRAINT `forwarders_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_info` ADD CONSTRAINT `product_info_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `product_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_info` ADD CONSTRAINT `product_info_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_info` ADD CONSTRAINT `product_info_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_costs` ADD CONSTRAINT `product_costs_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product_info`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product_info`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `finished_inventory` ADD CONSTRAINT `finished_inventory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `product_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `finished_inventory` ADD CONSTRAINT `finished_inventory_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product_info`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `finished_inventory` ADD CONSTRAINT `finished_inventory_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spare_inventory` ADD CONSTRAINT `spare_inventory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `product_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spare_inventory` ADD CONSTRAINT `spare_inventory_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product_info`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spare_inventory` ADD CONSTRAINT `spare_inventory_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_items` ADD CONSTRAINT `product_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product_info`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_reports` ADD CONSTRAINT `financial_reports_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packaging_tasks` ADD CONSTRAINT `packaging_tasks_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packaging_tasks` ADD CONSTRAINT `packaging_tasks_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipment_records` ADD CONSTRAINT `shipment_records_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipment_records` ADD CONSTRAINT `shipment_records_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipment_product_records` ADD CONSTRAINT `shipment_product_records_forwarderId_fkey` FOREIGN KEY (`forwarderId`) REFERENCES `forwarders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipment_product_records` ADD CONSTRAINT `shipment_product_records_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product_info`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipment_product_records` ADD CONSTRAINT `shipment_product_records_shipmentRecordId_fkey` FOREIGN KEY (`shipmentRecordId`) REFERENCES `shipment_records`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supply_share_access` ADD CONSTRAINT `supply_share_access_shareCode_fkey` FOREIGN KEY (`shareCode`) REFERENCES `supply_share_links`(`shareCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supply_records` ADD CONSTRAINT `supply_records_shareCode_fkey` FOREIGN KEY (`shareCode`) REFERENCES `supply_share_links`(`shareCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supply_record_items` ADD CONSTRAINT `supply_record_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product_info`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supply_record_items` ADD CONSTRAINT `supply_record_items_supplyRecordId_fkey` FOREIGN KEY (`supplyRecordId`) REFERENCES `supply_records`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `export_records` ADD CONSTRAINT `export_records_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_uploads` ADD CONSTRAINT `file_uploads_uploaderId_fkey` FOREIGN KEY (`uploaderId`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entity_resources` ADD CONSTRAINT `entity_resources_entityId_fkey` FOREIGN KEY (`entityId`) REFERENCES `product_info`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

