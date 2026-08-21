'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatArea } from '@/lib/bds-format';
import { useBdsMapMarkers, useBdsProvinces } from '@/lib/bds-queries';
import type { BdsListingType } from '@/types/bds';

const BdsLeafletCanvas = dynamic(
  () => import('@/components/bds-map/BdsLeafletCanvas').then((m) => m.BdsLeafletCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center bg-gray-100 text-sm text-gray-500">
        Đang tải bản đồ…
      </div>
    ),
  },
);

/** Trung tâm khu vực đang có dữ liệu (Quận 12, TP.HCM) — điểm mở bản đồ mặc định. */
const BDS_DEFAULT_CENTER: [number, number] = [10.8560, 106.6480];

const BDS_RADIUS_OPTIONS = [1, 3, 5, 10, 20];

export function BdsMapSearchScreen() {
  const [center, setCenter] = useState<[number, number]>(BDS_DEFAULT_CENTER);
  const [radiusKm, setRadiusKm] = useState(5);
  const [listingType, setListingType] = useState<BdsListingType>('sale');
  const { data: provinces = [] } = useBdsProvinces();

  const { data: markers = [], isFetching: loading } = useBdsMapMarkers({
    lat: center[0],
    lng: center[1],
    radius: radiusKm,
    listingType,
  });

  const pins = useMemo(
    () =>
      markers.map((m) => ({
        id: m.id,
        lat: m.lat,
        lng: m.lng,
        label: m.price_text,
        popupHtml:
          `<a href="/bat-dong-san/${m.slug}" style="font-weight:600;color:#c62f26">${m.title}</a>`
          + `<br/><span style="font-size:12px">${m.price_text} · ${formatArea(m.area)}</span>`,
      })),
    [markers],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900">Tìm bất động sản theo bản đồ</h1>
      <p className="mt-0.5 text-sm text-gray-600">
        Chọn khu vực và bán kính để xem các tin đăng quanh vị trí đó.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-gray-700">Nhu cầu</span>
          <select
            value={listingType}
            onChange={(e) => setListingType(e.target.value as BdsListingType)}
            className="rounded-md border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="sale">Nhà đất bán</option>
            <option value="rent">Nhà đất cho thuê</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-gray-700">Khu vực</span>
          <select
            onChange={(e) => {
              const province = provinces.find((p) => String(p.id) === e.target.value);

              if (province) {
                setCenter(BDS_PROVINCE_CENTERS[province.slug] ?? BDS_DEFAULT_CENTER);
              }
            }}
            className="rounded-md border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="">Chọn tỉnh/thành</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <div className="text-sm">
          <span className="mb-1 block text-xs font-medium text-gray-700">Bán kính</span>
          <div className="flex gap-1">
            {BDS_RADIUS_OPTIONS.map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => setRadiusKm(km)}
                className={`rounded-md border px-3 py-2 text-sm transition ${
                  radiusKm === km
                    ? 'border-brand-500 bg-brand-50 text-brand-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {km} km
              </button>
            ))}
          </div>
        </div>

        <p className="ml-auto text-sm text-gray-600">
          {loading ? 'Đang tải…' : `${markers.length} tin trong bán kính`}
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="h-[32rem] overflow-hidden rounded-lg border border-gray-200">
          <BdsLeafletCanvas
            center={center}
            zoom={13}
            markers={pins}
            radiusKm={radiusKm}
            className="h-full w-full"
          />
        </div>

        <div className="h-[32rem] space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
          {markers.length === 0 && !loading && (
            <p className="py-8 text-center text-sm text-gray-500">
              Không có tin đăng nào trong bán kính này.
            </p>
          )}

          {markers.map((m) => (
            <Link
              key={m.id}
              href={`/bat-dong-san/${m.slug}`}
              className="block rounded-md border border-gray-200 p-2.5 transition hover:border-brand-500"
            >
              <p className="line-clamp-2 text-sm font-medium text-gray-900">{m.title}</p>
              <p className="mt-1 text-sm font-bold text-brand-600">{m.price_text}</p>
              <p className="text-xs text-gray-500">
                {formatArea(m.area)}
                {m.bedrooms !== null && ` · ${m.bedrooms} PN`}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Toạ độ tâm bản đồ theo tỉnh/thành. Chỉ liệt kê nơi có dữ liệu;
 * tỉnh chưa có trong bảng này sẽ rơi về BDS_DEFAULT_CENTER.
 */
const BDS_PROVINCE_CENTERS: Record<string, [number, number]> = {
  'ho-chi-minh': [10.7769, 106.7009],
};
