'use client';

import { NodeViewWrapper } from '@tiptap/react';
import { useState, useRef, useEffect, useCallback } from 'react';

type ImgSelection = { el: HTMLImageElement; top: number; left: number; width: number; height: number };
type PlaceholderOverlay = { el: HTMLImageElement; top: number; left: number; width: number; height: number };

const ALL_HANDLES = [
  { pos: 'nw', style: { top: '-5px',    left: '-5px'   }, cursor: 'nw-resize' },
  { pos: 'ne', style: { top: '-5px',    right: '-5px'  }, cursor: 'ne-resize' },
  { pos: 'sw', style: { bottom: '-5px', left: '-5px'   }, cursor: 'sw-resize' },
  { pos: 'se', style: { bottom: '-5px', right: '-5px'  }, cursor: 'se-resize' },
  { pos: 'n',  style: { top: '-5px',    left: '50%', transform: 'translateX(-50%)' }, cursor: 'n-resize' },
  { pos: 's',  style: { bottom: '-5px', left: '50%', transform: 'translateX(-50%)' }, cursor: 's-resize' },
  { pos: 'w',  style: { top: '50%',     left: '-5px', transform: 'translateY(-50%)' }, cursor: 'w-resize' },
  { pos: 'e',  style: { top: '50%',     right: '-5px', transform: 'translateY(-50%)' }, cursor: 'e-resize' },
];

const isPlaceholder = (src: string) =>
  src.includes('placehold.co') || src.includes('placeholder') || src === '';

