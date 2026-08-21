'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { BdsPropertyCard } from '@/components/bds-property/BdsPropertyCard';
import { bdsApi } from '@/lib/bds-api-client';
import type { BdsPaginated, BdsProperty } from '@/types/bds';

export default function BdsFavoritesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['bds', 'favorites'],
    queryFn: () => bdsApi.get<BdsPaginated<BdsProperty>>('/my/favorites'),
  });

  const properties = data?.data ?? [];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Tin đã lưu</h1>

      {isLoading && <p className="mt-6 text-sm text-gray-500">Đang tải…</p>}

      {!isLoading && properties.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-sm text-gray-600">Bạn chưa lưu tin đăng nào.</p>
          <Link
            href="/nha-dat-ban"
            className="mt-3 inline-block rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Khám phá tin đăng
          </Link>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <BdsPropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
