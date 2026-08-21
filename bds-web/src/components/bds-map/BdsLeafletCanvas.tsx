'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
// Side-effect import: gắn thêm `L.markerClusterGroup()` vào namespace `leaflet`
// toàn cục (và @types/leaflet.markercluster khai báo lại kiểu cho nó) — bản
// thân module không export gì cần dùng trực tiếp.
import 'leaflet.markercluster';
import { useEffect, useRef } from 'react';

export interface BdsMapPin {
  id: number;
  lat: number;
  lng: number;
  label: string;
  /** HTML hiển thị trong popup khi bấm vào marker. */
  popupHtml?: string;
}

interface BdsLeafletCanvasProps {
  center: [number, number];
  zoom?: number;
  markers: BdsMapPin[];
  className?: string;
  /** Bán kính tìm kiếm (km) — vẽ vòng tròn quanh tâm bản đồ. */
  radiusKm?: number;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
}

/**
 * Bọc Leaflet bằng API mệnh lệnh thay vì react-leaflet để tránh
 * lệch phiên bản React 19 và kiểm soát vòng đời map chặt hơn.
 */
export function BdsLeafletCanvas({
  center,
  zoom = 13,
  markers,
  className = 'h-96 w-full',
  radiusKm,
  onBoundsChange,
}: BdsLeafletCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  // Gom marker gần nhau theo cụm khi zoom xa — cần thiết vì API trả tối đa
  // config('bds.map.max_markers') (300) marker cho một lượt tìm kiếm, dồn
  // hết vào layer thường lúc zoom xa sẽ đè lên nhau rối mắt và chậm render.
  const layerRef = useRef<L.MarkerClusterGroup | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const onBoundsChangeRef = useRef(onBoundsChange);

  // Cập nhật callback qua ref trong effect (không đọc/ghi ref khi đang render).
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  // Khởi tạo map một lần.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // maxClusterRadius mặc định (80px) đã hợp lý; disableClusteringAtZoom để
    // ở mức zoom rất gần (phóng to hẳn 1 khu vực) luôn thấy từng marker riêng
    // lẻ, không gộp cụm nữa dù 2 tin đứng sát nhau.
    layerRef.current = L.markerClusterGroup({ disableClusteringAtZoom: 17 }).addTo(map);
    mapRef.current = map;

    const emitBounds = () => {
      const b = map.getBounds();

      onBoundsChangeRef.current?.({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    };

    map.on('moveend', emitBounds);

    return () => {
      map.off('moveend', emitBounds);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // Cố ý chỉ chạy 1 lần: center/zoom ban đầu, các thay đổi sau xử lý ở effect khác.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đồng bộ marker mỗi khi danh sách đổi.
  useEffect(() => {
    const layer = layerRef.current;

    if (!layer) return;

    layer.clearLayers();

    markers.forEach((pin) => {
      const marker = L.marker([pin.lat, pin.lng], {
        icon: L.divIcon({
          className: 'bds-map-pin',
          html:
            '<span style="display:inline-block;background:#e03c31;color:#fff;'
            + 'padding:3px 7px;border-radius:9999px;font-size:11px;font-weight:600;'
            + 'white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.3)">'
            + escapeHtml(pin.label.slice(0, 24))
            + '</span>',
          iconSize: [0, 0],
        }),
      });

      if (pin.popupHtml) {
        marker.bindPopup(pin.popupHtml);
      }

      marker.addTo(layer);
    });
  }, [markers]);

  // Vẽ vòng tròn bán kính tìm kiếm.
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    circleRef.current?.remove();
    circleRef.current = null;

    if (radiusKm && radiusKm > 0) {
      circleRef.current = L.circle(center, {
        radius: radiusKm * 1000,
        color: '#e03c31',
        fillColor: '#e03c31',
        fillOpacity: 0.08,
        weight: 1,
      }).addTo(map);
    }
  }, [radiusKm, center]);

  return <div ref={containerRef} className={className} />;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
