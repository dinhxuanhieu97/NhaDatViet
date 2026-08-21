'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import { setBdsToken } from '@/lib/bds-api-client';
import { useBdsAuth } from '@/lib/bds-auth-context';

/**
 * Trang trung chuyển sau khi đăng nhập Google/Facebook.
 *
 * `SocialAuthController::callback()` ở backend redirect trình duyệt về đây
 * kèm `?token=...` (thành công) hoặc `?error=...` (thất bại) — KHÔNG có cách
 * nào khác để đưa access token về SPA vì toàn bộ luồng là điều hướng trình
 * duyệt qua nhiều domain (BDS API → Google/Facebook → BDS API → đây), không
 * phải gọi API bằng fetch.
 */
export default function BdsSocialCallbackPage() {
  return (
    <Suspense fallback={<BdsSocialCallbackStatus>Đang xử lý đăng nhập…</BdsSocialCallbackStatus>}>
      <BdsSocialCallbackContent />
    </Suspense>
  );
}

function BdsSocialCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useBdsAuth();
  const token = searchParams.get('token');
  const apiError = searchParams.get('error');
  const handled = useRef(false);

  // Đăng nhập bằng token nhận từ backend là hành động đồng bộ hóa với hệ
  // thống ngoài (localStorage + điều hướng trình duyệt) — hợp lệ để đặt
  // trong effect, khác với việc gọi setState của chính component này.
  useEffect(() => {
    if (!token || handled.current) return;
    handled.current = true;

    setBdsToken(token);
    void refresh().then(() => router.replace('/quan-ly'));
  }, [token, refresh, router]);

  if (!token) {
    return (
      <BdsSocialCallbackStatus>
        <p className="text-red-600">{apiError ?? 'Không đăng nhập được. Vui lòng thử lại.'}</p>
        <Link href="/dang-nhap" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">
          Quay lại trang đăng nhập
        </Link>
      </BdsSocialCallbackStatus>
    );
  }

  return <BdsSocialCallbackStatus>Đang xử lý đăng nhập…</BdsSocialCallbackStatus>;
}

function BdsSocialCallbackStatus({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center text-sm text-gray-700">{children}</div>
  );
}
