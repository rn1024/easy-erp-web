# 当前问题记录

## 问题概述
在进行登录功能的自动化测试时，遇到了验证码输入框选择器无法正确定位的问题。

## 问题详情

### 背景
- 项目：easy-erp-web (Next.js + Ant Design)
- 测试工具：Playwright MCP
- 测试目标：完整的登录流程自动化测试

### 当前状态
1. **项目启动正常**：开发服务器运行在 http://localhost:3001
2. **API 功能验证通过**：
   - 验证码生成 API 正常工作
   - 登录 API 正常工作（包括错误处理）
3. **Playwright 浏览器环境已修复**：
   - 解决了 Chromium 浏览器版本不匹配问题
   - 成功导航到登录页面
   - 成功填写用户名和密码字段

### 核心问题
**验证码输入框选择器无法定位**

#### 问题表现
- 点击登录按钮后，页面显示"验证码"和"请输入验证码"文本
- 但通过 JavaScript 查询无法找到验证码相关的 input 元素
- 尝试的选择器都无法定位到验证码输入框

#### 已尝试的方法
1. 使用常见的验证码选择器：
   ```javascript
   input[placeholder*='验证码'], input[name='captcha'], #captcha
   ```

2. 通过 JavaScript 查找所有 input 元素：
   ```javascript
   document.querySelectorAll('input')
   ```
   结果：只找到 username 和 password 输入框

3. 搜索包含"验证码"文本的元素：
   ```javascript
   document.querySelectorAll('*')
   ```
   结果：找到相关文本但无法定位到具体的输入框

#### 可能的原因分析
1. **动态渲染**：验证码输入框可能是通过 React/Ant Design 动态渲染的
2. **Shadow DOM**：可能使用了 Shadow DOM 或特殊的组件封装
3. **异步加载**：验证码组件可能需要额外的加载时间
4. **CSS 选择器问题**：实际的 DOM 结构可能与预期不同

### 下一步计划
1. **深入分析 DOM 结构**：
   - 获取完整的 HTML 结构
   - 分析 Ant Design Form 的实际渲染结果
   - 检查是否有嵌套的组件结构

2. **等待策略优化**：
   - 添加适当的等待时间
   - 使用 Playwright 的等待机制

3. **替代方案**：
   - 考虑直接调用 API 进行测试
   - 或者修改前端代码以便于测试

### 技术细节
- **前端框架**：Next.js 14 + Ant Design
- **测试环境**：macOS + Playwright MCP
- **浏览器**：Chromium (已修复版本兼容性问题)
- **当前文件位置**：`/Users/samuelcn/Documents/Project/easy-erp/easy-erp-web/src/app/purchase/purchase-orders/page.tsx:303`

### 相关文件
- 登录页面：`src/app/login/page.tsx`
- API 路由：`src/app/api/auth/login/route.ts`
- 验证码 API：`src/app/api/auth/captcha/route.ts`
- 测试记录：`docs/login-testing-memory.md`

---

**记录时间**：2025-01-11
**状态**：待解决
**优先级**：高（阻碍自动化测试进展）