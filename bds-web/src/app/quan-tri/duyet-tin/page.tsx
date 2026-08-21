'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { BdsApiError, bdsApi } from '@/lib/bds-api-client';
import { formatArea, formatDate } from '@/lib/bds-format';
import type { BdsPaginated, BdsProperty } from '@/types/bds';

const BDS_MODERATION_TABS = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'published', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Đã từ chối' },
  { value: 'hidden', label: 'Bị ẩn' },
];

export default function BdsModerationQueuePage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('pending');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['bds', 'moderation', status],
    queryFn: () =>
      bdsApi.get<BdsPaginated<BdsProperty>>('/admin/properties', {
        query: { status, per_page: 20 },
      }),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['bds', 'moderation'] });
    void queryClient.invalidateQueries({ queryKey: ['bds', 'admin-stats'] });
  };

  const approveMutation = useMutation({
    mutationFn: (id: number) => bdsApi.post(`/admin/properties/${id}/approve`),
    onSuccess: invalidate,
    onError: (error) =>
      setActionError(error instanceof BdsApiError ? error.message : 'Không duyệt được tin.'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      bdsApi.post(`/admin/properties/${id}/reject`, { reason }),
    onSuccess: () => {
      setRejectingId(null);
      setRejectReason('');
      invalidate();
    },
    onError: (error) =>
      setActionError(
        error instanceof BdsApiError
          ? (error.fieldError('reason') ?? error.message)
          : 'Không từ chối được tin.',
      ),
  });

  const properties = data?.data ?? [];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Duyệt tin đăng</h1>
      <p className="mt-0.5 text-sm text-gray-600">
        Kiểm tra nội dung, hình ảnh và thông tin liên hệ trước khi cho tin hiển thị công khai.
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {BDS_MODERATION_TABS.map((tab) => (
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

      {actionError && (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{actionError}</p>
      )}

      {isLoading && <p className="mt-6 text-sm text-gray-500">Đang tải…</p>}

      {!isLoading && properties.length === 0 && (
        <p className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
          Không có tin đăng nào ở trạng thái này.
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {properties.map((property) => (
          <li key={property.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex gap-4">
              <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md bg-gray-100">
                {property.primary_image ? (
                  <Image
                    src={property.primary_image}
                    alt={property.title}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full place-items-center text-xs text-gray-400">
                    Không ảnh
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-medium text-gray-900">{property.title}</h2>
                <p className="mt-0.5 text-sm text-gray-600">
                  {property.price_text} · {formatArea(property.area)} ·{' '}
                  {property.category?.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {property.address} · {property.district?.name}, {property.province?.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Người đăng: {property.user?.name} · SĐT: {property.contact_phone} · Gửi lúc{' '}
                  {formatDate(property.created_at)}
                </p>

                <p className="mt-2 line-clamp-2 text-sm text-gray-700">{property.description}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {property.status === 'published' && (
                    <Link
                      href={`/bat-dong-san/${property.slug}`}
                      target="_blank"
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Xem trang tin ↗
                    </Link>
                  )}

                  {(property.status === 'pending' || property.status === 'rejected') && (
                    <button
                      type="button"
                      onClick={() => approveMutation.mutate(property.id)}
                      disabled={approveMutation.isPending}
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Duyệt tin
                    </button>
                  )}

                  {property.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActionError(null);
                        setRejectingId(rejectingId === property.id ? null : property.id);
                      }}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Từ chối
                    </button>
                  )}
                </div>

                {rejectingId === property.id && (
                  <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                    <label className="block text-xs font-medium text-red-900">
                      Lý do từ chối (bắt buộc, tối thiểu 10 ký tự)
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={2}
                        className="mt-1 w-full rounded-md border border-red-300 px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-red-500"
                        placeholder="Ảnh không rõ ràng, mô tả sơ sài, vui lòng bổ sung…"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        rejectMutation.mutate({ id: property.id, reason: rejectReason })
                      }
                      disabled={rejectMutation.isPending}
                      className="mt-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Xác nhận từ chối
                    </button>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
