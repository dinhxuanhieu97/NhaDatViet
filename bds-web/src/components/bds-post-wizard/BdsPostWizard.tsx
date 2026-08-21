'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BdsApiError, bdsApi } from '@/lib/bds-api-client';
import { useBdsAuth } from '@/lib/bds-auth-context';
import { useBdsCategories, useBdsMyProperty } from '@/lib/bds-queries';
import {
  step1Schema,
  step2Schema,
  step3SchemaFor,
  step4Schema,
  step6Schema,
} from '@/lib/bds-schemas';
import { BdsWizardStepCategory } from './BdsWizardStepCategory';
import { BdsWizardStepLocation } from './BdsWizardStepLocation';
import { BdsWizardStepDetails } from './BdsWizardStepDetails';
import { BdsWizardStepContent } from './BdsWizardStepContent';
import { BdsWizardStepImages } from './BdsWizardStepImages';
import { BdsWizardStepReview } from './BdsWizardStepReview';
import type { BdsProperty } from '@/types/bds';

export type BdsPostDraft = Record<string, unknown>;

const BDS_DRAFT_STORAGE_KEY = 'bds_post_draft';

const BDS_WIZARD_STEPS = [
  { id: 1, title: 'Loại hình & Nhu cầu' },
  { id: 2, title: 'Địa chỉ & Bản đồ' },
  { id: 3, title: 'Thông tin BĐS' },
  { id: 4, title: 'Tiêu đề & Mô tả' },
  { id: 5, title: 'Hình ảnh' },
  { id: 6, title: 'Liên hệ & Xem trước' },
];

interface BdsPostWizardProps {
  /** Có giá trị khi đang sửa tin đã tồn tại. */
  propertyId?: number;
}

