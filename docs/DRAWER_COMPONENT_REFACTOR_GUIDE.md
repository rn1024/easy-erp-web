# Drawer组件抽离改造指南

## 项目概述

本文档提供了将页面中的Modal弹窗抽离为独立Drawer组件的标准化流程和最佳实践。

## 改造目标

1. **模块化**: 将弹窗逻辑抽离为独立组件，提高代码复用性
2. **标准化**: 统一使用Drawer替代Modal，提供更好的用户体验
3. **可维护性**: 简化页面代码结构，便于后续维护和扩展
4. **一致性**: 确保所有页面的弹窗交互体验一致

## 技术规范

### 组件结构模板

```typescript
import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  App,
  Button,
  Drawer,
  Form,
  Input,
  Space
} from 'antd';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

/**
 * APIs
 */
import {
  createApi,
  updateApi,
  type EntityType,
  type FormDataType
} from '@/services/xxx';

// form submit
const formSubmit = async (entity: EntityType | null, formData: FormDataType) => {
  // 区分是更新还是新增
  if (entity && entity.id) {
    return await updateApi(entity.id, formData);
  }
  return await createApi(formData);
};

/**
 * Types
 */
import type { DrawerProps, FormProps } from 'antd';
import type { IntlShape } from 'react-intl';

type Props = {
  open: boolean;
  entity: EntityType | null;
  closeDrawer: (reload?: boolean) => void;
  // 其他可选的props
};

const ComponentFormDrawer: React.FC<Props> = ({
  open,
  entity,
  closeDrawer
}) => {
  /**
   * Hooks
   */
  const { message } = App.useApp();
  const intl: IntlShape = useIntl();

  /**
   * State
   */
  const [submitting, { setFalse: setSubmittingFalse, setTrue: setSubmittingTrue }] = useBoolean(false);
  const [form] = Form.useForm();

  /**
   * DrawerProps
   */
  const drawerProps: DrawerProps = {
    footer: (
      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button type="default" onClick={() => closeDrawer()}>
            取消
          </Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={() => {
              form.validateFields()
                .then(async (formData: FormDataType) => {
                  setSubmittingTrue();
                  try {
                    const res = await formSubmit(entity, formData);
                    if (get(res, 'data.code') === 0) {
                      message.success(entity ? '更新成功' : '创建成功');
                      closeDrawer(true);
                    } else {
                      message.error(get(res, 'data.msg') || '操作失败');
                      setSubmittingFalse();
                    }
                  } catch (error: any) {
                    message.error(error.response?.data?.msg || '操作失败');
                    setSubmittingFalse();
                  }
                })
                .catch(() => {});
            }}
          >
            确定
          </Button>
        </Space>
      </div>
    ),
    destroyOnClose: true,
    maskClosable: false,
    open: open,
    title: entity ? '编辑' : '新建',
    width: 600,
    afterOpenChange: (open) => {
      if (!open) {
        setSubmittingFalse();
        form.resetFields();
      } else if (entity) {
        form.setFieldsValue({
          // 设置表单字段值
        });
      }
    },
    onClose: () => {
      closeDrawer();
    },
  };

  /**
   * FormProps
   */
  const formProps: FormProps = {
    form: form,
    layout: 'vertical',
    validateTrigger: 'onBlur',
    preserve: false,
  };

  return (
    <Drawer {...drawerProps}>
      <Form {...formProps}>
        {/* 表单字段 */}
      </Form>
    </Drawer>
  );
};

export default ComponentFormDrawer;
```

## 目录结构规范

```
src/app/system/[module]/
├── page.tsx                    # 主页面
├── components/                 # 组件目录
│   ├── [module]-form-drawer.tsx    # 表单抽屉组件
│   ├── [module]-detail-drawer.tsx  # 详情抽屉组件
│   └── [module]-xxx-drawer.tsx     # 其他特定抽屉组件
```

## 改造流程

### 1. 分析现有Modal

- [ ] 识别页面中的Modal组件
- [ ] 分析Modal的用途（表单、详情、确认等）
- [ ] 确定需要抽离的组件数量和类型

### 2. 创建目录结构

- [ ] 创建 `components` 目录
- [ ] 按功能命名抽屉组件文件

### 3. 实现Drawer组件

- [ ] 复制模板代码
- [ ] 替换API导入和类型定义
- [ ] 实现formSubmit函数
- [ ] 配置DrawerProps
- [ ] 实现表单布局
- [ ] 添加表单验证规则

### 4. 修改主页面

