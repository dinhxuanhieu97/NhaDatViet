'use client';

import Link from 'next/link';
import { use } from 'react';
import { BdsContactBox } from '@/components/bds-property/BdsContactBox';
import { BdsPropertyGallery } from '@/components/bds-property/BdsPropertyGallery';
import { BdsPropertySpecs } from '@/components/bds-property/BdsPropertySpecs';
import { useBdsMyProperty } from '@/lib/bds-queries';
import { STATUS_STYLES, formatArea, formatDate, formatNumber } from '@/lib/bds-format';

/**
 * Xem trước tin đăng như người mua sẽ thấy — dùng cho MỌI trạng thái
 * (nháp/chờ duyệt/bị từ chối), không chỉ tin đã hiển thị công khai.
 *
 * Trang công khai `/bat-dong-san/[slug]` render ở Server Component và fetch
 * không kèm token đăng nhập, nên chỉ xem được tin `published`. Trang này
 * render ở Client Component, gọi `/my/properties/{id}` (đã có sẵn cho wizard
 * sửa tin, xác thực qua PropertyPolicy::update) nên chủ tin xem trước được
 * tin ở bất kỳ trạng thái nào trước khi gửi duyệt.
 */
export default function BdsPreviewPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const propertyId = Number(id);

  const { data: property, isLoading, isError } = useBdsMyProperty(propertyId);

  if (isLoading) {
    return <p className="mx-auto max-w-7xl px-4 py-6 text-sm text-gray-500">Đang tải…</p>;
  }

  if (isError || !property) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Không tìm thấy tin đăng, hoặc bạn không có quyền xem tin này.
        </p>
        <Link href="/quan-ly/tin-dang" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
          ← Quay lại danh sách tin đăng
        </Link>
      </div>
    );
  }

  const badge = STATUS_STYLES[property.status];
  const location = [property.district?.name, property.province?.name].filter(Boolean).join(', ');

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <p>
          <strong>Bản xem trước</strong> — đây là cách tin đăng sẽ hiển thị với người mua, hiện tại{' '}
          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>{' '}
          nên chưa ai khác xem được ngoài bạn.
        </p>
        <div className="flex gap-2">
          <Link
            href={`/quan-ly/tin-dang/${propertyId}/sua`}
            className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
          >
            Sửa tin
          </Link>
          <Link
            href="/quan-ly/tin-dang"
            className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
          >
            ← Danh sách tin đăng
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <article>
          <BdsPropertyGallery images={property.images ?? []} title={property.title} />

          <h1 className="mt-4 text-xl font-bold text-gray-900 sm:text-2xl">{property.title}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {property.address}
            {location && `, ${location}`}
          </p>

          <div className="mt-4 flex flex-wrap gap-6 rounded-lg border border-gray-200 bg-white p-4">
            <div>
              <p className="text-xs text-gray-500">Mức giá</p>
              <p className="text-lg font-bold text-brand-600">{property.price_text}</p>
              {property.price_per_m2_text && (
                <p className="text-xs text-gray-500">{property.price_per_m2_text}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">Diện tích</p>
              <p className="text-lg font-bold text-gray-900">{formatArea(property.area)}</p>
            </div>
            {property.bedrooms !== null && (
              <div>
                <p className="text-xs text-gray-500">Phòng ngủ</p>
                <p className="text-lg font-bold text-gray-900">{property.bedrooms} PN</p>
              </div>
            )}
            {property.bathrooms !== null && (
              <div>
                <p className="text-xs text-gray-500">Phòng tắm</p>
                <p className="text-lg font-bold text-gray-900">{property.bathrooms} WC</p>
              </div>
            )}
          </div>

          <section className="mt-6">
            <h2 className="mb-2 text-base font-bold text-gray-900">Thông tin mô tả</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {property.description}
            </p>
          </section>

          <section className="mt-6">
            <h2 className="mb-2 text-base font-bold text-gray-900">Đặc điểm bất động sản</h2>
            <BdsPropertySpecs property={property} />
          </section>

          <p className="mt-6 text-xs text-gray-500">
            Ngày đăng: {formatDate(property.published_at)} · Lượt xem:{' '}
            {formatNumber(property.views_count)} · Mã tin: #{property.id}
          </p>
        </article>

        <BdsContactBox property={property} />
      </div>
    </div>
  );
}
