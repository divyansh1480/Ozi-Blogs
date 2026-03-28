'use client';

import { NodeViewWrapper } from '@tiptap/react';
import { useState, useRef, useEffect, useCallback } from 'react';

type ImgSelection = {
  el: HTMLImageElement;
  top: number;
  left: number;
  width: number;
  height: number;
};

const ALL_HANDLES = [
  { pos: 'nw', style: { top: '-5px',   left: '-5px'  }, cursor: 'nw-resize' },
  { pos: 'ne', style: { top: '-5px',   right: '-5px' }, cursor: 'ne-resize' },
  { pos: 'sw', style: { bottom: '-5px',left: '-5px'  }, cursor: 'sw-resize' },
  { pos: 'se', style: { bottom: '-5px',right: '-5px' }, cursor: 'se-resize' },
  { pos: 'n',  style: { top: '-5px',   left: '50%', transform: 'translateX(-50%)' }, cursor: 'n-resize'  },
  { pos: 's',  style: { bottom: '-5px',left: '50%', transform: 'translateX(-50%)' }, cursor: 's-resize'  },
  { pos: 'w',  style: { top: '50%',    left: '-5px', transform: 'translateY(-50%)' }, cursor: 'w-resize'  },
  { pos: 'e',  style: { top: '50%',    right: '-5px', transform: 'translateY(-50%)' }, cursor: 'e-resize'  },
];

