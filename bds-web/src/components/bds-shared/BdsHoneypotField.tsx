import { forwardRef } from 'react';
import { BDS_HONEYPOT_FIELD } from '@/lib/bds-anti-spam';

/**
 * Field bẫy bot — đặt tên như field thật ("website") để bot tự động điền
 * form dễ mắc bẫy hơn tên field lộ liễu kiểu "honeypot". Ẩn khỏi người dùng
 * thật bằng CSS đưa ra ngoài màn hình (không dùng `display:none`/`hidden`
 * vì một số bot bỏ qua field có 2 thuộc tính đó nhưng vẫn điền field chỉ ẩn
 * bằng vị trí) + `tabIndex={-1}` và `aria-hidden` để không lọt vào luồng
 * điều hướng bàn phím/trình đọc màn hình của người dùng thật.
 */
export const BdsHoneypotField = forwardRef<HTMLInputElement>(function BdsHoneypotField(_props, ref) {
  return (
    <input
      ref={ref}
      type="text"
      name={BDS_HONEYPOT_FIELD}
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden opacity-0"
    />
  );
});
