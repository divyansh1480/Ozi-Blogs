'use client';

import { NodeViewWrapper } from '@tiptap/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import SectionTemplates from './SectionTemplates';

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

// ── Formatting mini-toolbar ───────────────────────────────────────────────
const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px'];
const FONT_FAMILIES = [
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Inter',           value: 'Inter, sans-serif' },
  { label: 'Georgia',         value: 'Georgia, serif' },
  { label: 'Courier New',     value: '"Courier New", Courier, monospace' },
  { label: 'Arial',           value: 'Arial, sans-serif' },
];

// Normalize computed fontFamily to the closest FONT_FAMILIES value
function normalizeFontFamily(computed: string): string {
  if (!computed) return DEFAULT_FONT_FAMILY;
  const lower = computed.toLowerCase();
  for (const f of FONT_FAMILIES) {
    const key = f.label.toLowerCase();
    if (lower.includes(key)) return f.value;
  }
  return DEFAULT_FONT_FAMILY;
}

// Round computed fontSize to the nearest FONT_SIZES value
function normalizeFontSize(computed: string): string {
  if (!computed) return DEFAULT_FONT_SIZE;
  const px = parseFloat(computed);
  if (isNaN(px)) return DEFAULT_FONT_SIZE;
  // Pick the closest size
  let closest = FONT_SIZES[0];
  let minDiff = Infinity;
  for (const s of FONT_SIZES) {
    const diff = Math.abs(parseFloat(s) - px);
    if (diff < minDiff) { minDiff = diff; closest = s; }
  }
  return closest;
}
const TEXT_COLORS = [
  '#111827','#374151','#6B7280','#EF4444','#F97316',
  '#EAB308','#22C55E','#3B82F6','#8B5CF6','#EC4899',
];

// MS-Word style alignment SVG icons
const IcoLeft = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="1" y1="2"    x2="13" y2="2"/>
    <line x1="1" y1="5.5"  x2="9"  y2="5.5"/>
    <line x1="1" y1="9"    x2="13" y2="9"/>
    <line x1="1" y1="12.5" x2="7"  y2="12.5"/>
  </svg>
);
const IcoCenter = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="1"   y1="2"    x2="13"   y2="2"/>
    <line x1="3"   y1="5.5"  x2="11"   y2="5.5"/>
    <line x1="1"   y1="9"    x2="13"   y2="9"/>
    <line x1="3.5" y1="12.5" x2="10.5" y2="12.5"/>
  </svg>
);
const IcoRight = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="1" y1="2"    x2="13" y2="2"/>
    <line x1="5" y1="5.5"  x2="13" y2="5.5"/>
    <line x1="1" y1="9"    x2="13" y2="9"/>
    <line x1="7" y1="12.5" x2="13" y2="12.5"/>
  </svg>
);

// ── Cursor helpers (never select text — Issue 6) ──────────────────────────
function cursorAtEnd(el: HTMLElement) {
  const sel = window.getSelection(); if (!sel) return;
  const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
  sel.removeAllRanges(); sel.addRange(r);
}
function cursorAtStart(el: HTMLElement) {
  const sel = window.getSelection(); if (!sel) return;
  const r = document.createRange(); r.selectNodeContents(el); r.collapse(true);
  sel.removeAllRanges(); sel.addRange(r);
}

// Walk up from cursor to find nearest P/H1-H6 block inside editEl
function nearestBlock(editEl: HTMLDivElement): HTMLElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  let node: Node | null = sel.getRangeAt(0).startContainer;
  while (node && node !== editEl) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const t = (node as HTMLElement).tagName.toLowerCase();
      if (['p','h1','h2','h3','h4','h5','h6'].includes(t)) return node as HTMLElement;
    }
    node = node.parentNode;
  }
  return null;
}

// ── Heading ───────────────────────────────────────────────────────────────
// • No selection: NEVER change existing text. If current block is empty → retype it.
//   Otherwise → insert a new empty block of the requested tag after the current one.
// • Text selected → convert that block's tag in place.
function applyHeading(tag: string, editEl: HTMLDivElement | null) {
  if (!editEl) return;
  editEl.focus();
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  const block = nearestBlock(editEl);

  if (!range.collapsed) {
    // Text selected → change block tag, no text selected after (Issue 6)
    if (block) {
      const newEl = document.createElement(tag);
      newEl.innerHTML = block.innerHTML;
      if (block.style.cssText) newEl.style.cssText = block.style.cssText;
      block.replaceWith(newEl);
      cursorAtEnd(newEl);
    } else {
      document.execCommand('formatBlock', false, tag);
    }
    return;
  }

  // No selection — never touch existing text (Issue 3)
  const isEmpty = !block ||
    block.textContent?.trim() === '' ||
    block.innerHTML === '<br>' ||
    block.innerHTML === '';

  const newEl = document.createElement(tag);
  newEl.innerHTML = '<br>';

  if (isEmpty && block) {
    // Current block is empty → retype it in place
    block.replaceWith(newEl);
  } else if (block) {
    // Current block has content → insert new empty block after it
    block.after(newEl);
  } else {
    editEl.appendChild(newEl);
  }
  cursorAtStart(newEl);
}

// ── Alignment (Issue 2) ───────────────────────────────────────────────────
// Sets text-align directly on the current block element.
// With no selection: applies to current block, subsequent typing follows it.
function applyAlign(align: string, editEl: HTMLDivElement | null) {
  if (!editEl) return;
  editEl.focus();
  const block = nearestBlock(editEl);
  if (block) {
    block.style.textAlign = align;
    cursorAtEnd(block);           // keep cursor inside block, no text selected (Issue 6)
  } else {
    // Cursor is in a div/flex container — apply text-align to the nearest element
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node !== editEl) {
      if (node.nodeType === Node.ELEMENT_NODE && node !== editEl) {
        (node as HTMLElement).style.textAlign = align;
        break;
      }
      node = node.parentNode;
    }
  }
}

