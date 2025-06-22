# API 接口使用指南

## 快速开始

### 1. 环境配置

首先确保环境变量配置正确：

```bash
# .env.local
NEXT_PUBLIC_API_URL=''
```

### 2. 基本使用模式

所有接口调用都通过 `useRequest` hook 进行：

```typescript
import { useRequest } from 'ahooks';
import { captcha } from '@/services/auth';

const CaptchaExample = () => {
  const { data, loading, error, run } = useRequest(captcha, {
    manual: true,
    onSuccess: ({ data: { code, data, msg } }) => {
      if (code !== 0) {
        message.error(msg);
        return;
      }
      // 处理成功数据
      console.log('验证码信息:', data);
    },
  });

  return (
    <div>
      {loading && <Spin />}
      {/* 渲染数据 */}
    </div>
  );
};
```

## 常用接口示例

### 认证相关

#### 登录流程

```typescript
import { useRequest } from 'ahooks';
import { captcha, login } from '@/services/auth';
import { message } from 'antd';
import store from 'store2';

const LoginComponent = () => {
  // 获取验证码
  const { data: captchaData, run: getCaptcha } = useRequest(captcha, {
    manual: true,
    onSuccess: ({ data: { code, data } }) => {
      if (code === 0) {
        setCaptchaInfo(data);
      }
    },
  });

  // 用户登录
  const { loading: loginLoading, run: doLogin } = useRequest(login, {
    manual: true,
    onSuccess: ({ data: { code, data, msg } }) => {
      if (code !== 0) {
        message.error(msg);
        return;
      }

      // 保存token和用户信息
      store.set('token', data.token);
      store.set('user', data.user);
      store.set('permissions', data.permissions);

      // 跳转到首页
      router.push('/dashboard');
    },
  });

  const handleSubmit = (values) => {
    doLogin({
      username: values.username,
      password: values.password,
      captcha: values.captcha,
      key: captchaInfo.key,
    });
  };
};
```

### 文件上传

#### 图片上传

```typescript
import { uploadImage } from '@/services/common';
import { Upload, message } from 'antd';

const ImageUpload = ({ onSuccess }) => {
  const { run: doUpload } = useRequest(uploadImage, {
    manual: true,
    onSuccess: ({ data: { code, data, msg } }) => {
      if (code === 0) {
        message.success('上传成功');
        onSuccess(data[0]); // 返回第一个图片URL
      } else {
        message.error(msg);
      }
    },
  });

  const customRequest = ({ file, onSuccess, onError }) => {
    // 文件大小检查
    if (file.size > 5 * 1024 * 1024) {
      message.error('图片大小不能超过5MB');
      onError(new Error('文件过大'));
      return;
    }

    // 文件格式检查
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      message.error('只支持 JPG、PNG、GIF 格式');
      onError(new Error('格式不支持'));
      return;
    }

    doUpload({ file })
      .then(() => onSuccess())
      .catch(onError);
  };

  return (
    <Upload
      customRequest={customRequest}
      showUploadList={false}
      accept="image/*"
    >
      <Button>上传图片</Button>
    </Upload>
  );
};
```

### 举报管理

#### 举报列表查询

```typescript
import { changeReportStatusApi } from '@/services/report';

const ReportManagement = () => {
  const [filters, setFilters] = useState({
    status: ['pending'],
    page: 1,
    size: 20,
  });

  // 获取举报列表
  const { data, loading, refresh } = useRequest(reportListApi, {
    defaultParams: [filters],
    refreshDeps: [filters],
  });

  // 批量处理举报
  const { loading: updateLoading, run: updateStatus } = useRequest(changeReportStatusApi, {
    manual: true,
    onSuccess: ({ data: { code, msg } }) => {
      if (code === 0) {
        message.success('处理成功');
        refresh();
        setSelectedRows([]);
      } else {
        message.error(msg);
      }
    },
  });

  const handleBatchUpdate = (status) => {
    if (selectedRows.length === 0) {
      message.warning('请选择要处理的举报');
      return;
    }

    updateStatus({
      ids: selectedRows.map((row) => row.id),
      status,
    });
  };
};
```

## 错误处理最佳实践

### 1. 统一错误处理

```typescript
// 在 services/index.ts 中已经配置了全局错误处理
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401: 自动跳转登录
    if (error.response?.status === 401) {
      store.clear();
      window.location.href = '/login';
    }

    // 403: 权限错误
    if (error.response?.status === 403) {
      message.error('权限不足');
    }

    // 服务器错误
    if (error.response?.status >= 500) {
      message.error('系统错误，请稍后重试');
    }

    return Promise.reject(error);
  }
);
```

### 2. 业务错误处理

```typescript
const { run } = useRequest(apiFunction, {
  manual: true,
  onSuccess: ({ data: { code, data, msg } }) => {
    // 业务成功
    if (code === 0) {
      // 处理成功数据
      return;
    }

    // 业务错误处理
    switch (code) {
      case 1001:
        message.error('用户名或密码错误');
        break;
      case 1002:
        message.error('验证码错误');
        break;
      case 1003:
        message.error('账户已被禁用');
        break;
      default:
        message.error(msg || '操作失败');
    }
  },
  onError: (error) => {
    // 网络错误等
    console.error('请求错误:', error);
    message.error('网络错误，请检查网络连接');
  },
});
```

## 性能优化建议

### 1. 请求防抖

```typescript
import { useDebounceFn } from 'ahooks';

const SearchComponent = () => {
  const { run: search } = useRequest(searchApi, { manual: true });

  const { run: debouncedSearch } = useDebounceFn(
    (params) => {
      search(params);
    },
    { wait: 300 }
  );

  const handleInputChange = (value) => {
    debouncedSearch({ keyword: value });
  };
};
```

### 2. 请求缓存

```typescript
const { data } = useRequest(getDataList, {
  cacheKey: 'data-list',
  cacheTime: 5 * 60 * 1000, // 缓存5分钟
  staleTime: 2 * 60 * 1000, // 2分钟内认为数据新鲜
});
```

### 3. 并发请求控制

```typescript
import pLimit from 'p-limit';

const limit = pLimit(3); // 最多3个并发请求

const batchProcess = async (dataIds) => {
  const tasks = dataIds.map((id) => limit(() => getDataDetail(id)));

  const results = await Promise.all(tasks);
  return results;
};
```

## 类型安全建议

### 1. 严格类型定义

```typescript
// 定义严格的请求参数类型
interface LoginParams {
  username: string;
  password: string;
  captcha: string;
  key: string;
}

// 定义响应数据类型
interface LoginResponse {
  code: number;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      username: string;
      email: string;
    };
  };
  msg: string;
}

// 使用泛型约束
const useLogin = () => {
  return useRequest<LoginResponse, [LoginParams]>(login, {
    manual: true,
  });
};
```

### 2. 运行时类型检查

```typescript
import { z } from 'zod';

const LoginResponseSchema = z.object({
  code: z.number(),
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    user: z.object({
      id: z.string(),
      username: z.string(),
      email: z.string(),
    }),
  }),
  msg: z.string(),
});

const validateLoginResponse = (data: unknown) => {
  try {
    return LoginResponseSchema.parse(data);
  } catch (error) {
    console.error('登录响应数据格式错误:', error);
    throw new Error('数据格式不正确');
  }
};
```

---

**最后更新**: 2024-12-18  
**维护团队**: 前端开发组
