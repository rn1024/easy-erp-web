#!/usr/bin/env node

const shareCode = 'cZz5Qr6aZaybuEKU';
const correctExtractCode = 'zGeC';
const baseUrl = 'http://localhost:3000';

console.log('🧪 开始测试分享链接验证流程');
console.log('📋 测试信息:');
console.log(`- 分享码: ${shareCode}`);
console.log(`- 正确提取码: ${correctExtractCode}`);
console.log(`- 服务器地址: ${baseUrl}`);
console.log('');

// 通用的API调用函数
async function callApi(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// 测试1: 验证API - 正确提取码
async function test1_correctExtractCode() {
  console.log('🔍 测试1: 验证API - 正确提取码');

  const result = await callApi(`${baseUrl}/api/v1/share/verify`, {
    method: 'POST',
    body: JSON.stringify({
      shareCode,
      extractCode: correctExtractCode,
    }),
  });

  if (result.success && result.data.code === 0) {
    console.log('✅ 正确提取码验证成功');
    console.log(`   用户Token: ${result.data.data.userToken}`);
    console.log(`   过期时间: ${result.data.data.shareInfo.expiresAt}`);
    return result.data.data.userToken;
  } else {
    console.log('❌ 正确提取码验证失败');
    console.log(`   错误: ${result.data?.msg || result.error}`);
    return null;
  }
}

// 测试2: 验证API - 错误提取码
async function test2_wrongExtractCode() {
  console.log('\n🔍 测试2: 验证API - 错误提取码');

  const result = await callApi(`${baseUrl}/api/v1/share/verify`, {
    method: 'POST',
    body: JSON.stringify({
      shareCode,
      extractCode: 'wrong',
    }),
  });

  if (!result.success || result.data.code !== 0) {
    console.log('✅ 错误提取码正确被拒绝');
    console.log(`   错误信息: ${result.data?.msg || result.error}`);
  } else {
    console.log('❌ 错误提取码竟然通过了验证');
  }
}

// 测试3: 验证API - 空提取码
async function test3_emptyExtractCode() {
  console.log('\n🔍 测试3: 验证API - 空提取码');

  const result = await callApi(`${baseUrl}/api/v1/share/verify`, {
    method: 'POST',
    body: JSON.stringify({
      shareCode,
      extractCode: '',
    }),
  });

  if (!result.success || result.data.code !== 0) {
    console.log('✅ 空提取码正确被拒绝');
    console.log(`   错误信息: ${result.data?.msg || result.error}`);
  } else {
    console.log('❌ 空提取码竟然通过了验证');
  }
}

// 测试4: 验证API - 不提供提取码
async function test4_noExtractCode() {
  console.log('\n🔍 测试4: 验证API - 不提供提取码');

  const result = await callApi(`${baseUrl}/api/v1/share/verify`, {
    method: 'POST',
    body: JSON.stringify({
      shareCode,
    }),
  });

  if (!result.success || result.data.code !== 0) {
    console.log('✅ 不提供提取码正确被拒绝');
    console.log(`   错误信息: ${result.data?.msg || result.error}`);
  } else {
    console.log('❌ 不提供提取码竟然通过了验证');
  }
}

// 测试5: 获取采购订单信息
async function test5_getPurchaseOrderInfo(userToken) {
  console.log('\n🔍 测试5: 获取采购订单信息');

  if (!userToken) {
    console.log('❌ 没有有效的用户Token，跳过此测试');
    return;
  }

  const result = await callApi(
    `${baseUrl}/api/v1/share/${shareCode}/info?extractCode=${correctExtractCode}`,
    {
      method: 'GET',
    }
  );

  if (result.success && result.data.code === 0) {
    console.log('✅ 成功获取采购订单信息');
    console.log(`   订单号: ${result.data.data.orderInfo.orderNumber}`);
    console.log(`   产品数量: ${result.data.data.products.length}`);
    console.log(`   供货记录数: ${result.data.data.statistics.totalSupplyRecords}`);
    return result.data.data;
  } else {
    console.log('❌ 获取采购订单信息失败');
    console.log(`   错误: ${result.data?.msg || result.error}`);
    return null;
  }
}

// 测试6: 获取可选产品列表
async function test6_getAvailableProducts() {
  console.log('\n🔍 测试6: 获取可选产品列表');

  const result = await callApi(
    `${baseUrl}/api/v1/share/${shareCode}/products?extractCode=${correctExtractCode}`,
    {
      method: 'GET',
    }
  );

  if (result.success && result.data.code === 0) {
    console.log('✅ 成功获取可选产品列表');
    console.log(`   可选产品数: ${result.data.data.products.length}`);
    return result.data.data.products;
  } else {
    console.log('❌ 获取可选产品列表失败');
    console.log(`   错误: ${result.data?.msg || result.error}`);
    return null;
  }
}

// 测试7: 模拟创建供货记录
async function test7_createSupplyRecord(products) {
  console.log('\n🔍 测试7: 模拟创建供货记录');

  if (!products || products.length === 0) {
    console.log('❌ 没有可用产品，跳过此测试');
    return;
  }

  const testProduct = products[0];
  const testRecord = {
    supplierInfo: {
      name: '测试供应商',
      contactPerson: '张三',
      contactPhone: '13800138000',
      remark: '测试联系备注',
    },
    items: [
      {
        productId: testProduct.product.id,
        quantity: 1, // 供货1个
        unitPrice: testProduct.unitPrice,
        totalPrice: testProduct.unitPrice,
        remark: '测试供货',
      },
    ],
    totalAmount: testProduct.unitPrice,
    remark: '这是一个测试供货记录',
    extractCode: correctExtractCode,
  };

  console.log(`   测试产品: ${testProduct.product.code}`);
  console.log(`   供货数量: ${testRecord.items[0].quantity}`);
  console.log(`   可用数量: ${testProduct.availableQuantity}`);

  if (testProduct.availableQuantity <= 0) {
    console.log('⚠️  该产品没有可用库存，无法创建供货记录');
    return;
  }

  const result = await callApi(`${baseUrl}/api/v1/share/${shareCode}/supply`, {
    method: 'POST',
    body: JSON.stringify(testRecord),
  });

  if (result.success && result.data.code === 0) {
    console.log('✅ 成功创建测试供货记录');
    console.log(`   记录ID: ${result.data.data.supplyRecord.id}`);
    return result.data.data.supplyRecord.id;
  } else {
    console.log('❌ 创建供货记录失败');
    console.log(`   错误: ${result.data?.msg || result.error}`);
    return null;
  }
}

// 测试8: 测试案例模拟（用户实际操作流程）
async function test8_userScenario() {
  console.log('\n🔍 测试8: 用户实际操作流程模拟');

  // 步骤1: 用户访问分享链接页面
  console.log('   步骤1: 访问分享链接页面 /supply/' + shareCode);

  // 步骤2: 用户输入提取码
  console.log('   步骤2: 用户输入提取码 "' + correctExtractCode + '"');

  // 步骤3: 前端调用验证API
  console.log('   步骤3: 调用验证API...');
  const verifyResult = await callApi(`${baseUrl}/api/v1/share/verify`, {
    method: 'POST',
    body: JSON.stringify({
      shareCode,
      extractCode: correctExtractCode,
    }),
  });

  if (verifyResult.success && verifyResult.data.code === 0) {
    console.log('   ✅ 验证成功，获得访问权限');

    // 步骤4: 跳转到仪表板页面
    console.log('   步骤4: 跳转到仪表板页面...');

    // 步骤5: 获取订单信息
    console.log('   步骤5: 加载采购订单信息...');
    const orderInfo = await test5_getPurchaseOrderInfo(verifyResult.data.data.userToken);

    if (orderInfo) {
      console.log('   ✅ 完整流程测试成功！');
      console.log('   🎉 用户可以正常访问和操作供货记录');
    } else {
      console.log('   ❌ 流程在获取订单信息阶段失败');
    }
  } else {
    console.log('   ❌ 验证失败，流程中断');
    console.log(`   错误: ${verifyResult.data?.msg || verifyResult.error}`);
  }
}

// 运行所有测试
async function runAllTests() {
  try {
    // 基础验证测试
    const userToken = await test1_correctExtractCode();
    await test2_wrongExtractCode();
    await test3_emptyExtractCode();
    await test4_noExtractCode();

    // 功能测试
    const orderInfo = await test5_getPurchaseOrderInfo(userToken);
    const products = await test6_getAvailableProducts();
    const recordId = await test7_createSupplyRecord(products);

    // 完整流程测试
    await test8_userScenario();

    console.log('\n📊 测试完成总结:');
    console.log('- 验证API功能: ' + (userToken ? '✅ 正常' : '❌ 异常'));
    console.log('- 订单信息获取: ' + (orderInfo ? '✅ 正常' : '❌ 异常'));
    console.log('- 产品列表获取: ' + (products ? '✅ 正常' : '❌ 异常'));
    console.log('- 供货记录创建: ' + (recordId ? '✅ 正常' : '⚠️  跳过或失败'));

    if (userToken && orderInfo && products) {
      console.log('\n🎉 分享链接功能完全正常！');
      console.log('📱 你可以通过以下URL访问:');
      console.log(`   ${baseUrl}/supply/${shareCode}`);
      console.log(`   或直接带提取码: ${baseUrl}/supply/${shareCode}?pwd=${correctExtractCode}`);
    } else {
      console.log('\n⚠️  部分功能存在问题，请检查服务器状态');
    }
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
  }
}

// 开始运行测试
runAllTests();
