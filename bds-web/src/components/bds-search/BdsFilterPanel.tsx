'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { AREA_RANGES, DIRECTION_LABELS, LEGAL_LABELS, PRICE_RANGES } from '@/lib/bds-format';
import { useBdsCategories, useBdsDistricts, useBdsProvinces } from '@/lib/bds-queries';

interface BdsFilterPanelProps {
  /** Nhu cầu cố định theo route (/nha-dat-ban hoặc /nha-dat-cho-thue). */
  listingType: 'sale' | 'rent';
}

/**
 * Toàn bộ trạng thái bộ lọc nằm trên URL search params để:
 * - chia sẻ link giữ nguyên kết quả lọc,
 * - back/forward của trình duyệt hoạt động đúng,
 * - trang listing render được ở phía server.
 */
export function BdsFilterPanel({ listingType }: BdsFilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const provinceId = searchParams.get('province_id') ?? '';

  const { data: provinces = [] } = useBdsProvinces();
  const { data: categories = [] } = useBdsCategories(listingType);
  const { data: districts = [] } = useBdsDistricts(provinceId || null);

  const updateParams = useCallback(
    (changes: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());

      Object.entries(changes).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });

      next.delete('page'); // đổi bộ lọc thì quay về trang 1

      router.push(`?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const activeCount = ['category_id', 'province_id', 'district_id', 'price_min', 'area_min', 'bedrooms', 'direction', 'legal_status']
    .filter((k) => searchParams.get(k))
    .length;

  return (
    <aside className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">Bộ lọc</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => router.push('?', { scroll: false })}
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            Xóa lọc ({activeCount})
          </button>
        )}
      </div>

      <div className="space-y-4">
        <BdsFilterField label="Loại bất động sản">
          <select
            value={searchParams.get('category_id') ?? ''}
            onChange={(e) => updateParams({ category_id: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="">Tất cả</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </BdsFilterField>

        <BdsFilterField label="Tỉnh / Thành phố">
          <select
            value={provinceId}
            onChange={(e) => updateParams({ province_id: e.target.value, district_id: undefined })}
            className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="">Toàn quốc</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </BdsFilterField>

        {districts.length > 0 && (
          <BdsFilterField label="Khu vực">
            <select
              value={searchParams.get('district_id') ?? ''}
              onChange={(e) => updateParams({ district_id: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
            >
              <option value="">Tất cả</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </BdsFilterField>
        )}

        <BdsFilterField label="Khoảng giá">
          <div className="space-y-1">
            {PRICE_RANGES.map((range) => {
              const checked =
                searchParams.get('price_min') === String(range.min)
                && (searchParams.get('price_max') ?? '') === String(range.max ?? '');

              return (
                <label key={range.label} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="price-range"
                    checked={checked}
                    onChange={() =>
                      updateParams({
                        price_min: String(range.min),
                        price_max: range.max ? String(range.max) : undefined,
                      })
                    }
                    className="accent-brand-500"
                  />
                  {range.label}
                </label>
              );
            })}
          </div>
        </BdsFilterField>

        <BdsFilterField label="Diện tích">
          <div className="space-y-1">
            {AREA_RANGES.map((range) => {
              const checked =
                searchParams.get('area_min') === String(range.min)
                && (searchParams.get('area_max') ?? '') === String(range.max ?? '');

              return (
                <label key={range.label} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="area-range"
                    checked={checked}
                    onChange={() =>
                      updateParams({
                        area_min: String(range.min),
                        area_max: range.max ? String(range.max) : undefined,
                      })
                    }
                    className="accent-brand-500"
                  />
                  {range.label}
                </label>
              );
            })}
          </div>
        </BdsFilterField>

        <BdsFilterField label="Số phòng ngủ (từ)">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() =>
                  updateParams({
                    bedrooms: searchParams.get('bedrooms') === String(n) ? undefined : String(n),
                  })
                }
                className={`flex-1 rounded-md border px-2 py-1.5 text-sm transition ${
                  searchParams.get('bedrooms') === String(n)
                    ? 'border-brand-500 bg-brand-50 text-brand-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {n}+
              </button>
            ))}
          </div>
        </BdsFilterField>

        <BdsFilterField label="Hướng nhà">
          <select
            value={searchParams.get('direction') ?? ''}
            onChange={(e) => updateParams({ direction: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="">Tất cả</option>
            {Object.entries(DIRECTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </BdsFilterField>

        <BdsFilterField label="Pháp lý">
          <select
            value={searchParams.get('legal_status') ?? ''}
            onChange={(e) => updateParams({ legal_status: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="">Tất cả</option>
            {Object.entries(LEGAL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </BdsFilterField>
      </div>
    </aside>
  );
}

function BdsFilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      {children}
    </div>
  );
}
