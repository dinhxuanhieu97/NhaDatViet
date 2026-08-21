'use client';

import { useEffect, useRef, useState } from 'react';

interface BdsPropertyDescriptionProps {
  text: string;
}

/**
 * Mô tả tin ở layout `list` (`BdsPropertyCard`), cắt tối đa 3 dòng
 * (`line-clamp-3`) kèm gợi ý "… Xem thêm" — CHỈ hiện gợi ý này khi nội dung
 * THẬT SỰ bị cắt (so `scrollHeight` với `clientHeight` sau khi render bằng
 * `ResizeObserver`, không đoán theo số ký tự): độ rộng cột mô tả đổi rất
 * nhiều theo breakpoint (ảnh bên trái chỉ có từ `sm:` trở lên, dưới đó card
 * xếp dọc full-width) nên một ngưỡng ký tự tĩnh sẽ sai lệch giữa các kích
 * thước màn hình — có mô tả dài nhưng vừa đủ 3 dòng (không nên hiện gợi ý),
 * có mô tả ngắn hơn nhưng ở màn hẹp lại bị cắt (nên hiện).
 *
 * "Xem thêm" đặt làm khối RIÊNG ngay dưới đoạn văn, không lồng vào bên
 * trong `<p>` bị `line-clamp-3` — nếu lồng bên trong, chính gợi ý này cũng
 * sẽ bị cắt mất theo cùng cơ chế đã sửa ở CLAUDE.md §4.28 (flow-root +
 * overflow:hidden clip bất cứ nội dung nào vượt quá điểm cắt, kể cả phần tử
 * do mình tự thêm vào cuối). Không cần bọc thẻ `<a>` riêng — cả card đã nằm
 * trong một `<Link>` cha (xem `BdsPropertyCard`), lồng thêm `<a>` bên trong
 * `<a>` là HTML không hợp lệ; đây chỉ là gợi ý thị giác, bấm vào bất cứ đâu
 * trên card đều điều hướng tới trang chi tiết.
 */
export function BdsPropertyDescription({ text }: BdsPropertyDescriptionProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    const checkClamped = () => setIsClamped(el.scrollHeight - el.clientHeight > 1);

    checkClamped();

    const observer = new ResizeObserver(checkClamped);
    observer.observe(el);

    return () => observer.disconnect();
  }, [text]);

  return (
    <>
      <p ref={ref} className="mt-1.5 line-clamp-3 text-sm text-gray-600">
        {text}
      </p>

      {isClamped && (
        <span className="mt-0.5 inline-block text-xs font-semibold text-brand-600">
          … Xem thêm
        </span>
      )}
    </>
  );
}