- [ ] 导入新创建的Drawer组件
- [ ] 移除Modal相关代码
- [ ] 更新状态管理变量
- [ ] 修改事件处理函数
- [ ] 替换Modal组件为Drawer组件

### 5. 测试验证

- [ ] 测试新建功能
- [ ] 测试编辑功能
- [ ] 测试表单验证
- [ ] 测试错误处理
- [ ] 测试用户体验

## 关键特性

### 1. 状态管理

```typescript
// 使用useBoolean管理提交状态
const [submitting, { setFalse: setSubmittingFalse, setTrue: setSubmittingTrue }] =
  useBoolean(false);

// 主页面状态
const [drawerVisible, setDrawerVisible] = useState(false);
const [editingRecord, setEditingRecord] = useState<EntityType | null>(null);
```

### 2. 生命周期管理

```typescript
// 抽屉打开/关闭时的处理
afterOpenChange: (open) => {
  if (!open) {
    setSubmittingFalse();
    form.resetFields();
  } else if (entity) {
    form.setFieldsValue({
      // 编辑时设置表单值
    });
  }
};
```

### 3. 错误处理

```typescript
// 统一的错误处理逻辑
catch (error: any) {
  message.error(error.response?.data?.msg || '操作失败');
  setSubmittingFalse();
}
```

### 4. API响应处理

```typescript
// 标准化的API响应处理
if (get(res, 'data.code') === 0) {
  message.success(entity ? '更新成功' : '创建成功');
  closeDrawer(true);
} else {
  message.error(get(res, 'data.msg') || '操作失败');
  setSubmittingFalse();
}
```

## 已完成改造的页面

### 1. 角色管理页面

- **路径**: `src/app/system/roles/`
- **组件**:
  - `role-form-drawer.tsx` - 角色表单抽屉
  - `permission-manage-drawer.tsx` - 权限管理抽屉
- **特点**: 复杂权限配置、批量操作

### 2. 店铺管理页面

- **路径**: `src/app/system/shops/`
- **组件**:
  - `shop-form-drawer.tsx` - 店铺表单抽屉
- **特点**: 简单CRUD操作、头像上传

## 待改造页面清单

### 高优先级

- [ ] 账户管理页面 (`src/app/system/accounts/`)
- [ ] 产品管理页面 (`src/app/system/products/`)
- [ ] 供应商管理页面 (`src/app/system/suppliers/`)

### 中优先级

- [ ] 采购订单管理页面 (`src/app/system/purchase-orders/`)
- [ ] 库存管理页面 (`src/app/system/finished-inventory/`)
- [ ] 仓库任务管理页面 (`src/app/system/warehouse-tasks/`)

### 低优先级

- [ ] 财务报表页面 (`src/app/system/financial-reports/`)
- [ ] 日志管理页面 (`src/app/system/logs/`)
- [ ] 文件管理页面 (`src/app/files/`)

## 注意事项

### 1. 代码复用

- 对于相似的表单结构，可以考虑创建通用的表单组件
- 复杂的业务逻辑应该封装为独立的hooks或utils

### 2. 性能优化

- 使用 `destroyOnClose: true` 确保抽屉关闭时销毁DOM
- 使用 `preserve: false` 避免表单值缓存

### 3. 用户体验

- 使用 `maskClosable: false` 防止意外关闭
- 提供清晰的loading状态反馈
- 合理设置抽屉宽度以适应内容

### 4. 错误处理

- 统一的错误消息提示
- 失败时不关闭抽屉，保留用户输入
- 提供重试机制

## 最佳实践

1. **命名规范**: 使用描述性的组件名称
2. **目录结构**: 保持清晰的目录层次
3. **代码复用**: 抽取公共逻辑为工具函数
4. **类型安全**: 确保完整的TypeScript类型定义
5. **用户体验**: 保持一致的交互模式
6. **错误处理**: 提供友好的错误提示
7. **性能考虑**: 避免不必要的重渲染

## 质量检查清单

### 代码质量

- [ ] 所有组件都有明确的TypeScript类型
- [ ] 遵循统一的命名约定
- [ ] 没有unused imports
- [ ] 没有console.log等调试代码

### 功能完整性

- [ ] 新建功能正常
- [ ] 编辑功能正常
- [ ] 表单验证正确
- [ ] 错误处理完善
- [ ] 成功反馈及时

### 用户体验

- [ ] 抽屉打开/关闭动画流畅
- [ ] 表单初始化正确
- [ ] 提交状态反馈清晰
- [ ] 错误信息友好
- [ ] 操作响应及时

这个改造指南为整个项目的Modal到Drawer迁移提供了标准化的流程和最佳实践。
