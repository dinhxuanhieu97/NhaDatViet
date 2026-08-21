'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { bdsApi } from '@/lib/bds-api-client';
import { STATUS_STYLES, formatDate, formatNumber } from '@/lib/bds-format';
import type { BdsPaginated, BdsProperty } from '@/types/bds';

const BDS_STATUS_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'published', label: 'Đang hiển thị' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'rejected', label: 'Bị từ chối' },
  { value: 'draft', label: 'Tin nháp' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'hidden', label: 'Đã ẩn' },
];

export default function BdsMyPropertiesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Đang tải…</p>}>
      <BdsMyPropertiesContent />
    </Suspense>
  );
}

function BdsMyPropertiesContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(searchParams.get('status') ?? '');

  const { data, isLoading } = useQuery({
    queryKey: ['bds', 'my-properties', status],
    queryFn: () =>
      bdsApi.get<BdsPaginated<BdsProperty>>('/my/properties', {
        query: { status: status || undefined, per_page: 20 },
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bdsApi.delete(`/my/properties/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bds', 'my-properties'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => bdsApi.post(`/my/properties/${id}/toggle-visibility`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bds', 'my-properties'] }),
  });

  const submitMutation = useMutation({
    mutationFn: (id: number) => bdsApi.post(`/my/properties/${id}/submit`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bds', 'my-properties'] }),
  });

  const properties = data?.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Tin đăng của tôi</h1>
        <Link
          href="/quan-ly/tin-dang/tao"
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          + Đăng tin mới
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {BDS_STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`rounded-md border px-3 py-1.5 text-sm transition ${
              status === tab.value
                ? 'border-brand-500 bg-brand-50 font-medium text-brand-600'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-6 text-sm text-gray-500">Đang tải…</p>}

      {!isLoading && properties.length === 0 && (
        <p className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
          Không có tin đăng nào ở trạng thái này.
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {properties.map((property) => {
          const badge = STATUS_STYLES[property.status];

          return (
            <li key={property.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-gray-500">#{property.id}</span>
                  </div>

                  <h2 className="mt-1 font-medium text-gray-900">{property.title}</h2>

                  <p className="mt-0.5 text-sm text-gray-600">
                    {property.price_text} · {property.area} m² ·{' '}
                    {formatNumber(property.views_count)} lượt xem
                  </p>

                  {property.status === 'published' && property.expired_at && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      Hiển thị đến {formatDate(property.expired_at)}
                    </p>
                  )}

                  {property.status === 'rejected' && property.rejection_reason && (
                    <p className="mt-1.5 rounded bg-red-50 p-2 text-xs text-red-700">
                      Lý do từ chối: {property.rejection_reason}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {property.status === 'published' && (
                    <Link
                      href={`/bat-dong-san/${property.slug}`}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Xem tin
                    </Link>
                  )}

                  <Link
                    href={`/quan-ly/tin-dang/${property.id}/xem-truoc`}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Xem trước
                  </Link>

                  <Link
                    href={`/quan-ly/tin-dang/${property.id}/sua`}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Sửa
                  </Link>

                  {(property.status === 'draft' || property.status === 'rejected') && (
                    <button
                      type="button"
                      onClick={() => submitMutation.mutate(property.id)}
                      className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                    >
                      Gửi duyệt
                    </button>
                  )}

                  {(property.status === 'published' || property.status === 'hidden') && (
                    <button
                      type="button"
                      onClick={() => toggleMutation.mutate(property.id)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {property.status === 'published' ? 'Ẩn tin' : 'Hiện lại'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Xóa tin "${property.title}"?`)) {
                        deleteMutation.mutate(property.id);
                      }
                    }}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
