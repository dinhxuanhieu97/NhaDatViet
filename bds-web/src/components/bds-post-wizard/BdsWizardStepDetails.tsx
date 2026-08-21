'use client';

import { DIRECTION_LABELS, FURNITURE_LABELS, LEGAL_LABELS, formatPrice } from '@/lib/bds-format';
import type { BdsCategory } from '@/types/bds';
import { BdsWizardField, bdsWizardInputClass } from './BdsWizardField';
import type { BdsPostDraft } from './BdsPostWizard';

interface BdsWizardStepDetailsProps {
  draft: BdsPostDraft;
  category?: BdsCategory;
  errors: Record<string, string>;
  onChange: (changes: BdsPostDraft) => void;
}

export function BdsWizardStepDetails({
  draft,
  category,
  errors,
  onChange,
}: BdsWizardStepDetailsProps) {
  const type = category?.type ?? 'house';
  const hidden = new Set(category?.hidden_fields ?? []);
  const required = new Set(category?.required_fields ?? []);
  const isRent = category?.listing_type === 'rent';

  const show = (field: string) => !hidden.has(field);

  const numberValue = (field: string) => {
    const raw = draft[field];

    return raw === null || raw === undefined ? '' : String(raw);
  };

  const setNumber = (field: string, value: string) =>
    onChange({ [field]: value === '' ? null : Number(value) });

  return (
    <div className="space-y-4">
      <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
        Các trường hiển thị bên dưới được điều chỉnh theo loại hình{' '}
        <strong>{category?.type_label ?? '—'}</strong>. Trường có dấu{' '}
        <span className="text-red-500">*</span> là bắt buộc với loại hình này.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <BdsWizardField label="Diện tích (m²)" required error={errors.area}>
          <input
            type="number"
            min={1}
            step="0.1"
            value={numberValue('area')}
            onChange={(e) => setNumber('area', e.target.value)}
            className={bdsWizardInputClass}
            placeholder="80"
          />
        </BdsWizardField>

        <BdsWizardField
          label={isRent ? 'Giá thuê (VNĐ/tháng)' : 'Mức giá (VNĐ)'}
          error={errors.price}
          hint={
            draft.price
              ? `≈ ${formatPrice(Number(draft.price))}`
              : 'Bỏ trống nếu muốn hiển thị "Thỏa thuận"'
          }
        >
          <input
            type="number"
            min={0}
            value={numberValue('price')}
            onChange={(e) =>
              onChange({
                price: e.target.value === '' ? null : Number(e.target.value),
                price_unit: isRent ? 'per_month' : 'total',
              })
            }
            className={bdsWizardInputClass}
            placeholder={isRent ? '15000000' : '8500000000'}
          />
        </BdsWizardField>

        {show('bedrooms') && (
          <BdsWizardField
            label="Số phòng ngủ"
            required={required.has('bedrooms')}
            error={errors.bedrooms}
          >
            <input
              type="number"
              min={0}
              max={50}
              value={numberValue('bedrooms')}
              onChange={(e) => setNumber('bedrooms', e.target.value)}
              className={bdsWizardInputClass}
            />
          </BdsWizardField>
        )}

        {show('bathrooms') && (
          <BdsWizardField
            label="Số phòng tắm"
            required={required.has('bathrooms')}
            error={errors.bathrooms}
          >
            <input
              type="number"
              min={0}
              max={50}
              value={numberValue('bathrooms')}
              onChange={(e) => setNumber('bathrooms', e.target.value)}
              className={bdsWizardInputClass}
            />
          </BdsWizardField>
        )}

        {show('floors') && (
          <BdsWizardField
            label="Số tầng"
            required={required.has('floors')}
            error={errors.floors}
          >
            <input
              type="number"
              min={0}
              max={100}
              value={numberValue('floors')}
              onChange={(e) => setNumber('floors', e.target.value)}
              className={bdsWizardInputClass}
            />
          </BdsWizardField>
        )}

        {show('frontage') && (
          <BdsWizardField
            label="Mặt tiền (m)"
            required={required.has('frontage')}
            error={errors.frontage}
          >
            <input
              type="number"
              min={0}
              step="0.1"
              value={numberValue('frontage')}
              onChange={(e) => setNumber('frontage', e.target.value)}
              className={bdsWizardInputClass}
            />
          </BdsWizardField>
        )}

        {show('road_width') && (
          <BdsWizardField
            label="Đường vào (m)"
            required={required.has('road_width')}
            error={errors.road_width}
          >
            <input
              type="number"
              min={0}
              step="0.1"
              value={numberValue('road_width')}
              onChange={(e) => setNumber('road_width', e.target.value)}
              className={bdsWizardInputClass}
            />
          </BdsWizardField>
        )}

        <BdsWizardField label="Hướng nhà" error={errors.direction}>
          <select
            value={String(draft.direction ?? '')}
            onChange={(e) => onChange({ direction: e.target.value || null })}
            className={bdsWizardInputClass}
          >
            <option value="">Không xác định</option>
            {Object.entries(DIRECTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </BdsWizardField>

        {type !== 'project' && (
          <BdsWizardField
            label="Tình trạng pháp lý"
            required={required.has('legal_status')}
            error={errors.legal_status}
          >
            <select
              value={String(draft.legal_status ?? '')}
              onChange={(e) => onChange({ legal_status: e.target.value || null })}
              className={bdsWizardInputClass}
            >
              <option value="">Chưa xác định</option>
              {Object.entries(LEGAL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </BdsWizardField>
        )}

        {show('furniture') && (
          <BdsWizardField
            label="Nội thất"
            required={required.has('furniture')}
            error={errors.furniture}
          >
            <select
              value={String(draft.furniture ?? '')}
              onChange={(e) => onChange({ furniture: e.target.value || null })}
              className={bdsWizardInputClass}
            >
              <option value="">Chưa xác định</option>
              {Object.entries(FURNITURE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </BdsWizardField>
        )}
      </div>
    </div>
  );
}
