'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { BdsApiError, bdsApi } from '@/lib/bds-api-client';
import { useBdsAuth } from '@/lib/bds-auth-context';
import { formatDate } from '@/lib/bds-format';
import type { BdsPaginated, BdsUser, BdsUserRole } from '@/types/bds';

const BDS_ASSIGNABLE_ROLES: BdsUserRole[] = ['member', 'agent', 'moderator', 'admin'];

export default function BdsUserManagementPage() {
  const queryClient = useQueryClient();
  const { hasRole } = useBdsAuth();
  const [keyword, setKeyword] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const canManage = hasRole('admin');

  const { data, isLoading } = useQuery({
    queryKey: ['bds', 'admin-users', keyword],
    queryFn: () =>
      bdsApi.get<BdsPaginated<BdsUser>>('/admin/users', {
        query: { q: keyword || undefined, per_page: 20 },
      }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['bds', 'admin-users'] });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: BdsUserRole }) =>
      bdsApi.post(`/admin/users/${id}/roles`, { roles: [role] }),
    onSuccess: () => {
      setActionError(null);
      void invalidate();
    },
    onError: (error) =>
      setActionError(error instanceof BdsApiError ? error.message : 'Không đổi được vai trò.'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      bdsApi.put(`/admin/users/${id}`, { status }),
    onSuccess: () => {
      setActionError(null);
      void invalidate();
    },
    onError: (error) =>
      setActionError(error instanceof BdsApiError ? error.message : 'Không đổi được trạng thái.'),
  });

  const users = data?.data ?? [];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Quản lý người dùng</h1>

      {!canManage && (
        <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          Bạn đang xem ở chế độ chỉ đọc. Chỉ quản trị viên mới đổi được vai trò và trạng thái tài khoản.
        </p>
      )}

      <input
        type="search"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Tìm theo tên, email hoặc số điện thoại…"
        className="mt-4 w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
      />

      {actionError && (
        <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{actionError}</p>
      )}

      {isLoading && <p className="mt-6 text-sm text-gray-500">Đang tải…</p>}

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-2.5">Người dùng</th>
              <th className="px-4 py-2.5">Liên hệ</th>
              <th className="px-4 py-2.5">Vai trò</th>
              <th className="px-4 py-2.5">Trạng thái</th>
              <th className="px-4 py-2.5">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  {user.company && <p className="text-xs text-gray-500">{user.company}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-700">{user.email}</p>
                  <p className="text-xs text-gray-500">{user.phone ?? '—'}</p>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.roles[0] ?? 'member'}
                    disabled={!canManage || roleMutation.isPending}
                    onChange={(e) =>
                      roleMutation.mutate({ id: user.id, role: e.target.value as BdsUserRole })
                    }
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50"
                  >
                    {BDS_ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.status}
                    disabled={!canManage || statusMutation.isPending}
                    onChange={(e) => statusMutation.mutate({ id: user.id, status: e.target.value })}
                    className={`rounded-md border px-2 py-1.5 text-sm disabled:bg-gray-50 ${
                      user.status === 'suspended'
                        ? 'border-red-300 text-red-700'
                        : 'border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="suspended">Tạm khóa</option>
                    <option value="pending">Chờ xác thực</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDate(user.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
