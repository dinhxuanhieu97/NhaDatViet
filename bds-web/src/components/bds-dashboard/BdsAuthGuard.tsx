'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useBdsAuth } from '@/lib/bds-auth-context';
import type { BdsUserRole } from '@/types/bds';

interface BdsAuthGuardProps {
  children: React.ReactNode;
  /** Nếu truyền, người dùng phải có ít nhất một trong các vai trò này. */
  roles?: BdsUserRole[];
}

/** Chặn truy cập trang cần đăng nhập / cần vai trò cụ thể ở phía client. */
export function BdsAuthGuard({ children, roles }: BdsAuthGuardProps) {
  const { user, loading, hasRole } = useBdsAuth();
  const router = useRouter();

  const allowed = !!user && (!roles || hasRole(...roles));

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/dang-nhap');

      return;
    }

    if (roles && !hasRole(...roles)) {
      router.replace('/quan-ly');
    }
  }, [loading, user, roles, hasRole, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 h-64 animate-pulse rounded-lg bg-gray-100" />
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
