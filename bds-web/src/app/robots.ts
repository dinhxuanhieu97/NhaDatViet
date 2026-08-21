import type { MetadataRoute } from 'next';
import { BDS_SITE_URL } from '@/lib/bds-config';

export default function bdsRobots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Khu vực cần đăng nhập và endpoint API không cần index.
        disallow: ['/quan-ly', '/quan-tri', '/dang-nhap', '/dang-ky', '/quen-mat-khau', '/api'],
      },
    ],
    sitemap: `${BDS_SITE_URL}/sitemap.xml`,
    host: BDS_SITE_URL,
  };
}
