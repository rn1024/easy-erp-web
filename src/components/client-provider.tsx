'use client';

import { App as AntdApp, ConfigProvider } from 'antd';
import { IntlProvider } from 'react-intl';
import { useLocalStorageState } from 'ahooks';
import zhCN from '@/locales/zh-CN';
import enUS from '@/locales/en-US';
import antdZhCN from 'antd/locale/zh_CN';
import antdEnUS from 'antd/locale/en_US';
import AdminLayout from '@/components/admin-layout';

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

const antdLocales = {
  'zh-CN': antdZhCN,
  'en-US': antdEnUS,
};

interface ClientProviderProps {
  children: React.ReactNode;
}

export default function ClientProvider({ children }: ClientProviderProps) {
  const [locale] = useLocalStorageState<string>('umi_locale', {
    defaultValue: 'zh-CN',
  });

  const currentLocale = locale || 'zh-CN';
  const currentMessages = messages[currentLocale as keyof typeof messages] || messages['zh-CN'];
  const currentAntdLocale =
    antdLocales[currentLocale as keyof typeof antdLocales] || antdLocales['zh-CN'];

  return (
    <IntlProvider locale={currentLocale} messages={currentMessages}>
      <ConfigProvider
        locale={currentAntdLocale}
        theme={{
          token: {
            colorPrimary: '#1890ff',
          },
        }}
      >
        <AntdApp>
          <AdminLayout>{children}</AdminLayout>
        </AntdApp>
      </ConfigProvider>
    </IntlProvider>
  );
}
