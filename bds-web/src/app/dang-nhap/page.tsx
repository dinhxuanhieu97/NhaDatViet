import type { Metadata } from 'next';
import { BdsLoginForm } from '@/components/bds-auth/BdsLoginForm';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  description: 'Đăng nhập tài khoản Nhà Đất Việt để quản lý tin đăng và tin đã lưu.',
  robots: { index: false, follow: false },
};

export default function BdsLoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Đăng nhập</h1>
      <p className="mb-6 text-sm text-gray-600">
        Đăng nhập để đăng tin, quản lý tin đăng và lưu bất động sản yêu thích.
      </p>
      <BdsLoginForm />
    </div>
  );
}
