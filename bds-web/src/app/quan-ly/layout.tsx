import Link from 'next/link';
import { BdsAuthGuard } from '@/components/bds-dashboard/BdsAuthGuard';

const BDS_DASHBOARD_NAV = [
  { href: '/quan-ly', label: 'Tổng quan' },
  { href: '/quan-ly/tin-dang', label: 'Tin đăng của tôi' },
  { href: '/quan-ly/tin-dang/tao', label: 'Đăng tin mới' },
  { href: '/quan-ly/yeu-thich', label: 'Tin đã lưu' },
  { href: '/quan-ly/ho-so', label: 'Hồ sơ cá nhân' },
];

export default function BdsDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <BdsAuthGuard>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <nav className="h-fit rounded-lg border border-gray-200 bg-white p-2">
          {BDS_DASHBOARD_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div>{children}</div>
      </div>
    </BdsAuthGuard>
  );
}
