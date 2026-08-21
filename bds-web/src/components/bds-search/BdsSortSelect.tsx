'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const BDS_SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'relevance', label: 'Liên quan nhất' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
  { value: 'area_desc', label: 'Diện tích lớn nhất' },
  { value: 'views', label: 'Xem nhiều nhất' },
];

export function BdsSortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // "Liên quan nhất" chỉ có ý nghĩa khi có từ khóa tìm kiếm (`q`) — backend
  // (PropertySearchService::applySort) âm thầm rơi về "mới nhất" nếu thiếu
  // `q`, nên ẩn hẳn lựa chọn này lúc không tìm kiếm để tránh chọn một mục
  // trông như có tác dụng nhưng thực ra không đổi gì.
  const hasQuery = Boolean(searchParams.get('q'));
  const options = BDS_SORT_OPTIONS.filter((o) => o.value !== 'relevance' || hasQuery);

  // Nếu URL còn `sort=relevance` từ lúc có `q` nhưng người dùng vừa xóa từ
  // khóa tìm kiếm, mục "Liên quan nhất" đã bị lọc khỏi `options` ở trên —
  // hiển thị `<select>` với value không khớp bất kỳ `<option>` nào sẽ khiến
  // trình duyệt không chọn gì cả (trông như rỗng). Hiện "Mới nhất" thay thế
  // để khớp đúng hành vi thật sự backend đang áp dụng lúc này.
  const currentSort = searchParams.get('sort') ?? 'newest';
  const selectValue = currentSort === 'relevance' && !hasQuery ? 'newest' : currentSort;

  function onChange(value: string) {
    const next = new URLSearchParams(searchParams.toString());

    if (value === 'newest') {
      next.delete('sort');
    } else {
      next.set('sort', value);
    }

    next.delete('page');
    router.push(`?${next.toString()}`, { scroll: false });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-gray-600">
      Sắp xếp:
      <select
        value={selectValue}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
