import type { Metadata } from 'next';
import { BdsRegisterForm } from '@/components/bds-auth/BdsRegisterForm';

export const metadata: Metadata = {
  title: 'Đăng ký tài khoản',
  description:
    'Tạo tài khoản Nhà Đất Việt để đăng tin bán, cho thuê bất động sản miễn phí.',
  robots: { index: false, follow: false },
};

export default function BdsRegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Đăng ký tài khoản</h1>
      <p className="mb-6 text-sm text-gray-600">
        Tài khoản mới được cấp vai trò <strong>Thành viên</strong> với hạn mức 5 tin đang hiển thị.
        Liên hệ quản trị viên để nâng cấp lên tài khoản <strong>Môi giới</strong>.
      </p>
      <BdsRegisterForm />
    </div>
  );
}
