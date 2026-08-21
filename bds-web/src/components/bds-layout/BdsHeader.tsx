'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useBdsAuth } from '@/lib/bds-auth-context';

const NAV = [
  { href: '/nha-dat-ban', label: 'Nhà đất bán' },
  { href: '/nha-dat-cho-thue', label: 'Nhà đất cho thuê' },
  { href: '/du-an', label: 'Dự án' },
  { href: '/tim-kiem-ban-do', label: 'Tìm theo bản đồ' },
];

export function BdsHeader() {
  const { user, logout, hasRole } = useBdsAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 font-bold text-white">
            N
          </span>
          <span className="hidden text-lg font-bold text-gray-900 sm:block">Nhà Đất Việt</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                pathname.startsWith(item.href)
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenu((v) => !v)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-[10rem] truncate sm:block">{user.name}</span>
              </button>

              {userMenu && (
                <div
                  className="absolute right-0 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                  onMouseLeave={() => setUserMenu(false)}
                >
                  <MenuLink href="/quan-ly">Tổng quan</MenuLink>
                  <MenuLink href="/quan-ly/tin-dang">Tin đăng của tôi</MenuLink>
                  <MenuLink href="/quan-ly/yeu-thich">Tin đã lưu</MenuLink>
                  <MenuLink href="/quan-ly/ho-so">Hồ sơ cá nhân</MenuLink>

                  {hasRole('admin', 'moderator') && (
                    <>
                      <div className="my-1 border-t border-gray-100" />
                      <MenuLink href="/quan-tri">Trang quản trị</MenuLink>
                    </>
                  )}

                  <div className="my-1 border-t border-gray-100" />
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/dang-nhap"
                className="hidden rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:block"
              >
                Đăng nhập
              </Link>
              <Link
                href="/dang-ky"
                className="hidden rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:block"
              >
                Đăng ký
              </Link>
            </>
          )}

          <Link
            href="/quan-ly/tin-dang/tao"
            className="rounded-md bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Đăng tin
          </Link>

          <button
            type="button"
            aria-label="Mở menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-gray-200 bg-white px-4 py-2 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {item.label}
            </Link>
          ))}
          {!user && (
            <Link
              href="/dang-nhap"
              onClick={() => setMenuOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Đăng nhập
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
      {children}
    </Link>
  );
}
