import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 基础权限定义（生产环境必需）
const essentialPermissions = [
  // 系统管理
  { name: '系统管理', code: 'admin.*', category: 'system', description: '系统管理员权限' },

  // 基础权限
  { name: '账户查看', code: 'account.read', category: 'account', description: '查看账户信息' },
  { name: '账户编辑', code: 'account.write', category: 'account', description: '编辑账户信息' },
  { name: '账户删除', code: 'account.delete', category: 'account', description: '删除账户' },
  { name: '角色查看', code: 'role.read', category: 'role', description: '查看角色信息' },
  { name: '角色编辑', code: 'role.write', category: 'role', description: '编辑角色信息' },
  { name: '角色删除', code: 'role.delete', category: 'role', description: '删除角色' },
  { name: '日志查看', code: 'log.read', category: 'log', description: '查看系统日志' },
  { name: '文件上传', code: 'file.upload', category: 'file', description: '上传文件' },
  { name: '文件删除', code: 'file.delete', category: 'file', description: '删除文件' },
  { name: '文件查看', code: 'file.read', category: 'file', description: '查看文件列表' },

  // ERP核心业务权限
  { name: '店铺查看', code: 'shop.read', category: 'shop', description: '查看店铺信息' },
  { name: '店铺创建', code: 'shop.create', category: 'shop', description: '创建店铺' },
  { name: '店铺编辑', code: 'shop.write', category: 'shop', description: '编辑店铺信息' },
  { name: '店铺删除', code: 'shop.delete', category: 'shop', description: '删除店铺' },
  {
    name: '供应商查看',
    code: 'supplier.read',
    category: 'supplier',
    description: '查看供应商信息',
  },
  { name: '供应商创建', code: 'supplier.create', category: 'supplier', description: '创建供应商' },
  {
    name: '供应商编辑',
    code: 'supplier.write',
    category: 'supplier',
    description: '编辑供应商信息',
  },
  { name: '供应商删除', code: 'supplier.delete', category: 'supplier', description: '删除供应商' },
  {
    name: '产品信息查看',
    code: 'product.info.read',
    category: 'product',
    description: '查看产品信息',
  },
  {
    name: '产品信息创建',
    code: 'product.info.create',
    category: 'product',
    description: '创建产品信息',
  },
  {
    name: '产品信息编辑',
    code: 'product.info.write',
    category: 'product',
    description: '编辑产品信息',
  },
  {
    name: '产品信息删除',
    code: 'product.info.delete',
    category: 'product',
    description: '删除产品信息',
  },
  {
    name: '采购订单查看',
    code: 'purchase.read',
    category: 'purchase',
    description: '查看采购订单',
  },
  {
    name: '采购订单创建',
    code: 'purchase.create',
    category: 'purchase',
    description: '创建采购订单',
  },
  {
    name: '采购订单编辑',
    code: 'purchase.write',
    category: 'purchase',
    description: '编辑采购订单',
  },
  {
    name: '采购订单删除',
    code: 'purchase.delete',
    category: 'purchase',
    description: '删除采购订单',
  },
  {
    name: '采购订单审核',
    code: 'purchase.approve',
    category: 'purchase',
    description: '采购订单审核',
  },
];

// 基础角色定义（生产环境必需）
const essentialRoles = [
  {
    name: '超级管理员',
    permissions: ['admin.*'],
  },
  {
    name: '系统管理员',
    permissions: [
      'account.read',
      'account.write',
      'account.delete',
      'role.read',
      'role.write',
      'role.delete',
      'log.read',
      'file.read',
      'file.upload',
      'file.delete',
    ],
  },
  {
    name: '普通用户',
    permissions: [
      'account.read',
      'file.read',
      'shop.read',
      'supplier.read',
      'product.info.read',
      'purchase.read',
    ],
  },
];

