# Modal组件标准化改造指南

## 项目概述

本文档提供了将项目中的Drawer组件迁移为Modal组件的标准化流程和最佳实践。

## 改造目标

1. **统一交互模式**: 将所有Drawer组件统一替换为Modal组件
2. **保持业务功能**: 确保所有业务逻辑和功能完整保留
3. **优化用户体验**: 提供更好的弹窗交互体验
4. **代码规范化**: 遵循统一的代码结构和命名规范

## 技术规范

### 组件结构模板

```typescript
import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  App,
  Button,
  Modal,
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
import { createApi, updateApi } from '@/services/xxx';

/**
 * Types
 */
import type { ModalProps, FormProps } from 'antd';
import type { IntlShape } from 'react-intl';
import type { EntityType, FormDataType } from '@/services/xxx';

// form submit
const formSubmit = async (entity: EntityType | null, formData: FormDataType) => {
  // 区分是更新还是新增
  if (entity && entity.id) {
    return await updateApi(entity.id, formData);
  }
  return await createApi(formData);
};

type Props = {
  open: boolean;
  entity: EntityType | null;
  closeModal: (reload?: boolean) => void;
  // 其他可选的props
};

const ComponentFormModal: React.FC<Props> = ({
  open,
  entity,
  closeModal
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
   * Handlers
   */
  const handleSubmit = async () => {
    try {
      const formData = await form.validateFields();
      setSubmittingTrue();

      const res = await formSubmit(entity, formData);
      if (get(res, 'data.code') === 0) {
        message.success(entity ? '更新成功' : '创建成功');
        closeModal(true);
      } else {
        message.error(get(res, 'data.msg') || '操作失败');
        setSubmittingFalse();
      }
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误，不显示错误消息
        return;
      }
      message.error(error.response?.data?.msg || '操作失败');
      setSubmittingFalse();
    }
  };

  const handleCancel = () => {
    closeModal();
  };

  /**
   * Effects
   */
  useEffect(() => {
    if (open) {
      if (entity) {
        form.setFieldsValue({
          // 设置表单字段值
        });
      } else {
        form.resetFields();
      }
    } else {
      setSubmittingFalse();
      form.resetFields();
    }
  }, [open, entity, form]);

  /**
   * ModalProps
   */
  const modalProps: ModalProps = {
    title: entity ? '编辑' : '新建',
    open: open,
    onOk: handleSubmit,
    onCancel: handleCancel,
    okText: entity ? '更新' : '创建',
    cancelText: '取消',
    confirmLoading: submitting,
    destroyOnClose: true,
    maskClosable: false,
    width: 600,
    centered: true,
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
    <Modal {...modalProps}>
      <Form {...formProps}>
        {/* 表单字段 */}
      </Form>
    </Modal>
  );
};

export default ComponentFormModal;
```

## 命名规范

### 文件命名

- 表单Modal: `[module]-form-modal.tsx`
- 详情Modal: `[module]-detail-modal.tsx`
- 功能Modal: `[module]-[function]-modal.tsx`

### 组件命名

- 表单Modal: `[Module]FormModal`
- 详情Modal: `[Module]DetailModal`
- 功能Modal: `[Module][Function]Modal`

### 状态变量命名

- 显示状态: `modalVisible` 或 `open`
- 关闭方法: `closeModal`
- 打开方法: `openModal`

## Modal配置规范

### 1. 基础配置

```typescript
const modalProps: ModalProps = {
  title: '标题',
  open: open,
  onOk: handleSubmit,
  onCancel: handleCancel,
  okText: '确定',
  cancelText: '取消',
  confirmLoading: submitting,
  destroyOnClose: true,
  maskClosable: false,
  centered: true,
};
```

### 2. 宽度规范

- 简单表单: 520px (默认)
- 标准表单: 600px
- 复杂表单: 800px
- 详情展示: 800px

### 3. 特殊配置

- **表单Modal**:
  - `confirmLoading: submitting` - 显示提交状态
  - `maskClosable: false` - 防止意外关闭
  - `destroyOnClose: true` - 关闭时销毁内容
- **详情Modal**:
  - `footer: null` - 隐藏底部按钮
  - `maskClosable: true` - 允许点击遮罩关闭
- **上传Modal**:
  - `footer: null` - 自定义底部内容
  - `width: 520` - 适中宽度

## 改造流程

### 1. 修改导入语句

```typescript
// 原来
import { Drawer } from 'antd';

// 修改为
import { Modal } from 'antd';
```

**重要：类型导入规范**

```typescript
// ❌ 错误的混合导入方式
import { createApi, updateApi, type EntityType, type FormDataType } from '@/services/xxx';

// ✅ 正确的分离导入方式
import { createApi, updateApi } from '@/services/xxx';

// Types必须单独导入
import type { EntityType, FormDataType } from '@/services/xxx';
import type { ModalProps, FormProps } from 'antd';
import type { IntlShape } from 'react-intl';
```

### 2. 修改Props接口

```typescript
// 原来
import type { DrawerProps } from 'antd';

// 修改为
import type { ModalProps } from 'antd';
```

### 3. 修改组件配置

