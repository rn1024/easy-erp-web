import { PrismaClient } from './generated/prisma/index.js';

async function debugSupplyRecords() {
  const prisma = new PrismaClient();

  try {
    const purchaseOrderId = 'cmdvbqu5d0079zeo6av75tvri';

    console.log('=== 调试供货记录问题 ===');

    // 1. 检查采购订单是否存在
    console.log('\n1. 检查采购订单:');
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
      },
    });
    console.log('采购订单:', purchaseOrder);

    if (!purchaseOrder) {
      console.log('❌ 采购订单不存在');
      return;
    }

    // 2. 检查分享链接
    console.log('\n2. 检查分享链接:');
    const shareLinks = await prisma.supplyShareLink.findMany({
      where: { purchaseOrderId },
      select: {
        id: true,
        shareCode: true,
        status: true,
        expiresAt: true,
        accessCount: true,
      },
    });
    console.log('分享链接数量:', shareLinks.length);
    console.log('分享链接:', shareLinks);

    // 3. 检查供货记录
    console.log('\n3. 检查供货记录:');
    const supplyRecords = await prisma.supplyRecord.findMany({
      where: { purchaseOrderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                specification: true,
                color: true,
              },
            },
          },
        },
      },
    });
    console.log('供货记录数量:', supplyRecords.length);
    console.log('供货记录:', JSON.stringify(supplyRecords, null, 2));

    // 4. 检查所有供货记录（不限制采购订单）
    console.log('\n4. 检查所有供货记录:');
    const allSupplyRecords = await prisma.supplyRecord.findMany({
      take: 5,
      select: {
        id: true,
        purchaseOrderId: true,
        shareCode: true,
        status: true,
        totalAmount: true,
      },
    });
    console.log('所有供货记录样本:', allSupplyRecords);

    // 5. 检查采购订单产品
    console.log('\n5. 检查采购订单产品:');
    const purchaseOrderItems = await prisma.productItem.findMany({
      where: { purchaseOrderId },
      include: {
        product: {
          select: {
            id: true,
            code: true,
            specification: true,
            color: true,
          },
        },
      },
    });
    console.log('采购订单产品数量:', purchaseOrderItems.length);
    console.log('采购订单产品:', purchaseOrderItems);
  } catch (error) {
    console.error('查询错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSupplyRecords();
