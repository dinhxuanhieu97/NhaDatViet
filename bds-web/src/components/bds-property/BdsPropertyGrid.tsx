import Link from 'next/link';
import { BdsPropertyCard } from '@/components/bds-property/BdsPropertyCard';
import type { BdsPaginated, BdsProperty } from '@/types/bds';

interface BdsPropertyGridProps {
  page: BdsPaginated<BdsProperty>;
  /** Query string hiện tại để giữ nguyên bộ lọc khi chuyển trang. */
  searchParams: Record<string, string | string[] | undefined>;
  /** 'grid' (mặc định) hoặc 'list' — xem BdsViewModeToggle. */
  viewMode?: 'grid' | 'list';
}

export function BdsPropertyGrid({ page, searchParams, viewMode = 'grid' }: BdsPropertyGridProps) {
  if (page.data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="font-medium text-gray-900">Không tìm thấy tin đăng phù hợp</p>
        <p className="mt-1 text-sm text-gray-600">
          Thử nới rộng khoảng giá, diện tích hoặc bỏ bớt tiêu chí lọc.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        className={
          viewMode === 'list'
            ? 'flex flex-col gap-4'
            : 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'
        }
      >
        {page.data.map((property) => (
          <BdsPropertyCard key={property.id} property={property} layout={viewMode} />
        ))}
      </div>

      <BdsPagination page={page} searchParams={searchParams} />
    </div>
  );
}

function BdsPagination({ page, searchParams }: BdsPropertyGridProps) {
  if (page.meta.last_page <= 1) {
    return null;
  }

  const current = page.meta.current_page;
  const last = page.meta.last_page;

  const buildHref = (target: number) => {
    const params = new URLSearchParams();

    Object.entries(searchParams).forEach(([key, value]) => {
      if (key === 'page' || value === undefined) return;
      params.set(key, Array.isArray(value) ? value[0] : value);
    });

    if (target > 1) params.set('page', String(target));

    const qs = params.toString();

    return qs ? `?${qs}` : '?';
  };

  // Hiển thị tối đa 5 số trang quanh trang hiện tại.
  const start = Math.max(1, Math.min(current - 2, last - 4));
  const pages = Array.from({ length: Math.min(5, last) }, (_, i) => start + i).filter((p) => p <= last);

  return (
    <nav className="mt-6 flex items-center justify-center gap-1" aria-label="Phân trang">
      {current > 1 && (
        <Link
          href={buildHref(current - 1)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          ← Trước
        </Link>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === current ? 'page' : undefined}
          className={`rounded-md border px-3.5 py-2 text-sm transition ${
            p === current
              ? 'border-brand-500 bg-brand-500 font-semibold text-white'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {p}
        </Link>
      ))}

      {current < last && (
        <Link
          href={buildHref(current + 1)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Sau →
        </Link>
      )}
    </nav>
  );
}
