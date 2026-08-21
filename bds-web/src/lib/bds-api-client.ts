import type { BdsApiErrorPayload } from '@/types/bds';

export const BDS_API_URL =
  process.env.NEXT_PUBLIC_BDS_API_URL ?? 'http://localhost:8000/api/v1';

/**
 * Export để `bds-auth-context.tsx` lắng nghe sự kiện `storage` (đồng bộ đăng
 * nhập/đăng xuất giữa các tab) mà không hard-code lại chuỗi khóa ở nơi khác.
 */
export const BDS_TOKEN_STORAGE_KEY = 'bds_token';
const TOKEN_KEY = BDS_TOKEN_STORAGE_KEY;

/**
 * "Ghi nhớ đăng nhập": chọn nơi lưu token thay vì luôn dùng localStorage.
 * `remember = true` (mặc định, khớp hành vi trước đây) → localStorage, tồn
 * tại xuyên các lần đóng/mở trình duyệt. `remember = false` → sessionStorage,
 * mất ngay khi đóng tab/trình duyệt (không phải logout, chỉ không "nhớ" lâu).
 * `getBdsToken()` đọc cả hai nơi vì không biết trước request nào tới trước
 * khi có state ở React — luôn chỉ có nhiều nhất một trong hai nơi có giá trị
 * vì setBdsToken()/clearBdsToken() luôn dọn nơi còn lại.
 */
export function getBdsToken(): string | null {
  if (typeof window === 'undefined') return null;

  return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
}

export function setBdsToken(token: string, remember: boolean = true): void {
  if (typeof window === 'undefined') return;

  if (remember) {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.sessionStorage.removeItem(TOKEN_KEY);
  } else {
    window.sessionStorage.setItem(TOKEN_KEY, token);
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearBdsToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
}

export class BdsApiError extends Error implements BdsApiErrorPayload {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'BdsApiError';
    this.status = status;
    this.errors = errors;
  }

  /** Lỗi validate đầu tiên của một trường, dùng để hiển thị dưới input. */
  fieldError(field: string): string | undefined {
    return this.errors?.[field]?.[0];
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Bật khi cần dữ liệu mới nhất trên Server Component. */
  revalidate?: number | false;
  query?: Record<string, unknown>;
}

export function buildBdsQuery(params: Record<string, unknown> = {}): string {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(`${key}[]`, String(v)));
    } else {
      search.set(key, String(value));
    }
  });

  const qs = search.toString();

  return qs ? `?${qs}` : '';
}

export async function bdsApiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, revalidate, query, headers, ...rest } = options;

  const isFormData = body instanceof FormData;
  const token = getBdsToken();

  const url = `${BDS_API_URL}${path}${buildBdsQuery(query)}`;

  const response = await fetch(url, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string>),
    },
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    ...(revalidate !== undefined ? { next: { revalidate: revalidate as number } } : {}),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new BdsApiError(
      payload?.message ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.',
      response.status,
      payload?.errors,
    );
  }

  return payload as T;
}

export const bdsApi = {
  get: <T>(path: string, options?: RequestOptions) =>
    bdsApiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    bdsApiFetch<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    bdsApiFetch<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    bdsApiFetch<T>(path, { ...options, method: 'DELETE' }),
};
