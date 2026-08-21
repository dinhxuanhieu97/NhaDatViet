import { useEffect, useRef } from 'react';

/**
 * Chống spam/bot cho form công khai (liên hệ, đăng ký...) không cần captcha
 * hay script bên thứ 3 — chỉ honeypot + đo thời gian điền form. Hai lớp:
 *
 * 1. Honeypot: field ẩn tên giống field thật ("website") — người dùng thật
 *    không nhìn thấy nên luôn để trống; bot điền tự động theo tên field
 *    thường điền nhầm cả field ẩn này.
 * 2. Đo thời gian điền form: `formRenderedAt` chụp mốc thời gian ngay khi
 *    component mount, đặt trong `useEffect` (không gọi `Date.now()` thẳng
 *    lúc render vì đó là hàm không thuần khiết) và giữ nguyên qua các lần
 *    re-render/submit lại sau lỗi validate — tránh phạt nhầm người dùng bấm
 *    gửi lại nhanh. Backend so `Date.now() - formRenderedAt` với ngưỡng tối
 *    thiểu, submit quá nhanh so với lúc form hiện ra bị coi là bot.
 *
 * Tên field phải khớp `config('bds.anti_spam')` ở backend — xem
 * App\Support\SpamGuard và CLAUDE.md §4.24.
 */
export const BDS_HONEYPOT_FIELD = 'website';
export const BDS_FORM_TIMESTAMP_FIELD = 'form_rendered_at';

export function useBdsAntiSpam() {
  const formRenderedAt = useRef<number | null>(null);

  useEffect(() => {
    formRenderedAt.current = Date.now();
  }, []);

  /** Gắn vào payload gửi API cùng với dữ liệu form thật. */
  function bdsAntiSpamFields(honeypotValue: string) {
    return {
      [BDS_HONEYPOT_FIELD]: honeypotValue,
      // Fallback Date.now() phòng trường hợp submit xảy ra trước khi effect
      // kịp chạy (về lý thuyết không xảy ra vì phải qua render trước) — dù
      // sao cũng không ảnh hưởng vì lúc đó backend sẽ thấy elapsed ~0 và
      // đúng là coi như bot.
      [BDS_FORM_TIMESTAMP_FIELD]: formRenderedAt.current ?? Date.now(),
    };
  }

  return { bdsAntiSpamFields };
}
