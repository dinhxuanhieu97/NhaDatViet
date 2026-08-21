import type { Metadata } from 'next';
import { BdsListingScreen } from '@/components/bds-property/BdsListingScreen';

export const metadata: Metadata = {
  title: 'Nhà đất cho thuê — Thuê nhà, căn hộ, mặt bằng',
  description:
    'Danh sách tin đăng cho thuê nhà riêng, căn hộ chung cư, văn phòng, mặt bằng kinh doanh. '
    + 'Lọc theo khu vực, giá thuê, diện tích và nội thất.',
  alternates: { canonical: '/nha-dat-cho-thue' },
};

export default async function BdsRentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <BdsListingScreen
      listingType="rent"
      heading="Nhà đất cho thuê"
      searchParams={params}
    />
  );
}
