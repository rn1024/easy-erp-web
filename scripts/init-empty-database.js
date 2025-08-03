#!/usr/bin/env node
const { PrismaClient } = require('../generated/prisma');
const { execSync } = require('child_process');
const fs = require('fs');

class EmptyDatabaseInit {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async execute() {
    console.log('🚀 开始空数据库初始化...');

    try {
      // 1. 测试数据库连接
      await this.testConnection();

      // 2. 检查数据库是否为空
      const isEmpty = await this.checkIfDatabaseEmpty();
      
      if (!isEmpty) {
        console.log('ℹ️  数据库不为空，使用常规迁移流程');
        // 使用现有的同步迁移脚本
        execSync('node scripts/sync-and-migrate.js', { stdio: 'inherit' });
        return;
      }

      console.log('✅ 检测到空数据库，开始初始化...');

      // 3. 生成Prisma客户端
      console.log('🔧 生成Prisma客户端...');
      execSync('npx prisma generate', { stdio: 'inherit' });

      // 4. 直接执行迁移部署（适用于空数据库）
      console.log('📦 执行数据库迁移部署...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });

      // 5. 验证表结构创建
      await this.verifyTablesCreated();

      // 6. 验证迁移状态
      await this.verifyMigrationStatus();

      console.log('✅ 空数据库初始化完成!');
    } catch (error) {
      console.error('❌ 空数据库初始化失败:', error.message);
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async testConnection() {
    console.log('🔍 测试数据库连接...');
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      console.log('✅ 数据库连接成功');
    } catch (error) {
      throw new Error(`数据库连接失败: ${error.message}`);
    }
  }

  async checkIfDatabaseEmpty() {
    console.log('🔍 检查数据库是否为空...');
    try {
      // 检查是否有任何表存在
      const tables = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE';
      `;
      
      const tableCount = tables[0].count;
      console.log(`📊 数据库中共有 ${tableCount} 个表`);
      
      return tableCount === 0;
    } catch (error) {
      console.log('⚠️  检查数据库状态失败，假设为空数据库:', error.message);
      return true;
    }
  }

  async verifyTablesCreated() {
    console.log('🔍 验证表结构创建...');
    try {
      // 检查关键表是否存在
      const keyTables = ['accounts', 'roles', 'permissions', 'shops', 'suppliers'];
      
      for (const tableName of keyTables) {
        const result = await this.prisma.$queryRaw`
          SELECT COUNT(*) as count FROM information_schema.tables 
          WHERE table_schema = DATABASE() AND table_name = ${tableName};
        `;
        
        if (result[0].count === 0) {
          throw new Error(`关键表 ${tableName} 未创建`);
        }
        console.log(`✅ 表 ${tableName} 创建成功`);
      }
      
      console.log('✅ 所有关键表结构验证通过');
    } catch (error) {
      throw new Error(`表结构验证失败: ${error.message}`);
    }
  }

  async verifyMigrationStatus() {
    console.log('🔍 验证迁移状态...');
    try {
      const statusOutput = execSync('npx prisma migrate status', { encoding: 'utf8' });
      
      if (statusOutput.includes('Database schema is up to date')) {
        console.log('✅ 迁移状态正常');
      } else if (statusOutput.includes('No pending migrations')) {
        console.log('✅ 没有待应用的迁移');
      } else {
        console.warn('⚠️  迁移状态异常:', statusOutput);
      }
    } catch (error) {
      console.warn('⚠️  状态验证失败:', error.message);
    }
  }
}

// 执行空数据库初始化
if (require.main === module) {
  new EmptyDatabaseInit().execute();
}

module.exports = EmptyDatabaseInit;