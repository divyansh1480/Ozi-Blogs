'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Props {
  html: string;
  className?: string;
}

const ANIM_MS = 350;

export default function ZoomableContent({ html, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomed, setZoomed] = useState<{ src: string; alt: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const closeRef = useRef<() => void>(() => {});

  const setCursorOverride = (cursor: 'zoom-out' | null) => {
    const id = 'zoomable-cursor-override';
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!cursor) { el?.remove(); return; }
    if (!el) {
      el = document.createElement('style');
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = `* { cursor: ${cursor} !important; }`;
  };

  const close = useCallback(() => {
    setVisible(false);
    setCursorOverride(null);
    setTimeout(() => setZoomed(null), ANIM_MS);
  }, []);

  // Keep ref up-to-date so scroll handler always calls latest close
  useEffect(() => { closeRef.current = close; }, [close]);

  const open = (src: string, alt: string) => {
    setZoomed({ src, alt });
    setCursorOverride('zoom-out');
    requestAnimationFrame(() => setVisible(true));
  };

  // Close on scroll while lightbox is open
  useEffect(() => {
    if (!zoomed) return;
    let timer: ReturnType<typeof setTimeout>;
    timer = setTimeout(() => {
      const handler = () => closeRef.current();
      window.addEventListener('wheel', handler, { passive: true, once: true });
      window.addEventListener('touchmove', handler, { passive: true, once: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [zoomed]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      open(img.src, img.alt || '');
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`${className ?? ''} [&_img]:cursor-zoom-in`}
        onClick={handleContainerClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {zoomed && (
        <div
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            backdropFilter: 'blur(6px) brightness(0.4)',
            WebkitBackdropFilter: 'blur(6px) brightness(0.4)',
            opacity: visible ? 1 : 0,
            transition: `opacity ${ANIM_MS}ms ease`,
            pointerEvents: visible ? 'auto' : 'none',
          }}
        >
          <img
            src={zoomed.src}
            alt={zoomed.alt}
            onClick={close}
            style={{
              maxWidth: '92vw',
              maxHeight: '92vh',
              objectFit: 'contain',
              borderRadius: 10,
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              cursor: 'zoom-out',
              userSelect: 'none',
              transform: visible ? 'scale(1)' : 'scale(0.88)',
              transition: `transform ${ANIM_MS}ms ease, opacity ${ANIM_MS}ms ease`,
              opacity: visible ? 1 : 0,
            }}
          />
        </div>
      )}
    </>
  );
}
