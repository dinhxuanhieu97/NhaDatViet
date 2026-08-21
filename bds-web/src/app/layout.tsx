import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BdsHeader } from '@/components/bds-layout/BdsHeader';
import { BdsFooter } from '@/components/bds-layout/BdsFooter';
import { BDS_SITE_NAME, BDS_SITE_URL } from '@/lib/bds-config';
import { BdsProviders } from './bds-providers';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(BDS_SITE_URL),
  title: {
    default: 'Nhà Đất Việt — Cổng thông tin bất động sản',
    template: '%s | Nhà Đất Việt',
  },
  description:
    'Kênh thông tin mua bán, cho thuê nhà đất, căn hộ chung cư, đất nền dự án trên toàn quốc. '
    + 'Tin đăng được kiểm duyệt, tìm kiếm theo bản đồ và đa tiêu chí.',
  keywords: ['bất động sản', 'mua bán nhà đất', 'cho thuê nhà', 'căn hộ chung cư', 'đất nền'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: BDS_SITE_NAME,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 antialiased">
        <BdsProviders>
          <BdsHeader />
          <main className="min-h-[70vh]">{children}</main>
          <BdsFooter />
        </BdsProviders>
      </body>
    </html>
  );
}
