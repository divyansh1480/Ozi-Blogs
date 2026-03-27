'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import ProfileDropdown from './ProfileDropdown';
import { authorInitial } from '@/lib/utils';

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { toggle } = useSidebar();
  const [profileOpen, setProfileOpen] = useState(false);
  const initial = authorInitial(user?.displayName, user?.username);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="w-full px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">

        {/* ── FAR LEFT — hamburger + brand ── */}
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
          <Link href="/" className="text-lg sm:text-xl font-bold text-pink-500 tracking-tight whitespace-nowrap">
            Ozi BLogs
          </Link>
        </div>

        {/* ── FAR RIGHT — nav links + profile ── */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/blogs" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-pink-500 transition">
            Blogs
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                href="/blogs/new"
                className="text-sm font-medium bg-pink-400 hover:bg-pink-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition whitespace-nowrap"
              >
                <span className="hidden sm:inline">Write</span>
                <span className="sm:hidden">✏️</span>
              </Link>

              <div className="relative">
                <button
                  onClick={() => setProfileOpen(v => !v)}
                  title="Profile menu"
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-white font-bold text-sm flex items-center justify-center hover:opacity-90 transition shrink-0"
                >
                  {initial}
                </button>
                {profileOpen && <ProfileDropdown onClose={() => setProfileOpen(false)} />}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-pink-500 transition whitespace-nowrap">
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="text-sm font-medium bg-pink-400 hover:bg-pink-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition whitespace-nowrap"
              >
                <span className="hidden sm:inline">Sign Up</span>
                <span className="sm:hidden">Join</span>
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
