# GitHub Actions 脚本同步方案设计

## 问题背景

当前在本地修改的脚本文件（如数据库迁移脚本、部署脚本等）需要在 GitHub Actions 部署时自动同步到服务器，确保服务器上运行的是最新版本的脚本。

### 当前存在的问题

1. **脚本版本不一致**：本地修改的脚本无法及时同步到服务器
2. **手动同步易出错**：需要手动SSH登录服务器更新脚本，容易遗漏
3. **部署流程中断**：脚本版本不一致导致部署失败（如数据库迁移脚本问题）

## 现状分析

### 当前部署流程

1. **GitHub Actions 工作流**: `.github/workflows/deploy.yml`
   - 验证阶段：代码检查、类型检查、lint
   - 部署阶段：通过SSH连接服务器，执行git pull和部署脚本
   - 验证阶段：健康检查、功能验证

2. **关键脚本文件**:
   ```
   scripts/
   ├── deploy-to-ecs.sh          # 主部署脚本
   ├── deploy-standalone.sh      # 独立部署脚本
   ├── check-database-connection.sh  # 数据库连接检查
   └── db-backup.sh              # 数据库备份脚本
   ```

3. **部署过程中的脚本调用链**:
   - GitHub Actions → SSH → `git pull` → `scripts/deploy-to-ecs.sh`
   - `deploy-to-ecs.sh` → `db-backup.sh` (备份数据库)
   - `deploy-to-ecs.sh` → `prisma migrate deploy` (执行迁移)
   - 多处调用 `check-database-connection.sh` 进行连接验证

### 问题根源

当前部署流程依赖 `git pull` 来同步代码，包括脚本文件。但存在以下问题：

1. **Git 同步时机**：脚本在 git pull 之后才被更新，但某些检查脚本在 pull 之前就被调用
2. **权限问题**：脚本文件权限（执行权限）不会被 git 自动同步
3. **缓存问题**：服务器可能缓存旧版本的脚本

## 解决方案设计

### 方案一：优化 Git 同步策略（推荐）

#### 核心思路
确保所有脚本在被调用之前都已经更新到最新版本，并设置正确的权限。

#### 实施步骤

1. **调整部署流程顺序**
   ```yaml
   # deploy.yml 中的部署步骤优化
   steps:
     # 1. 先进行 git pull 更新所有文件
     - name: Update code and scripts
       script: |
         cd /www/wwwroot/easy-erp-web
         git fetch origin
         git reset --hard origin/main
         
     # 2. 统一设置脚本权限
     - name: Set scripts permissions
       script: |
         chmod +x scripts/*.sh
         
     # 3. 验证脚本文件完整性
     - name: Verify scripts
       script: |
         for script in deploy-to-ecs.sh check-database-connection.sh db-backup.sh; do
           if [ ! -f "scripts/$script" ]; then
             echo "❌ Missing script: $script"
             exit 1
           fi
         done
         
     # 4. 执行部署
     - name: Execute deployment
       script: |
         ./scripts/deploy-to-ecs.sh
   ```

2. **在 Git 仓库中保存执行权限**
   ```bash
   # 本地设置脚本权限并提交
   git update-index --chmod=+x scripts/*.sh
   git commit -m "chore: 设置脚本执行权限"
   ```

3. **添加脚本版本校验**
   ```bash
   # 在每个脚本开头添加版本标识
   #!/bin/bash
   # Script Version: 1.0.0
   # Last Updated: 2025-09-04
   ```

### 方案二：独立脚本同步机制

#### 核心思路
将脚本同步与代码同步分离，使用专门的同步机制确保脚本最新。

#### 实施步骤

1. **创建脚本同步工具**
   ```bash
   # scripts/sync-scripts.sh
   #!/bin/bash
   
   # 脚本同步配置
   SCRIPTS_TO_SYNC=(
     "deploy-to-ecs.sh"
     "deploy-standalone.sh"
     "check-database-connection.sh"
     "db-backup.sh"
   )
   
   # 从 GitHub 直接下载最新脚本
   for script in "${SCRIPTS_TO_SYNC[@]}"; do
     echo "📥 同步脚本: $script"
     curl -sL "https://raw.githubusercontent.com/rn1024/easy-erp-web/main/scripts/$script" \
          -o "scripts/$script"
     chmod +x "scripts/$script"
   done
   ```

2. **在部署前执行同步**
   ```yaml
   # 在 deploy.yml 中添加
   - name: Sync latest scripts
     script: |
       cd /www/wwwroot/easy-erp-web
       bash scripts/sync-scripts.sh
   ```

### 方案三：使用 GitHub Actions Artifacts

#### 核心思路
将脚本作为构建产物上传，部署时下载使用。

#### 实施步骤

1. **上传脚本作为 Artifacts**
   ```yaml
   - name: Upload scripts
     uses: actions/upload-artifact@v3
     with:
       name: deployment-scripts
       path: scripts/*.sh
   ```

2. **部署时下载并使用**
   ```yaml
   - name: Download scripts
     uses: actions/download-artifact@v3
     with:
       name: deployment-scripts
       path: /tmp/scripts
       
   - name: Deploy scripts
     script: |
       cp -f /tmp/scripts/*.sh /www/wwwroot/easy-erp-web/scripts/
       chmod +x /www/wwwroot/easy-erp-web/scripts/*.sh
   ```

## 推荐方案分析

### 为什么选择方案一

