import type { Metadata } from 'next';
import { BdsListingScreen } from '@/components/bds-property/BdsListingScreen';

export const metadata: Metadata = {
  title: 'Nhà đất bán — Mua bán nhà đất, căn hộ, đất nền',
  description:
    'Danh sách tin đăng bán nhà đất, căn hộ chung cư, đất nền trên toàn quốc. '
    + 'Lọc theo khu vực, khoảng giá, diện tích, số phòng ngủ, hướng nhà và pháp lý.',
  alternates: { canonical: '/nha-dat-ban' },
};

export default async function BdsSalePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <BdsListingScreen
      listingType="sale"
      heading="Nhà đất bán"
      searchParams={params}
    />
  );
}
