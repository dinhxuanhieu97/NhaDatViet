'use client';

import { DIRECTION_LABELS, LEGAL_LABELS, formatArea, formatPrice } from '@/lib/bds-format';
import type { BdsCategory, BdsDirection, BdsLegalStatus } from '@/types/bds';
import { BdsWizardField, bdsWizardInputClass } from './BdsWizardField';
import type { BdsPostDraft } from './BdsPostWizard';

interface BdsWizardStepReviewProps {
  draft: BdsPostDraft;
  category?: BdsCategory;
  errors: Record<string, string>;
  onChange: (changes: BdsPostDraft) => void;
}

export function BdsWizardStepReview({
  draft,
  category,
  errors,
  onChange,
}: BdsWizardStepReviewProps) {
  const price = draft.price != null ? Number(draft.price) : null;
  const area = draft.area != null ? Number(draft.area) : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <BdsWizardField label="Tên liên hệ" required error={errors.contact_name}>
          <input
            value={String(draft.contact_name ?? '')}
            onChange={(e) => onChange({ contact_name: e.target.value })}
            className={bdsWizardInputClass}
            placeholder="Nguyễn Văn A"
          />
        </BdsWizardField>

        <BdsWizardField label="Số điện thoại" required error={errors.contact_phone}>
          <input
            value={String(draft.contact_phone ?? '')}
            onChange={(e) => onChange({ contact_phone: e.target.value })}
            className={bdsWizardInputClass}
            placeholder="0912345678"
          />
        </BdsWizardField>

        <BdsWizardField label="Email liên hệ" error={errors.contact_email}>
          <input
            value={String(draft.contact_email ?? '')}
            onChange={(e) => onChange({ contact_email: e.target.value })}
            className={bdsWizardInputClass}
            placeholder="email@example.com"
          />
        </BdsWizardField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BdsWizardField
          label="Số Zalo (không bắt buộc)"
          error={errors.contact_zalo}
          hint="Bỏ trống thì người xem tin bấm nút Zalo sẽ dùng luôn số điện thoại ở trên."
        >
          <input
            value={String(draft.contact_zalo ?? '')}
            onChange={(e) => onChange({ contact_zalo: e.target.value })}
            className={bdsWizardInputClass}
            placeholder="0912345678"
          />
        </BdsWizardField>

        <BdsWizardField
          label="Link Facebook (không bắt buộc)"
          error={errors.contact_facebook}
          hint="Trang hoặc hồ sơ Facebook công khai — hiển thị thành nút liên hệ trên tin đăng."
        >
          <input
            value={String(draft.contact_facebook ?? '')}
            onChange={(e) => onChange({ contact_facebook: e.target.value })}
            className={bdsWizardInputClass}
            placeholder="https://facebook.com/ten-trang"
          />
        </BdsWizardField>
      </div>

      <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-3 text-sm font-bold text-gray-900">Xem trước tin đăng</h2>

        <h3 className="text-base font-semibold text-gray-900">
          {String(draft.title ?? '(chưa có tiêu đề)')}
        </h3>

        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="font-bold text-brand-600">{formatPrice(price)}</span>
          <span className="text-gray-700">{formatArea(area)}</span>
          {price !== null && area > 0 && (
            <span className="text-gray-500">{formatPrice(price / area)}/m²</span>
          )}
        </div>

        <dl className="mt-3 grid gap-x-8 text-sm sm:grid-cols-2">
          <BdsReviewRow label="Loại hình" value={category?.name} />
          <BdsReviewRow label="Địa chỉ" value={String(draft.address ?? '')} />
          <BdsReviewRow
            label="Phòng ngủ"
            value={draft.bedrooms != null ? `${draft.bedrooms} phòng` : undefined}
          />
          <BdsReviewRow
            label="Phòng tắm"
            value={draft.bathrooms != null ? `${draft.bathrooms} phòng` : undefined}
          />
          <BdsReviewRow
            label="Hướng"
            value={draft.direction ? DIRECTION_LABELS[draft.direction as BdsDirection] : undefined}
          />
          <BdsReviewRow
            label="Pháp lý"
            value={
              draft.legal_status ? LEGAL_LABELS[draft.legal_status as BdsLegalStatus] : undefined
            }
          />
        </dl>

        <p className="mt-3 whitespace-pre-line text-sm text-gray-700">
          {String(draft.description ?? '(chưa có mô tả)')}
        </p>
      </section>

      <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
        Sau khi bấm <strong>Gửi duyệt</strong>, tin sẽ ở trạng thái <strong>Chờ duyệt</strong> và
        được kiểm duyệt viên xem xét. Bạn sẽ nhận email khi tin được duyệt hoặc bị từ chối.
      </p>
    </div>
  );
}

function BdsReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div className="flex justify-between gap-4 border-b border-gray-200 py-1.5">
      <dt className="text-gray-600">{label}</dt>
      <dd className="text-right font-medium text-gray-900">{value}</dd>
    </div>
  );
}
