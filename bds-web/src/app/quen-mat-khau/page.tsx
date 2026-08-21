'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BdsApiError, bdsApi } from '@/lib/bds-api-client';

export default function BdsForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMessage(null);

    try {
      const res = await bdsApi.post<{ message: string }>('/auth/forgot-password', { email });
      setMessage(res.message);
    } catch (error) {
      setMessage(
        error instanceof BdsApiError ? error.message : 'Không gửi được email. Vui lòng thử lại.',
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Quên mật khẩu</h1>
      <p className="mb-6 text-sm text-gray-600">
        Nhập email đã đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
      </p>

      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            placeholder="email@example.com"
          />
        </label>

        {message && <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">{message}</p>}

        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {sending ? 'Đang gửi…' : 'Gửi hướng dẫn'}
        </button>

        <p className="text-center text-sm">
          <Link href="/dang-nhap" className="text-brand-600 hover:underline">
            Quay lại đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}