// ── List ──────────────────────────────────────────────────────────────────
// • In a list: always toggle off (li → p).
// • No selection, not in list: NEVER wrap existing text (Issue 3).
//   If current block is empty → wrap it. Otherwise → append new empty list after it.
// • Text selected, not in list → wrap selected block in list.
function applyList(type: 'ul' | 'ol', editEl: HTMLDivElement | null) {
  if (!editEl) return;
  editEl.focus();
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);

  // Check if cursor is inside an existing <li>
  let li: HTMLElement | null = null;
  let node: Node | null = range.startContainer;
  while (node && node !== editEl) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'LI') {
      li = node as HTMLElement; break;
    }
    node = node.parentNode;
  }

  if (li) {
    // Toggle OFF: convert li back to a paragraph
    const list = li.closest('ul,ol') as HTMLElement | null;
    if (list) {
      const p = document.createElement('p');
      p.innerHTML = li.innerHTML;
      if (li.style.cssText) p.style.cssText = li.style.cssText;
      list.replaceWith(p);
      cursorAtEnd(p);
    }
    return;
  }

  const block = nearestBlock(editEl);
  const makeList = (referenceBlock: HTMLElement | null, useContent: boolean) => {
    const listEl = document.createElement(type);
    const liEl   = document.createElement('li');
    if (useContent && referenceBlock) {
      liEl.innerHTML = referenceBlock.innerHTML;
      if (referenceBlock.style.fontSize)   liEl.style.fontSize   = referenceBlock.style.fontSize;
      if (referenceBlock.style.fontFamily) liEl.style.fontFamily = referenceBlock.style.fontFamily;
      if (referenceBlock.style.color)      liEl.style.color      = referenceBlock.style.color;
      listEl.appendChild(liEl);
      referenceBlock.replaceWith(listEl);
      cursorAtEnd(liEl);
    } else {
      liEl.innerHTML = '<br>';
      listEl.appendChild(liEl);
      if (referenceBlock) referenceBlock.after(listEl);
      else editEl.appendChild(listEl);
      cursorAtStart(liEl);
    }
  };

  if (!range.collapsed) {
    // Text selected → wrap selected block's content
    makeList(block, true);
    return;
  }

  // No selection — don't wrap existing text (Issue 3)
  const isEmpty = !block ||
    block.textContent?.trim() === '' ||
    block.innerHTML === '<br>' ||
    block.innerHTML === '';

  makeList(block, isEmpty);
}

// ── Inline font size / family (Issues 4, 6) ──────────────────────────────
// With selection: wraps selected text in a span.
// No selection: inserts a zero-width span at cursor so SUBSEQUENT typing inherits style.
// In both cases cursor is placed WITHOUT selecting any text.
function applyFontSize(size: string, editEl: HTMLDivElement | null) {
  if (!editEl) return;
  editEl.focus();
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  const span = document.createElement('span');
  span.style.fontSize = size;
  if (range.collapsed) {
    const txt = document.createTextNode('\u200B');
    span.appendChild(txt);
    range.insertNode(span);
    // Place cursor inside the text node (position 1 = after \u200B) → subsequent typing inherits size
    const r = document.createRange();
    r.setStart(txt, 1); r.collapse(true);
    sel.removeAllRanges(); sel.addRange(r);
  } else {
    try { range.surroundContents(span); } catch {
      span.appendChild(range.extractContents()); range.insertNode(span);
    }
    cursorAtEnd(span);  // collapse to end, no text selected (Issue 6)
  }
}

function applyFontFamily(family: string, editEl: HTMLDivElement | null) {
  if (!editEl) return;
  editEl.focus();
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  const span = document.createElement('span');
  span.style.fontFamily = family || '';
  if (range.collapsed) {
    const txt = document.createTextNode('\u200B');
    span.appendChild(txt);
    range.insertNode(span);
    const r = document.createRange();
    r.setStart(txt, 1); r.collapse(true);
    sel.removeAllRanges(); sel.addRange(r);
  } else {
    try { range.surroundContents(span); } catch {
      span.appendChild(range.extractContents()); range.insertNode(span);
    }
    cursorAtEnd(span);
  }
}

// Inline execCommand helpers (bold/italic/etc. — these naturally preserve selection behaviour)
function inlineCmd(command: string, editEl: HTMLDivElement | null, value?: string) {
  editEl?.focus();
  document.execCommand(command, false, value);
}

const DEFAULT_FONT_FAMILY = '"Times New Roman", Times, serif';
const DEFAULT_FONT_SIZE   = '16px';

