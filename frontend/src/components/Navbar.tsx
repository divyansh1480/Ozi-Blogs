'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import ProfileDropdown from './ProfileDropdown';
import { authorInitial } from '@/lib/utils';
import Image from 'next/image';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { toggle } = useSidebar();
  const [profileOpen, setProfileOpen] = useState(false);
  const [show, setShow] = useState(true);
  const lastScrollY = useRef(0);

  const initial = authorInitial(user?.displayName, user?.username);
  const pathname = usePathname();
  const isAuth = pathname?.startsWith('/auth') || pathname?.startsWith('/admin');
  const isOnBlogs = pathname === '/blogs';

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        if (currentScrollY <= 0) setShow(true);
        else if (currentScrollY > lastScrollY.current) setShow(false);
        else setShow(true);
        lastScrollY.current = currentScrollY;
        ticking = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-transform duration-300
      ${show ? 'translate-y-0' : '-translate-y-full'}
      bg-white/80 backdrop-blur-md
      ${!isAuth && 'border-b border-gray-100'}`}
    >
      <div className="w-full px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">

        {/* ── LEFT ── */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggle}
            aria-label="Toggle navigation"
            className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-lg hover:bg-gray-100 transition shrink-0"
          >
            <span className="w-5 h-[2px] bg-gray-500 rounded block" />
            <span className="w-5 h-[2px] bg-gray-500 rounded block" />
            <span className="w-5 h-[2px] bg-gray-500 rounded block" />
          </button>

          <Link
            href="/blogs"
            className="flex flex-col items-end gap-2 text-lg sm:text-xl font-bold text-primary tracking-tight whitespace-nowrap"
          >
            <Image src="/uploads/ozilogo.png" alt="Ozi Blogs Logo" width={60} height={12} priority />
            <span className="leading-none">Blogs</span>
          </Link>
        </div>

        {/* ── RIGHT ── */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* All Blogs pill */}
          <Link
            href="/blogs"
            className={`hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition
              ${isOnBlogs
                ? 'bg-primary/10 text-primary-dark'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-6-4h3" />
            </svg>
            All Blogs
          </Link>

          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link
                  href="/blogs/new"
                  className="flex items-center gap-1.5 text-sm font-medium bg-primary-light hover:bg-primary-dark text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Write</span>
                  <span className="sm:hidden">✏️</span>
                </Link>
              )}

              <div className="relative">
                <button
                  onClick={() => setProfileOpen(v => !v)}
                  title="Profile menu"
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-light to-purple-500 text-white font-bold text-sm flex items-center justify-center hover:opacity-90 transition shrink-0"
                >
                  {initial}
                </button>
                {profileOpen && <ProfileDropdown onClose={() => setProfileOpen(false)} />}
              </div>
            </>
          ) : null}
        </div>

      </div>
    </nav>
  );
}
