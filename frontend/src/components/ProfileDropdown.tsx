'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authorInitial } from '@/lib/utils';

interface ProfileDropdownProps {
  onClose: () => void;
}

export default function ProfileDropdown({ onClose }: ProfileDropdownProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const initial = authorInitial(user?.displayName, user?.username);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleLogout = async () => {
    onClose();
    await logout();
    router.push('/');
  };

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-[70] overflow-hidden"
    >
      {/* Profile header */}
      <div className="bg-gradient-to-br from-pink-400 to-purple-500 px-5 py-5 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center text-white font-bold text-xl shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold truncate">{user?.displayName || user?.username}</p>
          <p className="text-white/70 text-xs truncate">@{user?.username}</p>
        </div>
      </div>

      {/* Links */}
      <div className="py-2 px-2">
        <Link
          href={`/users/${user?.username}`}
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-pink-50 hover:text-pink-500 transition font-medium"
        >
          <span>👤</span> View Profile
        </Link>
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-pink-50 hover:text-pink-500 transition font-medium"
        >
          <span>⚡</span> Dashboard
        </Link>
        <Link
          href="/blogs/new"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-pink-50 hover:text-pink-500 transition font-medium"
        >
          <span>✏️</span> Write Blog
        </Link>
      </div>

      <div className="border-t border-gray-100 py-2 px-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition font-medium"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </div>
  );
}
