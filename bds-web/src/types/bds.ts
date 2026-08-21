// ---------------------------------------------------------------- Kiểu chung

export type BdsListingType = 'sale' | 'rent';
export type BdsPropertyType = 'land' | 'house' | 'apartment' | 'project';
export type BdsPropertyStatus =
  | 'draft'
  | 'pending'
  | 'published'
  | 'rejected'
  | 'expired'
  | 'hidden';

export type BdsDirection =
  | 'dong'
  | 'tay'
  | 'nam'
  | 'bac'
  | 'dong-nam'
  | 'tay-nam'
  | 'dong-bac'
  | 'tay-bac';

export type BdsLegalStatus =
  | 'red_book'
  | 'pink_book'
  | 'sale_contract'
  | 'waiting'
  | 'other';

export type BdsFurniture = 'full' | 'basic' | 'none';
export type BdsPriceUnit = 'total' | 'per_m2' | 'per_month';

export type BdsUserRole = 'admin' | 'moderator' | 'agent' | 'member';

// ------------------------------------------------------------ Bọc phản hồi API

export interface BdsPaginated<T> {
  data: T[];
  links: { first: string | null; last: string | null; prev: string | null; next: string | null };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
  };
}

export interface BdsWrapped<T> {
  data: T;
}

export interface BdsApiErrorPayload {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

// ------------------------------------------------------------------ Thực thể

export interface BdsUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  company: string | null;
  // Kênh mạng xã hội cấp hồ sơ (áp dụng cho mọi tin của người này) — khác
  // contact_zalo/contact_facebook trên BdsProperty, đặt riêng theo từng tin.
  // Xem CLAUDE.md §4.31.
  social_tiktok: string | null;
  social_youtube: string | null;
  social_instagram: string | null;
  status: 'active' | 'suspended' | 'pending';
  email_verified: boolean;
  roles: BdsUserRole[];
  permissions: string[];
  post_limit: number | null;
  image_limit: number;
  created_at: string;
}

export interface BdsCategory {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  type: BdsPropertyType;
  type_label: string;
  listing_type: BdsListingType;
  listing_type_label: string;
  icon: string | null;
  sort_order: number;
  required_fields: string[];
  hidden_fields: string[];
}

export interface BdsAdministrativeUnit {
  id: number;
  code: string;
  name: string;
  slug: string;
  type: string;
}

export interface BdsPropertyImage {
  id: number;
  url: string;
  thumb_url: string;
  is_primary: boolean;
  sort_order: number;
  is_processed: boolean;
}

export interface BdsProperty {
  id: number;
  title: string;
  slug: string;
  description: string;
  listing_type: BdsListingType;
  listing_type_label: string;

  price: number | null;
  price_unit: BdsPriceUnit;
  price_text: string;
  price_per_m2_text: string | null;

  area: number;
  bedrooms: number | null;
  bathrooms: number | null;
  floors: number | null;
  direction: BdsDirection | null;
  legal_status: BdsLegalStatus | null;
  furniture: BdsFurniture | null;
  frontage: number | null;
  road_width: number | null;

  address: string;
  latitude: number | null;
  longitude: number | null;

  status: BdsPropertyStatus;
  status_label: string;
  rejection_reason?: string | null;
  published_at: string | null;
  expired_at: string | null;
  views_count: number;
  is_featured: boolean;

  contact_name: string;
  contact_phone: string;
  contact_email?: string | null;
  /** Số Zalo riêng nếu người đăng cung cấp; nếu null thì dùng contact_phone. */
  contact_zalo?: string | null;
  /** Link trang/hồ sơ Facebook công khai của người đăng, nếu có. */
  contact_facebook?: string | null;

  category?: { id: number; name: string; slug: string; type: BdsPropertyType };
  project?: { id: number; name: string; slug: string } | null;
  province?: { id: number; name: string; slug: string };
  district?: { id: number; name: string; slug: string };
  ward?: { id: number; name: string } | null;
  user?: {
    id: number;
    name: string;
    company: string | null;
    avatar: string | null;
    social_tiktok: string | null;
    social_youtube: string | null;
    social_instagram: string | null;
  };
  images?: BdsPropertyImage[];
  primary_image?: string | null;

  created_at: string;
  updated_at: string;
}

export interface BdsMapMarker {
  id: number;
  slug: string;
  title: string;
  price_text: string;
  area: number;
  bedrooms: number | null;
  lat: number;
  lng: number;
  thumb: string | null;
}

export interface BdsProject {
  id: number;
  name: string;
  slug: string;
  developer: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  total_area: string | null;
  total_units: number | null;
  price_from: string | null;
  price_to: string | null;
  status: 'upcoming' | 'selling' | 'handed_over';
  thumbnail: string | null;
  is_featured: boolean;
  properties_count?: number;
  province?: { id: number; name: string; slug: string };
  district?: { id: number; name: string; slug: string };
}

export interface BdsAdminStats {
  properties: {
    total: number;
    pending: number;
    published: number;
    rejected: number;
    expired: number;
    new_today: number;
    new_this_week: number;
  };
  users: {
    total: number;
    new_today: number;
    by_role: Record<string, number>;
    suspended: number;
  };
  engagement: {
    total_views: number;
    contacts_today: number;
    pending_reports: number;
  };
}

// ------------------------------------------------------------------ Bộ lọc

export interface BdsPropertyFilters {
  q?: string;
  listing_type?: BdsListingType;
  category_id?: number;
  type?: BdsPropertyType;
  province_id?: number;
  district_id?: number;
  ward_id?: number;
  project_id?: number;
  price_min?: number;
  price_max?: number;
  area_min?: number;
  area_max?: number;
  bedrooms?: number;
  bathrooms?: number;
  direction?: BdsDirection;
  legal_status?: BdsLegalStatus;
  furniture?: BdsFurniture;
  lat?: number;
  lng?: number;
  radius?: number;
  sort?: 'newest' | 'relevance' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc' | 'views';
  page?: number;
  per_page?: number;
}
