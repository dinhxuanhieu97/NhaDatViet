import { BDS_API_URL, buildBdsQuery } from '@/lib/bds-api-client';
import type { BdsPaginated, BdsProject, BdsProperty, BdsWrapped } from '@/types/bds';

/**
 * Lớp truy vấn dành riêng cho Server Component / generateMetadata.
 * Không đụng tới localStorage nên tách khỏi bds-api-client (vốn chạy phía client).
 */
async function fetchBdsJson<T>(
  path: string,
  params: Record<string, unknown> = {},
  revalidate = 60,
): Promise<T | null> {
  try {
    const res = await fetch(`${BDS_API_URL}${path}${buildBdsQuery(params)}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate },
    });

    if (!res.ok) return null;

    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const EMPTY_PAGE: BdsPaginated<never> = {
  data: [],
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: null, last_page: 1, per_page: 20, to: null, total: 0 },
};

export async function fetchBdsPropertyPage(
  params: Record<string, unknown>,
): Promise<BdsPaginated<BdsProperty>> {
  const json = await fetchBdsJson<BdsPaginated<BdsProperty>>('/properties', params, 60);

  return json ?? (EMPTY_PAGE as BdsPaginated<BdsProperty>);
}

export async function fetchBdsProperty(slug: string): Promise<BdsProperty | null> {
  const json = await fetchBdsJson<BdsWrapped<BdsProperty>>(`/properties/${slug}`, {}, 60);

  return json?.data ?? null;
}

export async function fetchBdsSimilarProperties(slug: string): Promise<BdsProperty[]> {
  const json = await fetchBdsJson<{ data: BdsProperty[] }>(`/properties/${slug}/similar`, {}, 300);

  return json?.data ?? [];
}

export async function fetchBdsProjectPage(
  params: Record<string, unknown> = {},
): Promise<BdsPaginated<BdsProject>> {
  const json = await fetchBdsJson<BdsPaginated<BdsProject>>('/projects', params, 3600);

  return json ?? (EMPTY_PAGE as BdsPaginated<BdsProject>);
}

export async function fetchBdsProject(slug: string): Promise<BdsProject | null> {
  const json = await fetchBdsJson<BdsWrapped<BdsProject>>(`/projects/${slug}`, {}, 3600);

  return json?.data ?? null;
}

/** Chuyển searchParams của Next.js thành object filter gửi lên API. */
export function toBdsFilters(
  searchParams: Record<string, string | string[] | undefined>,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const allowed = [
    'q', 'category_id', 'type', 'province_id', 'district_id', 'ward_id', 'project_id',
    'price_min', 'price_max', 'area_min', 'area_max', 'bedrooms', 'bathrooms',
    'direction', 'legal_status', 'furniture', 'sort', 'page', 'per_page',
  ];

  const filters: Record<string, unknown> = {};

  allowed.forEach((key) => {
    const value = searchParams[key];

    if (value !== undefined && value !== '') {
      filters[key] = Array.isArray(value) ? value[0] : value;
    }
  });

  return { per_page: 12, ...filters, ...overrides };
}
