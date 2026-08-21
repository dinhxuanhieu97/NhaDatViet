import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchBdsProjectPage } from '@/lib/bds-server-api';
import { formatNumber } from '@/lib/bds-format';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Dự án bất động sản',
  description:
    'Danh sách dự án bất động sản đang mở bán và đã bàn giao: chung cư, khu đô thị, đất nền dự án '
    + 'trên toàn quốc kèm thông tin chủ đầu tư, quy mô và tiến độ.',
  alternates: { canonical: '/du-an' },
};

const BDS_PROJECT_STATUS_LABELS: Record<string, string> = {
  upcoming: 'Sắp mở bán',
  selling: 'Đang mở bán',
  handed_over: 'Đã bàn giao',
};

export default async function BdsProjectListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = await fetchBdsProjectPage({
    per_page: 20,
    status: params.status,
    q: params.q,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-gray-500">
        <Link href="/" className="hover:text-brand-600">
          Trang chủ
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-900">Dự án</span>
      </nav>

      <h1 className="text-xl font-bold text-gray-900">Dự án bất động sản</h1>
      <p className="mt-0.5 text-sm text-gray-600">{formatNumber(page.meta.total)} dự án</p>

      {page.data.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
          Chưa có dự án nào.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {page.data.map((project) => (
            <Link
              key={project.id}
              href={`/du-an/${project.slug}`}
              className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-brand-500 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-gray-900">{project.name}</h2>
                <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                  {BDS_PROJECT_STATUS_LABELS[project.status] ?? project.status}
                </span>
              </div>

              <p className="mt-1 text-sm text-gray-600">{project.developer}</p>
              <p className="mt-2 text-xs text-gray-500">
                {[project.district?.name, project.province?.name].filter(Boolean).join(', ')}
              </p>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-2 text-xs text-gray-600">
                {project.total_area && <span>{project.total_area} ha</span>}
                {project.total_units && <span>{formatNumber(project.total_units)} căn</span>}
                {project.properties_count !== undefined && (
                  <span className="font-medium text-brand-600">
                    {project.properties_count} tin đăng
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
