'use client';

import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Chuyển giữa hiển thị dạng lưới (mặc định) và dạng danh sách cho trang
 * listing. Lưu trạng thái vào query param `view` (không phải state cục bộ)
 * để giữ nguyên khi refresh/chia sẻ link/back-forward — cùng cách
 * `BdsSortSelect` lưu `sort`. `view` KHÔNG nằm trong allowlist của
 * `toBdsFilters()` (bds-server-api.ts) nên không bị gửi lên API — chỉ ảnh
 * hưởng cách trình bày phía client.
 */
export function BdsViewModeToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get('view') === 'list' ? 'list' : 'grid';

  function setMode(next: 'grid' | 'list') {
    const params = new URLSearchParams(searchParams.toString());

    if (next === 'grid') {
      params.delete('view');
    } else {
      params.set('view', next);
    }

    router.push(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div
      role="group"
      aria-label="Kiểu hiển thị"
      className="inline-flex overflow-hidden rounded-md border border-gray-300 bg-white"
    >
      <button
        type="button"
        onClick={() => setMode('grid')}
        aria-pressed={mode === 'grid'}
        title="Dạng lưới"
        className={`px-2.5 py-1.5 transition ${
          mode === 'grid' ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-50'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" />
          <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" />
          <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" />
          <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => setMode('list')}
        aria-pressed={mode === 'list'}
        title="Dạng danh sách"
        className={`border-l border-gray-300 px-2.5 py-1.5 transition ${
          mode === 'list' ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-50'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1" y="1.5" width="14" height="3" rx="1" fill="currentColor" />
          <rect x="1" y="6.5" width="14" height="3" rx="1" fill="currentColor" />
          <rect x="1" y="11.5" width="14" height="3" rx="1" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