export function HtmlBlockView({
  node, updateAttributes, selected,
}: { node: any; updateAttributes: any; selected: boolean }) {
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImg, setSelectedImg] = useState<ImgSelection | null>(null);
  const editRef    = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef    = useRef<{ pos: string; x0: number; y0: number; w0: number; h0: number } | null>(null);
  const [badge, setBadge] = useState<{ w: number; h: number } | null>(null);

  const refreshSelection = useCallback(() => {
    if (!selectedImg || !containerRef.current) return;
    const cr = containerRef.current.getBoundingClientRect();
    const ir = selectedImg.el.getBoundingClientRect();
    setSelectedImg(s => s ? { ...s, top: ir.top - cr.top, left: ir.left - cr.left, width: ir.width, height: ir.height } : null);
  }, [selectedImg]);

  // Wire image interactions when entering edit mode
  useEffect(() => {
    if (!editing || !editRef.current) return;
    editRef.current.innerHTML = node.attrs.html;

    editRef.current.querySelectorAll('img').forEach((img) => {
      // Ensure block display so scale is centered
      img.style.display = 'block';
      img.style.cursor = 'pointer';
      img.setAttribute('data-section-img', 'true');
      img.ondragstart = (e) => e.preventDefault();
      img.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!containerRef.current) return;
        const cr = containerRef.current.getBoundingClientRect();
        const ir = img.getBoundingClientRect();
        setSelectedImg({ el: img, top: ir.top - cr.top, left: ir.left - cr.left, width: ir.width, height: ir.height });
      };
    });

    const deselect = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-section-img]')) setSelectedImg(null);
    };
    editRef.current.addEventListener('click', deselect);
    return () => editRef.current?.removeEventListener('click', deselect);
  }, [editing]);

  // Resize drag
  const startDrag = (pos: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedImg) return;
    dragRef.current = { pos, x0: e.clientX, y0: e.clientY, w0: selectedImg.width, h0: selectedImg.height };
  };

  useEffect(() => {
    if (!selectedImg) return;
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.x0;
      const dy = e.clientY - d.y0;
      const p = d.pos;
      let newW = d.w0, newH = d.h0;
      if (p === 'e' || p === 'ne' || p === 'se') newW = Math.max(60, d.w0 + dx);
      else if (p === 'w' || p === 'nw' || p === 'sw') newW = Math.max(60, d.w0 - dx);
      if (p === 's' || p === 'se' || p === 'sw') newH = Math.max(40, d.h0 + dy);
      else if (p === 'n' || p === 'ne' || p === 'nw') newH = Math.max(40, d.h0 - dy);
      newW = Math.round(newW); newH = Math.round(newH);
      selectedImg.el.style.width = `${newW}px`;
      selectedImg.el.style.height = `${newH}px`;
      refreshSelection();
      setBadge({ w: newW, h: newH });
    };
    const onUp = () => { dragRef.current = null; setBadge(null); refreshSelection(); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [selectedImg, refreshSelection]);

  function handleImageUpload(img: HTMLImageElement) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) { img.src = data.url; img.removeAttribute('srcset'); setTimeout(refreshSelection, 50); }
        else alert('Upload failed — please try again.');
      } catch { alert('Upload failed — please try again.'); }
      finally { setUploading(false); }
    };
    input.click();
  }

  function saveEdits() {
    if (!editRef.current) { setEditing(false); return; }
    editRef.current.querySelectorAll('img').forEach((img) => {
      img.removeAttribute('data-section-img');
      img.style.cursor = '';
      img.onclick = null;
      img.ondragstart = null;
      // Preserve display:block so hover scale stays centered after save
      if (!img.style.display) img.style.display = 'block';
    });
    updateAttributes({ html: editRef.current.innerHTML });
    setSelectedImg(null);
    setEditing(false);
  }

  return (
    <NodeViewWrapper data-drag-handle>
      <div
        className={`relative group my-3 rounded-xl border-2 transition-colors
          ${editing
            ? 'border-pink-400 shadow-md'
            : selected
              ? 'border-pink-400 shadow-sm bg-pink-50/30'
              : 'border-dashed border-pink-200 hover:border-pink-300'
          }`}
      >
        {editing ? (
          <>
            {/* Edit toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-pink-50 border-b border-pink-200 rounded-t-xl">
              <span className="text-xs text-pink-700 font-medium">
                ✏️ Click text to edit &nbsp;·&nbsp; Click image to select → drag handles to resize or click Replace
                {uploading && <span className="ml-2 text-pink-400 animate-pulse">Uploading…</span>}
              </span>
              <div className="flex gap-2">
                <button onClick={() => { setSelectedImg(null); setEditing(false); }}
                  className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button onClick={saveEdits}
                  className="px-3 py-1 text-xs bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition font-medium">Save</button>
              </div>
            </div>

            <div ref={containerRef} className="relative">
              <div
                ref={editRef}
                contentEditable
                suppressContentEditableWarning
                className="outline-none px-4 py-3"
              />

              {/* Resize overlay on selected image */}
              {selectedImg && (
                <div style={{ position: 'absolute', top: selectedImg.top, left: selectedImg.left, width: selectedImg.width, height: selectedImg.height, pointerEvents: 'none' }}>
                  <div className="absolute inset-0 border-2 border-pink-400 rounded pointer-events-none" />

                  {/* Toolbar */}
                  <div style={{ position: 'absolute', top: -36, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto', whiteSpace: 'nowrap', zIndex: 50 }}
                    className="flex items-center gap-1 bg-gray-900 text-white text-xs rounded-lg px-2 py-1 shadow-lg">
                    <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleImageUpload(selectedImg.el); }}
                      className="px-2 py-0.5 bg-pink-500 hover:bg-pink-400 rounded text-xs transition">Replace</button>
                    <span className="text-gray-500 mx-0.5">|</span>
                    {[25, 50, 75, 100].map(pct => (
                      <button key={pct}
                        onMouseDown={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          if (!containerRef.current) return;
                          const w = Math.round(containerRef.current.offsetWidth * pct / 100);
                          selectedImg.el.style.width = `${w}px`;
                          selectedImg.el.style.height = '';
                          setTimeout(refreshSelection, 30);
                        }}
                        className="px-1.5 py-0.5 hover:bg-gray-700 rounded transition">{pct}%</button>
                    ))}
                    <span className="text-gray-500 ml-1 text-[10px]">{Math.round(selectedImg.width)}×{Math.round(selectedImg.height)}</span>
                  </div>

                  {/* Handles */}
                  {ALL_HANDLES.map(({ pos, style, cursor }) => (
                    <div key={pos}
                      style={{ position: 'absolute', ...style as any, cursor, pointerEvents: 'auto', width: 10, height: 10 }}
                      className="bg-white border-2 border-pink-400 rounded-sm shadow"
                      onMouseDown={startDrag(pos)} />
                  ))}

                  {badge && (
                    <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
                      {badge.w} × {badge.h}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* View mode — images get block display + scale-from-center hover */}
            <div
              dangerouslySetInnerHTML={{ __html: node.attrs.html }}
              className="px-4 py-3 pointer-events-none section-block-view"
            />

            {/* Hover actions */}
            <div className="absolute top-2 right-2 hidden group-hover:flex gap-1.5 pointer-events-auto">
              <button onClick={() => setEditing(true)}
                className="px-2.5 py-1 bg-white border border-gray-200 shadow-sm text-xs rounded-lg hover:border-pink-300 hover:text-pink-600 transition font-medium">
                ✏️ Edit
              </button>
            </div>

            {/* Selected state hint */}
            {selected && (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center py-1 bg-pink-400/90 text-white text-[11px] rounded-b-xl pointer-events-none">
                Press <kbd className="mx-1 px-1 py-0.5 bg-white/20 rounded text-[10px]">Backspace</kbd> or
                <kbd className="mx-1 px-1 py-0.5 bg-white/20 rounded text-[10px]">Delete</kbd> to remove · Ctrl+C to copy
              </div>
            )}

            {!selected && (
              <div className="absolute inset-x-0 bottom-0 hidden group-hover:flex items-center justify-center py-1 bg-black/50 text-white text-[11px] rounded-b-xl pointer-events-none">
                Click to select · then Delete to remove or Ctrl+C to copy
              </div>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}
