import { BDS_API_URL } from '@/lib/bds-api-client';

/**
 * Nút "Đăng nhập với Google/Facebook" — đây là các thẻ <a> điều hướng cả
 * trang (KHÔNG phải fetch/XHR) vì OAuth redirect-based cần trình duyệt tự
 * theo dõi cookie/state qua nhiều lượt chuyển trang giữa BDS API, Google/
 * Facebook, rồi quay lại BDS API → cuối cùng mới redirect về bds-web kèm
 * token (xem SocialAuthController::callback() ở backend).
 */
export function BdsSocialLoginButtons() {
  return (
    <div className="space-y-2">
      <div className="relative flex items-center py-1">
        <div className="grow border-t border-gray-200" />
        <span className="mx-3 text-xs text-gray-400">hoặc</span>
        <div className="grow border-t border-gray-200" />
      </div>

      <a
        href={`${BDS_API_URL}/auth/social/google/redirect`}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <BdsGoogleIcon />
        Đăng nhập với Google
      </a>

      <a
        href={`${BDS_API_URL}/auth/social/facebook/redirect`}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <BdsFacebookIcon />
        Đăng nhập với Facebook
      </a>
    </div>
  );
}

function BdsGoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5Z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.2 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.4 0-13.8 4.2-17.7 10.7Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-2.1 14.1-5.6l-6.5-5.5C29.6 34.7 27 35.5 24 35.5c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5c3.8 6.4 10.3 11.4 17.8 11.4Z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.5 5.5C41.5 35.9 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5Z"
      />
    </svg>
  );
}

function BdsFacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="#1877F2" className="h-4 w-4" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
    </svg>
  );
}
