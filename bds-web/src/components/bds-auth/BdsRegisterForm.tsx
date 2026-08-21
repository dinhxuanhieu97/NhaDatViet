'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { BdsHoneypotField } from '@/components/bds-shared/BdsHoneypotField';
import { BdsApiError } from '@/lib/bds-api-client';
import { useBdsAntiSpam } from '@/lib/bds-anti-spam';
import { useBdsAuth } from '@/lib/bds-auth-context';
import { registerSchema, type RegisterInput } from '@/lib/bds-schemas';
import { BdsPasswordInput } from './BdsPasswordInput';
import { BdsSocialLoginButtons } from './BdsSocialLoginButtons';

export function BdsRegisterForm() {
  const router = useRouter();
  const { register: registerAccount } = useBdsAuth();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { remember: true },
  });

  const { bdsAntiSpamFields } = useBdsAntiSpam();
  const honeypotRef = useRef<HTMLInputElement>(null);

  async function onSubmit(values: RegisterInput) {
    setServerErrors({});
    setGeneralError(null);

    // `remember` chỉ là lựa chọn nơi lưu token phía client (xem setBdsToken),
    // không phải trường của backend — tách ra để không gửi thừa lên API.
    const { remember, ...payload } = values;

    try {
      await registerAccount(
        { ...payload, ...bdsAntiSpamFields(honeypotRef.current?.value ?? '') },
        remember,
      );
      router.push('/quan-ly');
    } catch (error) {
      if (error instanceof BdsApiError && error.errors) {
        setServerErrors(
          Object.fromEntries(Object.entries(error.errors).map(([k, v]) => [k, v[0]])),
        );
      } else {
        setGeneralError('Không tạo được tài khoản. Vui lòng thử lại.');
      }
    }
  }

  const fieldError = (name: keyof RegisterInput) =>
    errors[name]?.message ?? serverErrors[name];

  return (
    <form
      // Bọc trong arrow function để `handleSubmit(onSubmit)` — và việc đọc
      // `honeypotRef.current` bên trong `onSubmit` — chỉ chạy lúc submit
      // thật sự, không phải lúc render (đọc ref lúc render vi phạm quy tắc
      // thuần khiết của React).
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event);
      }}
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
    >
      <BdsHoneypotField ref={honeypotRef} />

      <BdsTextField label="Họ và tên" error={fieldError('name')}>
        <input {...register('name')} className={bdsInputClass} placeholder="Nguyễn Văn A" />
      </BdsTextField>

      <BdsTextField label="Email" error={fieldError('email')}>
        <input
          {...register('email')}
          type="email"
          autoComplete="email"
          className={bdsInputClass}
          placeholder="email@example.com"
        />
      </BdsTextField>

      <BdsTextField label="Số điện thoại" error={fieldError('phone')}>
        <input {...register('phone')} className={bdsInputClass} placeholder="0912345678" />
      </BdsTextField>

      <BdsTextField
        label="Công ty / Sàn môi giới (không bắt buộc)"
        error={fieldError('company')}
      >
        <input {...register('company')} className={bdsInputClass} placeholder="Công ty BĐS ABC" />
      </BdsTextField>

      <BdsTextField label="Mật khẩu" error={fieldError('password')}>
        <BdsPasswordInput
          {...register('password')}
          autoComplete="new-password"
          className={bdsInputClass}
          placeholder="Tối thiểu 8 ký tự, có chữ và số"
        />
      </BdsTextField>

      <BdsTextField label="Nhập lại mật khẩu" error={fieldError('password_confirmation')}>
        <BdsPasswordInput
          {...register('password_confirmation')}
          autoComplete="new-password"
          className={bdsInputClass}
        />
      </BdsTextField>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          {...register('remember')}
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        Ghi nhớ đăng nhập
      </label>

      {generalError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{generalError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
      >
        {isSubmitting ? 'Đang tạo tài khoản…' : 'Đăng ký'}
      </button>

      <BdsSocialLoginButtons />

      <p className="text-center text-sm text-gray-600">
        Đã có tài khoản?{' '}
        <Link href="/dang-nhap" className="font-medium text-brand-600 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}

const bdsInputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500';

function BdsTextField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
