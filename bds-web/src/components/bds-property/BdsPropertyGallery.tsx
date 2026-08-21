'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { BdsPropertyImage } from '@/types/bds';

export function BdsPropertyGallery({
  images,
  title,
}: {
  images: BdsPropertyImage[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="grid aspect-16/10 place-items-center rounded-lg bg-gray-100 text-sm text-gray-400">
        Tin đăng chưa có hình ảnh
      </div>
    );
  }

  const active = images[activeIndex];

  return (
    <div>
      <div className="relative aspect-16/10 overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={active.url}
          alt={`${title} — ảnh ${activeIndex + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 800px"
          className="object-contain"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Ảnh trước"
              onClick={() => setActiveIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Ảnh tiếp theo"
              onClick={() => setActiveIndex((i) => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
            >
              ›
            </button>
            <span className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
              {activeIndex + 1}/{images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Xem ảnh ${index + 1}`}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded border-2 transition ${
                index === activeIndex ? 'border-brand-500' : 'border-transparent opacity-70'
              }`}
            >
              <Image
                src={image.thumb_url}
                alt={`${title} — ảnh thu nhỏ ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
