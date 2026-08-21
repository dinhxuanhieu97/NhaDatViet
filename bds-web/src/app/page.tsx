import Link from 'next/link';
import { Suspense } from 'react';
import { BdsPropertyCard, BdsPropertyCardSkeleton } from '@/components/bds-property/BdsPropertyCard';
import { BdsSearchBar } from '@/components/bds-search/BdsSearchBar';
import { BDS_API_URL, buildBdsQuery } from '@/lib/bds-api-client';
import type { BdsPaginated, BdsProject, BdsProperty } from '@/types/bds';

export const revalidate = 300; // ISR 5 phút

const CATEGORY_TILES = [
  { href: '/nha-dat-ban?type=apartment', label: 'Căn hộ chung cư', icon: '🏢' },
  { href: '/nha-dat-ban?type=house', label: 'Nhà riêng', icon: '🏠' },
  { href: '/nha-dat-ban?type=land', label: 'Đất nền', icon: '🗺️' },
  { href: '/du-an', label: 'Dự án', icon: '🏗️' },
  { href: '/nha-dat-cho-thue?type=apartment', label: 'Thuê căn hộ', icon: '🔑' },
  { href: '/tim-kiem-ban-do', label: 'Tìm theo bản đồ', icon: '📍' },
];

async function fetchProperties(params: Record<string, unknown>): Promise<BdsProperty[]> {
  try {
    const res = await fetch(`${BDS_API_URL}/properties${buildBdsQuery(params)}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];

    const json = (await res.json()) as BdsPaginated<BdsProperty>;

    return json.data;
  } catch {
    return [];
  }
}

async function fetchProjects(): Promise<BdsProject[]> {
  try {
    const res = await fetch(`${BDS_API_URL}/projects?featured=1&per_page=6`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const json = (await res.json()) as BdsPaginated<BdsProject>;

    return json.data;
  } catch {
    return [];
  }
}

export default function HomePage() {
  return (
    <>
      <section className="bg-linear-to-br from-brand-600 to-brand-700 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
            Tìm bất động sản phù hợp với bạn
          </h1>
          <p className="mb-6 text-sm text-white/80">
            Hàng nghìn tin đăng nhà đất bán và cho thuê trên toàn quốc, được kiểm duyệt trước khi hiển thị.
          </p>
          <BdsSearchBar />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {CATEGORY_TILES.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 text-center transition hover:border-brand-500 hover:shadow-sm"
            >
              <span className="text-2xl">{tile.icon}</span>
              <span className="text-xs font-medium text-gray-700">{tile.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <Suspense fallback={<SectionSkeleton title="Tin đăng mới nhất" />}>
        <PropertySection
          title="Tin đăng mới nhất"
          href="/nha-dat-ban"
          params={{ per_page: 8, sort: 'newest' }}
        />
      </Suspense>

      <Suspense fallback={<SectionSkeleton title="Nhà đất cho thuê" />}>
        <PropertySection
          title="Nhà đất cho thuê"
          href="/nha-dat-cho-thue"
          params={{ per_page: 4, listing_type: 'rent' }}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ProjectSection />
      </Suspense>
    </>
  );
}

async function PropertySection({
  title,
  href,
  params,
}: {
  title: string;
  href: string;
  params: Record<string, unknown>;
}) {
  const properties = await fetchProperties(params);

  if (properties.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <Link href={href} className="text-sm font-medium text-brand-600 hover:underline">
          Xem tất cả →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {properties.map((p) => (
          <BdsPropertyCard key={p.id} property={p} />
        ))}
      </div>
    </section>
  );
}

async function ProjectSection() {
  const projects = await fetchProjects();

  if (projects.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Dự án nổi bật</h2>
        <Link href="/du-an" className="text-sm font-medium text-brand-600 hover:underline">
          Xem tất cả →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/du-an/${project.slug}`}
            className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-brand-500 hover:shadow-sm"
          >
            <h3 className="font-semibold text-gray-900">{project.name}</h3>
            <p className="mt-1 text-sm text-gray-600">{project.developer}</p>
            <p className="mt-2 text-xs text-gray-500">
              {[project.district?.name, project.province?.name].filter(Boolean).join(', ')}
            </p>
            {project.properties_count !== undefined && (
              <p className="mt-2 text-xs font-medium text-brand-600">
                {project.properties_count} tin đăng
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

function SectionSkeleton({ title }: { title: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <h2 className="mb-4 text-lg font-bold text-gray-900">{title}</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <BdsPropertyCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
