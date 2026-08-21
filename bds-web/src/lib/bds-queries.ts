'use client';

import { useQuery } from '@tanstack/react-query';
import { bdsApi } from '@/lib/bds-api-client';
import type {
  BdsAdministrativeUnit,
  BdsCategory,
  BdsListingType,
  BdsMapMarker,
  BdsProperty,
  BdsWrapped,
} from '@/types/bds';

/**
 * Hook truy vấn dùng chung cho dữ liệu tham chiếu (danh mục, địa giới).
 * Dùng TanStack Query thay vì useEffect + setState để tránh cascading render
 * và tận dụng cache giữa các màn hình.
 */

/** Danh mục ít thay đổi → cache 1 giờ. */
const BDS_REFERENCE_STALE_TIME = 60 * 60 * 1000;

export function useBdsCategories(listingType?: BdsListingType) {
  return useQuery({
    queryKey: ['bds', 'categories', listingType ?? 'all'],
    staleTime: BDS_REFERENCE_STALE_TIME,
    queryFn: () =>
      bdsApi.get<{ data: BdsCategory[] }>('/categories', {
        query: { listing_type: listingType },
      }),
    select: (res) => res.data,
  });
}

export function useBdsProvinces() {
  return useQuery({
    queryKey: ['bds', 'provinces'],
    staleTime: BDS_REFERENCE_STALE_TIME,
    queryFn: () => bdsApi.get<{ data: BdsAdministrativeUnit[] }>('/provinces'),
    select: (res) => res.data,
  });
}

export function useBdsDistricts(provinceId?: number | string | null) {
  return useQuery({
    queryKey: ['bds', 'districts', provinceId],
    enabled: !!provinceId,
    staleTime: BDS_REFERENCE_STALE_TIME,
    queryFn: () =>
      bdsApi.get<{ data: BdsAdministrativeUnit[] }>(`/provinces/${provinceId}/districts`),
    select: (res) => res.data,
  });
}

export function useBdsWards(districtId?: number | string | null) {
  return useQuery({
    queryKey: ['bds', 'wards', districtId],
    enabled: !!districtId,
    staleTime: BDS_REFERENCE_STALE_TIME,
    queryFn: () =>
      bdsApi.get<{ data: BdsAdministrativeUnit[] }>(`/districts/${districtId}/wards`),
    select: (res) => res.data,
  });
}

/** Chi tiết một tin đăng của chính người dùng (dùng ở form sửa tin và bước ảnh). */
export function useBdsMyProperty(propertyId?: number) {
  return useQuery({
    queryKey: ['bds', 'my-property', propertyId],
    enabled: !!propertyId,
    queryFn: () => bdsApi.get<BdsWrapped<BdsProperty>>(`/my/properties/${propertyId}`),
    select: (res) => res.data,
  });
}

interface BdsMapMarkerParams {
  lat: number;
  lng: number;
  radius: number;
  listingType: BdsListingType;
}

export function useBdsMapMarkers({ lat, lng, radius, listingType }: BdsMapMarkerParams) {
  return useQuery({
    queryKey: ['bds', 'map-markers', lat, lng, radius, listingType],
    queryFn: () =>
      bdsApi.get<{ data: BdsMapMarker[]; meta: { count: number } }>('/properties/map', {
        query: { lat, lng, radius, listing_type: listingType },
      }),
    select: (res) => res.data,
  });
}
