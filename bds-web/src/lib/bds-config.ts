/**
 * Hằng số cấu hình dùng chung cho bds-web.
 *
 * Tách khỏi app/layout.tsx để sitemap.ts, robots.ts và các Server Component
 * không phải import từ file layout (dễ gây phụ thuộc vòng và khó theo dõi).
 */

export const BDS_SITE_URL =
  process.env.NEXT_PUBLIC_BDS_SITE_URL ?? 'http://localhost:3000';

export const BDS_SITE_NAME = 'Nhà Đất Việt';

/** Đường dẫn tới trang chi tiết một tin đăng. */
export function bdsPropertyPath(slug: string): string {
  return `/bat-dong-san/${slug}`;
}

/** Đường dẫn tới trang chi tiết một dự án. */
export function bdsProjectPath(slug: string): string {
  return `/du-an/${slug}`;
}

/** Route listing tương ứng với nhu cầu bán / cho thuê. */
export function bdsListingPath(listingType: 'sale' | 'rent'): string {
  return listingType === 'sale' ? '/nha-dat-ban' : '/nha-dat-cho-thue';
}
