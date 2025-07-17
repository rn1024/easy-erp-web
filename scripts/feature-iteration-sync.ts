#!/usr/bin/env tsx

/**
 * 功能迭代集成系统
 * 支持新功能的渐进式数据库更新和自动化流程
 * 确保现有数据保护和平滑功能发布
 */

import { PrismaClient } from '../generated/prisma/index.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface FeatureIterationConfig {
  version: string;
  description: string;
  migrations: MigrationStep[];
  seedData: SeedDataStep[];
  rollbackPlan: RollbackStep[];
}

interface MigrationStep {
  id: string;
  description: string;
  type: 'schema' | 'data' | 'index';
  sql?: string;
  prismaCommand?: string;
  safety: 'safe' | 'caution' | 'dangerous';
  dependencies: string[];
}

interface SeedDataStep {
  id: string;
  description: string;
  type: 'permissions' | 'roles' | 'business_data';
  data: any;
  condition?: string;
}

interface RollbackStep {
  id: string;
  description: string;
  action: string;
  order: number;
}

interface IterationResult {
  version: string;
  success: boolean;
  migrationsApplied: string[];
  seedDataApplied: string[];
  rollbackPoint?: string;
  errors: string[];
  warnings: string[];
  summary: string;
}

class FeatureIterationManager {
  private readonly projectRoot: string;
  private readonly configurationsPath: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.configurationsPath = path.join(this.projectRoot, 'feature-configs');
    this.ensureConfigDirectory();
  }

  /**
   * 确保配置目录存在
   */
  private ensureConfigDirectory(): void {
    if (!fs.existsSync(this.configurationsPath)) {
      fs.mkdirSync(this.configurationsPath, { recursive: true });
      console.log('📁 创建功能配置目录:', this.configurationsPath);
    }
  }

  /**
   * 创建功能迭代配置
   */
  async createFeatureConfig(version: string, description: string): Promise<void> {
    const config: FeatureIterationConfig = {
      version,
      description,
      migrations: [],
      seedData: [],
      rollbackPlan: [],
    };

    const configPath = path.join(this.configurationsPath, `${version}.json`);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log(`✅ 创建功能配置: ${configPath}`);
    console.log(`📋 版本: ${version}`);
    console.log(`📝 描述: ${description}`);
  }

  /**
   * 加载功能配置
   */
  private loadFeatureConfig(version: string): FeatureIterationConfig {
    const configPath = path.join(this.configurationsPath, `${version}.json`);

    if (!fs.existsSync(configPath)) {
      throw new Error(`功能配置不存在: ${version}`);
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  }

  /**
   * 检测待应用的功能更新
   */
  async detectPendingFeatures(): Promise<string[]> {
    console.log('🔍 检测待应用的功能更新...\n');

    const pendingFeatures: string[] = [];

    if (!fs.existsSync(this.configurationsPath)) {
      console.log('📋 没有发现功能配置目录');
      return pendingFeatures;
    }

    const configFiles = fs
      .readdirSync(this.configurationsPath)
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace('.json', ''));

    for (const version of configFiles) {
      try {
        const config = this.loadFeatureConfig(version);

        // 检查是否已应用
        const isApplied = await this.isFeatureApplied(version);

        if (!isApplied) {
          pendingFeatures.push(version);
          console.log(`📦 待应用功能: ${version} - ${config.description}`);
        } else {
          console.log(`✅ 已应用功能: ${version} - ${config.description}`);
        }
      } catch (error) {
        console.warn(`⚠️  无法加载配置: ${version} - ${(error as Error).message}`);
      }
    }

    if (pendingFeatures.length === 0) {
      console.log('🎉 所有功能都已是最新版本');
    }

    return pendingFeatures;
  }

  /**
   * 检查功能是否已应用
   */
  private async isFeatureApplied(version: string): Promise<boolean> {
    try {
      // 检查功能应用记录表（如果存在）
      const result = (await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'feature_applications'
      `) as any[];

      if (result[0].count > 0) {
        const applications = (await prisma.$queryRawUnsafe(
          `
          SELECT version FROM feature_applications WHERE version = ?
        `,
          version
        )) as any[];

        return applications.length > 0;
      }

      // 如果表不存在，假设功能未应用
      return false;
    } catch (error) {
      console.warn(`⚠️  检查功能应用状态时出错: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * 创建功能应用记录表
   */
  private async ensureFeatureTrackingTable(): Promise<void> {
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS feature_applications (
          id VARCHAR(191) NOT NULL PRIMARY KEY,
          version VARCHAR(191) NOT NULL UNIQUE,
          description TEXT,
          applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          applied_by VARCHAR(191) NOT NULL DEFAULT 'system'
        )
      `;
      console.log('✅ 功能追踪表已准备');
    } catch (error) {
      console.error('❌ 创建功能追踪表失败:', error);
    }
  }

  /**
   * 创建回滚点
   */
  async createRollbackPoint(version: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rollbackId = `rollback_${version}_${timestamp}`;

    try {
      // 这里可以创建数据库备份或保存关键状态
      console.log(`📸 创建回滚点: ${rollbackId}`);

      // 保存当前迁移状态
      const migrationStatus = execSync('npx prisma migrate status', {
        encoding: 'utf-8',
        cwd: this.projectRoot,
      });

      const rollbackData = {
        id: rollbackId,
        version,
        timestamp,
        migrationStatus,
        createdAt: new Date().toISOString(),
      };

      const rollbackPath = path.join(this.projectRoot, 'rollbacks', `${rollbackId}.json`);
      fs.mkdirSync(path.dirname(rollbackPath), { recursive: true });
      fs.writeFileSync(rollbackPath, JSON.stringify(rollbackData, null, 2));

      console.log(`✅ 回滚点已创建: ${rollbackPath}`);
      return rollbackId;
    } catch (error) {
      console.error('❌ 创建回滚点失败:', error);
      throw error;
    }
  }

  /**
   * 应用功能迭代
   */
  async applyFeatureIteration(version: string): Promise<IterationResult> {
    console.log(`\n🚀 开始应用功能迭代: ${version}\n`);

    const result: IterationResult = {
      version,
      success: false,
      migrationsApplied: [],
      seedDataApplied: [],
      errors: [],
      warnings: [],
      summary: '',
    };

    try {
      // 1. 加载功能配置
      const config = this.loadFeatureConfig(version);
      console.log(`📋 加载配置: ${config.description}`);

      // 2. 确保功能追踪表存在
      await this.ensureFeatureTrackingTable();

      // 3. 创建回滚点
      result.rollbackPoint = await this.createRollbackPoint(version);

      // 4. 执行迁移步骤
      for (const migration of config.migrations) {
        try {
          console.log(`🔧 执行迁移: ${migration.description}`);

          if (migration.safety === 'dangerous') {
            console.warn(`⚠️  危险操作: ${migration.description}`);
            result.warnings.push(`危险操作: ${migration.description}`);
          }

          await this.executeMigrationStep(migration);
          result.migrationsApplied.push(migration.id);

          console.log(`✅ 迁移完成: ${migration.id}`);
        } catch (error) {
          const errorMsg = `迁移失败 ${migration.id}: ${(error as Error).message}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
          throw error;
        }
      }

      // 5. 执行种子数据
      for (const seedStep of config.seedData) {
        try {
          console.log(`🌱 执行种子数据: ${seedStep.description}`);

          await this.executeSeedStep(seedStep);
          result.seedDataApplied.push(seedStep.id);

          console.log(`✅ 种子数据完成: ${seedStep.id}`);
        } catch (error) {
          const errorMsg = `种子数据失败 ${seedStep.id}: ${(error as Error).message}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
          // 种子数据失败通常不是致命的，继续执行
        }
      }

      // 6. 记录功能应用
      await this.recordFeatureApplication(version, config.description);

      // 7. 验证应用结果
      const isApplied = await this.isFeatureApplied(version);
      result.success = isApplied && result.errors.length === 0;

      result.summary = result.success
        ? `功能 ${version} 应用成功，包含 ${result.migrationsApplied.length} 个迁移和 ${result.seedDataApplied.length} 个种子数据步骤`
        : `功能 ${version} 应用失败，发生 ${result.errors.length} 个错误`;
    } catch (error) {
      result.errors.push(`功能应用失败: ${(error as Error).message}`);
      result.summary = `功能 ${version} 应用过程发生严重错误`;
      console.error('❌ 功能应用过程中发生严重错误:', error);
    }

    return result;
  }

  /**
   * 执行迁移步骤
   */
  private async executeMigrationStep(step: MigrationStep): Promise<void> {
    if (step.prismaCommand) {
      execSync(step.prismaCommand, {
        encoding: 'utf-8',
        cwd: this.projectRoot,
      });
    } else if (step.sql) {
      await prisma.$executeRawUnsafe(step.sql);
    } else {
      throw new Error(`迁移步骤 ${step.id} 没有有效的执行命令`);
    }
  }

  /**
   * 执行种子数据步骤
   */
  private async executeSeedStep(step: SeedDataStep): Promise<void> {
    switch (step.type) {
      case 'permissions':
        await this.seedPermissions(step.data);
        break;
      case 'roles':
        await this.seedRoles(step.data);
        break;
      case 'business_data':
        await this.seedBusinessData(step.data);
        break;
      default:
        throw new Error(`未知的种子数据类型: ${step.type}`);
    }
  }

  /**
   * 种子权限数据
   */
  private async seedPermissions(permissions: any[]): Promise<void> {
    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { code: permission.code },
        update: permission,
        create: permission,
      });
    }
  }

  /**
   * 种子角色数据
   */
  private async seedRoles(roles: any[]): Promise<void> {
    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: role,
        create: role,
      });
    }
  }

  /**
   * 种子业务数据
   */
  private async seedBusinessData(data: any): Promise<void> {
    // 根据具体的业务数据类型执行相应操作
    console.log('执行业务数据种子:', data);
  }

  /**
   * 记录功能应用
   */
  private async recordFeatureApplication(version: string, description: string): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO feature_applications (id, version, description, applied_at, applied_by)
        VALUES (?, ?, ?, NOW(), 'system')
        ON DUPLICATE KEY UPDATE applied_at = NOW()
      `,
        `feature_${version}`,
        version,
        description
      );

      console.log(`✅ 记录功能应用: ${version}`);
    } catch (error) {
      console.error('❌ 记录功能应用失败:', error);
    }
  }

  /**
   * 批量应用所有待处理功能
   */
  async applyAllPendingFeatures(): Promise<IterationResult[]> {
    console.log('🚀 开始批量应用所有待处理功能\n');

    const pendingFeatures = await this.detectPendingFeatures();
    const results: IterationResult[] = [];

    if (pendingFeatures.length === 0) {
      console.log('🎉 没有待处理的功能更新');
      return results;
    }

    // 按版本排序（确保按正确顺序应用）
    const sortedFeatures = pendingFeatures.sort();

    for (const version of sortedFeatures) {
      console.log(`\n📦 处理功能版本: ${version}`);

      const result = await this.applyFeatureIteration(version);
      results.push(result);

      if (!result.success) {
        console.error(`❌ 功能 ${version} 应用失败，停止后续功能应用`);
        break;
      }

      console.log(`✅ 功能 ${version} 应用成功`);
    }

    return results;
  }

  /**
   * 生成功能迭代报告
   */
  generateIterationReport(results: IterationResult[]): void {
    console.log('\n📊 功能迭代报告\n');
    console.log('='.repeat(60));

    if (results.length === 0) {
      console.log('📋 没有功能更新被应用');
      return;
    }

    let totalMigrations = 0;
    let totalSeedData = 0;
    let successCount = 0;
    let errorCount = 0;

    console.log('📋 功能应用详情:');
    results.forEach((result, index) => {
      const status = result.success ? '✅ 成功' : '❌ 失败';
      console.log(`   ${index + 1}. ${result.version}: ${status}`);
      console.log(`      迁移: ${result.migrationsApplied.length} 个`);
      console.log(`      种子数据: ${result.seedDataApplied.length} 个`);

      if (result.errors.length > 0) {
        console.log(`      错误: ${result.errors.length} 个`);
        result.errors.forEach((error) => console.log(`        - ${error}`));
      }

      if (result.warnings.length > 0) {
        console.log(`      警告: ${result.warnings.length} 个`);
        result.warnings.forEach((warning) => console.log(`        - ${warning}`));
      }

      totalMigrations += result.migrationsApplied.length;
      totalSeedData += result.seedDataApplied.length;

      if (result.success) successCount++;
      else errorCount++;
    });

    console.log('\n📈 统计摘要:');
    console.log(`   处理功能: ${results.length} 个`);
    console.log(`   成功应用: ${successCount} 个`);
    console.log(`   应用失败: ${errorCount} 个`);
    console.log(`   总迁移数: ${totalMigrations} 个`);
    console.log(`   总种子数据: ${totalSeedData} 个`);

    console.log('\n' + '='.repeat(60));
    const overallSuccess = errorCount === 0 && results.length > 0;
    console.log(`🎯 整体状态: ${overallSuccess ? '✅ 所有功能应用成功' : '⚠️  部分功能应用失败'}`);

    if (overallSuccess && results.length > 0) {
      console.log('\n🎉 功能迭代完成！系统已更新到最新版本。');
    } else if (errorCount > 0) {
      console.log('\n⚠️  功能迭代过程中出现错误，请检查失败的功能并手动处理。');
    }
  }

  /**
   * 主执行流程
   */
  async execute(): Promise<void> {
    console.log('🚀 功能迭代集成系统启动\n');

    try {
      const results = await this.applyAllPendingFeatures();
      this.generateIterationReport(results);

      // 设置退出码
      const hasErrors = results.some((r) => !r.success);
      process.exit(hasErrors ? 1 : 0);
    } catch (error) {
      console.error('❌ 功能迭代系统执行失败:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// 主执行函数
async function main() {
  const manager = new FeatureIterationManager();
  await manager.execute();
}

// 错误处理
main().catch((error) => {
  console.error('❌ 功能迭代系统启动失败:', error);
  process.exit(1);
});
