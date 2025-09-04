// 测试progress计算逻辑
// 复制calculatePackagingTaskProgress函数的逻辑
function calculatePackagingTaskProgress(items) {
  if (!items || items.length === 0) {
    return 0;
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const completedQuantity = items.reduce((sum, item) => sum + (item.completedQuantity || 0), 0);

  if (totalQuantity === 0) {
    return 0;
  }

  return Math.round((completedQuantity / totalQuantity) * 100 * 100) / 100;
}

// 模拟测试数据
const testItems = [
  {
    id: '1',
    quantity: 100,
    completedQuantity: 50,
  },
  {
    id: '2', 
    quantity: 200,
    completedQuantity: 100,
  },
  {
    id: '3',
    quantity: 50,
    completedQuantity: 50,
  }
];

console.log('测试数据:', testItems);
console.log('总数量:', testItems.reduce((sum, item) => sum + item.quantity, 0));
console.log('已完成数量:', testItems.reduce((sum, item) => sum + (item.completedQuantity || 0), 0));
console.log('计算的进度:', calculatePackagingTaskProgress(testItems));
console.log('预期进度: 57.14%');

// 测试边界情况
console.log('\n边界情况测试:');
console.log('空数组:', calculatePackagingTaskProgress([]));
console.log('全部完成:', calculatePackagingTaskProgress([{quantity: 100, completedQuantity: 100}]));
console.log('未开始:', calculatePackagingTaskProgress([{quantity: 100, completedQuantity: 0}]));