```typescript
// 原来
const drawerProps: DrawerProps = {
  footer: <Footer />,
  destroyOnClose: true,
  maskClosable: false,
  open: open,
  title: '标题',
  width: 600,
  afterOpenChange: (open) => { ... },
  onClose: () => { ... },
};

// 修改为
const modalProps: ModalProps = {
  title: '标题',
  open: open,
  onOk: handleSubmit,
  onCancel: handleCancel,
  okText: '确定',
  cancelText: '取消',
  confirmLoading: submitting,
  destroyOnClose: true,
  maskClosable: false,
  width: 600,
  centered: true,
};
```

### 4. 修改事件处理

```typescript
// 原来
const drawerProps = {
  afterOpenChange: (open) => {
    if (!open) {
      setSubmittingFalse();
      form.resetFields();
    } else if (entity) {
      form.setFieldsValue({ ... });
    }
  },
};

// 修改为
useEffect(() => {
  if (open) {
    if (entity) {
      form.setFieldsValue({ ... });
    } else {
      form.resetFields();
    }
  } else {
    setSubmittingFalse();
    form.resetFields();
  }
}, [open, entity, form]);
```

### 5. 修改渲染结构

```typescript
// 原来
<Drawer {...drawerProps}>
  <Form {...formProps}>
    {/* 内容 */}
  </Form>
</Drawer>

// 修改为
<Modal {...modalProps}>
  <Form {...formProps}>
    {/* 内容 */}
  </Form>
</Modal>
```

## 特殊情况处理

### 1. 详情Modal

```typescript
const modalProps: ModalProps = {
  title: '详情',
  open: open,
  onCancel: handleCancel,
  footer: (
    <Button type="primary" onClick={handleCancel}>
      关闭
    </Button>
  ),
  width: 800,
  centered: true,
};
```

### 2. 上传Modal

```typescript
const modalProps: ModalProps = {
  title: '文件上传',
  open: open,
  onCancel: handleCancel,
  footer: null,
  width: 520,
  centered: true,
};
```

### 3. 复杂表单Modal

```typescript
const modalProps: ModalProps = {
  title: '编辑',
  open: open,
  onOk: handleSubmit,
  onCancel: handleCancel,
  okText: '保存',
  cancelText: '取消',
  confirmLoading: submitting,
  width: 800,
  centered: true,
  bodyStyle: { maxHeight: '70vh', overflowY: 'auto' },
};
```

## 最佳实践

### 1. 状态管理

```typescript
// 使用useBoolean管理提交状态
const [submitting, { setFalse: setSubmittingFalse, setTrue: setSubmittingTrue }] =
  useBoolean(false);

// 页面状态
const [modalVisible, setModalVisible] = useState(false);
const [editingRecord, setEditingRecord] = useState<EntityType | null>(null);
```

### 2. 错误处理

```typescript
const handleSubmit = async () => {
  try {
    const formData = await form.validateFields();
    setSubmittingTrue();

    const res = await formSubmit(entity, formData);
    if (get(res, 'data.code') === 0) {
      message.success(entity ? '更新成功' : '创建成功');
      closeModal(true);
    } else {
      message.error(get(res, 'data.msg') || '操作失败');
      setSubmittingFalse();
    }
  } catch (error: any) {
    if (error.errorFields) {
      // 表单验证错误，不显示错误消息
      return;
    }
    message.error(error.response?.data?.msg || '操作失败');
    setSubmittingFalse();
  }
};
```

### 3. 生命周期处理

```typescript
useEffect(() => {
  if (open) {
    if (entity) {
      form.setFieldsValue(entity);
    } else {
      form.resetFields();
    }
  } else {
    setSubmittingFalse();
    form.resetFields();
  }
}, [open, entity, form]);
```

### 4. 性能优化

```typescript
// 使用useCallback优化事件处理函数
const handleSubmit = useCallback(async () => {
  // 提交逻辑
}, [entity, form]);

const handleCancel = useCallback(() => {
  closeModal();
}, [closeModal]);
```

## 注意事项

1. **表单验证**: Modal的确定按钮会自动触发表单验证
2. **加载状态**: 使用`confirmLoading`属性显示提交状态
3. **键盘事件**: Modal支持ESC键关闭，Enter键确认
4. **焦点管理**: Modal打开时自动聚焦到确定按钮
5. **无障碍访问**: Modal提供完整的无障碍访问支持

## 改造检查清单

### 组件改造

- [ ] 修改导入语句 (Drawer → Modal)
- [ ] 分离类型导入 (import type 单独声明)
- [ ] 修改Props接口 (DrawerProps → ModalProps)
- [ ] 修改组件配置 (drawerProps → modalProps)
- [ ] 修改事件处理 (afterOpenChange → useEffect)
- [ ] 修改渲染结构 (Drawer → Modal)

### 功能验证

- [ ] 新建功能正常
- [ ] 编辑功能正常
- [ ] 表单验证正确
- [ ] 错误处理完善
- [ ] 成功反馈及时

### 用户体验

- [ ] Modal打开/关闭动画流畅
- [ ] 表单初始化正确
- [ ] 提交状态反馈清晰
- [ ] 错误信息友好
- [ ] 键盘操作支持

这个改造指南为整个项目的Drawer到Modal迁移提供了标准化的流程和最佳实践。
