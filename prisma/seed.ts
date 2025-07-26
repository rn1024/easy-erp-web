import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ERP权限定义 - 包含所有业务模块权限
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

  // ==================== ERP业务模块权限 ====================

  // 店铺管理权限
  { name: '店铺查看', code: 'shop.read', category: 'shop', description: '查看店铺信息' },
  { name: '店铺创建', code: 'shop.create', category: 'shop', description: '创建店铺' },
  { name: '店铺编辑', code: 'shop.write', category: 'shop', description: '编辑店铺信息' },
  { name: '店铺删除', code: 'shop.delete', category: 'shop', description: '删除店铺' },

  // 供应商管理权限
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

  // 货代管理权限
  { name: '货代查看', code: 'forwarder.read', category: 'forwarder', description: '查看货代信息' },
  { name: '货代创建', code: 'forwarder.create', category: 'forwarder', description: '创建货代' },
  { name: '货代编辑', code: 'forwarder.write', category: 'forwarder', description: '编辑货代信息' },
  { name: '货代删除', code: 'forwarder.delete', category: 'forwarder', description: '删除货代' },

  // 产品管理权限
  {
    name: '产品分类查看',
    code: 'product.category.read',
    category: 'product',
    description: '查看产品分类',
  },
  {
    name: '产品分类管理',
    code: 'product.category.write',
    category: 'product',
    description: '管理产品分类',
  },
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

  // 库存管理权限
  {
    name: '成品库存查看',
    code: 'inventory.finished.read',
    category: 'inventory',
    description: '查看成品库存',
  },
  {
    name: '成品库存管理',
    code: 'inventory.finished.write',
    category: 'inventory',
    description: '管理成品库存',
  },
  {
    name: '配件库存查看',
    code: 'inventory.spare.read',
    category: 'inventory',
    description: '查看配件库存',
  },
  {
    name: '配件库存管理',
    code: 'inventory.spare.write',
    category: 'inventory',
    description: '管理配件库存',
  },
  { name: '库存盘点', code: 'inventory.count', category: 'inventory', description: '库存盘点操作' },

  // 采购管理权限
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

  // 财务管理权限
  {
    name: '财务报表查看',
    code: 'financial.read',
    category: 'financial',
    description: '查看财务报表',
  },
  {
    name: '财务数据录入',
    code: 'financial.input',
    category: 'financial',
    description: '财务数据录入',
  },
  {
    name: '财务报表管理',
    code: 'financial.write',
    category: 'financial',
    description: '管理财务报表',
  },
  {
    name: '财务审核',
    code: 'financial.approve',
    category: 'financial',
    description: '财务审核权限',
  },

  // 仓库任务权限
  {
    name: '仓库任务查看',
    code: 'warehouse.task.read',
    category: 'warehouse',
    description: '查看仓库任务',
  },
  {
    name: '仓库任务创建',
    code: 'warehouse.task.create',
    category: 'warehouse',
    description: '创建仓库任务',
  },
  {
    name: '仓库任务执行',
    code: 'warehouse.task.execute',
    category: 'warehouse',
    description: '执行仓库任务',
  },
  {
    name: '仓库任务管理',
    code: 'warehouse.task.write',
    category: 'warehouse',
    description: '管理仓库任务',
  },

  // 发货记录权限
  {
    name: '发货记录查看',
    code: 'delivery.read',
    category: 'delivery',
    description: '查看发货记录',
  },
  {
    name: '发货记录创建',
    code: 'delivery.create',
    category: 'delivery',
    description: '创建发货记录',
  },
  {
    name: '发货记录编辑',
    code: 'delivery.write',
    category: 'delivery',
    description: '编辑发货记录',
  },
  {
    name: '发货记录删除',
    code: 'delivery.delete',
    category: 'delivery',
    description: '删除发货记录',
  },
];

