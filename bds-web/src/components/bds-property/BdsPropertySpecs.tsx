import {
  DIRECTION_LABELS,
  FURNITURE_LABELS,
  LEGAL_LABELS,
  formatArea,
} from '@/lib/bds-format';
import type { BdsProperty } from '@/types/bds';

export function BdsPropertySpecs({ property }: { property: BdsProperty }) {
  const rows: Array<[string, string | null]> = [
    ['Loại bất động sản', property.category?.name ?? null],
    ['Diện tích', formatArea(property.area)],
    ['Mức giá', property.price_text],
    ['Số phòng ngủ', property.bedrooms !== null ? `${property.bedrooms} phòng` : null],
    ['Số phòng tắm', property.bathrooms !== null ? `${property.bathrooms} phòng` : null],
    ['Số tầng', property.floors !== null ? `${property.floors} tầng` : null],
    ['Hướng nhà', property.direction ? DIRECTION_LABELS[property.direction] : null],
    ['Pháp lý', property.legal_status ? LEGAL_LABELS[property.legal_status] : null],
    ['Nội thất', property.furniture ? FURNITURE_LABELS[property.furniture] : null],
    ['Mặt tiền', property.frontage !== null ? `${property.frontage} m` : null],
    ['Đường vào', property.road_width !== null ? `${property.road_width} m` : null],
    ['Dự án', property.project?.name ?? null],
  ];

  const visible = rows.filter(([, value]) => value !== null);

  return (
    <dl className="grid grid-cols-1 gap-x-8 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2">
      {visible.map(([label, value]) => (
        <div
          key={label}
          className="flex justify-between gap-4 border-b border-gray-100 py-2.5 last:border-0"
        >
          <dt className="text-sm text-gray-600">{label}</dt>
          <dd className="text-right text-sm font-medium text-gray-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
