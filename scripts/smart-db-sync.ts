#!/usr/bin/env tsx

/**
 * 智能数据库同步系统
 * 基于Prisma的完整数据库状态检测和自动修复机制
 * 确保功能迭代时数据库自动同步并保护现有数据
 */

import { PrismaClient } from '../generated/prisma/index.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface SchemaStatus {
  isUpToDate: boolean;
  hasPendingMigrations: boolean;
  hasDrift: boolean;
  migrationDetails: string[];
  issues: string[];
}

interface DataIntegrityReport {
  essential: {
    adminExists: boolean;
    rolesExist: boolean;
    permissionsExist: boolean;
    tablesExist: boolean;
  };
  business: {
    shopsCount: number;
    productsCount: number;
    ordersCount: number;
  };
  issues: string[];
  needsRepair: boolean;
}

interface SyncResult {
  schemaStatus: SchemaStatus;
  dataIntegrity: DataIntegrityReport;
  repairActions: RepairAction[];
  success: boolean;
  summary: string;
}

interface RepairAction {
  type: 'schema' | 'data' | 'permissions';
  action: string;
  description: string;
  executed: boolean;
  result?: any;
  error?: string;
}

class IntelligentSyncEngine {
  private readonly projectRoot: string;
  private readonly migrationsPath: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.migrationsPath = path.join(this.projectRoot, 'prisma', 'migrations');
  }

  /**
   * 检测Prisma Schema状态
   */
  async detectSchemaStatus(): Promise<SchemaStatus> {
    console.log('🔍 检测数据库Schema状态...\n');

    const status: SchemaStatus = {
      isUpToDate: true,
      hasPendingMigrations: false,
      hasDrift: false,
      migrationDetails: [],
      issues: [],
    };

    try {
      // 1. 检查迁移状态
      const migrationStatus = execSync('npx prisma migrate status', {
        encoding: 'utf-8',
        cwd: this.projectRoot,
      });

      console.log('📋 迁移状态:');
      console.log(migrationStatus);

      // 分析迁移状态
      if (migrationStatus.includes('pending')) {
        status.hasPendingMigrations = true;
        status.isUpToDate = false;
        status.issues.push('存在待应用的迁移');
        console.log('⚠️  发现待应用的迁移');
      }

      if (migrationStatus.includes('drift')) {
        status.hasDrift = true;
        status.isUpToDate = false;
        status.issues.push('数据库结构与Schema不一致');
        console.log('⚠️  数据库存在结构偏移');
      }

      // 2. 验证Prisma客户端
      try {
        execSync('npx prisma validate', {
          encoding: 'utf-8',
          cwd: this.projectRoot,
        });
        console.log('✅ Prisma Schema验证通过');
      } catch (error) {
        status.issues.push('Prisma Schema验证失败');
        console.log('❌ Prisma Schema验证失败');
      }

      // 3. 检查生成的客户端
      const clientPath = path.join(this.projectRoot, 'generated', 'prisma');
      if (!fs.existsSync(clientPath)) {
        status.issues.push('Prisma客户端未生成');
        console.log('❌ Prisma客户端未生成');
      } else {
        console.log('✅ Prisma客户端已生成');
      }
    } catch (error) {
      status.issues.push(`Schema检测错误: ${(error as Error).message}`);
      console.error('❌ Schema检测过程中发生错误:', error);
    }

    console.log(`\n📊 Schema状态: ${status.isUpToDate ? '最新' : '需要更新'}`);
    return status;
  }

  /**
   * 检查数据完整性
   */
  async checkDataIntegrity(): Promise<DataIntegrityReport> {
    console.log('\n🔍 检查数据完整性...\n');

    const report: DataIntegrityReport = {
      essential: {
        adminExists: false,
        rolesExist: false,
        permissionsExist: false,
        tablesExist: false,
      },
      business: {
        shopsCount: 0,
        productsCount: 0,
        ordersCount: 0,
      },
      issues: [],
      needsRepair: false,
    };

    try {
      // 1. 检查基础数据表
      const tables = ['accounts', 'roles', 'permissions', 'account_roles', 'role_permissions'];
      let tablesExist = true;

      for (const table of tables) {
        try {
          await prisma.$queryRawUnsafe(`SELECT 1 FROM ${table} LIMIT 1`);
          console.log(`✅ 表 ${table} 存在`);
        } catch (error) {
          console.log(`❌ 表 ${table} 不存在`);
          tablesExist = false;
          report.issues.push(`表 ${table} 不存在`);
        }
      }
      report.essential.tablesExist = tablesExist;

      // 2. 检查admin用户
      const adminCount = await prisma.account.count({
        where: { name: 'admin' },
      });
      report.essential.adminExists = adminCount > 0;
      if (!report.essential.adminExists) {
        report.issues.push('admin用户不存在');
        console.log('❌ admin用户不存在');
      } else {
        console.log('✅ admin用户存在');
      }

      // 3. 检查角色数据
      const roleCount = await prisma.role.count();
      report.essential.rolesExist = roleCount > 0;
      if (!report.essential.rolesExist) {
        report.issues.push('角色数据不存在');
        console.log('❌ 角色数据不存在');
      } else {
        console.log(`✅ 存在 ${roleCount} 个角色`);
      }

      // 4. 检查权限数据
      const permissionCount = await prisma.permission.count();
      report.essential.permissionsExist = permissionCount > 0;
      if (!report.essential.permissionsExist) {
        report.issues.push('权限数据不存在');
        console.log('❌ 权限数据不存在');
      } else {
        console.log(`✅ 存在 ${permissionCount} 个权限`);
      }

      // 5. 检查业务数据
      try {
        report.business.shopsCount = await prisma.shop.count();
        report.business.productsCount = await prisma.productInfo.count();
        report.business.ordersCount = await prisma.purchaseOrder.count();

        console.log('📈 业务数据统计:');
        console.log(`   店铺: ${report.business.shopsCount}`);
        console.log(`   产品: ${report.business.productsCount}`);
        console.log(`   订单: ${report.business.ordersCount}`);
      } catch (error) {
        console.log('⚠️  部分业务表可能不存在，这在初始化阶段是正常的');
      }

      // 判断是否需要修复
      report.needsRepair =
        !report.essential.adminExists ||
        !report.essential.rolesExist ||
        !report.essential.permissionsExist ||
        !report.essential.tablesExist;
    } catch (error) {
      report.issues.push(`数据完整性检查错误: ${(error as Error).message}`);
      console.error('❌ 数据完整性检查过程中发生错误:', error);
      report.needsRepair = true;
    }

    console.log(`\n📊 数据完整性: ${report.needsRepair ? '需要修复' : '正常'}`);
    return report;
  }

  /**
   * 执行Schema同步
   */
  async syncSchema(): Promise<RepairAction[]> {
    console.log('\n🔧 开始Schema同步...\n');

    const actions: RepairAction[] = [];

    try {
      // 1. 生成Prisma客户端
      console.log('📦 生成Prisma客户端...');
      execSync('npx prisma generate', {
        encoding: 'utf-8',
        cwd: this.projectRoot,
      });

      actions.push({
        type: 'schema',
        action: 'generate_client',
        description: '生成Prisma客户端',
        executed: true,
        result: { success: true },
      });

      console.log('✅ Prisma客户端生成完成');

      // 2. 应用数据库迁移
      console.log('🚀 应用数据库迁移...');
      const migrateOutput = execSync('npx prisma migrate deploy', {
        encoding: 'utf-8',
        cwd: this.projectRoot,
      });

      actions.push({
        type: 'schema',
        action: 'migrate_deploy',
        description: '应用数据库迁移',
        executed: true,
        result: { output: migrateOutput },
      });

      console.log('✅ 数据库迁移应用完成');
    } catch (error) {
      actions.push({
        type: 'schema',
        action: 'sync_failed',
        description: 'Schema同步失败',
        executed: false,
        error: (error as Error).message,
      });

      console.error('❌ Schema同步失败:', error);
    }

    return actions;
  }

  /**
   * 修复数据问题
   */
  async repairData(): Promise<RepairAction[]> {
    console.log('\n🔧 开始数据修复...\n');

    const actions: RepairAction[] = [];

    try {
      // 1. 执行生产环境种子数据
      console.log('🌱 执行种子数据...');
      execSync('npm run db:seed:production', {
        encoding: 'utf-8',
        cwd: this.projectRoot,
      });

      actions.push({
        type: 'data',
        action: 'seed_production',
        description: '执行生产环境种子数据',
        executed: true,
        result: { success: true },
      });

      console.log('✅ 种子数据执行完成');

      // 2. 验证admin账户
      console.log('👤 验证admin账户...');
      execSync('npm run admin:fix', {
        encoding: 'utf-8',
        cwd: this.projectRoot,
      });

      actions.push({
        type: 'data',
        action: 'fix_admin',
        description: '修复admin账户',
        executed: true,
        result: { success: true },
      });

      console.log('✅ admin账户验证完成');
    } catch (error) {
      actions.push({
        type: 'data',
        action: 'repair_failed',
        description: '数据修复失败',
        executed: false,
        error: (error as Error).message,
      });

      console.error('❌ 数据修复失败:', error);
    }

    return actions;
  }

  /**
   * 生成同步报告
   */
  generateSyncReport(result: SyncResult): void {
    console.log('\n📊 同步报告\n');
    console.log('='.repeat(50));

    // Schema状态
    console.log('🗄️  Schema状态:');
    console.log(`   状态: ${result.schemaStatus.isUpToDate ? '✅ 最新' : '⚠️  需要更新'}`);
    if (result.schemaStatus.issues.length > 0) {
      console.log('   问题:');
      result.schemaStatus.issues.forEach((issue) => console.log(`     - ${issue}`));
    }

    // 数据完整性
    console.log('\n📋 数据完整性:');
    console.log(`   admin用户: ${result.dataIntegrity.essential.adminExists ? '✅' : '❌'}`);
    console.log(`   角色数据: ${result.dataIntegrity.essential.rolesExist ? '✅' : '❌'}`);
    console.log(`   权限数据: ${result.dataIntegrity.essential.permissionsExist ? '✅' : '❌'}`);
    console.log(`   表结构: ${result.dataIntegrity.essential.tablesExist ? '✅' : '❌'}`);

    // 业务数据统计
    console.log('\n📈 业务数据:');
    console.log(`   店铺: ${result.dataIntegrity.business.shopsCount}`);
    console.log(`   产品: ${result.dataIntegrity.business.productsCount}`);
    console.log(`   订单: ${result.dataIntegrity.business.ordersCount}`);

    // 修复操作
    if (result.repairActions.length > 0) {
      console.log('\n🔧 执行的修复操作:');
      result.repairActions.forEach((action) => {
        const status = action.executed ? '✅' : '❌';
        console.log(`   ${status} ${action.description}`);
        if (action.error) {
          console.log(`     错误: ${action.error}`);
        }
      });
    }

    // 总结
    console.log('\n' + '='.repeat(50));
    console.log(`🎯 同步结果: ${result.success ? '✅ 成功' : '❌ 失败'}`);
    console.log(`📝 摘要: ${result.summary}`);

    if (result.success) {
      console.log('\n🎉 数据库同步完成！系统已准备就绪。');
      console.log('\n📋 可以使用以下账户登录:');
      console.log('   用户名: admin');
      console.log('   密码: 123456');
    } else {
      console.log('\n⚠️  同步过程中出现问题，请检查上述错误信息。');
    }
  }

  /**
   * 主同步流程
   */
  async synchronizeDatabase(): Promise<SyncResult> {
    console.log('🚀 智能数据库同步系统启动\n');
    console.log('目标: 确保数据库状态与代码同步，保护现有数据\n');

    const result: SyncResult = {
      schemaStatus: {} as SchemaStatus,
      dataIntegrity: {} as DataIntegrityReport,
      repairActions: [],
      success: false,
      summary: '',
    };

    try {
      // 1. 检测Schema状态
      result.schemaStatus = await this.detectSchemaStatus();

      // 2. 检查数据完整性
      result.dataIntegrity = await this.checkDataIntegrity();

      // 3. 执行修复操作
      if (!result.schemaStatus.isUpToDate) {
        const schemaActions = await this.syncSchema();
        result.repairActions.push(...schemaActions);
      }

      if (result.dataIntegrity.needsRepair) {
        const dataActions = await this.repairData();
        result.repairActions.push(...dataActions);
      }

      // 4. 重新验证（如果执行了修复）
      if (result.repairActions.length > 0) {
        console.log('\n🔄 重新验证修复结果...');
        result.dataIntegrity = await this.checkDataIntegrity();
      }

      // 5. 判断整体成功状态
      const hasFailedActions = result.repairActions.some((action) => !action.executed);
      const finalDataOk = !result.dataIntegrity.needsRepair;

      result.success = !hasFailedActions && finalDataOk;
      result.summary = result.success
        ? '数据库同步成功，所有系统组件正常运行'
        : '同步过程中出现问题，部分功能可能受影响';
    } catch (error) {
      result.success = false;
      result.summary = `同步过程发生严重错误: ${(error as Error).message}`;
      console.error('❌ 同步过程中发生严重错误:', error);
    } finally {
      await prisma.$disconnect();
    }

    return result;
  }
}

// 主执行函数
async function main() {
  const syncEngine = new IntelligentSyncEngine();
  const result = await syncEngine.synchronizeDatabase();

  // 生成报告
  syncEngine.generateSyncReport(result);

  // 根据结果设置退出码
  process.exit(result.success ? 0 : 1);
}

// 错误处理
main().catch((error) => {
  console.error('❌ 智能同步系统启动失败:', error);
  process.exit(1);
});