export function BdsPostWizard({ propertyId }: BdsPostWizardProps) {
  const router = useRouter();
  const { user } = useBdsAuth();

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedPropertyId, setSavedPropertyId] = useState<number | undefined>(propertyId);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const { data: categories = [] } = useBdsCategories();
  const { data: editingProperty } = useBdsMyProperty(propertyId);

  // Khôi phục bản nháp đang dở ngay khi khởi tạo state (chỉ áp dụng khi tạo mới),
  // tránh setState trong effect gây render lồng.
  const [draft, setDraft] = useState<BdsPostDraft>(() => {
    if (propertyId || typeof window === 'undefined') {
      return { price_unit: 'total' };
    }

    const raw = window.localStorage.getItem(BDS_DRAFT_STORAGE_KEY);

    if (!raw) return { price_unit: 'total' };

    try {
      return JSON.parse(raw) as BdsPostDraft;
    } catch {
      window.localStorage.removeItem(BDS_DRAFT_STORAGE_KEY);

      return { price_unit: 'total' };
    }
  });

  // Đổ dữ liệu tin đang sửa vào draft khi tải xong.
  const loadedPropertyIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!editingProperty || loadedPropertyIdRef.current === editingProperty.id) return;

    loadedPropertyIdRef.current = editingProperty.id;

    const p: BdsProperty = editingProperty;

    setDraft({
          listing_type: p.listing_type,
          category_id: p.category?.id,
          province_id: p.province?.id,
          district_id: p.district?.id,
          ward_id: p.ward?.id ?? null,
          address: p.address,
          latitude: p.latitude,
          longitude: p.longitude,
          area: p.area,
          price: p.price,
          price_unit: p.price_unit,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          floors: p.floors,
          direction: p.direction,
          legal_status: p.legal_status,
          furniture: p.furniture,
          frontage: p.frontage,
          road_width: p.road_width,
          title: p.title,
          description: p.description,
          contact_name: p.contact_name,
          contact_phone: p.contact_phone,
      contact_email: p.contact_email ?? '',
      contact_zalo: p.contact_zalo ?? '',
      contact_facebook: p.contact_facebook ?? '',
    });
  }, [editingProperty]);

  // Tự lưu nháp vào localStorage để không mất dữ liệu khi tải lại trang.
  useEffect(() => {
    if (propertyId) return;

    window.localStorage.setItem(BDS_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [draft, propertyId]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === Number(draft.category_id)),
    [categories, draft.category_id],
  );

  const patchDraft = useCallback((changes: BdsPostDraft) => {
    setDraft((prev) => ({ ...prev, ...changes }));
    setErrors({});
  }, []);

  /** Validate riêng từng bước để người dùng thấy lỗi ngay, không cần chờ server. */
  function validateStep(target: number): boolean {
    const schema = {
      1: step1Schema,
      2: step2Schema,
      3: step3SchemaFor(selectedCategory?.type ?? 'house'),
      4: step4Schema,
      6: step6Schema,
    }[target];

    if (!schema) return true;

    const result = schema.safeParse(draft);

    if (result.success) {
      setErrors({});

      return true;
    }

    const fieldErrors: Record<string, string> = {};

    result.error.issues.forEach((issue) => {
      const key = String(issue.path[0]);

      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    });

    setErrors(fieldErrors);

    return false;
  }

  function goNext() {
    if (!validateStep(step)) return;

    setStep((s) => Math.min(s + 1, BDS_WIZARD_STEPS.length));
  }

  function goBack() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  }

  /** Lưu tin (nháp hoặc gửi duyệt). Trả về id tin để bước ảnh dùng tiếp. */
  async function saveProperty(asDraft: boolean): Promise<number | null> {
    setSubmitting(true);
    setBanner(null);

    const payload = { ...draft, save_as_draft: asDraft };

    delete (payload as Record<string, unknown>).listing_type; // backend suy ra từ category

    try {
      if (savedPropertyId) {
        await bdsApi.put(`/my/properties/${savedPropertyId}`, payload);

        return savedPropertyId;
      }

      const res = await bdsApi.post<{ data: BdsProperty }>('/my/properties', payload);
      setSavedPropertyId(res.data.id);

      return res.data.id;
    } catch (error) {
      if (error instanceof BdsApiError) {
        if (error.errors) {
          setErrors(
            Object.fromEntries(Object.entries(error.errors).map(([k, v]) => [k, v[0]])),
          );
        }
        setBanner(error.message);
      } else {
        setBanner('Không lưu được tin đăng. Vui lòng thử lại.');
      }

      return null;
    } finally {
      setSubmitting(false);
    }
  }

  async function onSaveDraft() {
    const id = await saveProperty(true);

    if (id) {
      window.localStorage.removeItem(BDS_DRAFT_STORAGE_KEY);
      router.push('/quan-ly/tin-dang?status=draft');
    }
  }

  async function onSubmitForReview() {
    if (!validateStep(6)) return;

    // Tin đã tồn tại (id) TRƯỚC lần lưu này nghĩa là nó được tạo ngầm từ trước —
    // ví dụ lúc bước 5 "Tải ảnh" tự lưu nháp để có id gắn ảnh vào. Trường hợp đó,
    // tin đang ở trạng thái draft/rejected trong DB; PUT bên dưới chỉ cập nhật nội
    // dung chứ KHÔNG tự chuyển sang "chờ duyệt" — phải gọi riêng endpoint
    // `POST /submit` (nơi cũng kiểm tra lại điều kiện có ít nhất 1 ảnh).
    // Nếu tin chưa từng có id, saveProperty(false) bên dưới POST tạo mới và backend
    // đã đặt thẳng trạng thái "pending" ngay trong lần tạo đó, không cần gọi thêm.
    const existedBeforeThisSave = Boolean(savedPropertyId);

    const id = await saveProperty(false);

    if (!id) return;

    if (existedBeforeThisSave) {
      try {
        await bdsApi.post(`/my/properties/${id}/submit`);
      } catch (error) {
        setBanner(
          error instanceof BdsApiError ? error.message : 'Không gửi duyệt được tin đăng.',
        );

        return;
      }
    }

    window.localStorage.removeItem(BDS_DRAFT_STORAGE_KEY);
    router.push('/quan-ly/tin-dang?status=pending');
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">
        {propertyId ? 'Chỉnh sửa tin đăng' : 'Đăng tin mới'}
      </h1>

      <ol className="mt-4 flex flex-wrap gap-1.5">
        {BDS_WIZARD_STEPS.map((s) => (
          <li key={s.id} className="flex-1">
            <button
              type="button"
              onClick={() => s.id < step && setStep(s.id)}
              disabled={s.id > step}
              className={`w-full rounded-md border px-2 py-2 text-left text-xs transition ${
                s.id === step
                  ? 'border-brand-500 bg-brand-50 font-semibold text-brand-600'
                  : s.id < step
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white text-gray-400'
              }`}
            >
              <span className="block font-medium">Bước {s.id}</span>
              <span className="block truncate">{s.title}</span>
            </button>
          </li>
        ))}
      </ol>

      {banner && (
        <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">{banner}</p>
      )}

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5">
        {step === 1 && (
          <BdsWizardStepCategory
            draft={draft}
            categories={categories}
            errors={errors}
            onChange={patchDraft}
          />
        )}
        {step === 2 && (
          <BdsWizardStepLocation draft={draft} errors={errors} onChange={patchDraft} />
        )}
        {step === 3 && (
          <BdsWizardStepDetails
            draft={draft}
            category={selectedCategory}
            errors={errors}
            onChange={patchDraft}
          />
        )}
        {step === 4 && (
          <BdsWizardStepContent draft={draft} errors={errors} onChange={patchDraft} />
        )}
        {step === 5 && (
          <BdsWizardStepImages
            propertyId={savedPropertyId}
            imageLimit={user?.image_limit ?? 10}
            onEnsureProperty={() => saveProperty(true)}
          />
        )}
        {step === 6 && (
          <BdsWizardStepReview
            draft={draft}
            category={selectedCategory}
            errors={errors}
            onChange={patchDraft}
          />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {step > 1 && (
          <button
            type="button"
            onClick={goBack}
            className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Quay lại
          </button>
        )}

        {step < BDS_WIZARD_STEPS.length ? (
          <button
            type="button"
            onClick={goNext}
            className="rounded-md bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Tiếp tục →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void onSubmitForReview()}
            disabled={submitting}
            className="rounded-md bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? 'Đang gửi…' : 'Gửi duyệt'}
          </button>
        )}

        <button
          type="button"
          onClick={() => void onSaveDraft()}
          disabled={submitting}
          className="ml-auto rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Lưu nháp
        </button>
      </div>
    </div>
  );
}
