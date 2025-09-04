#!/bin/bash

# 脚本完整性验证工具
# 用于验证所有必需的脚本文件是否存在、具有执行权限，且语法正确

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 必需的脚本列表
REQUIRED_SCRIPTS=(
  "deploy-to-ecs.sh"
  "deploy-standalone.sh"
  "check-database-connection.sh"
  "db-backup.sh"
)

echo -e "${GREEN}🔍 开始验证脚本完整性...${NC}"
echo "========================================="

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ 错误：请在项目根目录执行此脚本${NC}"
  exit 1
fi

# 检查scripts目录是否存在
if [ ! -d "scripts" ]; then
  echo -e "${RED}❌ 错误：scripts目录不存在${NC}"
  exit 1
fi

# 统计信息
total_scripts=${#REQUIRED_SCRIPTS[@]}
passed_scripts=0
failed_scripts=0

# 验证每个脚本
for script in "${REQUIRED_SCRIPTS[@]}"; do
  script_path="scripts/$script"
  echo -e "\n📄 检查脚本: $script"
  
  # 检查文件是否存在
  if [ ! -f "$script_path" ]; then
    echo -e "  ${RED}❌ 文件不存在${NC}"
    failed_scripts=$((failed_scripts + 1))
    continue
  fi
  echo -e "  ${GREEN}✅ 文件存在${NC}"
  
  # 检查执行权限
  if [ ! -x "$script_path" ]; then
    echo -e "  ${YELLOW}⚠️  无执行权限，正在设置...${NC}"
    chmod +x "$script_path"
    if [ -x "$script_path" ]; then
      echo -e "  ${GREEN}✅ 权限已设置${NC}"
    else
      echo -e "  ${RED}❌ 权限设置失败${NC}"
      failed_scripts=$((failed_scripts + 1))
      continue
    fi
  else
    echo -e "  ${GREEN}✅ 具有执行权限${NC}"
  fi
  
  # 检查脚本语法
  if bash -n "$script_path" 2>/dev/null; then
    echo -e "  ${GREEN}✅ 语法检查通过${NC}"
    passed_scripts=$((passed_scripts + 1))
  else
    echo -e "  ${RED}❌ 语法检查失败${NC}"
    bash -n "$script_path" 2>&1 | sed 's/^/    /'
    failed_scripts=$((failed_scripts + 1))
  fi
done

# 输出汇总结果
echo ""
echo "========================================="
echo -e "${GREEN}📊 验证结果汇总${NC}"
echo "========================================="
echo "检查脚本总数: $total_scripts"
echo -e "${GREEN}✅ 通过: $passed_scripts${NC}"
if [ $failed_scripts -gt 0 ]; then
  echo -e "${RED}❌ 失败: $failed_scripts${NC}"
else
  echo -e "${GREEN}❌ 失败: 0${NC}"
fi

# 额外信息
echo ""
echo "📋 当前脚本权限状态："
ls -la scripts/*.sh

# 返回结果
if [ $failed_scripts -gt 0 ]; then
  echo ""
  echo -e "${RED}❌ 脚本验证失败，请修复上述问题${NC}"
  exit 1
else
  echo ""
  echo -e "${GREEN}🎉 所有脚本验证通过！${NC}"
  exit 0
fi