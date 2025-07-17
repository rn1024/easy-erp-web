#!/usr/bin/env tsx

/**
 * 智能Admin账户修复系统
 * 基于Prisma的自动检测和修复机制
 * 确保admin/123456能够正常登录
 */

import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface AdminCheckResult {
  exists: boolean;
  passwordCorrect: boolean;
  statusActive: boolean;
  hasRoles: boolean;
  roleDetails: string[];
  needsRepair: boolean;
  issues: string[];
}

interface RepairAction {
  action: string;
  description: string;
  executed: boolean;
  result?: any;
  error?: string;
}

class SmartAdminFixer {
  private readonly targetPassword = '123456';
  private readonly adminUsername = 'admin';

  /**
   * 全面检测admin账户状态
   */
  async checkAdminStatus(): Promise<AdminCheckResult> {
    console.log('🔍 开始检测admin账户状态...\n');

    const result: AdminCheckResult = {
      exists: false,
      passwordCorrect: false,
      statusActive: false,
      hasRoles: false,
      roleDetails: [],
      needsRepair: false,
      issues: [],
    };

    try {
      // 1. 检查admin用户是否存在
      const admin = await prisma.account.findFirst({
        where: { name: this.adminUsername },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!admin) {
        result.issues.push('admin用户不存在');
        result.needsRepair = true;
        console.log('❌ admin用户不存在');
        return result;
      }

      result.exists = true;
      console.log('✅ admin用户存在');

      // 2. 检查密码是否正确
      const passwordValid = await bcrypt.compare(this.targetPassword, admin.password);
      result.passwordCorrect = passwordValid;

      if (!passwordValid) {
        result.issues.push('密码不正确');
        result.needsRepair = true;
        console.log('❌ 密码不正确');
      } else {
        console.log('✅ 密码正确');
      }

      // 3. 检查账户状态
      result.statusActive = admin.status === 'ACTIVE';
      if (!result.statusActive) {
        result.issues.push(`账户状态异常: ${admin.status}`);
        result.needsRepair = true;
        console.log(`❌ 账户状态异常: ${admin.status}`);
      } else {
        console.log('✅ 账户状态正常');
      }

      // 4. 检查角色权限
      result.hasRoles = admin.roles.length > 0;
      result.roleDetails = admin.roles.map((r: any) => r.role.name);

      if (!result.hasRoles) {
        result.issues.push('没有分配角色');
        result.needsRepair = true;
        console.log('❌ 没有分配角色');
      } else {
        console.log(`✅ 已分配角色: ${result.roleDetails.join(', ')}`);

        // 检查是否有超级管理员角色
        const hasSuperAdmin = result.roleDetails.includes('超级管理员');
        if (!hasSuperAdmin) {
          result.issues.push('缺少超级管理员角色');
          result.needsRepair = true;
          console.log('⚠️  缺少超级管理员角色');
        }
      }

      console.log(`\n📊 检测结果: ${result.needsRepair ? '需要修复' : '状态正常'}`);
      if (result.issues.length > 0) {
        console.log('📋 发现的问题:');
        result.issues.forEach((issue) => console.log(`   - ${issue}`));
      }
    } catch (error) {
      console.error('❌ 检测过程中发生错误:', error);
      result.issues.push(`检测错误: ${(error as Error).message}`);
      result.needsRepair = true;
    }

    return result;
  }

  /**
   * 确保超级管理员角色存在
   */
  async ensureSuperAdminRole(): Promise<{ roleId: string; created: boolean }> {
    let superAdminRole = await prisma.role.findFirst({
      where: { name: '超级管理员' },
    });

    if (!superAdminRole) {
      console.log('🔧 创建超级管理员角色...');
      superAdminRole = await prisma.role.create({
        data: {
          name: '超级管理员',
          status: 'ACTIVE',
          operator: 'system',
        },
      });

      // 分配所有权限给超级管理员
      const allPermissions = await prisma.permission.findMany();
      for (const permission of allPermissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        });
      }

      console.log('✅ 超级管理员角色创建完成');
      return { roleId: superAdminRole.id, created: true };
    }