// ── Active state helpers for contenteditable ─────────────────────────────
function getActiveStates(editEl: HTMLDivElement | null) {
  const none = { bold: false, italic: false, underline: false, strike: false, heading: '', align: '', list: '', fontFamily: DEFAULT_FONT_FAMILY, fontSize: DEFAULT_FONT_SIZE };
  if (!editEl) return none;
  const bold      = document.queryCommandState('bold');
  const italic    = document.queryCommandState('italic');
  const underline = document.queryCommandState('underline');
  const strike    = document.queryCommandState('strikeThrough');

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return none;
  const range = sel.getRangeAt(0);

  // For font: use the element at the start of the selection (or the common ancestor)
  let fontEl: HTMLElement | null = null;
  if (!range.collapsed) {
    // Selected text — use startContainer
    fontEl = range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer.parentElement
      : range.startContainer as HTMLElement;
  } else {
    fontEl = range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer.parentElement
      : range.startContainer as HTMLElement;
  }
  let fontFamily = DEFAULT_FONT_FAMILY;
  let fontSize   = DEFAULT_FONT_SIZE;
  if (fontEl && editEl.contains(fontEl)) {
    const cs = window.getComputedStyle(fontEl);
    if (cs.fontFamily) fontFamily = normalizeFontFamily(cs.fontFamily);
    if (cs.fontSize)   fontSize   = normalizeFontSize(cs.fontSize);
  }

  // Walk up for block-level context
  let node: Node | null = range.startContainer;
  let heading = '';
  let align   = '';
  let list    = '';
  while (node && node !== editEl) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el  = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (!heading && ['h1','h2','h3','h4','h5','h6','p'].includes(tag)) heading = tag;
      if (!align   && el.style.textAlign) align = el.style.textAlign;
      if (!list    && (tag === 'ul' || tag === 'ol')) list = tag;
    }
    node = node.parentNode;
  }
  return { bold, italic, underline, strike, heading, align, list, fontFamily, fontSize };
}

