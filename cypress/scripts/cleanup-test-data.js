#!/usr/bin/env node

/**
 * 测试数据清理脚本
 * 用于清理E2E测试产生的数据，保持环境干净
 */

import fs from 'fs';
import path from 'path';

// 测试数据文件路径
const testDataDir = path.join(__dirname, '..', 'fixtures');
const backupDir = path.join(__dirname, '..', 'backups');

// 测试数据类型
const testDataTypes = [
  'customers',
  'suppliers',
  'products',
  'orders',
  'inventory',
  'purchase-orders',
  'delivery-records',
  'receivables',
  'payables',
  'users',
  'roles',
  'permissions'
];

/**
 * 创建备份目录
 */
function ensureBackupDir() {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
}

/**
 * 备份测试数据
 */
function backupTestData() {
  console.log('🔍 开始备份测试数据...');
  ensureBackupDir();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}`);
  
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }
  
  testDataTypes.forEach(type => {
    const sourcePath = path.join(testDataDir, `${type}.json`);
    const destPath = path.join(backupPath, `${type}.json`);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ 备份 ${type} 数据完成`);
    }
  });
  
  console.log(`📁 备份已保存到: ${backupPath}`);
  return backupPath;
}

/**
 * 清理测试数据
 */
function cleanupTestData() {
  console.log('🧹 开始清理测试数据...');
  
  let cleanedCount = 0;
  
  testDataTypes.forEach(type => {
    const filePath = path.join(testDataDir, `${type}.json`);
    
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // 过滤掉测试数据（以test_开头的ID）
        if (Array.isArray(data)) {
          const cleanedData = data.filter(item => 
            !item.id?.toString().startsWith('test_') && 
            !item.name?.toString().includes('测试') &&
            !item.email?.toString().includes('test@')
          );
          
          if (cleanedData.length !== data.length) {
            fs.writeFileSync(filePath, JSON.stringify(cleanedData, null, 2));
            cleanedCount += (data.length - cleanedData.length);
            console.log(`✅ 清理 ${type}: ${data.length - cleanedData.length} 条记录`);
          }
        }
      } catch (error) {
        console.error(`❌ 清理 ${type} 失败:`, error.message);
      }
    }
  });
  
  console.log(`🎯 共清理 ${cleanedCount} 条测试数据`);
  return cleanedCount;
}

/**
 * 重置测试数据为默认值
 */
function resetTestData() {
  console.log('🔄 开始重置测试数据...');
  
  const defaultData = {
    'customers.json': [
      {
        "id": 1,
        "companyName": "示例客户",
        "contactName": "张三",
        "phone": "138-0013-8000",
        "email": "example@company.com",
        "address": "北京市朝阳区"
      }
    ],
    'suppliers.json': [
      {
        "id": 1,
        "companyName": "示例供应商",
        "contactName": "李四",
        "phone": "139-0013-9000",
        "email": "supplier@company.com",
        "address": "上海市浦东新区"
      }
    ],
    'products.json': [
      {
        "id": 1,
        "name": "示例产品",
        "sku": "EX-001",
        "category": "示例分类",
        "price": 100.00,
        "stock": 1000
      }
    ]
  };
  
  Object.entries(defaultData).forEach(([filename, data]) => {
    const filePath = path.join(testDataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ 重置 ${filename} 完成`);
  });
  
  console.log('🎯 测试数据已重置为默认值');
}

/**
 * 删除旧备份（保留最近7天的备份）
 */
function cleanupOldBackups() {
  console.log('🗑️ 开始清理旧备份...');
  
  if (!fs.existsSync(backupDir)) {
    console.log('📁 备份目录不存在，跳过清理');
    return;
  }
  
  const backups = fs.readdirSync(backupDir)
    .filter(name => name.startsWith('backup-'))
    .map(name => ({
      name,
      path: path.join(backupDir, name),
      mtime: fs.statSync(path.join(backupDir, name)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7);
  
  let deletedCount = 0;
  
  backups.forEach(backup => {
    if (backup.mtime < cutoffDate) {
      fs.rmSync(backup.path, { recursive: true, force: true });
      deletedCount++;
      console.log(`🗑️ 删除旧备份: ${backup.name}`);
    }
  });
  
  console.log(`🎯 共删除 ${deletedCount} 个旧备份`);
}

/**
 * 生成清理报告
 */
function generateCleanupReport(backupPath, cleanedCount, options) {
  const report = {
    timestamp: new Date().toISOString(),
    backupPath,
    cleanedRecords: cleanedCount,
    options,
    summary: {
      totalTypes: testDataTypes.length,
      processedTypes: testDataTypes.filter(type => {
        const filePath = path.join(testDataDir, `${type}.json`);
        return fs.existsSync(filePath);
      }).length
    }
  };
  
  const reportPath = path.join(backupDir, `cleanup-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📊 清理报告已生成: ${reportPath}`);
  return report;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const options = {
    backup: args.includes('--backup') || args.includes('-b'),
    cleanup: args.includes('--cleanup') || args.includes('-c'),
    reset: args.includes('--reset') || args.includes('-r'),
    quiet: args.includes('--quiet') || args.includes('-q'),
    help: args.includes('--help') || args.includes('-h')
  };
  
  if (options.help) {
    console.log(`
测试数据清理脚本

用法: node cleanup-test-data.js [选项]

选项:
  -b, --backup    备份测试数据
  -c, --cleanup   清理测试数据
  -r, --reset     重置测试数据为默认值
  -q, --quiet     静默模式
  -h, --help      显示帮助信息

示例:
  node cleanup-test-data.js --backup --cleanup
  node cleanup-test-data.js --reset
  node cleanup-test-data.js -c -q
    `);
    return;
  }
  
  if (!options.backup && !options.cleanup && !options.reset) {
    // 默认执行备份和清理
    options.backup = true;
    options.cleanup = true;
  }
  
  try {
    console.log('🚀 开始测试数据清理任务...\n');
    
    let backupPath = null;
    let cleanedCount = 0;
    
    if (options.backup) {
      backupPath = backupTestData();
    }
    
    if (options.reset) {
      resetTestData();
    } else if (options.cleanup) {
      cleanedCount = cleanupTestData();
    }
    
    cleanupOldBackups();
    
    if (!options.quiet) {
      generateCleanupReport(backupPath, cleanedCount, options);
    }
    
    console.log('\n✅ 测试数据清理任务完成！');
    
  } catch (error) {
    console.error('❌ 清理任务失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  backupTestData,
  cleanupTestData,
  resetTestData,
  cleanupOldBackups,
  generateCleanupReport
};