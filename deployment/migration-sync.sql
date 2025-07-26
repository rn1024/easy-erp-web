-- _prisma_migrations 同步脚本
-- 自动生成于: 2025-07-26T06:45:15.434Z
-- 记录数量: 4

-- 创建迁移表
CREATE TABLE IF NOT EXISTS _prisma_migrations (
  id VARCHAR(36) NOT NULL,
  checksum VARCHAR(64) NOT NULL,
  finished_at DATETIME(3) NULL,
  migration_name VARCHAR(255) NOT NULL,
  logs TEXT NULL,
  rolled_back_at DATETIME(3) NULL,
  started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  applied_steps_count INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 同步迁移记录
INSERT IGNORE INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('8dcc7779-3852-472d-bd35-ad26f69568a7', 'a79851db8d29090fec3ba592eb1a74bf580e79afe7eb0fdf340e41be13973f34', NULL, '20250718030000_add_finalamount_safely', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20250718030000_add_finalamount_safely

Database error code: 1060

Database error:
Duplicate column name ''finalAmount''

Please check the query number 1 from the migration file.

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20250718030000_add_finalamount_safely"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113
   1: schema_commands::commands::apply_migrations::Applying migration
           with migration_name="20250718030000_add_finalamount_safely"
             at schema-engine/commands/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:236', '2025-07-18T03:14:36.443Z', '2025-07-18T03:14:19.509Z', 0);
INSERT IGNORE INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('78cda2ce-da72-4842-8888-36d50991e7a0', 'a79851db8d29090fec3ba592eb1a74bf580e79afe7eb0fdf340e41be13973f34', '2025-07-18T03:14:36.445Z', '20250718030000_add_finalamount_safely', NULL, NULL, '2025-07-18T03:14:36.445Z', 0);
INSERT IGNORE INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('e9f5fd42-b500-4ffa-bc6b-92a82a1eb5e0', 'a2116ccdf49053b5a483b113cba774256385d44c06099d43aa0c811a26921fab', NULL, '20250718031500_complete_schema_sync', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20250718031500_complete_schema_sync

Database error code: 1050

Database error:
Table ''approval_records'' already exists

Please check the query number 1 from the migration file.

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20250718031500_complete_schema_sync"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113
   1: schema_commands::commands::apply_migrations::Applying migration
           with migration_name="20250718031500_complete_schema_sync"
             at schema-engine/commands/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:236', '2025-07-18T03:14:54.480Z', '2025-07-18T03:14:41.866Z', 0);
INSERT IGNORE INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('5971220a-c712-4fe4-9264-ee737dcac46e', 'a2116ccdf49053b5a483b113cba774256385d44c06099d43aa0c811a26921fab', '2025-07-18T03:14:54.484Z', '20250718031500_complete_schema_sync', NULL, NULL, '2025-07-18T03:14:54.484Z', 0);
