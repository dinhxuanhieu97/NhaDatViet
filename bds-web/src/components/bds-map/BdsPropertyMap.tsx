'use client';

import dynamic from 'next/dynamic';

/**
 * Leaflet đụng tới `window` nên phải nạp phía client, tắt SSR.
 */
const BdsLeafletCanvas = dynamic(
  () => import('@/components/bds-map/BdsLeafletCanvas').then((m) => m.BdsLeafletCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-80 place-items-center rounded-lg bg-gray-100 text-sm text-gray-500">
        Đang tải bản đồ…
      </div>
    ),
  },
);

export function BdsPropertyMap({
  lat,
  lng,
  title,
}: {
  lat: number;
  lng: number;
  title: string;
}) {
  return (
    <BdsLeafletCanvas
      center={[lat, lng]}
      zoom={16}
      markers={[{ id: 0, lat, lng, label: title }]}
      className="h-80 w-full rounded-lg"
    />
  );
}
