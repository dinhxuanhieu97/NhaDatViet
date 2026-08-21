'use client';

import { useRef } from 'react';
import { BdsPropertyCard } from './BdsPropertyCard';
import type { BdsProperty } from '@/types/bds';

/**
 * Danh sách "Bất động sản tương tự" dạng slide cuộn ngang (giống các trang BĐS
 * lớn) thay vì lưới tĩnh — cho phép hiển thị nhiều hơn 4 tin mà không chiếm
 * quá nhiều chiều cao trang. Mũi tên trái/phải cuộn theo từng "trang" bằng
 * đúng bề rộng vùng nhìn thấy, dùng scroll-snap để dừng đúng biên thẻ tin.
 */
export function BdsSimilarPropertiesSlide({ properties }: { properties: BdsProperty[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByPage(direction: 1 | -1) {
    const track = trackRef.current;

    if (!track) return;

    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' });
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Bất động sản tương tự</h2>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label="Xem tin trước"
            className="grid h-8 w-8 place-items-center rounded-full border border-gray-300 text-gray-600 transition hover:bg-gray-50"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label="Xem tin tiếp theo"
            className="grid h-8 w-8 place-items-center rounded-full border border-gray-300 text-gray-600 transition hover:bg-gray-50"
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {properties.map((item) => (
          <div key={item.id} className="w-[68%] shrink-0 snap-start sm:w-[45%] lg:w-[23%]">
            <BdsPropertyCard property={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