1. **最小改动**：只需调整现有流程顺序，不需要引入新的工具或机制
2. **可靠性高**：利用 Git 的版本控制能力，确保一致性
3. **易于维护**：所有脚本都在版本控制中，便于追踪和回滚
4. **性能最优**：不需要额外的网络请求或文件传输

### 方案对比

| 特性 | 方案一（Git优化） | 方案二（独立同步） | 方案三（Artifacts） |
|-----|----------------|----------------|-------------------|
| 实施难度 | 低 | 中 | 中 |
| 维护成本 | 低 | 中 | 高 |
| 可靠性 | 高 | 中 | 高 |
| 性能影响 | 无 | 小 | 中 |
| 灵活性 | 中 | 高 | 高 |

## 实施计划

### 第一阶段：快速修复（立即实施）

1. **修改 deploy.yml 文件**
   - 调整脚本调用顺序
   - 确保 git pull 在所有脚本调用之前
   - 统一设置脚本权限

2. **提交脚本执行权限**
   ```bash
   git update-index --chmod=+x scripts/*.sh
   git add scripts/*.sh
   git commit -m "fix: 设置脚本执行权限"
   git push origin main
   ```

### 第二阶段：优化增强（1周内）

1. **添加脚本完整性检查**
   - 在部署开始前验证所有必需脚本存在
   - 检查脚本语法错误

2. **实现脚本版本管理**
   - 在脚本中添加版本信息
   - 部署时记录脚本版本

3. **添加回滚机制**
   - 备份旧版本脚本
   - 支持快速回滚到上一版本

### 第三阶段：长期改进（1个月内）

1. **建立脚本测试机制**
   - 添加脚本单元测试
   - CI/CD 中集成脚本测试

2. **监控和告警**
   - 监控脚本执行状态
   - 失败时及时告警

3. **文档完善**
   - 完善脚本使用文档
   - 记录常见问题和解决方案

## 具体实施步骤

### Step 1: 修改 .github/workflows/deploy.yml

需要修改的关键部分：

1. **将 git pull 提前到所有脚本调用之前**
2. **统一设置脚本权限**
3. **添加脚本完整性检查**

### Step 2: 设置本地脚本权限

```bash
# 在本地项目目录执行
cd /Users/samuelcn/Documents/Project/easy-erp/easy-erp-web

# 设置所有脚本的执行权限
chmod +x scripts/*.sh

# 告诉 git 记录权限变更
git update-index --chmod=+x scripts/deploy-to-ecs.sh
git update-index --chmod=+x scripts/deploy-standalone.sh
git update-index --chmod=+x scripts/check-database-connection.sh
git update-index --chmod=+x scripts/db-backup.sh

# 提交更改
git add scripts/*.sh
git commit -m "fix: 设置脚本执行权限，确保部署时权限正确"
```

### Step 3: 添加脚本验证逻辑

创建新的验证脚本 `scripts/verify-scripts.sh`:

```bash
#!/bin/bash

# 脚本完整性验证
REQUIRED_SCRIPTS=(
  "deploy-to-ecs.sh"
  "deploy-standalone.sh"
  "check-database-connection.sh"
  "db-backup.sh"
)

echo "🔍 验证必需脚本..."

for script in "${REQUIRED_SCRIPTS[@]}"; do
  if [ ! -f "scripts/$script" ]; then
    echo "❌ 缺少必需脚本: $script"
    exit 1
  fi
  
  if [ ! -x "scripts/$script" ]; then
    echo "⚠️ 脚本无执行权限: $script，正在设置..."
    chmod +x "scripts/$script"
  fi
  
  # 检查脚本语法
  if ! bash -n "scripts/$script" 2>/dev/null; then
    echo "❌ 脚本语法错误: $script"
    exit 1
  fi
done

echo "✅ 所有脚本验证通过"
```

## 风险评估

### 潜在风险

1. **Git 权限问题**
   - 风险：服务器无法访问 Git 仓库
   - 缓解：使用 SSH key 认证，定期检查权限

2. **脚本兼容性**
   - 风险：新脚本与旧环境不兼容
   - 缓解：添加版本检查，渐进式更新

3. **部署中断**
   - 风险：脚本更新过程中部署失败
   - 缓解：添加回滚机制，保留旧版本备份

### 回滚方案

1. **快速回滚**
   ```bash
   # 恢复到上一个版本
   cd /www/wwwroot/easy-erp-web
   git reset --hard HEAD~1
   chmod +x scripts/*.sh
   ```

2. **从备份恢复**
   ```bash
   # 从备份目录恢复脚本
   cp -f /backup/scripts/*.sh scripts/
   chmod +x scripts/*.sh
   ```

## 监控指标

1. **部署成功率**
   - 目标：> 99%
   - 监控脚本同步失败导致的部署失败

2. **脚本执行时间**
   - 基准：记录各脚本执行时间
   - 告警：执行时间超过基准 2 倍

3. **版本一致性**
   - 检查：服务器脚本版本与 Git 仓库一致
   - 频率：每次部署后验证

## 总结

通过优化 Git 同步策略和部署流程顺序，可以有效解决脚本同步问题。推荐采用方案一，因为它：

1. **实施简单**：只需调整现有流程
2. **风险最低**：不引入新的依赖
3. **效果立竿见影**：可立即解决当前问题

后续可以根据实际使用情况，逐步引入更多优化措施，如自动化测试、版本管理等，持续改进部署流程的可靠性和效率。