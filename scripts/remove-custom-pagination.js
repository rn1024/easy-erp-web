#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 开始移除自定义Pagination组件导入...\n');

// 递归获取所有文件
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);

    if (fs.statSync(fullPath).isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        if (!file.endsWith('.d.ts') && !file.includes('.test.')) {
          arrayOfFiles.push(fullPath);
        }
      }
    }
  });

  return arrayOfFiles;
}

// 获取src目录下的所有文件
const files = getAllFiles('./src');

let processedCount = 0;
let modifiedCount = 0;

files.forEach((filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // 检查是否包含自定义Pagination组件的导入
    const hasCustomPagination =
      content.includes("import { Pagination } from '@/components/ui/pagination'") ||
      content.includes('import { Pagination } from "@/components/ui/pagination"');

    if (hasCustomPagination) {
      console.log(`📝 处理文件: ${filePath}`);

      let newContent = content;

      // 移除自定义Pagination组件的导入行
      newContent = newContent.replace(
        /import { Pagination } from ['"]@\/components\/ui\/pagination['"];\n?/g,
        ''
      );

      // 移除可能的混合导入中的Pagination部分 (如果有其他组件一起导入)
      newContent = newContent.replace(
        /import { ([^}]*), Pagination, ([^}]*) } from ['"]@\/components\/ui\/pagination['"];/g,
        (match, before, after) => {
          const imports = [before, after].filter(Boolean).join(', ');
          return imports ? `import { ${imports} } from '@/components/ui/pagination';` : '';
        }
      );

      // 移除单独的Pagination导入
      newContent = newContent.replace(
        /import { Pagination } from ['"]@\/components\/ui\/pagination['"];?\n?/g,
        ''
      );

      // 如果内容发生了变化，写入文件
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`  ✅ 已移除自定义Pagination导入`);
        modifiedCount++;
      }
    }

    processedCount++;
  } catch (error) {
    console.error(`❌ 处理文件 ${filePath} 时出错:`, error.message);
  }
});

console.log(`\n📊 处理完成:`);
console.log(`  - 总文件数: ${processedCount}`);
console.log(`  - 修改文件数: ${modifiedCount}`);

if (modifiedCount > 0) {
  console.log(`\n⚠️  注意事项:`);
  console.log(`  1. 需要手动更新这些页面的ProTable配置，添加pagination属性`);
  console.log(`  2. 移除页面中的<Pagination />组件使用`);
  console.log(`  3. 参考已更新的页面: accounts、shops、logs`);
  console.log(`\n🔧 ProTable分页配置示例:`);
  console.log(`  pagination: {`);
  console.log(`    current: Number(searchParams.page) || 1,`);
  console.log(`    pageSize: Number(searchParams.pageSize) || 20,`);
  console.log(`    total: data?.total || 0,`);
  console.log(`    showSizeChanger: true,`);
  console.log(`    showQuickJumper: true,`);
  console.log(
    `    showTotal: (total, range) => \`第 \${range[0]}-\${range[1]} 条，共 \${total} 条\`,`
  );
  console.log(`    onChange: (page, pageSize) => { /* 更新searchParams */ }`);
  console.log(`  }`);
}

console.log(`\n🎉 自定义Pagination组件导入移除完成!`);
