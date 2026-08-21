'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { BdsApiError } from '@/lib/bds-api-client';
import { useBdsAuth } from '@/lib/bds-auth-context';
import { loginSchema, type LoginInput } from '@/lib/bds-schemas';
import { BdsPasswordInput } from './BdsPasswordInput';
import { BdsSocialLoginButtons } from './BdsSocialLoginButtons';

export function BdsLoginForm() {
  const router = useRouter();
  const { login } = useBdsAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: true },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);

    try {
      await login(values.email, values.password, values.remember);
      router.push('/quan-ly');
    } catch (error) {
      setServerError(
        error instanceof BdsApiError
          ? (error.fieldError('email') ?? error.message)
          : 'Không đăng nhập được. Vui lòng thử lại.',
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
    >
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          Email hoặc số điện thoại
        </span>
        <input
          {...register('email')}
          autoComplete="username"
          className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          placeholder="email@example.com"
        />
        {errors.email && <span className="mt-1 block text-xs text-red-600">{errors.email.message}</span>}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</span>
        <BdsPasswordInput
          {...register('password')}
          autoComplete="current-password"
          className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          placeholder="••••••••"
        />
        {errors.password && (
          <span className="mt-1 block text-xs text-red-600">{errors.password.message}</span>
        )}
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          {...register('remember')}
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        Ghi nhớ đăng nhập
      </label>

      {serverError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
      >
        {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </button>

      <BdsSocialLoginButtons />

      <div className="flex justify-between text-sm">
        <Link href="/quen-mat-khau" className="text-gray-600 hover:text-brand-600">
          Quên mật khẩu?
        </Link>
        <Link href="/dang-ky" className="font-medium text-brand-600 hover:underline">
          Tạo tài khoản mới
        </Link>
      </div>
    </form>
  );
}
