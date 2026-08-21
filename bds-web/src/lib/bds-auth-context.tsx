'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { BDS_TOKEN_STORAGE_KEY, bdsApi, clearBdsToken, setBdsToken } from '@/lib/bds-api-client';
import type { BdsUser, BdsUserRole, BdsWrapped } from '@/types/bds';

interface BdsAuthState {
  user: BdsUser | null;
  loading: boolean;
  /** `remember` = "Ghi nhớ đăng nhập": true (mặc định) lưu token lâu dài, false chỉ lưu trong phiên trình duyệt hiện tại. */
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (payload: BdsRegisterPayload, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasRole: (...roles: BdsUserRole[]) => boolean;
  can: (permission: string) => boolean;
}

export interface BdsRegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  company?: string;
  // Field chống bot (xem lib/bds-anti-spam.ts) — người dùng thật luôn để
  // trống honeypot ("website") và luôn gửi form_rendered_at, không phải dữ
  // liệu tài khoản thật nhưng đi chung payload cho gọn.
  website?: string;
  form_rendered_at?: number;
}

const BDS_CURRENT_USER_KEY = ['bds', 'current-user'] as const;

const BdsAuthContext = createContext<BdsAuthState | null>(null);

export function BdsAuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: BDS_CURRENT_USER_KEY,
    // Token hết hạn hoặc chưa đăng nhập đều trả null, không coi là lỗi.
    queryFn: async (): Promise<BdsUser | null> => {
      try {
        const res = await bdsApi.get<BdsWrapped<BdsUser>>('/auth/me');

        return res.data;
      } catch {
        clearBdsToken();

        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const setCurrentUser = useCallback(
    (next: BdsUser | null) => queryClient.setQueryData(BDS_CURRENT_USER_KEY, next),
    [queryClient],
  );

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: BDS_CURRENT_USER_KEY });
  }, [queryClient]);

  const login = useCallback(
    async (email: string, password: string, remember: boolean = true) => {
      const res = await bdsApi.post<BdsWrapped<BdsUser> & { token: string }>('/auth/login', {
        email,
        password,
      });
      setBdsToken(res.token, remember);
      setCurrentUser(res.data);
    },
    [setCurrentUser],
  );

  const register = useCallback(
    async (payload: BdsRegisterPayload, remember: boolean = true) => {
      const res = await bdsApi.post<BdsWrapped<BdsUser> & { token: string }>(
        '/auth/register',
        payload,
      );
      setBdsToken(res.token, remember);
      setCurrentUser(res.data);
    },
    [setCurrentUser],
  );

  const logout = useCallback(async () => {
    try {
      await bdsApi.post('/auth/logout');
    } finally {
      clearBdsToken();
      setCurrentUser(null);
      queryClient.clear();
    }
  }, [setCurrentUser, queryClient]);

  // Đồng bộ đăng nhập/đăng xuất giữa các tab cùng origin. `localStorage` vốn
  // đã dùng chung giữa các tab (đăng xuất ở tab A đã tự xóa token khỏi
  // localStorage mà tab B nhìn thấy nếu reload) — cái thiếu là state của
  // React Query trong bộ nhớ mỗi tab không tự biết để refetch, vì
  // `refetchOnWindowFocus` bị tắt toàn cục (bds-providers.tsx) để tránh gọi
  // lại API vô ích khi chuyển tab thường. Sự kiện `storage` của trình duyệt
  // giải quyết đúng việc này: theo chuẩn Web Storage API, nó CHỈ bắn ra ở các
  // document KHÁC tab vừa ghi localStorage — nên không tự kích hoạt lại ở tab
  // vừa gọi login()/logout(), chỉ đồng bộ các tab còn lại.
  //
  // Chỉ đồng bộ theo `localStorage` (ghi nhớ đăng nhập = true, mặc định) —
  // `sessionStorage` (ghi nhớ đăng nhập = false) đã cố tình giới hạn theo
  // từng tab/phiên riêng (xem CLAUDE.md §4.22 "Ghi nhớ đăng nhập"), nên việc
  // KHÔNG đồng bộ sessionStorage giữa tab là đúng thiết kế, không phải thiếu sót.
  //
  // Cố tình KHÔNG gọi `queryClient.clear()` ở đây rồi mới `invalidateQueries`
  // (như logout() cục bộ làm) — đã tự tay verify bằng Playwright thấy tổ hợp
  // đó khiến `useQuery` đang mount của current-user không tự refetch được
  // nữa (clear() gỡ đăng ký query khỏi cache đúng lúc observer vẫn đang theo
  // dõi, invalidateQueries() gọi ngay sau đó không tìm thấy gì để invalidate
  // — UI kẹt ở trạng thái cũ dù token đã đổi thật). Gọi thẳng
  // `queryClient.invalidateQueries()` KHÔNG filter (invalidate toàn bộ query
  // đang có, kể cả current-user) giải quyết đúng cả 2 việc cùng lúc: buộc
  // current-user refetch danh tính mới, và mọi màn hình khác đang mở (tin đã
  // lưu, tin của tôi, …) cũng tự làm mới theo tài khoản mới — mà không phá
  // observer đang mount như clear() làm.
  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.storageArea !== window.localStorage) return;
      if (event.key !== null && event.key !== BDS_TOKEN_STORAGE_KEY) return;
      if (event.newValue === event.oldValue) return;

      void queryClient.invalidateQueries();
    }

    window.addEventListener('storage', handleStorageChange);

    return () => window.removeEventListener('storage', handleStorageChange);
  }, [queryClient]);

  const value = useMemo<BdsAuthState>(() => {
    const current = user ?? null;

    return {
      user: current,
      loading: isLoading,
      login,
      register,
      logout,
      refresh,
      hasRole: (...roles) => !!current && roles.some((role) => current.roles.includes(role)),
      can: (permission) =>
        !!current && (current.roles.includes('admin') || current.permissions.includes(permission)),
    };
  }, [user, isLoading, login, register, logout, refresh]);

  return <BdsAuthContext.Provider value={value}>{children}</BdsAuthContext.Provider>;
}

export function useBdsAuth(): BdsAuthState {
  const ctx = useContext(BdsAuthContext);

  if (!ctx) {
    throw new Error('useBdsAuth phải được dùng bên trong <BdsAuthProvider>');
  }

  return ctx;
}
