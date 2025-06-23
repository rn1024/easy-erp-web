const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

// 数据库优化建议
const optimizations = [
  {
    name: '系统日志表索引优化',
    description: '为系统日志表添加复合索引，优化查询性能',
    queries: [
      // 为日志查询添加复合索引
      `CREATE INDEX IF NOT EXISTS "idx_logs_category_created_at" ON "Log" ("category", "createdAt" DESC);`,
      `CREATE INDEX IF NOT EXISTS "idx_logs_module_created_at" ON "Log" ("module", "createdAt" DESC);`,
      `CREATE INDEX IF NOT EXISTS "idx_logs_operator_created_at" ON "Log" ("operatorAccountId", "createdAt" DESC);`,
      `CREATE INDEX IF NOT EXISTS "idx_logs_status_created_at" ON "Log" ("status", "createdAt" DESC);`,
    ],
  },
  {
    name: '财务报表索引优化',
    description: '为财务报表添加索引，提升查询速度',
    queries: [
      `CREATE INDEX IF NOT EXISTS "idx_financial_reports_shop_month" ON "FinancialReport" ("shopId", "reportMonth" DESC);`,
      `CREATE INDEX IF NOT EXISTS "idx_financial_reports_month" ON "FinancialReport" ("reportMonth" DESC);`,
    ],
  },
  {
    name: '库存表索引优化',
    description: '为库存表添加索引，优化库存查询',
    queries: [
      `CREATE INDEX IF NOT EXISTS "idx_finished_inventory_product_shop" ON "FinishedInventory" ("productId", "shopId");`,
      `CREATE INDEX IF NOT EXISTS "idx_finished_inventory_shop_updated" ON "FinishedInventory" ("shopId", "updatedAt" DESC);`,
      `CREATE INDEX IF NOT EXISTS "idx_spare_inventory_category_shop" ON "SpareInventory" ("categoryId", "shopId");`,
      `CREATE INDEX IF NOT EXISTS "idx_spare_inventory_shop_updated" ON "SpareInventory" ("shopId", "updatedAt" DESC);`,
    ],
  },
  {
    name: '采购订单索引优化',
    description: '为采购订单添加索引，提升订单查询性能',
    queries: [
      `CREATE INDEX IF NOT EXISTS "idx_purchase_orders_supplier_date" ON "PurchaseOrder" ("supplierId", "orderDate" DESC);`,
      `CREATE INDEX IF NOT EXISTS "idx_purchase_orders_status_date" ON "PurchaseOrder" ("status", "orderDate" DESC);`,
      `CREATE INDEX IF NOT EXISTS "idx_purchase_orders_shop_date" ON "PurchaseOrder" ("shopId", "orderDate" DESC);`,
    ],
  },
  {
    name: '发货记录索引优化',
    description: '为发货记录添加索引，优化发货查询',
    queries: [
      `CREATE INDEX IF NOT EXISTS "idx_delivery_records_shop_date" ON "DeliveryRecord" ("shopId", "shippingDate" DESC);`,
      `CREATE INDEX IF NOT EXISTS "idx_delivery_records_forwarder_date" ON "DeliveryRecord" ("forwarderId", "shippingDate" DESC);`,
      `CREATE INDEX IF NOT EXISTS "idx_delivery_records_status_date" ON "DeliveryRecord" ("status", "shippingDate" DESC);`,
      `CREATE INDEX IF NOT EXISTS "idx_delivery_records_fba" ON "DeliveryRecord" ("fbaCode");`,
    ],
  },
  {
    name: '仓库任务索引优化',
    description: '为仓库任务添加索引，提升任务管理性能',
    queries: [
      `CREATE INDEX IF NOT EXISTS "idx_warehouse_tasks_shop_type" ON "WarehouseTask" ("shopId", "type");`,
      `CREATE INDEX IF NOT EXISTS "idx_warehouse_tasks_status_updated" ON "WarehouseTask" ("status", "updatedAt" DESC);`,
      `CREATE INDEX IF NOT EXISTS "idx_warehouse_tasks_product_status" ON "WarehouseTask" ("productId", "status");`,
    ],
  },
  {
    name: '产品相关索引优化',
    description: '为产品和分类添加索引',
    queries: [
      `CREATE INDEX IF NOT EXISTS "idx_products_category_name" ON "Product" ("categoryId", "name");`,
      `CREATE INDEX IF NOT EXISTS "idx_products_sku" ON "Product" ("sku");`,
      `CREATE INDEX IF NOT EXISTS "idx_products_status" ON "Product" ("status");`,
    ],
  },
];

