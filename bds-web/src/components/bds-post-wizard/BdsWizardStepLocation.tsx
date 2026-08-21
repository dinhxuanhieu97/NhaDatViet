'use client';

import dynamic from 'next/dynamic';
import { useBdsDistricts, useBdsProvinces, useBdsWards } from '@/lib/bds-queries';
import { BdsWizardField, bdsWizardInputClass } from './BdsWizardField';
import type { BdsPostDraft } from './BdsPostWizard';

const BdsLocationPicker = dynamic(
  () => import('@/components/bds-map/BdsLocationPicker').then((m) => m.BdsLocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-64 place-items-center rounded-lg bg-gray-100 text-sm text-gray-500">
        Đang tải bản đồ…
      </div>
    ),
  },
);

interface BdsWizardStepLocationProps {
  draft: BdsPostDraft;
  errors: Record<string, string>;
  onChange: (changes: BdsPostDraft) => void;
}

export function BdsWizardStepLocation({ draft, errors, onChange }: BdsWizardStepLocationProps) {
  const { data: provinces = [] } = useBdsProvinces();
  const { data: districts = [] } = useBdsDistricts(draft.province_id as number | undefined);
  const { data: wards = [] } = useBdsWards(draft.district_id as number | undefined);

  const lat = draft.latitude != null ? Number(draft.latitude) : null;
  const lng = draft.longitude != null ? Number(draft.longitude) : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <BdsWizardField label="Tỉnh / Thành phố" required error={errors.province_id}>
          <select
            value={String(draft.province_id ?? '')}
            onChange={(e) =>
              onChange({
                province_id: e.target.value ? Number(e.target.value) : undefined,
                district_id: undefined,
                ward_id: undefined,
              })
            }
            className={bdsWizardInputClass}
          >
            <option value="">Chọn tỉnh/thành</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </BdsWizardField>

        <BdsWizardField
          label="Khu vực"
          required
          error={errors.district_id}
          hint="Tên quận cũ, dùng để người tìm nhà lọc theo thói quen"
        >
          <select
            value={String(draft.district_id ?? '')}
            disabled={districts.length === 0}
            onChange={(e) =>
              onChange({
                district_id: e.target.value ? Number(e.target.value) : undefined,
                ward_id: undefined,
              })
            }
            className={`${bdsWizardInputClass} disabled:bg-gray-50`}
          >
            <option value="">Chọn khu vực</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </BdsWizardField>

        <BdsWizardField
          label="Phường / Xã"
          error={errors.ward_id}
          hint="Đơn vị hành chính hiện hành (sau sắp xếp 01/7/2025)"
        >
          <select
            value={String(draft.ward_id ?? '')}
            disabled={wards.length === 0}
            onChange={(e) => onChange({ ward_id: e.target.value ? Number(e.target.value) : null })}
            className={`${bdsWizardInputClass} disabled:bg-gray-50`}
          >
            <option value="">Chọn phường/xã</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </BdsWizardField>
      </div>

      <BdsWizardField
        label="Địa chỉ chi tiết"
        required
        error={errors.address}
        hint="Số nhà, tên đường. Ví dụ: 123 Nguyễn Trãi"
      >
        <input
          value={String(draft.address ?? '')}
          onChange={(e) => onChange({ address: e.target.value })}
          className={bdsWizardInputClass}
          placeholder="123 Nguyễn Trãi"
        />
      </BdsWizardField>

      <div>
        <p className="mb-1 text-sm font-medium text-gray-700">
          Ghim vị trí trên bản đồ
          <span className="ml-2 text-xs font-normal text-gray-500">
            Bấm vào bản đồ để đặt vị trí chính xác (không bắt buộc nhưng giúp tin dễ được tìm thấy)
          </span>
        </p>

        <BdsLocationPicker
          lat={lat}
          lng={lng}
          onPick={(pickedLat, pickedLng) =>
            onChange({ latitude: pickedLat, longitude: pickedLng })
          }
        />

        {lat !== null && lng !== null && (
          <p className="mt-1 text-xs text-gray-500">
            Tọa độ đã chọn: {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
        )}
      </div>
    </div>
  );
}
