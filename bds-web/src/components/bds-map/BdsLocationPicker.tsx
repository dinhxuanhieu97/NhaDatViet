'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef } from 'react';

/** Trung tâm TP.HCM — điểm mở bản đồ khi tin chưa có tọa độ. */
const BDS_PICKER_FALLBACK: [number, number] = [10.7769, 106.7009];

interface BdsLocationPickerProps {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
}

/** Bản đồ cho phép bấm để ghim tọa độ bất động sản khi đăng tin. */
export function BdsLocationPicker({ lat, lng, onPick }: BdsLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick);

  // Đồng bộ callback qua effect để không ghi ref trong lúc render.
  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const start: [number, number] = lat !== null && lng !== null ? [lat, lng] : BDS_PICKER_FALLBACK;
    const map = L.map(containerRef.current).setView(start, lat !== null ? 16 : 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      className: 'bds-picker-pin',
      html:
        '<span style="display:block;width:16px;height:16px;border-radius:9999px;'
        + 'background:#e03c31;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    if (lat !== null && lng !== null) {
      markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
    }

    map.on('click', (event: L.LeafletMouseEvent) => {
      const { lat: pickedLat, lng: pickedLng } = event.latlng;

      if (markerRef.current) {
        markerRef.current.setLatLng([pickedLat, pickedLng]);
      } else {
        markerRef.current = L.marker([pickedLat, pickedLng], { icon }).addTo(map);
      }

      onPickRef.current(Number(pickedLat.toFixed(6)), Number(pickedLng.toFixed(6)));
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Khởi tạo một lần; cập nhật vị trí do người dùng bấm nên không phụ thuộc lat/lng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="h-64 w-full rounded-lg border border-gray-200" />;
}