// 执行数据库优化
async function optimizeDatabase() {
  console.log('🚀 开始数据库性能优化...');
  console.log('=====================================');

  let totalOptimizations = 0;
  let successfulOptimizations = 0;

  for (const optimization of optimizations) {
    console.log(`\n📊 ${optimization.name}`);
    console.log(`   ${optimization.description}`);

    for (const query of optimization.queries) {
      totalOptimizations++;

      try {
        console.log(`   🔄 执行: ${query.substring(0, 80)}...`);
        await prisma.$executeRawUnsafe(query);
        console.log(`   ✅ 成功`);
        successfulOptimizations++;
      } catch (error) {
        console.log(`   ❌ 失败: ${error.message}`);
      }
    }
  }

  console.log('\n📈 数据库统计分析...');
  await analyzeDatabaseStats();

  console.log('\n🎯 优化建议...');
  await generateOptimizationRecommendations();

  console.log('\n✅ 数据库优化完成!');
  console.log(`   总操作数: ${totalOptimizations}`);
  console.log(`   成功操作数: ${successfulOptimizations}`);
  console.log(`   成功率: ${((successfulOptimizations / totalOptimizations) * 100).toFixed(2)}%`);
}

// 分析数据库统计信息
async function analyzeDatabaseStats() {
  try {
    // 获取各表的记录数量
    const tables = [
      'Account',
      'Role',
      'Shop',
      'Supplier',
      'ForwardingAgent',
      'ProductCategory',
      'Product',
      'FinishedInventory',
      'SpareInventory',
      'PurchaseOrder',
      'DeliveryRecord',
      'WarehouseTask',
      'FinancialReport',
      'Log',
    ];

    console.log('   📋 表记录统计:');

    for (const tableName of tables) {
      try {
        const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const recordCount = count[0]?.count || 0;
        console.log(`      ${tableName}: ${recordCount} 条记录`);

        // 警告大表
        if (recordCount > 10000) {
          console.log(`      ⚠️  ${tableName} 是大表，建议关注查询性能`);
        }
      } catch (error) {
        console.log(`      ❌ ${tableName}: 查询失败`);
      }
    }
  } catch (error) {
    console.log('   ❌ 统计分析失败:', error.message);
  }
}

// 生成优化建议
async function generateOptimizationRecommendations() {
  const recommendations = [
    {
      category: '查询优化',
      items: [
        '使用 SELECT 指定字段而不是 SELECT *',
        '为经常查询的字段添加索引',
        '使用分页查询避免一次性加载大量数据',
        '使用 Promise.all 并行执行独立查询',
      ],
    },
    {
      category: '缓存策略',
      items: [
        '为不经常变化的数据添加 Redis 缓存',
        '使用 Next.js 的静态生成和增量静态再生',
        '为 API 响应添加适当的缓存头',
        '考虑使用 CDN 缓存静态资源',
      ],
    },
    {
      category: '数据库连接优化',
      items: [
        '使用连接池管理数据库连接',
        '设置合适的连接超时时间',
        '监控数据库连接使用情况',
        '考虑读写分离架构',
      ],
    },
    {
      category: '代码层面优化',
      items: [
        '使用 useMemo 和 useCallback 优化 React 组件',
        '实现虚拟滚动处理大量列表数据',
        '使用防抖和节流优化用户输入',
        '代码分割和懒加载减少初始包大小',
      ],
    },
  ];

  recommendations.forEach((rec) => {
    console.log(`   📌 ${rec.category}:`);
    rec.items.forEach((item) => {
      console.log(`      • ${item}`);
    });
    console.log('');
  });
}

// 性能监控查询
async function performanceMonitoring() {
  console.log('\n🔍 性能监控查询示例:');

  // 慢查询检测 (SQLite 不支持，这里提供 PostgreSQL 示例)
  const monitoringQueries = [
    {
      name: '检查长时间运行的查询',
      description: '监控执行时间超过阈值的查询',
      // PostgreSQL 示例
      query: `
        -- PostgreSQL 示例 (SQLite 不支持)
        -- SELECT query, state, query_start, now() - query_start as duration
        -- FROM pg_stat_activity
        -- WHERE now() - query_start > interval '1 minute'
        -- AND state = 'active';
      `,
    },
    {
      name: '索引使用统计',
      description: '检查索引的使用情况',
      // PostgreSQL 示例
      query: `
        -- PostgreSQL 示例
        -- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
        -- FROM pg_stat_user_indexes
        -- ORDER BY idx_scan DESC;
      `,
    },
  ];

  monitoringQueries.forEach((mq) => {
    console.log(`   📊 ${mq.name}`);
    console.log(`      ${mq.description}`);
  });
}

// 主函数
async function main() {
  try {
    await optimizeDatabase();
    await performanceMonitoring();
  } catch (error) {
    console.error('优化过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 导出函数供其他脚本使用
module.exports = {
  optimizeDatabase,
  analyzeDatabaseStats,
  generateOptimizationRecommendations,
};

// 如果直接运行此脚本
if (require.main === module) {
  main();
}
