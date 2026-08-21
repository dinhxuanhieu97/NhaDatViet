'use client';

import { BdsWizardField, bdsWizardInputClass } from './BdsWizardField';
import type { BdsPostDraft } from './BdsPostWizard';

interface BdsWizardStepContentProps {
  draft: BdsPostDraft;
  errors: Record<string, string>;
  onChange: (changes: BdsPostDraft) => void;
}

export function BdsWizardStepContent({ draft, errors, onChange }: BdsWizardStepContentProps) {
  const title = String(draft.title ?? '');
  const description = String(draft.description ?? '');

  return (
    <div className="space-y-4">
      <BdsWizardField
        label="Tiêu đề tin đăng"
        required
        error={errors.title}
        hint={`${title.length}/200 ký tự — tối thiểu 30 ký tự. Nên có: loại BĐS + đường/khu vực + diện tích.`}
      >
        <input
          value={title}
          maxLength={200}
          onChange={(e) => onChange({ title: e.target.value })}
          className={bdsWizardInputClass}
          placeholder="Bán nhà mặt phố Nguyễn Trãi, Thanh Xuân, 80m² 4 phòng ngủ"
        />
      </BdsWizardField>

      <BdsWizardField
        label="Mô tả chi tiết"
        required
        error={errors.description}
        hint={`${description.length}/10.000 ký tự — tối thiểu 50 ký tự.`}
      >
        <textarea
          value={description}
          rows={10}
          maxLength={10_000}
          onChange={(e) => onChange({ description: e.target.value })}
          className={bdsWizardInputClass}
          placeholder={
            'Mô tả nên có:\n'
            + '- Vị trí, tiện ích xung quanh (trường học, chợ, bệnh viện)\n'
            + '- Kết cấu, hiện trạng bất động sản\n'
            + '- Pháp lý, khả năng thương lượng\n'
            + '- Thời gian có thể xem nhà'
          }
        />
      </BdsWizardField>

      <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
        <p className="font-medium">Lưu ý khi viết nội dung</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
          <li>Không ghi số điện thoại trong mô tả — hệ thống sẽ tự lọc. Số liên hệ nhập ở bước 6.</li>
          <li>Không dùng chữ IN HOA toàn bộ hoặc ký tự lặp gây rối.</li>
          <li>Tin sai lệch thông tin có thể bị từ chối hoặc gỡ bỏ.</li>
        </ul>
      </div>
    </div>
  );
}
