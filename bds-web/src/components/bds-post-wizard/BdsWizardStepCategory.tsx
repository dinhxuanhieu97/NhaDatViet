'use client';

import { TYPE_LABELS } from '@/lib/bds-format';
import type { BdsCategory, BdsListingType, BdsPropertyType } from '@/types/bds';
import { BdsWizardField } from './BdsWizardField';
import type { BdsPostDraft } from './BdsPostWizard';

interface BdsWizardStepCategoryProps {
  draft: BdsPostDraft;
  categories: BdsCategory[];
  errors: Record<string, string>;
  onChange: (changes: BdsPostDraft) => void;
}

export function BdsWizardStepCategory({
  draft,
  categories,
  errors,
  onChange,
}: BdsWizardStepCategoryProps) {
  const listingType = draft.listing_type as BdsListingType | undefined;

  const available = categories.filter((c) => c.listing_type === listingType);

  const typeGroups = Array.from(new Set(available.map((c) => c.type))) as BdsPropertyType[];

  return (
    <div className="space-y-5">
      <BdsWizardField label="Bạn muốn đăng tin gì?" required error={errors.listing_type}>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: 'sale', label: 'Bán', hint: 'Bán nhà, đất, căn hộ' },
              { value: 'rent', label: 'Cho thuê', hint: 'Cho thuê nhà, căn hộ, mặt bằng' },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ listing_type: option.value, category_id: undefined })}
              className={`rounded-lg border-2 p-4 text-left transition ${
                listingType === option.value
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="block font-semibold text-gray-900">{option.label}</span>
              <span className="mt-0.5 block text-xs text-gray-600">{option.hint}</span>
            </button>
          ))}
        </div>
      </BdsWizardField>

      {listingType && (
        <BdsWizardField label="Loại bất động sản" required error={errors.category_id}>
          <div className="space-y-4">
            {typeGroups.map((type) => (
              <div key={type}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {TYPE_LABELS[type]}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {available
                    .filter((c) => c.type === type)
                    .map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => onChange({ category_id: category.id })}
                        className={`rounded-md border px-3 py-2.5 text-left text-sm transition ${
                          Number(draft.category_id) === category.id
                            ? 'border-brand-500 bg-brand-50 font-medium text-brand-600'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </BdsWizardField>
      )}
    </div>
  );
}