function SectionToolbar({ editRef }: { editRef: React.RefObject<HTMLDivElement> }) {
  const [showColors, setShowColors] = useState(false);
  const [active, setActive] = useState(() => getActiveStates(null));
  const savedSelRef = useRef<Range | null>(null);

  // Re-read active states whenever selection changes inside the edit area
  useEffect(() => {
    const update = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const anchor = sel.getRangeAt(0).startContainer;
      if (editRef.current && editRef.current.contains(anchor)) {
        setActive(getActiveStates(editRef.current));
      }
    };
    document.addEventListener('selectionchange', update);
    return () => document.removeEventListener('selectionchange', update);
  }, [editRef]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      try { savedSelRef.current = sel.getRangeAt(0).cloneRange(); } catch {}
    }
  };

  const restoreAndFocus = () => {
    const el = editRef.current;
    if (!el) return;
    el.focus();
    if (savedSelRef.current) {
      try {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(savedSelRef.current);
      } catch {}
    }
  };

  const B = ({ onCmd, children, title, isActive }: { onCmd: () => void; children: React.ReactNode; title: string; isActive?: boolean }) => (
    <button
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onCmd();
        // Re-sync active state immediately after command
        setTimeout(() => setActive(getActiveStates(editRef.current)), 0);
      }}
      className={`px-2 py-1 rounded transition select-none flex items-center text-xs
        ${isActive ? 'bg-primary/20 text-primary-dark font-semibold' : 'hover:bg-gray-200 text-gray-700'}`}
    >
      {children}
    </button>
  );

  const Sep = () => <div className="w-px h-5 bg-gray-300 mx-0.5 shrink-0" />;

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 bg-gray-100 border-b border-gray-200 rounded-t-xl text-xs">

      {/* Font family — controlled, shows active font at cursor */}
      <select
        title="Font family"
        value={active.fontFamily}
        onMouseDown={saveSelection}
        onChange={(e) => { restoreAndFocus(); applyFontFamily(e.target.value, editRef.current); setTimeout(() => setActive(getActiveStates(editRef.current)), 0); }}
        className="text-xs bg-white border border-gray-300 rounded px-1.5 py-1 focus:outline-none max-w-[130px]"
      >
        {FONT_FAMILIES.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
      </select>

      {/* Font size — controlled, shows active size at cursor */}
      <select
        title="Font size"
        value={active.fontSize}
        onMouseDown={saveSelection}
        onChange={(e) => { if (e.target.value) { restoreAndFocus(); applyFontSize(e.target.value, editRef.current); setTimeout(() => setActive(getActiveStates(editRef.current)), 0); } }}
        className="text-xs bg-white border border-gray-300 rounded px-1.5 py-1 focus:outline-none w-[68px]"
      >
        {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <Sep />

      <B title="Bold"          isActive={active.bold}      onCmd={() => inlineCmd('bold',          editRef.current)}><strong>B</strong></B>
      <B title="Italic"        isActive={active.italic}    onCmd={() => inlineCmd('italic',        editRef.current)}><em>I</em></B>
      <B title="Underline"     isActive={active.underline} onCmd={() => inlineCmd('underline',     editRef.current)}><span className="underline">U</span></B>
      <B title="Strikethrough" isActive={active.strike}    onCmd={() => inlineCmd('strikeThrough', editRef.current)}><s>S</s></B>

      <Sep />

      <B title="Heading 1" isActive={active.heading === 'h1'} onCmd={() => applyHeading('h1', editRef.current)}>H1</B>
      <B title="Heading 2" isActive={active.heading === 'h2'} onCmd={() => applyHeading('h2', editRef.current)}>H2</B>
      <B title="Heading 3" isActive={active.heading === 'h3'} onCmd={() => applyHeading('h3', editRef.current)}>H3</B>
      <B title="Paragraph" isActive={active.heading === 'p'}  onCmd={() => applyHeading('p',  editRef.current)}>¶</B>

      <Sep />

      <B title="Align left"   isActive={active.align === 'left' || active.align === ''} onCmd={() => applyAlign('left',   editRef.current)}><IcoLeft /></B>
      <B title="Align center" isActive={active.align === 'center'}                      onCmd={() => applyAlign('center', editRef.current)}><IcoCenter /></B>
      <B title="Align right"  isActive={active.align === 'right'}                       onCmd={() => applyAlign('right',  editRef.current)}><IcoRight /></B>

      <Sep />

      <B title="Bullet list"   isActive={active.list === 'ul'} onCmd={() => applyList('ul', editRef.current)}>• List</B>
      <B title="Numbered list" isActive={active.list === 'ol'} onCmd={() => applyList('ol', editRef.current)}>1. List</B>

      <Sep />

      {/* Text color */}
      <div className="relative">
        <button
          title="Text color"
          onMouseDown={(e) => { e.preventDefault(); saveSelection(); setShowColors(v => !v); }}
          className="px-2 py-1 rounded hover:bg-gray-200 text-gray-700 transition select-none text-sm font-medium"
        >
          A
        </button>
        {showColors && (
          <div
            className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 flex flex-wrap gap-1 w-36"
            onMouseDown={(e) => e.preventDefault()}
          >
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                title={color}
                onMouseDown={(e) => {
                  e.preventDefault();
                  restoreAndFocus();
                  inlineCmd('foreColor', editRef.current, color);
                  setShowColors(false);
                }}
                className="w-5 h-5 rounded-full border border-gray-200 hover:scale-110 transition"
                style={{ backgroundColor: color }}
              />
            ))}
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                restoreAndFocus();
                inlineCmd('removeFormat', editRef.current);
                setShowColors(false);
              }}
              className="text-xs text-gray-500 hover:text-gray-700 mt-1 w-full text-left"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export function HtmlBlockView({
  node, updateAttributes, selected, editor, getPos,
}: { node: any; updateAttributes: any; selected: boolean; editor: any; getPos: any }) {
  const [editing, setEditing]           = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [selectedImg, setSelectedImg]   = useState<ImgSelection | null>(null);
  const [placeholders, setPlaceholders] = useState<PlaceholderOverlay[]>([]);
  const [badge, setBadge]               = useState<{ w: number; h: number } | null>(null);
  const [hovered, setHovered]           = useState(false);
  const [isDragging, setIsDragging]     = useState(false);
  const [anyDragging, setAnyDragging]   = useState(false);
  const [dragDeltaY, setDragDeltaY]     = useState(0);
  const [shiftY, setShiftY]             = useState(0);

  const editRef       = useRef<HTMLDivElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const sectionCardRef = useRef<HTMLDivElement>(null);
  const dragRef       = useRef<{ pos: string; x0: number; y0: number; w0: number; h0: number } | null>(null);
  const justClosedRef = useRef(false);
  // Stable ref so native keydown handler can call closeEdit without a stale closure
  const closeEditRef  = useRef<() => void>(() => {});
  // Stable ref for getPos so event listeners don't close over a stale value
  const getPosRef = useRef(getPos);
  useEffect(() => { getPosRef.current = getPos; });
  const nodeSizeRef = useRef<number>(node.nodeSize);
  useEffect(() => { nodeSizeRef.current = node.nodeSize; });

  // Auto-enter edit mode when freshly inserted from the sections panel
  useEffect(() => {
    if (node.attrs.autoEdit) {
      updateAttributes({ autoEdit: false });
      setEditing(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset guard when node is deselected
  useEffect(() => {
    if (!selected) justClosedRef.current = false;
  }, [selected]);

  // Keep closeEditRef pointing at the latest closeEdit closure
  useEffect(() => { closeEditRef.current = closeEdit; }); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Listen for drag events from whichever section is being dragged ──
  // COLLAPSED_H = visible height of one compressed section during drag (36px) + margins (my-3 = 12+12)
  const COLLAPSED_H = 60;
  useEffect(() => {
    const onDragStart = () => setAnyDragging(true);
    const onGlobalEnd = () => { setAnyDragging(false); setShiftY(0); };

    // Live position feedback: shift this section up/down based on where dragged section will land
    const onDragMove = (e: Event) => {
      const { fromPos, insertPos } = (e as CustomEvent).detail as { fromPos: number; insertPos: number };
      const myPos = typeof getPosRef.current === 'function' ? getPosRef.current() : null;
      if (myPos === null || myPos === fromPos) return;
      if (insertPos > fromPos) {
        // dragging DOWN: sections between fromPos and insertPos shift up
        setShiftY(myPos > fromPos && myPos < insertPos ? -COLLAPSED_H : 0);
      } else if (insertPos < fromPos) {
        // dragging UP: sections between insertPos and fromPos shift down
        setShiftY(myPos >= insertPos && myPos < fromPos ? COLLAPSED_H : 0);
      } else {
        setShiftY(0);
      }
    };

    window.addEventListener('section-drag-start', onDragStart);
    window.addEventListener('section-drag-move',  onDragMove);
    window.addEventListener('section-drag-end',   onGlobalEnd);
    return () => {
      window.removeEventListener('section-drag-start', onDragStart);
      window.removeEventListener('section-drag-move',  onDragMove);
      window.removeEventListener('section-drag-end',   onGlobalEnd);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Custom drag-to-reorder ───────────────────────────────────────────────
  function startDragReorder(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!editor || typeof getPos !== 'function') return;

    const startY = e.clientY;
    setIsDragging(true);
    setDragDeltaY(0);
    window.dispatchEvent(new CustomEvent('section-drag-start'));

    let rafId: number | null = null;
    let prevClientY = startY;
    // Pill's top after collapse — captured on first move (React re-renders before then).
    // Using the pill's visual bounds (not raw cursor) gives natural "touch-to-swap" feel.
    let collapsedPillTop: number | null = null;

    // Position switches the moment the dragged pill's edge physically touches the
    // adjacent section's edge — no arbitrary percentage, just visual contact.
    function findTarget(clientY: number, dragDir: 'up' | 'down'): { el: HTMLElement; pos: number; nodeSize: number; before: boolean } | null {
      const myPos = getPos();
      // Pill visual bounds (36 px tall collapsed pill)
      const deltaY = clientY - startY;
      const pillTop    = (collapsedPillTop ?? clientY - 18) + deltaY;
      const pillBottom = pillTop + 36;

      let best: { el: HTMLElement; pos: number; nodeSize: number; before: boolean; dist: number } | null = null;
      editor.state.doc.descendants((n: any, pos: number) => {
        if (n.type.name !== 'htmlBlock') return;
        if (pos === myPos) return;
        const domNode = editor.view.nodeDOM(pos) as HTMLElement | null;
        if (!domNode) return;
        const card = domNode.querySelector('[data-section-view]') as HTMLElement | null ?? domNode;
        const rect = card.getBoundingClientRect();
        let before: boolean;
        if (dragDir === 'down') {
          // Dragging down: stay "before this section" until pill bottom touches its top
          before = pillBottom <= rect.top;
        } else {
          // Dragging up: switch to "before this section" the moment pill top touches its bottom
          before = pillTop <= rect.bottom;
        }
        // Midpoint distance only picks the CLOSEST section; before/after is pill-edge based
        const dist = Math.abs(clientY - (rect.top + rect.height / 2));
        if (!best || dist < best.dist) {
          best = { el: card, pos, nodeSize: n.nodeSize, before, dist };
        }
      });
      return best;
    }

    function onMove(ev: MouseEvent) {
      // Batch state updates inside rAF so the browser composites smoothly
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // Capture pill top once — by the first move React has already collapsed the section
        if (collapsedPillTop === null && sectionCardRef.current) {
          collapsedPillTop = sectionCardRef.current.getBoundingClientRect().top;
        }
        const dragDir: 'up' | 'down' = ev.clientY >= prevClientY ? 'down' : 'up';
        prevClientY = ev.clientY;
        const deltaY = ev.clientY - startY;
        setDragDeltaY(deltaY);

        const myPos = getPos();
        const target = findTarget(ev.clientY, dragDir);
        if (target) {
          const insertPos = target.before ? target.pos : target.pos + target.nodeSize;
          window.dispatchEvent(new CustomEvent('section-drag-move', {
            detail: { fromPos: myPos, insertPos },
          }));
        }
      });
    }

    function onUp(ev: MouseEvent) {
      if (rafId !== null) cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      setIsDragging(false);
      setDragDeltaY(0);
      window.dispatchEvent(new CustomEvent('section-drag-end'));

      const myPos  = getPos();
      const mySize = node.nodeSize;
      const myHtml = node.attrs.html as string;
      const dragDir: 'up' | 'down' = ev.clientY >= prevClientY ? 'down' : 'up';
      const target = findTarget(ev.clientY, dragDir);
      if (!target) return;

      // Avoid no-op: dropping on self
      if (target.pos === myPos) return;
      const insertPos = target.before ? target.pos : target.pos + target.nodeSize;
      if (insertPos === myPos || insertPos === myPos + mySize) return;

      // Adjust for deletion shifting later positions
      const adjustedInsertPos = insertPos > myPos ? insertPos - mySize : insertPos;

      editor.chain()
        .focus()
        .deleteRange({ from: myPos, to: myPos + mySize })
        .insertContentAt(adjustedInsertPos, { type: 'htmlBlock', attrs: { html: myHtml } })
        .run();
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }

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

    // Set section HTML into the editable div
    editRef.current.innerHTML = node.attrs.html;

    // ── Normalize margins so edit mode matches view mode exactly ────────────
    // Problem 1: Browser UA contenteditable rules add margin-block-start/end
    //   to block elements (e.g. Chrome adds ~1em on <p>). These run as separate
    //   logical properties alongside the physical margin-top/bottom from inline
    //   styles, so inline style alone doesn't fully suppress them.
    // Problem 2: Whitespace text nodes (newlines + spaces from template
    //   indentation) are rendered as visible gaps inside contenteditable.
    // Fix: for elements that have NO explicit margin in their inline style,
    //   stamp marginTop/marginBottom as inline styles — inline styles always
    //   beat UA rules. Elements with existing inline margins are left alone
    //   so template spacing (e.g. margin:0 0 12px 0) is fully preserved.
    // Note: stamped values match what the global * { margin:0 } reset applies
    //   in view mode, so save/view will look identical.
    const BLOCK_SEL = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, pre';
    editRef.current.querySelectorAll<HTMLElement>(BLOCK_SEL).forEach((el) => {
      if (!/margin/i.test(el.getAttribute('style') || '')) {
        el.style.marginTop = '0';
        el.style.marginBottom = '0';
      }
    });
    // Remove pure-whitespace text nodes between block elements — these create
    // phantom blank lines inside contenteditable that don't appear in view mode.
    const removeWhitespaceNodes = (parent: Node) => {
      Array.from(parent.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim() === '') {
          parent.removeChild(child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          removeWhitespaceNodes(child);
        }
      });
    };
    removeWhitespaceNodes(editRef.current);

    editRef.current.querySelectorAll('img').forEach((rawImg) => {
      const img = rawImg as HTMLImageElement;
      img.style.display = 'block';
      img.style.cursor = 'pointer';
      img.ondragstart = (e) => e.preventDefault();

      if (isPlaceholder(img.src)) {
        img.onclick = (e) => { e.preventDefault(); e.stopPropagation(); handleImageUpload(img); };
      } else {
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

    const deselect = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-section-img]')) setSelectedImg(null);
    };
    editRef.current.addEventListener('click', deselect);
    setTimeout(recalcPlaceholders, 80);

    // ── Block all keystrokes from reaching TipTap/ProseMirror ───────────────
    // stopImmediatePropagation prevents ProseMirror's ancestor handlers AND
    // prevents bubbling to the React root (where React 18 delegates events).
    // So Esc must be handled HERE, not in the React onKeyDown prop.
    const blockKeyFromPM = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        closeEditRef.current();
        return;
      }
      e.stopPropagation();
      e.stopImmediatePropagation();
    };
    editRef.current.addEventListener('keydown', blockKeyFromPM);
    editRef.current.addEventListener('keyup',   blockKeyFromPM);

    // ── Synchronous focus + caret at end ─────────────────────────────────────
    // useEffect runs after React has committed the DOM, so editRef.current is
    // guaranteed to be set here. Synchronous (no rAF/setTimeout) so toolbar
    // clicks work on the very first click — no race window.
    editRef.current.focus();
    const range = document.createRange();
    range.selectNodeContents(editRef.current);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    return () => {
      editRef.current?.removeEventListener('click', deselect);
      editRef.current?.removeEventListener('keydown', blockKeyFromPM);
      editRef.current?.removeEventListener('keyup', blockKeyFromPM);
    };
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (p === 'e'  || p === 'ne' || p === 'se') w = d.w0 + dx;
      if (p === 'w'  || p === 'nw' || p === 'sw') w = d.w0 - dx;
      if (p === 's'  || p === 'se' || p === 'sw') h = d.h0 + dy;
      if (p === 'n'  || p === 'ne' || p === 'nw') h = d.h0 - dy;
      w = Math.round(Math.max(20, w)); h = Math.round(Math.max(20, h));
      const img = selectedImg.el;
      const wrapper = img.parentElement;
      const containerW = containerRef.current?.offsetWidth || 800;
      const wPct = Math.min(100, Math.round((w / containerW) * 100));
      if (wrapper && wrapper !== editRef.current && getComputedStyle(wrapper.parentElement!).display === 'flex') {
        wrapper.style.width    = `${wPct}%`;
        wrapper.style.maxWidth = '100%';
        wrapper.style.flexShrink = '1';
        img.style.width  = '100%';
        img.style.height = `${h}px`;
      } else {
        img.style.width    = `${wPct}%`;
        img.style.maxWidth = '100%';
        img.style.height   = `${h}px`;
      }
      img.style.maxHeight = 'none';
      img.style.objectFit = 'fill';
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
          img.style.borderRadius = '0';
          img.style.cursor = 'pointer';
          img.setAttribute('data-section-img', 'true');
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

  // Known default caption text patterns set by section templates
  const PLACEHOLDER_CAPTION_RE = /^(caption|caption for image|caption one|caption two|caption three|add a caption)/i;

  // ── Save / Cancel / Duplicate / Delete ───────────────────────────────────
  function saveEdits() {
    if (!editRef.current) { closeEdit(); return; }

    // Strip the margin normalizations we stamped when entering edit mode.
    // Elements that originally had no margin inline style had marginTop/Bottom
    // set to '0' by JS. Remove those so the saved HTML stays clean.
    // Elements that had a real inline margin (e.g. margin:0 0 12px 0) were
    // never touched by the normalizer, so those are unchanged.
    const BLOCK_SEL = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, pre';
    editRef.current.querySelectorAll<HTMLElement>(BLOCK_SEL).forEach((el) => {
      const style = el.getAttribute('style') || '';
      // If the only margin-related props are our stamped marginTop/marginBottom=0,
      // remove them. Detect: style contains margin-top/margin-bottom but no
      // shorthand 'margin:' (which indicates a real template margin).
      if (!/\bmargin\s*:/i.test(style)) {
        el.style.marginTop = '';
        el.style.marginBottom = '';
        // Clean up empty style attribute
        if (!el.getAttribute('style')?.trim()) el.removeAttribute('style');
      }
    });

    editRef.current.querySelectorAll('img').forEach((img) => {
      img.removeAttribute('data-section-img');
      (img as HTMLImageElement).style.cursor = '';
      (img as HTMLImageElement).onclick = null;
      (img as HTMLImageElement).ondragstart = null;
      if ((img as HTMLImageElement).style.objectFit === 'fill')
        (img as HTMLImageElement).style.objectFit = 'cover';
      if (!(img as HTMLImageElement).style.display)
        (img as HTMLImageElement).style.display = 'block';
    });

    // Clear figcaptions that are whitespace-only or still contain default placeholder text
    // so they are hidden by the CSS :empty rule in preview / blog post view.
    editRef.current.querySelectorAll('figcaption').forEach((fc) => {
      const text = fc.textContent?.trim() ?? '';
      if (!text || PLACEHOLDER_CAPTION_RE.test(text)) fc.innerHTML = '';
    });

    updateAttributes({ html: editRef.current.innerHTML });
    closeEdit();
  }

  function closeEdit() {
    setSelectedImg(null);
    setPlaceholders([]);
    setEditing(false);
    justClosedRef.current = true;
    setTimeout(() => { justClosedRef.current = false; }, 600);
    if (editor && typeof getPos === 'function') {
      setTimeout(() => {
        try { editor.commands.setTextSelection(getPos() + node.nodeSize); }
        catch { /* ignore */ }
      }, 0);
    }
  }

  function duplicateSection() {
    if (!editor || typeof getPos !== 'function') return;
    try {
      editor.commands.insertContentAt(getPos() + node.nodeSize, {
        type: 'htmlBlock', attrs: { html: node.attrs.html },
      });
    } catch { /* ignore */ }
  }

  function deleteSection() {
    closeEdit();
    setTimeout(() => {
      try {
        const pos = typeof getPos === 'function' ? getPos() : null;
        if (editor && pos != null)
          editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
      } catch { /* ignore */ }
    }, 50);
  }

  // ── Inline section insert ────────────────────────────────────────────────
  const [insertPanel, setInsertPanel] = useState<'before' | 'after' | null>(null);

  function handleSectionInsert(html: string) {
    const pos = typeof getPos === 'function' ? getPos() : null;
    if (pos == null || !editor) return;
    const insertPos = insertPanel === 'before' ? pos : pos + node.nodeSize;
    setInsertPanel(null);
    setHovered(false);
    editor.chain().focus().insertContentAt(insertPos, {
      type: 'htmlBlock',
      attrs: { html, autoEdit: true },
    }).run();
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const PlusRow = ({ slot }: { slot: 'before' | 'after' }) => (
    <div className="flex items-center my-1">
      <div className="flex-1 h-px bg-primary/25" />
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setInsertPanel(p => p === slot ? null : slot);
        }}
        className={`mx-2 w-6 h-6 rounded-full text-white text-base font-bold flex items-center justify-center transition shadow-sm leading-none select-none
          ${insertPanel === slot ? 'bg-primary-dark ring-2 ring-primary/40' : 'bg-primary-light hover:bg-primary-dark'}`}
        title={slot === 'before' ? 'Insert section above' : 'Insert section below'}
      >+</button>
      <div className="flex-1 h-px bg-primary/25" />
    </div>
  );

  return (
    <NodeViewWrapper>
      <div
        onMouseEnter={() => { if (!anyDragging) setHovered(true); }}
        onMouseLeave={() => { if (!insertPanel) setHovered(false); }}
      >
        {/* ── TOP plus + inline panel — hidden during any drag ── */}
        {(hovered || insertPanel === 'before') && !editing && !anyDragging && (
          <>
            <PlusRow slot="before" />
            {insertPanel === 'before' && (
              <div className="mb-2">
                <SectionTemplates
                  onInsert={handleSectionInsert}
                  onClose={() => setInsertPanel(null)}
                />
              </div>
            )}
          </>
        )}

        {/* ── Section card ── */}
        <div
          ref={sectionCardRef}
          data-section-view="true"
          style={
            isDragging
              ? {
                  transform: `translateY(${dragDeltaY}px)`,
                  zIndex: 50,
                  position: 'relative',
                  opacity: 1,
                  background: 'hsl(340deg 45% 55%)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 0 0 2px hsl(340deg 45% 55%)',
                  minHeight: 36,
                  maxHeight: 36,
                  overflow: 'hidden',
                  transition: 'box-shadow 0.12s ease',
                  willChange: 'transform',
                }
              : anyDragging
              ? {
                  transform: `translateY(${shiftY}px)`,
                  transition: 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  maxHeight: 36,
                  overflow: 'hidden',
                  willChange: 'transform',
                }
              : editing
              ? {
                  transform: 'translateY(0)',
                  transition: 'transform 0.3s ease',
                  maxHeight: 9999,
                  overflow: 'visible',
                  cursor: 'text',
                }
              : {
                  transform: 'translateY(0)',
                  transition: 'transform 0.3s ease',
                  maxHeight: 9999,
                  overflow: 'visible',
                }
          }
          className={`relative group my-3 rounded-xl border-2
            ${isDragging ? 'section-is-dragging' : anyDragging ? 'section-drag-dimmed' : ''}
            ${editing ? 'border-primary-light shadow-md cursor-auto' : selected ? 'border-primary-light cursor-grab active:cursor-grabbing' : 'border-gray-200 hover:border-gray-300 cursor-grab active:cursor-grabbing'}`}
          onMouseDown={(e) => {
            if (editing) return;
            // If clicking the ✏️ Edit button or action buttons, don't drag
            if ((e.target as HTMLElement).closest('button')) return;
            startDragReorder(e);
          }}
        >

          {isDragging ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', height: 36, color: 'white', userSelect: 'none' }}>
              <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                <circle cx="2.5" cy="2"  r="1.5" fill="white"/>
                <circle cx="7.5" cy="2"  r="1.5" fill="white"/>
                <circle cx="2.5" cy="8"  r="1.5" fill="white"/>
                <circle cx="7.5" cy="8"  r="1.5" fill="white"/>
                <circle cx="2.5" cy="14" r="1.5" fill="white"/>
                <circle cx="7.5" cy="14" r="1.5" fill="white"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.01em' }}>Moving section…</span>
            </div>
          ) : editing ? (
            <>
              {/* Formatting toolbar */}
              <SectionToolbar editRef={editRef} />

              {/* Action bar */}
              <div className="flex items-center justify-between px-4 py-1.5 bg-primary/10 border-b border-primary/30">
                <span className="text-xs text-primary select-none">
                  {uploading
                    ? <span className="animate-pulse">Uploading image…</span>
                    : <span>Type freely · Click image to resize · <kbd className="px-1 bg-primary/20 rounded text-primary-dark font-mono">Esc</kbd> to cancel</span>
                  }
                </span>
                <div className="flex gap-2">
                  <button onClick={deleteSection}
                    className="px-3 py-1 text-xs border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition">
                    Delete
                  </button>
                  <button onClick={() => { duplicateSection(); closeEdit(); }}
                    className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    Duplicate
                  </button>
                  <button onClick={closeEdit}
                    className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    Cancel
                  </button>
                  <button onClick={saveEdits}
                    className="px-3 py-1 text-xs bg-primary-light text-white rounded-lg hover:bg-primary-dark transition font-medium">
                    Save
                  </button>
                </div>
              </div>

              {/* Editable area */}
              <div ref={containerRef} className="relative">
                <div
                  ref={editRef}
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck={false}
                  className="outline-none px-4 py-3 section-edit-area"
                  style={{
                    caretColor: '#111827',
                    cursor: 'text',
                    color: '#111827',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    minHeight: 60,
                    WebkitUserModify: 'read-write' as any,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      e.stopPropagation();
                      closeEdit();
                    }
                    e.stopPropagation();
                  }}
                  onKeyUp={(e) => e.stopPropagation()}
                  onInput={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Placeholder overlays */}
                {placeholders.map((ph, i) => (
                  <div key={i}
                    onClick={() => handleImageUpload(ph.el)}
                    style={{ position: 'absolute', top: ph.top, left: ph.left, width: ph.width, height: ph.height, zIndex: 10, cursor: 'pointer' }}
                    className="flex flex-col items-center justify-center bg-primary-light/25 border-2 border-dashed border-primary-light rounded-lg hover:bg-primary-light/40 transition group/ph"
                  >
                    <svg className="w-8 h-8 text-primary-light group-hover/ph:text-primary-dark transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 16.5V18a1.5 1.5 0 001.5 1.5h15A1.5 1.5 0 0021 18v-1.5M12 3v12m0 0l-3.5-3.5M12 15l3.5-3.5" />
                    </svg>
                    <span className="text-xs text-primary font-medium mt-1 group-hover/ph:text-primary-dark">Click to upload</span>
                  </div>
                ))}

                {/* Image resize overlay */}
                {selectedImg && (
                  <div style={{ position: 'absolute', top: selectedImg.top, left: selectedImg.left, width: selectedImg.width, height: selectedImg.height, pointerEvents: 'none' }}>
                    <div className="absolute inset-0 border-2 border-primary-light rounded pointer-events-none" />
                    <div style={{ position: 'absolute', top: -36, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto', whiteSpace: 'nowrap', zIndex: 50 }}
                      className="flex items-center gap-1 bg-gray-900 text-white text-xs rounded-lg px-2 py-1 shadow-lg">
                      <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleImageUpload(selectedImg.el); }}
                        className="px-2 py-0.5 bg-primary/100 hover:bg-primary-light rounded text-xs transition">Replace</button>
                      <span className="text-gray-500 mx-0.5">|</span>
                      {[25, 50, 75, 100].map(pct => (
                        <button key={pct}
                          onMouseDown={(e) => {
                            e.preventDefault(); e.stopPropagation();
                            if (!containerRef.current) return;
                            const img = selectedImg.el;
                            const wrapper = img.parentElement;
                            if (wrapper && wrapper !== editRef.current && getComputedStyle(wrapper.parentElement!).display === 'flex') {
                              wrapper.style.width = `${pct}%`;
                              wrapper.style.maxWidth = '100%';
                              wrapper.style.flexShrink = '1';
                              img.style.width = '100%';
                              img.style.height = '';
                            } else {
                              img.style.width = `${pct}%`;
                              img.style.maxWidth = '100%';
                              img.style.height = '';
                            }
                            img.style.objectFit = 'cover';
                            setTimeout(refreshSelection, 30);
                          }}
                          className="px-1.5 py-0.5 hover:bg-gray-700 rounded transition">{pct}%</button>
                      ))}
                      <span className="text-gray-500 ml-1 text-[10px]">
                        {Math.round(selectedImg.width)}×{Math.round(selectedImg.height)}
                      </span>
                    </div>
                    {ALL_HANDLES.map(({ pos, style, cursor }) => (
                      <div key={pos}
                        style={{ position: 'absolute', ...style as any, cursor, pointerEvents: 'auto', width: 10, height: 10 }}
                        className="bg-white border-2 border-primary-light rounded-sm shadow"
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

              {!anyDragging && (
                <button
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); justClosedRef.current = false; setEditing(true); }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-primary-light hover:bg-primary-dark text-white text-[11px] rounded-lg shadow pointer-events-auto z-10"
                >
                  ✏️ Edit
                </button>
              )}

              {!selected && !anyDragging && (
                <div className="absolute inset-x-0 bottom-0 hidden group-hover:flex items-center justify-center py-1 bg-black/50 text-white text-[11px] rounded-b-xl pointer-events-none">
                  ⠿ Drag to reorder · Click to edit · Select &amp; Delete to remove
                </div>
              )}
              {selected && !anyDragging && (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 py-1 bg-primary/100/80 text-white text-[11px] rounded-b-xl pointer-events-auto">
                  <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); justClosedRef.current = false; setEditing(true); }}
                    className="underline hover:no-underline">Edit</button>
                  <span>·</span>
                  <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); duplicateSection(); }}
                    className="underline hover:no-underline">Duplicate</button>
                  <span>·</span>
                  <span>Press <kbd className="mx-1 px-1 bg-white/20 rounded">Backspace</kbd> to delete</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── BOTTOM plus + inline panel — hidden during any drag ── */}
        {(hovered || insertPanel === 'after') && !editing && !anyDragging && (
          <>
            {insertPanel === 'after' && (
              <div className="mt-2">
                <SectionTemplates
                  onInsert={handleSectionInsert}
                  onClose={() => setInsertPanel(null)}
                />
              </div>
            )}
            <PlusRow slot="after" />
          </>
        )}

      </div>
    </NodeViewWrapper>
  );
}
