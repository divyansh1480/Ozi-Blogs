'use client';

import Image from '@tiptap/extension-image';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';

type Dir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
type Align = 'left' | 'center' | 'right';

// top/left as percentage, cursor, direction
const HANDLES: { top: string; left: string; cursor: string; dir: Dir }[] = [
  { top: '0%',   left: '50%',  cursor: 'ns-resize',  dir: 'n'  },
  { top: '100%', left: '50%',  cursor: 'ns-resize',  dir: 's'  },
  { top: '50%',  left: '0%',   cursor: 'ew-resize',  dir: 'w'  },
  { top: '50%',  left: '100%', cursor: 'ew-resize',  dir: 'e'  },
  { top: '0%',   left: '0%',   cursor: 'nw-resize',  dir: 'nw' },
  { top: '0%',   left: '100%', cursor: 'ne-resize',  dir: 'ne' },
  { top: '100%', left: '0%',   cursor: 'sw-resize',  dir: 'sw' },
  { top: '100%', left: '100%', cursor: 'se-resize',  dir: 'se' },
];

function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, title, width, height, align } = node.attrs as {
    src: string; alt?: string; title?: string;
    width?: number | null; height?: number | null; align?: Align;
  };

  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ dir: Dir; x0: number; y0: number; w0: number; h0: number } | null>(null);
  const [resizing, setResizing] = useState(false);
  const [badge, setBadge] = useState<{ w: number; h: number } | null>(null);

  const startDrag = (dir: Dir) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = imgRef.current;
    if (!el) return;
    drag.current = { dir, x0: e.clientX, y0: e.clientY, w0: el.offsetWidth, h0: el.offsetHeight };
    setResizing(true);
  };

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x0;
      const dy = e.clientY - d.y0;
      const update: Record<string, number> = {};

      if (d.dir === 'e' || d.dir === 'ne' || d.dir === 'se')
        update.width = Math.round(Math.max(80, Math.min(d.w0 + dx, 1200)));
      else if (d.dir === 'w' || d.dir === 'nw' || d.dir === 'sw')
        update.width = Math.round(Math.max(80, Math.min(d.w0 - dx, 1200)));

      if (d.dir === 's' || d.dir === 'se' || d.dir === 'sw')
        update.height = Math.round(Math.max(40, d.h0 + dy));
      else if (d.dir === 'n' || d.dir === 'ne' || d.dir === 'nw')
        update.height = Math.round(Math.max(40, d.h0 - dy));

      updateAttributes(update);
      setBadge({ w: update.width ?? width ?? d.w0, h: update.height ?? height ?? d.h0 });
    };
    const onUp = () => { setResizing(false); setBadge(null); drag.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [resizing, updateAttributes, width, height]);

  const HANDLE_SIZE = 10;

  // Outer block controls alignment via text-align; inner inline-block wraps the image tightly
  const outerStyle: React.CSSProperties = {
    display: 'block',
    textAlign: align === 'center' ? 'center' : align === 'right' ? 'right' : 'left',
    lineHeight: 0,
    margin: '12px 0',
  };

  return (
    <NodeViewWrapper as="div" style={outerStyle} data-drag-handle>
      <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0, fontSize: 0 }}>

        {/* Alignment toolbar — floats above the image */}
        {selected && (
          <div style={{
            position: 'absolute',
            top: -36,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1f2937',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            padding: '3px 4px',
            gap: 2,
            zIndex: 40,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
          }}>
            {(['left', 'center', 'right'] as Align[]).map((a) => (
              <button
                key={a}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); updateAttributes({ align: a }); }}
                title={`Align ${a}`}
                style={{
                  background: align === a ? '#C04878' : 'transparent',
                  border: 'none',
                  borderRadius: 4,
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '2px 7px',
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                {a === 'left' ? '⬛▪▪' : a === 'center' ? '▪⬛▪' : '▪▪⬛'}
              </button>
            ))}
            <div style={{ width: 1, height: 16, background: '#4b5563', margin: '0 3px' }} />
            <span style={{ color: '#9ca3af', fontSize: 11, padding: '0 4px' }}>
              {width ? `${width}px` : 'auto'}{height ? ` × ${height}px` : ''}
            </span>
          </div>
        )}

        {/* Image */}
        <img
          ref={imgRef}
          src={src}
          alt={alt || ''}
          title={title || ''}
          draggable={false}
style={{
            display: 'block',
            width: width ? `${width}px` : 'auto',
            height: height ? `${height}px` : 'auto',
            objectFit: 'fill',
            userSelect: 'none',
            maxWidth: '100%',
            borderRadius: 8,
            cursor: resizing ? undefined : 'move',
          }}
        />


        {/* Selection border — sits exactly on the image */}
        {selected && (
          <div style={{
            position: 'absolute',
            inset: 0,
            border: '2px solid #C04878',
            borderRadius: 8,
            pointerEvents: 'none',
            zIndex: 10,
          }} />
        )}

        {/* 8 resize handles — centered on the image border */}
        {selected && HANDLES.map(({ top, left, cursor, dir }) => (
          <div
            key={dir}
            onMouseDown={startDrag(dir)}
            style={{
              position: 'absolute',
              top, left,
              transform: 'translate(-50%, -50%)',
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              background: '#ffffff',
              border: '2px solid #C04878',
              borderRadius: 2,
              cursor,
              zIndex: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            }}
          />
        ))}

        {/* Live W×H badge while dragging */}
        {badge && (
          <div style={{
            position: 'absolute', bottom: 6, right: 6,
            background: 'rgba(0,0,0,0.65)', color: '#fff',
            fontSize: 11, padding: '2px 6px', borderRadius: 4,
            pointerEvents: 'none', userSelect: 'none', zIndex: 30,
          }}>
            {badge.w} × {badge.h}
          </div>
        )}

      </div>
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => { const w = el.style.width || el.getAttribute('width'); return w ? parseInt(w) : null; },
        renderHTML: (attrs) => attrs.width ? { style: `width:${attrs.width}px` } : {},
      },
      height: {
        default: null,
        parseHTML: (el) => { const h = el.style.height || el.getAttribute('height'); return h ? parseInt(h) : null; },
        renderHTML: (attrs) => attrs.height ? { style: `height:${attrs.height}px` } : {},
      },
      align: {
        default: 'center',
        parseHTML: (el) => (el.getAttribute('data-align') as Align) || 'left',
        renderHTML: (attrs) => attrs.align ? { 'data-align': attrs.align } : {},
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
