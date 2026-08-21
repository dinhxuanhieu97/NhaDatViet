import type { Metadata } from 'next';
import { BdsMapSearchScreen } from '@/components/bds-map/BdsMapSearchScreen';

export const metadata: Metadata = {
  title: 'Tìm bất động sản theo bản đồ',
  description:
    'Tìm nhà đất, căn hộ theo vị trí trên bản đồ. Kéo bản đồ hoặc chọn bán kính quanh một điểm '
    + 'để xem các tin đăng trong khu vực.',
  alternates: { canonical: '/tim-kiem-ban-do' },
  robots: { index: true, follow: true },
};

export default function BdsMapSearchPage() {
  return <BdsMapSearchScreen />;
}
