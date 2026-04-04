'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';

const NAV_SECTIONS = [
  { heading: 'Explore', items: [
    // { label: 'Home', href: '/', icon: '🏠' },  // re-enable when home page is restored
    { label: 'All Blogs',  href: '/blogs',     icon: '📰' },
  ]},
  { heading: 'My Space', authOnly: true, items: [
    { label: 'Dashboard',  href: '/dashboard', icon: '⚡' },
    { label: 'Write Blog', href: '/blogs/new', icon: '✏️' },
  ]},
];

export default function AppSidebar() {
  const { open, close } = useSidebar();
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop — only visible on small screens when open */}
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
          {NAV_SECTIONS
            .filter(s => !s.authOnly || isAuthenticated)
            .map((section) => (
              <div key={section.heading} className="mb-5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-1.5">
                  {section.heading}
                </p>
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition mb-0.5 ${
                        active
                          ? 'bg-primary/10 text-primary-dark'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                      }`}
                    >
                      <span className="text-base w-5 text-center">{item.icon}</span>
                      {item.label}
                      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-light" />}
                    </Link>
                  );
                })}
              </div>
            ))
          }
        </div>
      </aside>
    </>
  );
}