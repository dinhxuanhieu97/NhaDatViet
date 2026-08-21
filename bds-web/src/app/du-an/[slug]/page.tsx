import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BdsPropertyCard } from '@/components/bds-property/BdsPropertyCard';
import { BdsPropertyMap } from '@/components/bds-map/BdsPropertyMap';
import { BDS_SITE_URL } from '@/lib/bds-config';
import { fetchBdsProject, fetchBdsPropertyPage } from '@/lib/bds-server-api';
import { formatNumber } from '@/lib/bds-format';

export const revalidate = 3600;

interface BdsProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BdsProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await fetchBdsProject(slug);

  if (!project) {
    return { title: 'Không tìm thấy dự án' };
  }

  const location = [project.district?.name, project.province?.name].filter(Boolean).join(', ');

  return {
    title: `Dự án ${project.name}`,
    description:
      `Thông tin dự án ${project.name}${project.developer ? ` do ${project.developer} phát triển` : ''}`
      + `${location ? ` tại ${location}` : ''}. Quy mô, tiến độ và các tin đăng thuộc dự án.`,
    alternates: { canonical: `/du-an/${project.slug}` },
    openGraph: {
      type: 'article',
      title: `Dự án ${project.name}`,
      url: `${BDS_SITE_URL}/du-an/${project.slug}`,
    },
  };
}

export default async function BdsProjectDetailPage({ params }: BdsProjectPageProps) {
  const { slug } = await params;
  const project = await fetchBdsProject(slug);

  if (!project) {
    notFound();
  }

  const properties = await fetchBdsPropertyPage({ project_id: project.id, per_page: 8 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-gray-500">
        <Link href="/" className="hover:text-brand-600">
          Trang chủ
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/du-an" className="hover:text-brand-600">
          Dự án
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-900">{project.name}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
      <p className="mt-1 text-sm text-gray-600">
        {project.developer && <>Chủ đầu tư: {project.developer} · </>}
        {[project.district?.name, project.province?.name].filter(Boolean).join(', ')}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <BdsProjectFact label="Quy mô" value={project.total_area ? `${project.total_area} ha` : null} />
        <BdsProjectFact
          label="Số căn"
          value={project.total_units ? formatNumber(project.total_units) : null}
        />
        <BdsProjectFact label="Địa chỉ" value={project.address} />
        <BdsProjectFact label="Tin đăng" value={`${project.properties_count ?? 0} tin`} />
      </dl>

      {project.description && (
        <section className="mt-6">
          <h2 className="mb-2 text-base font-bold text-gray-900">Giới thiệu dự án</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
            {project.description}
          </p>
        </section>
      )}

      {project.latitude && project.longitude && (
        <section className="mt-6">
          <h2 className="mb-2 text-base font-bold text-gray-900">Vị trí dự án</h2>
          <BdsPropertyMap lat={project.latitude} lng={project.longitude} title={project.name} />
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Tin đăng thuộc dự án</h2>

        {properties.data.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
            Chưa có tin đăng nào thuộc dự án này.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {properties.data.map((property) => (
              <BdsPropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BdsProjectFact({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-gray-900">{value}</dd>
    </div>
  );
}
