'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Heading {
  level: number;
  text: string;
  id: string;
}

export default function CollapsibleTOC({ headings }: { headings: Heading[] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="sticky top-24">
      {/* Toggle button — 3-bar hamburger */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={open ? 'Collapse contents' : 'Expand contents'}
        className="mb-3 flex items-center gap-2 text-xs text-gray-400 hover:text-primary transition select-none"
      >
        {/* 3-stripe icon */}
        <span className="flex flex-col gap-[4px]">
          <span className="block w-4 h-[2px] bg-current rounded" />
          <span className={`block h-[2px] bg-current rounded transition-all ${open ? 'w-4' : 'w-2.5'}`} />
          <span className="block w-4 h-[2px] bg-current rounded" />
        </span>
        <span className="font-medium">{open ? 'Hide contents' : 'Contents'}</span>
      </button>

      {/* TOC panel */}
      {open && headings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">On this page</p>
          <nav className="space-y-1">
            {headings.map((h, i) => (
              <a
                key={i}
                href={`#${h.id}`}
                className={`block text-sm text-gray-500 hover:text-primary transition leading-snug truncate ${
                  h.level === 1 ? 'font-medium' : h.level === 2 ? 'pl-3' : 'pl-6 text-xs'
                }`}
              >
                {h.text}
              </a>
            ))}
          </nav>
        </div>
      )}

      {/* Back link always visible */}
      <Link
        href="/blogs"
        className="mt-4 flex items-center gap-1 text-sm text-gray-400 hover:text-primary transition"
      >
        ← All blogs
      </Link>
    </div>
  );
}
