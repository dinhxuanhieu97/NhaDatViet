'use client';

import { forwardRef, useId, useState } from 'react';
import type { InputHTMLAttributes } from 'react';

type BdsPasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

/**
 * Input mật khẩu dùng chung cho mọi form (đăng nhập, đăng ký, đổi mật khẩu) —
 * có nút ẩn/hiện mật khẩu. Dùng forwardRef để tương thích với
 * `{...register('password')}` của react-hook-form (cần ref trỏ vào input thật).
 */
export const BdsPasswordInput = forwardRef<HTMLInputElement, BdsPasswordInputProps>(
  function BdsPasswordInput({ className = '', ...props }, ref) {
    const [visible, setVisible] = useState(false);
    const describedById = useId();

    return (
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={`${className} pr-10`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          // Bấm nút này không được submit form hay giành focus khỏi input lúc gõ tiếp.
          tabIndex={-1}
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          aria-pressed={visible}
          aria-describedby={describedById}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
        >
          {visible ? <BdsEyeOffIcon /> : <BdsEyeIcon />}
        </button>
        <span id={describedById} className="sr-only">
          {visible ? 'Mật khẩu đang hiển thị dạng chữ' : 'Mật khẩu đang được ẩn'}
        </span>
      </div>
    );
  },
);

function BdsEyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4.5 w-4.5"
      aria-hidden="true"
    >
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function BdsEyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4.5 w-4.5"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c7 0 10.5 7 10.5 7a13.5 13.5 0 0 1-3.1 3.9M6.6 6.6C3.4 8.6 1.5 12 1.5 12s3.5 7 10.5 7a10.4 10.4 0 0 0 5.4-1.5" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}
