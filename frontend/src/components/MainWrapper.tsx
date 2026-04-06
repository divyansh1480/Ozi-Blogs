'use client';

import { useSidebar } from '@/context/SidebarContext';

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const { open } = useSidebar();
  return (
    <div className={`pt-16 transition-all duration-300 ease-in-out ${open ? 'md:ml-60' : 'ml-0'}`}>
      {children}
    </div>
  );
}