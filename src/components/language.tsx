'use client';

import { GlobalOutlined } from '@ant-design/icons';
import { useLocalStorageState } from 'ahooks';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';

/**
 * Types
 */
import type { DropdownProps } from 'antd';

const ComponentLanguage: React.FC = () => {
  /**
   * States
   */
  const [locale, setLocale] = useLocalStorageState<string>('umi_locale', {
    defaultValue: 'zh-CN',
  });

  const items: MenuProps['items'] = [
    {
      key: 'zh-CN',
      label: '简体中文',
      onClick: () => setLocale('zh-CN'),
    },
    {
      key: 'en-US',
      label: 'English',
      onClick: () => setLocale('en-US'),
    },
  ];

  return (
    <Dropdown
      menu={{
        items,
        selectedKeys: [locale || 'zh-CN'],
      }}
      placement="bottomRight"
    >
      <GlobalOutlined style={{ fontSize: 16, cursor: 'pointer' }} />
    </Dropdown>
  );
};

export default ComponentLanguage;
