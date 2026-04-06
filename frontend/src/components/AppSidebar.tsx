'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';

export default function AppSidebar() {
  const { open, close } = useSidebar();
  const { isAuthenticated, isAdmin } = useAuth();
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-100 shadow-sm flex flex-col transition-all duration-300 ease-in-out overflow-hidden z-40 ${
          open ? 'w-60' : 'w-0'
        }`}
      >
        <div className="w-60 flex flex-col h-full py-4 px-3">

          {/* Explore */}
          <div className="mb-5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-1.5">
              Explore
            </p>
            <Link
              href="/blogs"
              onClick={close}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition mb-0.5 ${
                isActive('/blogs')
                  ? 'bg-primary/10 text-primary-dark'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
              }`}
            >
              <span className="text-base w-5 text-center">📰</span>
              All Blogs
              {isActive('/blogs') && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-light" />}
            </Link>
          </div>

          {/* Admin section — only shown when logged in as admin */}
          {isAuthenticated && isAdmin && (
            <div className="mb-5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-1.5">
                Admin
              </p>
              {[
                { label: 'Dashboard', href: '/dashboard', icon: '⚡' },
                { label: 'Write Blog', href: '/blogs/new', icon: '✏️' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition mb-0.5 ${
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary-dark'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                  }`}
                >
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  {item.label}
                  {isActive(item.href) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-light" />}
                </Link>
              ))}
            </div>
          )}

          {/* Spacer pushes admin login to bottom */}
          <div className="flex-1" />

          {/* Admin login — only shown when NOT logged in */}
          {!isAuthenticated && (
            <div className="pb-2 px-1">
              <Link
                href="/admin/login"
                onClick={close}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Admin Login
              </Link>
            </div>
          )}

        </div>
      </aside>
    </>
  );
}
