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

      // 4. 执行标准迁移（带基线处理）
      console.log('📦 执行数据库迁移...');
      try {
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      } catch (error) {
        console.log('⚠️  迁移失败，错误信息:', error.message);

        // 如果是基线错误，尝试设置基线
        if (
          error.message.includes('P3005') ||
          error.message.includes('database schema is not empty') ||
          error.message.includes('The database schema is not empty')
        ) {
          console.log('⚠️  检测到基线问题，尝试设置迁移基线...');
          await this.handleBaseline();

          // 基线设置后，再次尝试迁移
          console.log('🔄 基线设置完成，重新尝试迁移...');
          try {
            execSync('npx prisma migrate deploy', { stdio: 'inherit' });
            console.log('✅ 迁移成功完成');
          } catch (retryError) {
            console.error('❌ 重试迁移仍然失败:', retryError.message);
            throw retryError;
          }
        } else {
          throw error;
        }
      }

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

  async handleBaseline() {
    console.log('🔧 处理迁移基线...');

    try {
      // 获取所有迁移文件
      const migrationsDir = 'prisma/migrations';
      const migrationFolders = fs
        .readdirSync(migrationsDir)
        .filter((name) => fs.statSync(`${migrationsDir}/${name}`).isDirectory())
        .sort();

      if (migrationFolders.length === 0) {
        console.log('ℹ️  没有找到迁移文件');
        return;
      }

      console.log(`📋 找到 ${migrationFolders.length} 个迁移文件`);

      // 为每个迁移设置基线
      for (const folder of migrationFolders) {
        const migrationName = folder;
        console.log(`🔧 设置基线: ${migrationName}`);

        try {
          execSync(`npx prisma migrate resolve --applied ${migrationName}`, {
            stdio: 'inherit',
          });
          console.log(`✅ 基线设置成功: ${migrationName}`);
        } catch (baselineError) {
          console.warn(`⚠️  基线设置失败: ${migrationName}`, baselineError.message);
        }
      }

      console.log('✅ 基线处理完成');
    } catch (error) {
      console.warn('⚠️  基线处理失败:', error.message);
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