    return { roleId: superAdminRole.id, created: false };
  }

  /**
   * 智能修复admin账户
   */
  async repairAdminAccount(): Promise<RepairAction[]> {
    console.log('\n🔧 开始修复admin账户...\n');

    const actions: RepairAction[] = [];
    const hashedPassword = await bcrypt.hash(this.targetPassword, 12);

    try {
      // 1. 确保超级管理员角色存在
      const roleResult = await this.ensureSuperAdminRole();
      actions.push({
        action: 'ensure_super_admin_role',
        description: '确保超级管理员角色存在',
        executed: true,
        result: roleResult,
      });

      // 2. 创建或更新admin用户
      const admin = await prisma.account.upsert({
        where: { name: this.adminUsername },
        update: {
          password: hashedPassword,
          status: 'ACTIVE',
          operator: 'system',
        },
        create: {
          name: this.adminUsername,
          password: hashedPassword,
          status: 'ACTIVE',
          operator: 'system',
        },
      });

      actions.push({
        action: 'upsert_admin_account',
        description: '创建或更新admin账户',
        executed: true,
        result: { adminId: admin.id, action: admin ? 'updated' : 'created' },
      });

      console.log('✅ admin账户已更新');

      // 3. 分配超级管理员角色
      await prisma.accountRole.upsert({
        where: {
          accountId_roleId: {
            accountId: admin.id,
            roleId: roleResult.roleId,
          },
        },
        update: {},
        create: {
          accountId: admin.id,
          roleId: roleResult.roleId,
        },
      });

      actions.push({
        action: 'assign_super_admin_role',
        description: '分配超级管理员角色',
        executed: true,
        result: { roleAssigned: true },
      });

      console.log('✅ 超级管理员角色已分配');
    } catch (error) {
      console.error('❌ 修复过程中发生错误:', error);
      actions.push({
        action: 'repair_failed',
        description: '修复失败',
        executed: false,
        error: (error as Error).message,
      });
    }

    return actions;
  }

  /**
   * 验证修复结果
   */
  async verifyRepair(): Promise<boolean> {
    console.log('\n🧪 验证修复结果...\n');

    try {
      // 1. 重新检测admin状态
      const checkResult = await this.checkAdminStatus();

      if (!checkResult.needsRepair) {
        console.log('✅ 修复验证成功！admin账户状态正常');
        console.log('\n📋 登录信息:');
        console.log(`   用户名: ${this.adminUsername}`);
        console.log(`   密码: ${this.targetPassword}`);
        return true;
      } else {
        console.log('❌ 修复验证失败，仍存在问题:');
        checkResult.issues.forEach((issue) => console.log(`   - ${issue}`));
        return false;
      }
    } catch (error) {
      console.error('❌ 验证过程中发生错误:', error);
      return false;
    }
  }

  /**
   * 生成数据库状态报告
   */
  async generateStatusReport(): Promise<void> {
    console.log('\n📊 生成数据库状态报告...\n');

    try {
      // 统计信息
      const accountCount = await prisma.account.count();
      const roleCount = await prisma.role.count();
      const permissionCount = await prisma.permission.count();
      const activeAccounts = await prisma.account.count({
        where: { status: 'ACTIVE' },
      });

      console.log('📈 数据库统计:');
      console.log(`   总账户数: ${accountCount}`);
      console.log(`   活跃账户数: ${activeAccounts}`);
      console.log(`   角色数: ${roleCount}`);
      console.log(`   权限数: ${permissionCount}`);

      // 检查关键表是否存在
      console.log('\n🗃️  关键表状态:');
      const tables = ['accounts', 'roles', 'permissions', 'account_roles', 'role_permissions'];

      for (const table of tables) {
        try {
          const result = (await prisma.$queryRawUnsafe(
            `SELECT COUNT(*) as count FROM ${table}`
          )) as any[];
          console.log(`   ✅ ${table}: ${result[0].count} 条记录`);
        } catch (error) {
          console.log(`   ❌ ${table}: 表不存在或无法访问`);
        }
      }
    } catch (error) {
      console.error('❌ 生成报告时发生错误:', error);
    }
  }

  /**
   * 主执行流程
   */
  async execute(): Promise<void> {
    console.log('🚀 智能Admin账户修复系统启动\n');
    console.log('目标: 确保admin/123456能够正常登录\n');

    try {
      // 1. 检测当前状态
      const checkResult = await this.checkAdminStatus();

      // 2. 如果需要修复，执行修复
      if (checkResult.needsRepair) {
        const repairActions = await this.repairAdminAccount();

        // 3. 验证修复结果
        const verifySuccess = await this.verifyRepair();

        if (!verifySuccess) {
          console.log('\n❌ 修复失败，请检查数据库连接和权限');
          process.exit(1);
        }
      } else {
        console.log('\n✅ admin账户状态正常，无需修复');
      }

      // 4. 生成状态报告
      await this.generateStatusReport();

      console.log('\n🎉 智能Admin修复完成！');
    } catch (error) {
      console.error('\n❌ 执行过程中发生严重错误:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// 执行修复
async function main() {
  const fixer = new SmartAdminFixer();
  await fixer.execute();
}

// 错误处理
main().catch((error) => {
  console.error('❌ 修复系统启动失败:', error);
  process.exit(1);
});
