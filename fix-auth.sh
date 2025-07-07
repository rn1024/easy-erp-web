#!/bin/bash

echo "开始批量修复API接口认证方式..."

# 需要修复的文件列表
files=(
  "src/app/api/v1/spare-inventory/route.ts"
  "src/app/api/v1/logs/route.ts"
  "src/app/api/v1/financial-reports/route.ts"
  "src/app/api/v1/purchase-orders/route.ts"
  "src/app/api/v1/warehouse-tasks/route.ts"
  "src/app/api/v1/delivery-records/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "修复文件: $file"

    # 替换import语句
    sed -i '' 's/import { getCurrentUser } from/@\/lib\/auth/import { withAuth } from @\/lib\/middleware/g' "$file"

    # 替换GET方法
    sed -i '' 's/export async function GET(request: NextRequest)/export const GET = withAuth(async (request: NextRequest, user: any)/g' "$file"

    # 替换POST方法
    sed -i '' 's/export async function POST(request: NextRequest)/export const POST = withAuth(async (request: NextRequest, user: any)/g' "$file"

    # 替换PUT方法
    sed -i '' 's/export async function PUT(request: NextRequest)/export const PUT = withAuth(async (request: NextRequest, user: any)/g' "$file"

    # 替换DELETE方法
    sed -i '' 's/export async function DELETE(request: NextRequest)/export const DELETE = withAuth(async (request: NextRequest, user: any)/g' "$file"

    # 删除getCurrentUser调用和权限检查
    sed -i '' '/const user = await getCurrentUser(request);/d' "$file"
    sed -i '' '/if (!user) {/,+2d' "$file"

    # 修复函数结束括号
    sed -i '' 's/^}$/});/g' "$file"

  else
    echo "文件不存在: $file"
  fi
done

echo "批量修复完成！"
