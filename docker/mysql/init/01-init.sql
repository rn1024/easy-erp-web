-- 确保数据库使用UTF8MB4字符集
ALTER DATABASE easy_erp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户并授权（如果需要）
-- GRANT ALL PRIVILEGES ON easy_erp_db.* TO 'erp_user'@'%';
-- FLUSH PRIVILEGES;
