import type { MetadataRoute } from 'next';
import { BDS_SITE_URL } from '@/lib/bds-config';
import { fetchBdsProjectPage, fetchBdsPropertyPage } from '@/lib/bds-server-api';

export const revalidate = 3600;

/**
 * Sitemap gồm 3 nhóm: trang tĩnh, tin đăng đã duyệt, dự án.
 * Khi số tin vượt 50.000, tách thành nhiều sitemap con bằng generateSitemaps().
 */
export default async function bdsSitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BDS_SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${BDS_SITE_URL}/nha-dat-ban`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BDS_SITE_URL}/nha-dat-cho-thue`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BDS_SITE_URL}/du-an`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BDS_SITE_URL}/tim-kiem-ban-do`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BDS_SITE_URL}/huong-dan-dang-tin`, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const [properties, projects] = await Promise.all([
    fetchBdsPropertyPage({ per_page: 50, sort: 'newest' }),
    fetchBdsProjectPage({ per_page: 50 }),
  ]);

  const propertyRoutes: MetadataRoute.Sitemap = properties.data.map((property) => ({
    url: `${BDS_SITE_URL}/bat-dong-san/${property.slug}`,
    lastModified: property.updated_at,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects.data.map((project) => ({
    url: `${BDS_SITE_URL}/du-an/${project.slug}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...propertyRoutes, ...projectRoutes];
}