async function seedProductionEssentials() {
  console.log('🚀 开始初始化生产环境基础数据...');

  try {
    // 1. 创建基础权限
    console.log('📋 创建基础权限...');
    const createdPermissions = [];
    for (const permission of essentialPermissions) {
      const created = await prisma.permission.upsert({
        where: { code: permission.code },
        update: {
          name: permission.name,
          description: permission.description,
          category: permission.category,
        },
        create: permission,
      });
      createdPermissions.push(created);
    }
    console.log(`✅ 已确保 ${essentialPermissions.length} 个基础权限存在`);

    // 2. 创建基础角色并分配权限
    console.log('👥 创建基础角色...');
    const createdRoles = [];
    for (const role of essentialRoles) {
      const created = await prisma.role.upsert({
        where: { name: role.name },
        update: {
          status: 'ACTIVE',
          operator: 'system',
        },
        create: {
          name: role.name,
          status: 'ACTIVE',
          operator: 'system',
        },
      });
      createdRoles.push(created);

      // 清除旧的权限关联
      await prisma.rolePermission.deleteMany({
        where: { roleId: created.id },
      });

      // 分配权限给角色
      for (const permissionCode of role.permissions) {
        const permission = createdPermissions.find((p) => p.code === permissionCode);
        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: created.id,
                permissionId: permission.id,
              },
            },
            update: {},
            create: {
              roleId: created.id,
              permissionId: permission.id,
            },
          });
        }
      }
    }
    console.log(`✅ 已确保 ${essentialRoles.length} 个基础角色存在`);

    // 3. 创建/更新admin账户
    console.log('👤 确保admin账户存在...');
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    let adminAccount = await prisma.account.findFirst({
      where: { name: 'admin' },
    });

    if (!adminAccount) {
      adminAccount = await prisma.account.create({
        data: {
          name: 'admin',
          operator: 'system',
          password: hashedPassword,
          status: 'ACTIVE',
        },
      });
      console.log('✅ 创建admin账户');
    } else {
      // 更新密码（防止密码被重置）
      await prisma.account.update({
        where: { id: adminAccount.id },
        data: {
          password: hashedPassword,
          status: 'ACTIVE',
        },
      });
      console.log('✅ 更新admin账户密码');
    }

    // 4. 给admin分配超级管理员角色
    const superAdminRole = createdRoles.find((r) => r.name === '超级管理员');
    if (superAdminRole) {
      await prisma.accountRole.upsert({
        where: {
          accountId_roleId: {
            accountId: adminAccount.id,
            roleId: superAdminRole.id,
          },
        },
        update: {},
        create: {
          accountId: adminAccount.id,
          roleId: superAdminRole.id,
        },
      });
      console.log('✅ 确保admin拥有超级管理员角色');
    }

    console.log('\n🎉 生产环境基础数据初始化完成！');
    console.log('📋 摘要信息:');
    console.log(`   - ${essentialPermissions.length} 个基础权限`);
    console.log(`   - ${essentialRoles.length} 个基础角色`);
    console.log(`   - admin账户: ${adminAccount.name}`);
    console.log(`   - 密码已设置为环境变量ADMIN_PASSWORD的值`);

    return {
      success: true,
      permissions: essentialPermissions.length,
      roles: essentialRoles.length,
      adminCreated: true,
    };
  } catch (error) {
    console.error('❌ 生产环境基础数据初始化失败:', error);
    throw error;
  }
}

// 验证基础数据是否存在
async function verifyEssentialData() {
  try {
    // 检查admin用户
    const adminExists = await prisma.account.findFirst({
      where: { name: 'admin' },
    });

    // 检查基础权限
    const permissionCount = await prisma.permission.count();

    // 检查基础角色
    const roleCount = await prisma.role.count();

    const isValid = adminExists && permissionCount >= 10 && roleCount >= 3;

    console.log(`📊 基础数据验证结果:`);
    console.log(`   - Admin用户: ${adminExists ? '✅' : '❌'}`);
    console.log(`   - 权限数量: ${permissionCount} (需要 >= 10)`);
    console.log(`   - 角色数量: ${roleCount} (需要 >= 3)`);
    console.log(`   - 整体状态: ${isValid ? '✅ 健康' : '❌ 需要修复'}`);

    return isValid;
  } catch (error) {
    console.error('❌ 基础数据验证失败:', error);
    return false;
  }
}

async function main() {
  const isProduction = process.env.NODE_ENV === 'production';

  console.log(`🔧 环境: ${isProduction ? '生产环境' : '开发环境'}`);

  // 首先验证基础数据
  const isHealthy = await verifyEssentialData();

  if (!isHealthy) {
    console.log('🔄 检测到基础数据不完整，开始修复...');
    await seedProductionEssentials();
  } else {
    console.log('✅ 基础数据已存在且完整，跳过初始化');
  }

  // 在生产环境中不创建测试数据
  if (!isProduction) {
    console.log('⚠️ 检测到非生产环境，建议运行完整的种子数据脚本');
  }
}

main()
  .catch((e) => {
    console.error('❌ 生产环境数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
