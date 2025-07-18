#!/usr/bin/env node
const { PrismaClient } = require('../generated/prisma');
const fs = require('fs');
const path = require('path');

class MigrationExporter {
  constructor() {
    this.prisma = new PrismaClient();
    this.outputFile = 'deployment/migration-sync.sql';
  }

  async export() {
    console.log('📤 导出迁移记录...');

    try {
      // 确保输出目录存在
      const outputDir = path.dirname(this.outputFile);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // 获取所有迁移记录
      const migrations = await this.prisma.$queryRaw`
        SELECT * FROM _prisma_migrations ORDER BY started_at;
      `;

      // 生成同步SQL
      const syncSQL = this.generateSyncSQL(migrations);

      // 写入文件
      fs.writeFileSync(this.outputFile, syncSQL);

      console.log(`✅ 导出完成: ${migrations.length} 条迁移记录`);
      console.log(`📁 输出文件: ${this.outputFile}`);
    } catch (error) {
      console.error('❌ 导出失败:', error);
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  generateSyncSQL(migrations) {
    const header = `-- _prisma_migrations 同步脚本
-- 自动生成于: ${new Date().toISOString()}
-- 记录数量: ${migrations.length}

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
`;

    const insertStatements = migrations
      .map((m) => {
        const values = [
          `'${m.id}'`,
          `'${m.checksum}'`,
          m.finished_at ? `'${m.finished_at.toISOString()}'` : 'NULL',
          `'${m.migration_name}'`,
          m.logs ? `'${m.logs.replace(/'/g, "''")}'` : 'NULL',
          m.rolled_back_at ? `'${m.rolled_back_at.toISOString()}'` : 'NULL',
          `'${m.started_at.toISOString()}'`,
          m.applied_steps_count,
        ];

        return `INSERT IGNORE INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES (${values.join(', ')});`;
      })
      .join('\n');

    return `${header}${insertStatements}\n`;
  }
}

// 执行导出
if (require.main === module) {
  new MigrationExporter().export();
}

module.exports = MigrationExporter;
