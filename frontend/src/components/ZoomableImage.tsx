'use client';

import { useState } from 'react';

interface Props {
  src: string;
  alt?: string;
  className?: string;
}

export default function ZoomableImage({ src, alt = '', className }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={() => setOpen(true)}
        className={className}
        style={{ cursor: 'zoom-in' }}
      />

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <button
            onClick={() => setOpen(false)}
            style={{
              position: 'absolute', top: 20, right: 24,
              color: '#fff', background: 'rgba(255,255,255,0.15)',
              border: 'none', borderRadius: 8,
              fontSize: 22, width: 40, height: 40,
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
          <img
            src={src}
            alt={alt}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: 8,
              cursor: 'zoom-out',
              userSelect: 'none',
            }}
          />
        </div>
      )}
    </>
  );
}
