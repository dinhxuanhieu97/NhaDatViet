import Link from 'next/link';
import { Suspense } from 'react';
import { BdsPropertyGrid } from '@/components/bds-property/BdsPropertyGrid';
import { BdsFilterPanel } from '@/components/bds-search/BdsFilterPanel';
import { BdsSortSelect } from '@/components/bds-search/BdsSortSelect';
import { BdsViewModeToggle } from '@/components/bds-search/BdsViewModeToggle';
import { fetchBdsPropertyPage, toBdsFilters } from '@/lib/bds-server-api';
import { formatNumber } from '@/lib/bds-format';
import type { BdsListingType } from '@/types/bds';

interface BdsListingScreenProps {
  listingType: BdsListingType;
  heading: string;
  searchParams: Record<string, string | string[] | undefined>;
}

/** Khung trang danh sách dùng chung cho /nha-dat-ban và /nha-dat-cho-thue. */
export async function BdsListingScreen({
  listingType,
  heading,
  searchParams,
}: BdsListingScreenProps) {
  const filters = toBdsFilters(searchParams, { listing_type: listingType });
  const page = await fetchBdsPropertyPage(filters);
  const viewMode = searchParams.view === 'list' ? 'list' : 'grid';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-gray-500">
        <Link href="/" className="hover:text-brand-600">
          Trang chủ
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-900">{heading}</span>
      </nav>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{heading}</h1>
          <p className="mt-0.5 text-sm text-gray-600">
            {formatNumber(page.meta.total)} tin đăng
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Suspense fallback={null}>
            <BdsSortSelect />
          </Suspense>
          <Suspense fallback={null}>
            <BdsViewModeToggle />
          </Suspense>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-white" />}>
          <BdsFilterPanel listingType={listingType} />
        </Suspense>

        <BdsPropertyGrid page={page} searchParams={searchParams} viewMode={viewMode} />
      </div>
    </div>
  );
}
