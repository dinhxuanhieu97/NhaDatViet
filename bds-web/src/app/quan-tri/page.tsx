'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { bdsApi } from '@/lib/bds-api-client';
import { formatNumber } from '@/lib/bds-format';
import type { BdsAdminStats } from '@/types/bds';

export default function BdsAdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['bds', 'admin-stats'],
    queryFn: () => bdsApi.get<BdsAdminStats>('/admin/stats'),
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Bảng điều khiển</h1>

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Tin đăng</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <BdsMetricCard
            label="Chờ duyệt"
            value={data?.properties.pending}
            loading={isLoading}
            href="/quan-tri/duyet-tin"
            highlight
          />
          <BdsMetricCard label="Đang hiển thị" value={data?.properties.published} loading={isLoading} />
          <BdsMetricCard label="Bị từ chối" value={data?.properties.rejected} loading={isLoading} />
          <BdsMetricCard label="Hết hạn" value={data?.properties.expired} loading={isLoading} />
          <BdsMetricCard label="Tổng tin đăng" value={data?.properties.total} loading={isLoading} />
          <BdsMetricCard label="Mới hôm nay" value={data?.properties.new_today} loading={isLoading} />
          <BdsMetricCard
            label="Mới trong tuần"
            value={data?.properties.new_this_week}
            loading={isLoading}
          />
          <BdsMetricCard
            label="Tổng lượt xem"
            value={data?.engagement.total_views}
            loading={isLoading}
          />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Người dùng & Tương tác</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <BdsMetricCard label="Tổng người dùng" value={data?.users.total} loading={isLoading} />
          <BdsMetricCard label="Đăng ký hôm nay" value={data?.users.new_today} loading={isLoading} />
          <BdsMetricCard
            label="Tài khoản bị khóa"
            value={data?.users.suspended}
            loading={isLoading}
            href="/quan-tri/nguoi-dung"
          />
          <BdsMetricCard
            label="Báo cáo chờ xử lý"
            value={data?.engagement.pending_reports}
            loading={isLoading}
            highlight={(data?.engagement.pending_reports ?? 0) > 0}
          />
        </div>
      </section>

      {data && (
        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Phân bố vai trò</h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(data.users.by_role).map(([role, count]) => (
              <div key={role} className="rounded-md bg-gray-50 p-3">
                <dt className="text-xs capitalize text-gray-600">{role}</dt>
                <dd className="mt-0.5 text-lg font-bold text-gray-900">{formatNumber(count)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}

function BdsMetricCard({
  label,
  value,
  loading,
  href,
  highlight,
}: {
  label: string;
  value?: number;
  loading: boolean;
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <div
      className={`rounded-lg border p-4 transition ${
        highlight ? 'border-brand-300 bg-brand-50' : 'border-gray-200 bg-white'
      } ${href ? 'hover:border-brand-500' : ''}`}
    >
      <p className="text-xs text-gray-600">{label}</p>
      {loading ? (
        <div className="mt-1 h-7 w-16 animate-pulse rounded bg-gray-200" />
      ) : (
        <p className={`mt-1 text-2xl font-bold ${highlight ? 'text-brand-600' : 'text-gray-900'}`}>
          {formatNumber(value ?? 0)}
        </p>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