// ERP角色定义 - 按业务职能划分
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
    name: '总经理',
    permissions: [
      // 基础权限
      'account.read',
      'role.read',
      'log.read',
      'file.read',
      // 所有业务模块查看权限
      'shop.read',
      'supplier.read',
      'forwarder.read',
      'product.category.read',
      'product.info.read',
      'inventory.finished.read',
      'inventory.spare.read',
      'purchase.read',
      'purchase.approve',
      'financial.read',
      'financial.approve',
      'warehouse.task.read',
      'delivery.read',
    ],
  },
  {
    name: '财务经理',
    permissions: [
      'account.read',
      'file.read',
      'file.upload',
      'supplier.read',
      'purchase.read',
      'financial.read',
      'financial.input',
      'financial.write',
      'financial.approve',
      'delivery.read',
    ],
  },
  {
    name: '采购经理',
    permissions: [
      'account.read',
      'file.read',
      'file.upload',
      'supplier.read',
      'supplier.create',
      'supplier.write',
      'product.info.read',
      'inventory.finished.read',
      'inventory.spare.read',
      'purchase.read',
      'purchase.create',
      'purchase.write',
      'purchase.approve',
    ],
  },
  {
    name: '仓库管理员',
    permissions: [
      'account.read',
      'file.read',
      'file.upload',
      'product.info.read',
      'inventory.finished.read',
      'inventory.finished.write',
      'inventory.spare.read',
      'inventory.spare.write',
      'inventory.count',
      'warehouse.task.read',
      'warehouse.task.create',
      'warehouse.task.execute',
      'warehouse.task.write',
      'delivery.read',
      'delivery.create',
      'delivery.write',
    ],
  },
  {
    name: '运营专员',
    permissions: [
      'account.read',
      'file.read',
      'file.upload',
      'shop.read',
      'shop.create',
      'shop.write',
      'product.category.read',
      'product.category.write',
      'product.info.read',
      'product.info.create',
      'product.info.write',
      'inventory.finished.read',
      'inventory.spare.read',
      'delivery.read',
    ],
  },
  {
    name: '普通员工',
    permissions: [
      'account.read',
      'file.read',
      'shop.read',
      'supplier.read',
      'forwarder.read',
      'product.category.read',
      'product.info.read',
      'inventory.finished.read',
      'inventory.spare.read',
      'purchase.read',
      'delivery.read',
    ],
  },
];

