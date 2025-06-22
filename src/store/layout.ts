import store2 from 'store2';
import { create } from 'zustand';

/**
 * Types
 */
import type { ProLayoutProps } from '@ant-design/pro-components';
import { ConfigProviderProps } from 'antd';

type LayoutStore = {
  config: ConfigProviderProps;
  layout: ProLayoutProps;
  locale: string;
  setConfig: (config: ConfigProviderProps) => void;
  setLayout: (layout: ProLayoutProps) => void;
  setLocale: (locale: string) => void;
};

export const useLayoutStore = create<LayoutStore>((set) => ({
  config: {},
  layout: {},
  locale: store2('locale') || 'zh-CN',
  setConfig: (config) => set({ config }),
  setLayout: (layout) => set({ layout }),
  setLocale: (locale) => {
    set({ locale });
    store2('locale', locale);
  },
}));
