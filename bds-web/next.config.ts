import type { NextConfig } from 'next';

/**
 * Host phục vụ ảnh tin đăng (storage của bds-api).
 * Production: đổi NEXT_PUBLIC_BDS_IMAGE_HOST thành domain CDN/S3 thật.
 */
const bdsImageHost = process.env.NEXT_PUBLIC_BDS_IMAGE_HOST ?? 'localhost';

/**
 * Bật khi API chạy trên máy local (localhost / 127.0.0.1 / mạng LAN).
 *
 * Next 16 chặn tối ưu ảnh từ IP riêng để phòng SSRF, nên khi dev với
 * bds-api ở localhost:8000 mọi ảnh tin đăng sẽ hỏng kèm log
 * "upstream image ... hostname resolved to private IP".
 *
 * KHÔNG bật ở production: production phục vụ ảnh qua domain/CDN công khai.
 */
const bdsAllowLocalImages =
  process.env.BDS_ALLOW_LOCAL_IMAGES === 'true' || process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Xuất bản standalone để image Docker chỉ chứa runtime cần thiết.
  output: 'standalone',

  // Next 16 tự sinh AGENTS.md + CLAUDE.md (stub "@AGENTS.md") mỗi lần `next dev`
  // khởi động, dễ nhầm với CLAUDE.md thật ở gốc repo. Tắt để tránh xung đột.
  agentRules: false,

  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/storage/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/storage/**' },
      { protocol: 'https', hostname: bdsImageHost, pathname: '/**' },
    ],
    formats: ['image/webp'],
    dangerouslyAllowLocalIP: bdsAllowLocalImages,
  },

  // Ẩn header lộ công nghệ.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
