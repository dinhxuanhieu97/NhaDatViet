import Link from 'next/link';
import { BdsAuthGuard } from '@/components/bds-dashboard/BdsAuthGuard';

const BDS_ADMIN_NAV = [
  { href: '/quan-tri', label: 'Bảng điều khiển' },
  { href: '/quan-tri/duyet-tin', label: 'Duyệt tin đăng' },
  { href: '/quan-tri/nguoi-dung', label: 'Quản lý người dùng' },
];

export default function BdsAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <BdsAuthGuard roles={['admin', 'moderator']}>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <nav className="h-fit rounded-lg border border-gray-200 bg-white p-2">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Quản trị
          </p>
          {BDS_ADMIN_NAV.map((item) => (
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
