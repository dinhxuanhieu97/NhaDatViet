import Link from 'next/link';

const COLUMNS = [
  {
    title: 'Nhà đất bán',
    links: [
      { href: '/nha-dat-ban?type=apartment', label: 'Bán căn hộ chung cư' },
      { href: '/nha-dat-ban?type=house', label: 'Bán nhà riêng' },
      { href: '/nha-dat-ban?type=land', label: 'Bán đất' },
      { href: '/du-an', label: 'Dự án đang mở bán' },
    ],
  },
  {
    title: 'Nhà đất cho thuê',
    links: [
      { href: '/nha-dat-cho-thue?type=apartment', label: 'Cho thuê căn hộ' },
      { href: '/nha-dat-cho-thue?type=house', label: 'Cho thuê nhà riêng' },
      { href: '/nha-dat-cho-thue?type=land', label: 'Cho thuê đất' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { href: '/huong-dan-dang-tin', label: 'Hướng dẫn đăng tin' },
      { href: '/dang-ky', label: 'Đăng ký tài khoản môi giới' },
      { href: '/lien-he', label: 'Liên hệ' },
    ],
  },
];

export function BdsFooter() {
  return (
    <footer className="mt-12 border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 font-bold text-white">
              N
            </span>
            <span className="text-lg font-bold text-gray-900">Nhà Đất Việt</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Cổng thông tin mua bán, cho thuê bất động sản. Tin đăng được kiểm duyệt trước khi hiển thị.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-gray-900">{col.title}</h3>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-600 hover:text-brand-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 py-4">
        <p className="mx-auto max-w-7xl px-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Nhà Đất Việt. Dự án mẫu phục vụ mục đích học tập và phát triển.
        </p>
      </div>
    </footer>
  );
}