async function main() {
  console.log('开始初始化ERP数据库...');

  // 创建权限
  console.log('创建权限...');
  const createdPermissions = [];
  for (const permission of permissions) {
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
  const adminPassword = process.env.ADMIN_PASSWORD || '123456';
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

  // 创建测试业务数据
  console.log('创建测试业务数据...');

  // 创建测试店铺
  const testShop = await prisma.shop.upsert({
    where: { nickname: '天猫旗舰店' },
    update: {},
    create: {
      nickname: '天猫旗舰店',
      responsiblePerson: '店铺负责人',
      operatorId: adminAccount.id,
    },
  });
  console.log('✓ 创建测试店铺');

  // 创建测试供应商
  const testSupplier = await prisma.supplier.upsert({
    where: { nickname: '深圳电子供应商' },
    update: {},
    create: {
      nickname: '深圳电子供应商',
      contactPerson: '张三',
      contactPhone: '13800138000',
      companyName: '深圳市xx电子有限公司',
      operatorId: adminAccount.id,
    },
  });
  console.log('✓ 创建测试供应商');

  // 创建测试货代
  const testForwarder = await prisma.forwarder.upsert({
    where: { nickname: '顺丰物流' },
    update: {},
    create: {
      nickname: '顺丰物流',
      contactPerson: '李四',
      contactPhone: '13900139000',
      companyName: '顺丰速运有限公司',
      operatorId: adminAccount.id,
    },
  });
  console.log('✓ 创建测试货代');

  // 创建产品分类
  const testCategory = await prisma.productCategory.upsert({
    where: { name: '电子产品' },
    update: {},
    create: {
      name: '电子产品',
    },
  });
  console.log('✓ 创建产品分类');

  // 创建多个测试产品
  const testProducts = await Promise.all([
    prisma.productInfo.upsert({
      where: { sku: 'PRD001' },
      update: {},
      create: {
        shopId: testShop.id,
        categoryId: testCategory.id,
        code: 'PRD001',
        sku: 'PRD001',
        specification: '手机保护壳-透明',
        color: '透明',
        setQuantity: 1,
        operatorId: adminAccount.id,
      },
    }),
    prisma.productInfo.upsert({
      where: { sku: 'PRD002' },
      update: {},
      create: {
        shopId: testShop.id,
        categoryId: testCategory.id,
        code: 'PRD002',
        sku: 'PRD002',
        specification: '数据线-Type-C',
        color: '黑色',
        setQuantity: 1,
        operatorId: adminAccount.id,
      },
    }),
    prisma.productInfo.upsert({
      where: { sku: 'PRD003' },
      update: {},
      create: {
        shopId: testShop.id,
        categoryId: testCategory.id,
        code: 'PRD003',
        sku: 'PRD003',
        specification: '无线充电器-15W',
        color: '白色',
        setQuantity: 1,
        operatorId: adminAccount.id,
      },
    }),
  ]);
  console.log('✓ 创建测试产品');

  // 生成采购订单号
  const generateOrderNumber = (index: number) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const sequence = (index + 1).toString().padStart(6, '0');
    return `CGDD${dateStr}${sequence}`;
  };

  // 创建测试采购订单
  const testPurchaseOrders = await Promise.all([
    // 第一个采购订单 - 包含2个产品
    prisma.purchaseOrder.create({
      data: {
        orderNumber: generateOrderNumber(0),
        shopId: testShop.id,
        supplierId: testSupplier.id,
        totalAmount: 1518.0,
        discountRate: 0,
        discountAmount: 0,
        finalAmount: 1518.0,
        urgent: true,
        remark: '紧急采购手机配件',
        operatorId: adminAccount.id,
        status: 'PENDING',
      },
    }),

    // 第二个采购订单 - 包含1个产品
    prisma.purchaseOrder.create({
      data: {
        orderNumber: generateOrderNumber(1),
        shopId: testShop.id,
        supplierId: testSupplier.id,
        totalAmount: 2480.0,
        discountRate: 5.0,
        discountAmount: 124.0,
        finalAmount: 2356.0,
        urgent: false,
        remark: '无线充电器补货',
        operatorId: adminAccount.id,
        status: 'CONFIRMED',
      },
    }),

    // 第三个采购订单 - 包含3个产品
    prisma.purchaseOrder.create({
      data: {
        orderNumber: generateOrderNumber(2),
        shopId: testShop.id,
        supplierId: testSupplier.id,
        totalAmount: 4680.0,
        discountRate: 0,
        discountAmount: 0,
        finalAmount: 4680.0,
        urgent: false,
        remark: '月度常规采购',
        operatorId: adminAccount.id,
        status: 'CREATED',
      },
    }),
  ]);
  console.log('✓ 创建测试采购订单');

  // 获取创建的采购订单
  const createdOrders = await prisma.purchaseOrder.findMany({
    where: {
      operatorId: adminAccount.id,
    },
    orderBy: {
      orderNumber: 'asc',
    },
  });

  // 为采购订单创建产品明细
  await prisma.productItem.createMany({
    data: [
      // 第一个订单的产品明细 (2个产品)
      {
        relatedType: 'PURCHASE_ORDER',
        relatedId: createdOrders[0].id,
        productId: testProducts[0].id, // 手机保护壳
        quantity: 100,
        unitPrice: 8.5,
        amount: 850.0,
        taxRate: 13.0,
        taxAmount: 110.5,
        totalAmount: 960.5,
        remark: '透明保护壳',
      },
      {
        relatedType: 'PURCHASE_ORDER',
        relatedId: createdOrders[0].id,
        productId: testProducts[1].id, // 数据线
        quantity: 50,
        unitPrice: 12.0,
        amount: 600.0,
        taxRate: 13.0,
        taxAmount: 78.0,
        totalAmount: 678.0,
        remark: 'Type-C数据线',
      },

      // 第二个订单的产品明细 (1个产品)
      {
        relatedType: 'PURCHASE_ORDER',
        relatedId: createdOrders[1].id,
        productId: testProducts[2].id, // 无线充电器
        quantity: 80,
        unitPrice: 25.0,
        amount: 2000.0,
        taxRate: 13.0,
        taxAmount: 260.0,
        totalAmount: 2260.0,
        remark: '15W无线充电器',
      },

      // 第三个订单的产品明细 (3个产品)
      {
        relatedType: 'PURCHASE_ORDER',
        relatedId: createdOrders[2].id,
        productId: testProducts[0].id, // 手机保护壳
        quantity: 200,
        unitPrice: 8.5,
        amount: 1700.0,
        taxRate: 13.0,
        taxAmount: 221.0,
        totalAmount: 1921.0,
        remark: '透明保护壳批量采购',
      },
      {
        relatedType: 'PURCHASE_ORDER',
        relatedId: createdOrders[2].id,
        productId: testProducts[1].id, // 数据线
        quantity: 150,
        unitPrice: 12.0,
        amount: 1800.0,
        taxRate: 13.0,
        taxAmount: 234.0,
        totalAmount: 2034.0,
        remark: 'Type-C数据线批量采购',
      },
      {
        relatedType: 'PURCHASE_ORDER',
        relatedId: createdOrders[2].id,
        productId: testProducts[2].id, // 无线充电器
        quantity: 30,
        unitPrice: 25.0,
        amount: 750.0,
        taxRate: 13.0,
        taxAmount: 97.5,
        totalAmount: 847.5,
        remark: '无线充电器少量补货',
      },
    ],
  });
  console.log('✓ 创建采购订单产品明细');

  // 注意：仓库任务功能已被移除，包装任务现在作为独立功能存在

  // 创建测试发货记录
  const testShipmentRecords = await prisma.shipmentRecord.createMany({
    data: [
      {
        shopId: testShop.id,
        country: '美国',
        channel: 'Amazon FBA',
        shippingChannel: '海运',
        warehouseShippingDeadline: new Date('2024-12-30'),
        warehouseReceiptDeadline: new Date('2025-01-05'),
        shippingDetails: '美国亚马逊FBA发货，海运渠道，预计15-20天到达',
        date: new Date('2024-12-25'),
        status: 'PREPARING',
        operatorId: adminAccount.id,
      },
      {
        shopId: testShop.id,
        country: '德国',
        channel: 'Amazon FBA',
        shippingChannel: '空运',
        warehouseShippingDeadline: new Date('2024-12-28'),
        warehouseReceiptDeadline: new Date('2025-01-03'),
        shippingDetails: '德国亚马逊FBA发货，空运渠道，预计5-7天到达',
        date: new Date('2024-12-26'),
        status: 'SHIPPED',
        operatorId: adminAccount.id,
      },
    ],
  });
  console.log('✓ 创建测试发货记录');

  // 获取创建的发货记录
  const createdShipmentRecords = await prisma.shipmentRecord.findMany({
    where: {
      operatorId: adminAccount.id,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // 为发货记录创建产品明细
  await prisma.shipmentProductRecord.createMany({
    data: [
      // 第一条发货记录的产品明细
      {
        shipmentRecordId: createdShipmentRecords[0].id,
        productId: testProducts[0].id, // 手机保护壳
        forwarderId: testForwarder.id,
        totalBoxes: 10,
        fbaShipmentCode: 'FBA123456789',
        fbaWarehouseCode: 'US-WEST-1',
      },
      {
        shipmentRecordId: createdShipmentRecords[0].id,
        productId: testProducts[1].id, // 数据线
        forwarderId: testForwarder.id,
        totalBoxes: 5,
        fbaShipmentCode: 'FBA123456790',
        fbaWarehouseCode: 'US-WEST-1',
      },

      // 第二条发货记录的产品明细
      {
        shipmentRecordId: createdShipmentRecords[1].id,
        productId: testProducts[2].id, // 无线充电器
        forwarderId: testForwarder.id,
        totalBoxes: 8,
        fbaShipmentCode: 'FBA123456791',
        fbaWarehouseCode: 'DE-CENTRAL-1',
      },
    ],
  });
  console.log('✓ 创建发货记录产品明细');

  console.log('\n🎉 ERP数据库初始化完成！');
  console.log('📋 默认管理员账户信息:');
  console.log(`   用户名: admin`);
  console.log(`   密码: ${adminPassword}`);
  console.log(`   角色: 超级管理员`);
  console.log('\n📊 已创建的角色和权限:');
  console.log(`   - ${roles.length} 个角色`);
  console.log(`   - ${permissions.length} 个权限`);
  console.log('   - 测试业务数据已创建');
}

main()
  .catch((e) => {
    console.error('❌ 数据库初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
