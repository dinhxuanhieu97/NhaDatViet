'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useBdsProvinces } from '@/lib/bds-queries';

const TABS = [
  { value: 'sale', label: 'Nhà đất bán', path: '/nha-dat-ban' },
  { value: 'rent', label: 'Nhà đất cho thuê', path: '/nha-dat-cho-thue' },
] as const;

const TYPES = [
  { value: '', label: 'Tất cả loại hình' },
  { value: 'apartment', label: 'Căn hộ chung cư' },
  { value: 'house', label: 'Nhà riêng' },
  { value: 'land', label: 'Đất' },
  { value: 'project', label: 'Dự án' },
];

export function BdsSearchBar() {
  const router = useRouter();
  const [tab, setTab] = useState<'sale' | 'rent'>('sale');
  const [keyword, setKeyword] = useState('');
  const [provinceId, setProvinceId] = useState('');
  const [type, setType] = useState('');
  const { data: provinces = [] } = useBdsProvinces();

  function submit(e: React.FormEvent) {
    e.preventDefault();

    const path = TABS.find((t) => t.value === tab)!.path;
    const params = new URLSearchParams();

    if (keyword.trim()) params.set('q', keyword.trim());
    if (provinceId) params.set('province_id', provinceId);
    if (type) params.set('type', type);

    const qs = params.toString();
    router.push(qs ? `${path}?${qs}` : path);
  }

  return (
    <div className="w-full">
      <div className="flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.value ? 'bg-white text-brand-600' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={submit}
        className="flex flex-col gap-2 rounded-b-lg rounded-tr-lg bg-white p-3 shadow-lg sm:flex-row"
      >
        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo từ khóa, tên đường, dự án…"
          aria-label="Từ khóa tìm kiếm"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
        />

        <select
          value={provinceId}
          onChange={(e) => setProvinceId(e.target.value)}
          aria-label="Tỉnh/Thành phố"
          className="rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 sm:w-44"
        >
          <option value="">Toàn quốc</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Loại bất động sản"
          className="rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 sm:w-48"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-md bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Tìm kiếm
        </button>
      </form>
    </div>
  );
}
