'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { bdsApi } from '@/lib/bds-api-client';
import { useBdsAuth } from '@/lib/bds-auth-context';
import { STATUS_STYLES, formatNumber } from '@/lib/bds-format';
import type { BdsPaginated, BdsProperty } from '@/types/bds';

export default function BdsDashboardOverviewPage() {
  const { user } = useBdsAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['bds', 'my-properties', 'overview'],
    queryFn: () => bdsApi.get<BdsPaginated<BdsProperty>>('/my/properties', { query: { per_page: 50 } }),
  });

  const properties = data?.data ?? [];

  const countBy = (status: string) => properties.filter((p) => p.status === status).length;
  const totalViews = properties.reduce((sum, p) => sum + p.views_count, 0);
  const activeCount = countBy('published') + countBy('pending');

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">
        Xin chào, {user?.name}
      </h1>
      <p className="mt-0.5 text-sm text-gray-600">
        Vai trò: {user?.roles.join(', ')}
        {user?.post_limit !== null && user?.post_limit !== undefined && (
          <> · Hạn mức: {activeCount}/{user.post_limit} tin đang hiển thị</>
        )}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <BdsStatCard label="Tổng tin đăng" value={properties.length} loading={isLoading} />
        <BdsStatCard label="Đang hiển thị" value={countBy('published')} loading={isLoading} />
        <BdsStatCard label="Chờ duyệt" value={countBy('pending')} loading={isLoading} />
        <BdsStatCard label="Tổng lượt xem" value={totalViews} loading={isLoading} />
      </div>

      {user?.post_limit !== null && user?.post_limit !== undefined && activeCount >= user.post_limit && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Bạn đã dùng hết hạn mức {user.post_limit} tin. Ẩn bớt tin cũ hoặc liên hệ quản trị viên để
          nâng cấp lên tài khoản Môi giới (đăng tin không giới hạn).
        </p>
      )}

      <div className="mt-6 rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 className="text-sm font-bold text-gray-900">Tin đăng gần đây</h2>
          <Link href="/quan-ly/tin-dang" className="text-sm font-medium text-brand-600 hover:underline">
            Xem tất cả →
          </Link>
        </div>

        {isLoading && <p className="p-4 text-sm text-gray-500">Đang tải…</p>}

        {!isLoading && properties.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-600">Bạn chưa có tin đăng nào.</p>
            <Link
              href="/quan-ly/tin-dang/tao"
              className="mt-3 inline-block rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Đăng tin đầu tiên
            </Link>
          </div>
        )}

        <ul className="divide-y divide-gray-100">
          {properties.slice(0, 5).map((property) => {
            const badge = STATUS_STYLES[property.status];

            return (
              <li key={property.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/quan-ly/tin-dang/${property.id}/sua`}
                    className="line-clamp-2 text-sm font-medium text-gray-900 hover:text-brand-600"
                  >
                    {property.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {property.price_text} · {formatNumber(property.views_count)} lượt xem
                  </p>
                </div>
                <span className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function BdsStatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      {loading ? (
        <div className="mt-1 h-7 w-16 animate-pulse rounded bg-gray-200" />
      ) : (
        <p className="mt-1 text-2xl font-bold text-gray-900">{formatNumber(value)}</p>
      )}
    </div>
  );
}
