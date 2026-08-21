import Image from 'next/image';
import Link from 'next/link';
import { BdsPropertyDescription } from '@/components/bds-property/BdsPropertyDescription';
import { formatArea, formatRelative } from '@/lib/bds-format';
import type { BdsProperty } from '@/types/bds';

interface BdsPropertyCardProps {
  property: BdsProperty;
  /** 'grid' (mặc định): ảnh trên, nội dung dưới. 'list': ảnh trái, nội dung phải, chiếm cả hàng — xem BdsViewModeToggle. */
  layout?: 'grid' | 'list';
}

export function BdsPropertyCard({ property, layout = 'grid' }: BdsPropertyCardProps) {
  const image = property.primary_image ?? property.images?.[0]?.thumb_url ?? null;
  const location = [property.district?.name, property.province?.name].filter(Boolean).join(', ');

  if (layout === 'list') {
    return (
      <article className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-md">
        <Link href={`/bat-dong-san/${property.slug}`} className="flex flex-col sm:flex-row">
          <div className="relative aspect-4/3 shrink-0 bg-gray-100 sm:aspect-square sm:w-56">
            {image ? (
              <Image
                src={image}
                alt={`${property.title} — ${property.address}`}
                fill
                sizes="(max-width: 640px) 100vw, 224px"
                className="object-cover transition group-hover:scale-105"
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-gray-400">Chưa có ảnh</div>
            )}

            {property.is_featured && (
              <span className="absolute left-2 top-2 rounded bg-brand-500 px-2 py-0.5 text-xs font-semibold text-white">
                Tin nổi bật
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col p-3 sm:p-4">
            <h3 className="line-clamp-1 text-base font-semibold text-gray-900 group-hover:text-brand-600">
              {property.title}
            </h3>

            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-lg font-bold text-brand-600">{property.price_text}</span>
              <span className="text-sm text-gray-600">{formatArea(property.area)}</span>
              {property.price_per_m2_text && (
                <span className="text-xs text-gray-500">{property.price_per_m2_text}</span>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-gray-600">
              {property.bedrooms !== null && <span>{property.bedrooms} PN</span>}
              {property.bathrooms !== null && <span>{property.bathrooms} WC</span>}
              {property.floors !== null && <span>{property.floors} tầng</span>}
            </div>

            {/*
              Không đặt flex-1 trực tiếp trên phần tử bị line-clamp: flex-grow sẽ kéo
              cao hơn đúng N dòng (vd. 51px thay vì 40px cho 2 dòng cao 20px/dòng),
              khiến biên overflow:hidden nằm dưới điểm cắt của line-clamp — lộ thêm
              một phần dòng kế tiếp bên dưới dấu "…" (bug đã gặp thực tế, xem ảnh
              chụp màn hình báo lỗi). Để phần còn lại của flex column co giãn, bọc
              khối bên dưới mô tả bằng mt-auto thay vì gắn flex-1 lên chính đoạn văn.
            */}
            <BdsPropertyDescription text={property.description} />

            <div className="mt-auto">
              <p className="mt-1.5 truncate text-xs text-gray-500">{location || property.address}</p>

              <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 text-xs text-gray-500">
                <span className="truncate">{property.user?.name ?? property.contact_name}</span>
                <span>{formatRelative(property.published_at)}</span>
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-md">
      <Link href={`/bat-dong-san/${property.slug}`} className="block">
        <div className="relative aspect-4/3 bg-gray-100">
          {image ? (
            <Image
              src={image}
              alt={`${property.title} — ${property.address}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-gray-400">Chưa có ảnh</div>
          )}

          {property.is_featured && (
            <span className="absolute left-2 top-2 rounded bg-brand-500 px-2 py-0.5 text-xs font-semibold text-white">
              Tin nổi bật
            </span>
          )}
        </div>

        <div className="p-3">
          <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold text-gray-900 group-hover:text-brand-600">
            {property.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-base font-bold text-brand-600">{property.price_text}</span>
            <span className="text-sm text-gray-600">{formatArea(property.area)}</span>
            {property.price_per_m2_text && (
              <span className="text-xs text-gray-500">{property.price_per_m2_text}</span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
            {property.bedrooms !== null && <span>{property.bedrooms} PN</span>}
            {property.bathrooms !== null && <span>{property.bathrooms} WC</span>}
            {property.floors !== null && <span>{property.floors} tầng</span>}
          </div>

          <p className="mt-2 truncate text-xs text-gray-500">{location || property.address}</p>

          <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 text-xs text-gray-500">
            <span className="truncate">{property.user?.name ?? property.contact_name}</span>
            <span>{formatRelative(property.published_at)}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function BdsPropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="aspect-4/3 animate-pulse bg-gray-200" />
      <div className="space-y-2 p-3">
        <div className="h-4 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}
