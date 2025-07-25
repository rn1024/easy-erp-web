import type { Metadata } from 'next';
import '@/globals.css';
import ClientProvider from '@/components/client-provider';

export const metadata: Metadata = {
  title: 'ERP Admin',
  description: 'ERP Admin Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
