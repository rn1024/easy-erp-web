import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 权限定义 - 只保留CMS管理系统需要的权限
const permissions = [
  // 系统管理
  { name: '系统管理', code: 'admin.*', category: 'system', description: '系统管理员权限' },

  // 账户管理权限
  { name: '账户查看', code: 'account.read', category: 'account', description: '查看账户信息' },
  { name: '账户编辑', code: 'account.write', category: 'account', description: '编辑账户信息' },
  { name: '账户删除', code: 'account.delete', category: 'account', description: '删除账户' },

  // 角色权限管理
  { name: '角色查看', code: 'role.read', category: 'role', description: '查看角色信息' },
  { name: '角色编辑', code: 'role.write', category: 'role', description: '编辑角色信息' },
  { name: '角色删除', code: 'role.delete', category: 'role', description: '删除角色' },

  // 日志管理权限
  { name: '日志查看', code: 'log.read', category: 'log', description: '查看系统日志' },

  // 文件管理权限
  { name: '文件上传', code: 'file.upload', category: 'file', description: '上传文件' },
  { name: '文件删除', code: 'file.delete', category: 'file', description: '删除文件' },
  { name: '文件查看', code: 'file.read', category: 'file', description: '查看文件列表' },
];

// 角色定义 - 简化角色结构
const roles = [
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
    name: '操作员',
    permissions: ['account.read', 'role.read', 'log.read', 'file.read', 'file.upload'],
  },
];

async function main() {
  console.log('开始初始化CMS数据库...');

  // 创建权限
  console.log('创建权限...');
  const createdPermissions = [];
  for (const permission of permissions) {
    const created = await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        name: permission.name,
        description: permission.description,
      },
      create: permission,
    });
    createdPermissions.push(created);
    console.log(`✓ 权限: ${permission.name} (${permission.code})`);
  }

  // 创建角色并分配权限
  console.log('创建角色...');
  const createdRoles = [];
  for (const role of roles) {
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
    console.log(`✓ 角色: ${role.name}`);

    // 清除旧的权限关联
    await prisma.rolePermission.deleteMany({
      where: { roleId: created.id },
    });

    // 分配权限给角色
    for (const permissionCode of role.permissions) {
      const permission = createdPermissions.find((p) => p.code === permissionCode);
      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: created.id,
            permissionId: permission.id,
          },
        });
        console.log(`  ✓ 分配权限: ${permissionCode}`);
      }
    }
  }

  // 创建默认管理员账户
  console.log('创建默认管理员账户...');
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
    console.log('✓ 创建admin账户');
  } else {
    // 更新密码
    await prisma.account.update({
      where: { id: adminAccount.id },
      data: {
        password: hashedPassword,
        status: 'ACTIVE',
      },
    });
    console.log('✓ 更新admin账户');
  }

  // 给管理员分配超级管理员角色
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
    console.log('✓ 分配超级管理员角色');
  }

  console.log('\n🎉 CMS数据库初始化完成！');
  console.log('📋 默认管理员账户信息:');
  console.log(`   用户名: admin`);
  console.log(`   密码: ${adminPassword}`);
  console.log(`   角色: 超级管理员`);
}

main()
  .catch((e) => {
    console.error('❌ 数据库初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
