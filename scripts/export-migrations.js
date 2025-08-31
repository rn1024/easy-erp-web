#!/usr/bin/env node

/**
 * 导出Prisma迁移记录脚本
 * 用于在提交前生成迁移同步文件
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEPLOYMENT_DIR = path.join(__dirname, '../deployment');
const MIGRATION_SYNC_FILE = path.join(DEPLOYMENT_DIR, 'migration-sync.sql');

try {
  console.log('🔄 开始导出迁移记录...');
  
  // 确保deployment目录存在
  if (!fs.existsSync(DEPLOYMENT_DIR)) {
    fs.mkdirSync(DEPLOYMENT_DIR, { recursive: true });
    console.log('📁 创建deployment目录');
  }
  
  // 生成Prisma迁移SQL
  try {
    const migrationSql = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..')
    });
    
    // 写入迁移同步文件
    const syncContent = `-- Migration Sync File\n-- Generated at: ${new Date().toISOString()}\n-- This file contains the current schema state\n\n${migrationSql}`;
    
    fs.writeFileSync(MIGRATION_SYNC_FILE, syncContent);
    console.log('✅ 迁移记录已导出到:', MIGRATION_SYNC_FILE);
    
  } catch (prismaError) {
    console.warn('⚠️  Prisma迁移生成失败，创建空的同步文件');
    const fallbackContent = `-- Migration Sync File\n-- Generated at: ${new Date().toISOString()}\n-- Prisma migration generation failed, manual review required\n\n-- No migrations to sync\n`;
    fs.writeFileSync(MIGRATION_SYNC_FILE, fallbackContent);
  }
  
} catch (error) {
  console.error('❌ 导出迁移记录失败:', error.message);
  
  // 创建空的同步文件以避免阻塞提交
  const errorContent = `-- Migration Sync File\n-- Generated at: ${new Date().toISOString()}\n-- Error occurred during migration export\n\n-- Error: ${error.message}\n`;
  
  if (!fs.existsSync(DEPLOYMENT_DIR)) {
    fs.mkdirSync(DEPLOYMENT_DIR, { recursive: true });
  }
  
  fs.writeFileSync(MIGRATION_SYNC_FILE, errorContent);
  console.log('📝 已创建错误记录文件');
}

console.log('🎉 迁移导出脚本执行完成');