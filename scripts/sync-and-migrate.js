#!/usr/bin/env node
const { PrismaClient } = require('../generated/prisma');
const { execSync } = require('child_process');
const fs = require('fs');

class SyncAndMigrate {
  constructor() {
    this.prisma = new PrismaClient();
    this.syncFile = 'deployment/migration-sync.sql';
  }

  async execute() {
    console.log('🚀 开始同步和迁移...');

    try {
      // 1. 检查是否需要同步
      const needsSync = await this.checkIfNeedsSync();

      if (needsSync) {
        // 2. 执行迁移记录同步
        await this.syncMigrationRecords();
      }

      // 3. 生成Prisma客户端
      console.log('🔧 生成Prisma客户端...');
      execSync('npx prisma generate', { stdio: 'inherit' });

      // 4. 执行标准迁移
      console.log('📦 执行数据库迁移...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });

      // 5. 验证最终状态
      await this.verifyStatus();

      console.log('✅ 同步和迁移完成!');
    } catch (error) {
      console.error('❌ 同步和迁移失败:', error);
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async checkIfNeedsSync() {
    try {
      // 检查同步文件是否存在
      if (!fs.existsSync(this.syncFile)) {
        console.log('ℹ️  无同步文件，跳过同步');
        return false;
      }

      // 检查_prisma_migrations表是否存在
      const tableCheck = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = '_prisma_migrations';
      `;

      if (tableCheck[0].count === 0) {
        console.log('⚠️  _prisma_migrations表不存在，需要同步');
        return true;
      }

      // 检查迁移记录数量
      const recordCount = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM _prisma_migrations;
      `;

      if (recordCount[0].count === 0) {
        console.log('⚠️  迁移记录为空，需要同步');
        return true;
      }

      console.log('✅ 迁移记录存在，跳过同步');
      return false;
    } catch (error) {
      console.log('⚠️  检查失败，执行同步:', error.message);
      return true;
    }
  }

  async syncMigrationRecords() {
    console.log('🔄 同步迁移记录...');

    try {
      const syncSQL = fs.readFileSync(this.syncFile, 'utf8');

      // 分割SQL语句并逐个执行
      const statements = syncSQL
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        await this.prisma.$executeRawUnsafe(statement);
      }

      console.log('✅ 迁移记录同步完成');
    } catch (error) {
      throw new Error(`迁移记录同步失败: ${error.message}`);
    }
  }

  async verifyStatus() {
    console.log('🔍 验证迁移状态...');

    try {
      const statusOutput = execSync('npx prisma migrate status', { encoding: 'utf8' });

      if (statusOutput.includes('Database schema is up to date')) {
        console.log('✅ 迁移状态正常');
      } else {
        console.warn('⚠️  迁移状态异常:', statusOutput);
      }
    } catch (error) {
      console.warn('⚠️  状态验证失败:', error.message);
    }
  }
}

// 执行同步和迁移
if (require.main === module) {
  new SyncAndMigrate().execute();
}

module.exports = SyncAndMigrate;