export function HtmlBlockView({
  node, updateAttributes, selected, editor, getPos,
}: { node: any; updateAttributes: any; selected: boolean; editor: any; getPos: any }) {
  const [editing, setEditing]       = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [selectedImg, setSelectedImg] = useState<ImgSelection | null>(null);
  const [placeholders, setPlaceholders] = useState<PlaceholderOverlay[]>([]);
  const [badge, setBadge]           = useState<{ w: number; h: number } | null>(null);

  const editRef      = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef      = useRef<{ pos: string; x0: number; y0: number; w0: number; h0: number } | null>(null);
  const justClosedRef = useRef(false);

  // ── Auto-open edit mode on TipTap selection ─────────────────────────────
  useEffect(() => {
    if (selected && !editing && !justClosedRef.current) {
      setEditing(true);
    }
    if (!selected) {
      justClosedRef.current = false;
    }
  }, [selected]);

  // ── Recalculate placeholder overlay positions ────────────────────────────
  const recalcPlaceholders = useCallback(() => {
    if (!editRef.current || !containerRef.current) return;
    const cr = containerRef.current.getBoundingClientRect();
    const items: PlaceholderOverlay[] = [];
    editRef.current.querySelectorAll('img').forEach((img) => {
      if (isPlaceholder((img as HTMLImageElement).src)) {
        const ir = img.getBoundingClientRect();
        items.push({ el: img as HTMLImageElement, top: ir.top - cr.top, left: ir.left - cr.left, width: ir.width, height: ir.height });
      }
    });
    setPlaceholders(items);
  }, []);

  // ── Wire image interactions when entering edit mode ──────────────────────
  useEffect(() => {
    if (!editing || !editRef.current) return;
    editRef.current.innerHTML = node.attrs.html;

    editRef.current.querySelectorAll('img').forEach((rawImg) => {
      const img = rawImg as HTMLImageElement;
      img.style.display = 'block';
      img.ondragstart = (e) => e.preventDefault();

      if (isPlaceholder(img.src)) {
        // Placeholder: click goes straight to upload
        img.style.cursor = 'pointer';
        img.onclick = (e) => { e.preventDefault(); e.stopPropagation(); handleImageUpload(img); };
      } else {
        // Real image: click selects it for resize / replace
        img.style.cursor = 'pointer';
        img.setAttribute('data-section-img', 'true');
        img.onclick = (e) => {
          e.preventDefault(); e.stopPropagation();
          if (!containerRef.current) return;
          const cr = containerRef.current.getBoundingClientRect();
          const ir = img.getBoundingClientRect();
          setSelectedImg({ el: img, top: ir.top - cr.top, left: ir.left - cr.left, width: ir.width, height: ir.height });
        };
      }

      img.onload = recalcPlaceholders;
    });

    // Deselect image when clicking non-image area
    const deselect = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-section-img]')) setSelectedImg(null);
    };
    editRef.current.addEventListener('click', deselect);

    // Initial placeholder scan (after layout)
    setTimeout(recalcPlaceholders, 80);

    return () => editRef.current?.removeEventListener('click', deselect);
  }, [editing]);

  // ── Resize drag ──────────────────────────────────────────────────────────
  const startDrag = (pos: string) => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!selectedImg) return;
    dragRef.current = { pos, x0: e.clientX, y0: e.clientY, w0: selectedImg.width, h0: selectedImg.height };
  };

  const refreshSelection = useCallback(() => {
    if (!selectedImg || !containerRef.current) return;
    const cr = containerRef.current.getBoundingClientRect();
    const ir = selectedImg.el.getBoundingClientRect();
    setSelectedImg(s => s ? { ...s, top: ir.top - cr.top, left: ir.left - cr.left, width: ir.width, height: ir.height } : null);
    recalcPlaceholders();
  }, [selectedImg, recalcPlaceholders]);

  useEffect(() => {
    if (!selectedImg) return;
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
      const p = d.pos;
      let w = d.w0, h = d.h0;
      if (p === 'e'  || p === 'ne' || p === 'se') w = Math.max(60, d.w0 + dx);
      if (p === 'w'  || p === 'nw' || p === 'sw') w = Math.max(60, d.w0 - dx);
      if (p === 's'  || p === 'se' || p === 'sw') h = Math.max(40, d.h0 + dy);
      if (p === 'n'  || p === 'ne' || p === 'nw') h = Math.max(40, d.h0 - dy);
      w = Math.round(w); h = Math.round(h);
      selectedImg.el.style.width  = `${w}px`;
      selectedImg.el.style.height = `${h}px`;
      refreshSelection();
      setBadge({ w, h });
    };
    const onUp = () => { dragRef.current = null; setBadge(null); refreshSelection(); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [selectedImg, refreshSelection]);

  // ── Image upload ─────────────────────────────────────────────────────────
  function handleImageUpload(img: HTMLImageElement) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const fd = new FormData(); fd.append('file', file);
        const res  = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) {
          img.src = data.url;
          img.removeAttribute('srcset');
          img.style.cursor = 'pointer';
          img.setAttribute('data-section-img', 'true');
          // Switch onclick from "upload" to "select for resize"
          img.onclick = (ev) => {
            ev.preventDefault(); ev.stopPropagation();
            if (!containerRef.current) return;
            const cr = containerRef.current.getBoundingClientRect();
            const ir = img.getBoundingClientRect();
            setSelectedImg({ el: img, top: ir.top - cr.top, left: ir.left - cr.left, width: ir.width, height: ir.height });
          };
          setTimeout(recalcPlaceholders, 80);
        } else { alert('Upload failed — please try again.'); }
      } catch { alert('Upload failed — please try again.'); }
      finally { setUploading(false); }
    };
    input.click();
  }

  // ── Save / Cancel ────────────────────────────────────────────────────────
  function saveEdits() {
    if (!editRef.current) { closeEdit(); return; }
    editRef.current.querySelectorAll('img').forEach((img) => {
      img.removeAttribute('data-section-img');
      (img as HTMLImageElement).style.cursor = '';
      (img as HTMLImageElement).onclick = null;
      (img as HTMLImageElement).ondragstart = null;
      if (!(img as HTMLImageElement).style.display) (img as HTMLImageElement).style.display = 'block';
    });
    updateAttributes({ html: editRef.current.innerHTML });
    closeEdit();
  }

  function closeEdit() {
    setSelectedImg(null);
    setPlaceholders([]);
    setEditing(false);
    justClosedRef.current = true;
    // Move TipTap cursor after this node so it deselects
    if (editor && typeof getPos === 'function') {
      setTimeout(() => {
        try { editor.commands.setTextSelection(getPos() + node.nodeSize); }
        catch { /* ignore */ }
      }, 0);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <NodeViewWrapper data-drag-handle>
      <div className={`relative group my-3 rounded-xl border-2 transition-colors
        ${editing ? 'border-pink-400 shadow-md' : selected ? 'border-pink-400' : 'border-dashed border-pink-200 hover:border-pink-300'}`}
      >
        {editing ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-pink-50 border-b border-pink-200 rounded-t-xl">
              <span className="text-xs text-pink-700 font-medium">
                ✏️ Click text to edit · Click image to resize · Click placeholder to upload
                {uploading && <span className="ml-2 text-pink-400 animate-pulse">Uploading…</span>}
              </span>
              <div className="flex gap-2">
                <button onClick={() => { setSelectedImg(null); setPlaceholders([]); justClosedRef.current = true; setEditing(false); setTimeout(() => { justClosedRef.current = false; }, 300); }}
                  className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={saveEdits}
                  className="px-3 py-1 text-xs bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition font-medium">
                  Save
                </button>
              </div>
            </div>

            <div ref={containerRef} className="relative">
              {/* Editable HTML */}
              <div ref={editRef} contentEditable suppressContentEditableWarning className="outline-none px-4 py-3" />

              {/* Placeholder upload overlays */}
              {placeholders.map((ph, i) => (
                <div key={i}
                  onClick={() => handleImageUpload(ph.el)}
                  style={{ position: 'absolute', top: ph.top, left: ph.left, width: ph.width, height: ph.height, zIndex: 10, cursor: 'pointer' }}
                  className="flex flex-col items-center justify-center bg-pink-400/25 border-2 border-dashed border-pink-400 rounded-lg hover:bg-pink-400/40 transition group/ph"
                >
                  <svg className="w-8 h-8 text-pink-400 group-hover/ph:text-pink-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 16.5V18a1.5 1.5 0 001.5 1.5h15A1.5 1.5 0 0021 18v-1.5M12 3v12m0 0l-3.5-3.5M12 15l3.5-3.5" />
                  </svg>
                  <span className="text-xs text-pink-500 font-medium mt-1 group-hover/ph:text-pink-700">Click to upload</span>
                </div>
              ))}

              {/* Resize overlay on selected real image */}
              {selectedImg && (
                <div style={{ position: 'absolute', top: selectedImg.top, left: selectedImg.left, width: selectedImg.width, height: selectedImg.height, pointerEvents: 'none' }}>
                  <div className="absolute inset-0 border-2 border-pink-400 rounded pointer-events-none" />

                  {/* Floating toolbar */}
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
                          selectedImg.el.style.width  = `${w}px`;
                          selectedImg.el.style.height = '';
                          setTimeout(refreshSelection, 30);
                        }}
                        className="px-1.5 py-0.5 hover:bg-gray-700 rounded transition">{pct}%</button>
                    ))}
                    <span className="text-gray-500 ml-1 text-[10px]">
                      {Math.round(selectedImg.width)}×{Math.round(selectedImg.height)}
                    </span>
                  </div>

                  {/* Resize handles */}
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
            <div dangerouslySetInnerHTML={{ __html: node.attrs.html }}
              className="px-4 py-3 pointer-events-none section-block-view" />

            {!selected && (
              <div className="absolute inset-x-0 bottom-0 hidden group-hover:flex items-center justify-center py-1 bg-black/50 text-white text-[11px] rounded-b-xl pointer-events-none">
                Click to edit · Select &amp; Delete to remove
              </div>
            )}
            {selected && (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center py-1 bg-pink-500/80 text-white text-[11px] rounded-b-xl pointer-events-none">
                Press <kbd className="mx-1 px-1 bg-white/20 rounded">Backspace</kbd> to delete ·
                <kbd className="mx-1 px-1 bg-white/20 rounded">Ctrl+C</kbd> to copy
              </div>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}
