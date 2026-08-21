import type { BdsDirection, BdsFurniture, BdsLegalStatus, BdsPropertyType } from '@/types/bds';

/** Định dạng giá theo cách người Việt đọc: 8,5 tỷ / 950 triệu. */
export function formatPrice(value: number | null): string {
  if (value === null) return 'Thỏa thuận';

  if (value >= 1_000_000_000) {
    return `${trimZero(value / 1_000_000_000)} tỷ`;
  }

  if (value >= 1_000_000) {
    return `${trimZero(value / 1_000_000)} triệu`;
  }

  if (value >= 1_000) {
    return `${trimZero(value / 1_000)} nghìn`;
  }

  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
}

function trimZero(n: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(n);
}

export function formatArea(value: number): string {
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value)} m²`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

/** "3 ngày trước", "hôm nay" — dùng ở BdsPropertyCard. */
export function formatRelative(iso: string | null): string {
  if (!iso) return '—';

  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

  if (diffDays <= 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 30) return `${diffDays} ngày trước`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;

  return formatDate(iso);
}

export const DIRECTION_LABELS: Record<BdsDirection, string> = {
  dong: 'Đông',
  tay: 'Tây',
  nam: 'Nam',
  bac: 'Bắc',
  'dong-nam': 'Đông Nam',
  'tay-nam': 'Tây Nam',
  'dong-bac': 'Đông Bắc',
  'tay-bac': 'Tây Bắc',
};

export const LEGAL_LABELS: Record<BdsLegalStatus, string> = {
  red_book: 'Sổ đỏ',
  pink_book: 'Sổ hồng',
  sale_contract: 'Hợp đồng mua bán',
  waiting: 'Đang chờ sổ',
  other: 'Khác',
};

export const FURNITURE_LABELS: Record<BdsFurniture, string> = {
  full: 'Đầy đủ',
  basic: 'Cơ bản',
  none: 'Không nội thất',
};

export const TYPE_LABELS: Record<BdsPropertyType, string> = {
  land: 'Đất',
  house: 'Nhà',
  apartment: 'Chung cư',
  project: 'Dự án',
};

export const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft: { label: 'Tin nháp', className: 'bg-gray-100 text-gray-700' },
  pending: { label: 'Chờ duyệt', className: 'bg-amber-100 text-amber-800' },
  published: { label: 'Đang hiển thị', className: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Bị từ chối', className: 'bg-red-100 text-red-700' },
  expired: { label: 'Hết hạn', className: 'bg-slate-200 text-slate-600' },
  hidden: { label: 'Đã ẩn', className: 'bg-slate-100 text-slate-600' },
};

/** Khoảng giá gợi ý cho bộ lọc (đơn vị VNĐ). */
export const PRICE_RANGES = [
  { label: 'Dưới 500 triệu', min: 0, max: 500_000_000 },
  { label: '500 triệu - 1 tỷ', min: 500_000_000, max: 1_000_000_000 },
  { label: '1 - 2 tỷ', min: 1_000_000_000, max: 2_000_000_000 },
  { label: '2 - 3 tỷ', min: 2_000_000_000, max: 3_000_000_000 },
  { label: '3 - 5 tỷ', min: 3_000_000_000, max: 5_000_000_000 },
  { label: '5 - 10 tỷ', min: 5_000_000_000, max: 10_000_000_000 },
  { label: 'Trên 10 tỷ', min: 10_000_000_000, max: undefined },
];

export const AREA_RANGES = [
  { label: 'Dưới 30 m²', min: 0, max: 30 },
  { label: '30 - 50 m²', min: 30, max: 50 },
  { label: '50 - 80 m²', min: 50, max: 80 },
  { label: '80 - 100 m²', min: 80, max: 100 },
  { label: '100 - 200 m²', min: 100, max: 200 },
  { label: 'Trên 200 m²', min: 200, max: undefined },
];
