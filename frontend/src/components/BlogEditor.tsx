'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Blog } from '@/types/index';
import SectionTemplates from './SectionTemplates';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

// Dynamically import to avoid SSR issues with TipTap
const RichTextEditor = dynamic(() => import('./RichTextEditor'), { ssr: false });

interface BlogEditorProps {
  initialData?: Partial<Blog>;
  onSave: (data: { title: string; content: string; excerpt: string; status: 'draft' | 'published' }) => Promise<void>;
}

// Decode TipTap sentinel divs back to raw section HTML for display/save
function decodeSentinels(html: string) {
  return html.replace(
    /<div data-html-block="([^"]*)"[^>]*><\/div>/g,
    (_, encoded) => decodeURIComponent(encoded)
  );
}

// Strip figcaptions that are empty or contain only template placeholder text
const PLACEHOLDER_CAPTION_RE = /^(caption|caption for image|caption one|caption two|caption three|add a caption)/i;
function cleanFigcaptions(html: string) {
  return html.replace(/<figcaption([^>]*)>([\s\S]*?)<\/figcaption>/gi, (match, attrs, inner) => {
    const text = inner.replace(/<[^>]*>/g, '').trim();
    if (!text || PLACEHOLDER_CAPTION_RE.test(text)) return `<figcaption${attrs}></figcaption>`;
    return match;
  });
}

// ── Draft persistence (localStorage) ────────────────────────────────────────
interface DraftData {
  title: string;
  content: string;
  excerpt: string;
  savedAt: number; // timestamp ms
}

function draftKey(userId: string, id?: string) {
  return id ? `blog_draft_${userId}_${id}` : `blog_draft_${userId}_new`;
}

function readDraft(userId: string, id?: string): DraftData | null {
  try {
    const raw = localStorage.getItem(draftKey(userId, id));
    return raw ? (JSON.parse(raw) as DraftData) : null;
  } catch {
    return null;
  }
}

function writeDraft(userId: string, id: string | undefined, data: DraftData) {
  try {
    localStorage.setItem(draftKey(userId, id), JSON.stringify(data));
  } catch {}
}

function clearDraft(userId: string, id?: string) {
  try {
    localStorage.removeItem(draftKey(userId, id));
  } catch {}
}

export default function BlogEditor({ initialData, onSave }: BlogEditorProps) {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [previewMode, setPreviewMode] = useState(false);
  const [showSections, setShowSections] = useState(false);
  const [started, setStarted] = useState(!!(initialData?.content && initialData.content !== '<p></p>'));
  const [error, setError] = useState('');
  // null = idle, 'draft' | 'published' = that action is in flight
  const [savingAction, setSavingAction] = useState<'draft' | 'published' | null>(null);
  // Timestamp of last successful localStorage auto-save
  const [lastAutoSaved, setLastAutoSaved] = useState<number | null>(null);

  // Draft recovery banner
  const [pendingDraft, setPendingDraft] = useState<DraftData | null>(null);
  // Incrementing this key forces RichTextEditor to remount with the restored content
  const [editorKey, setEditorKey] = useState(0);

  const insertFnRef = useRef<((html: string) => void) | null>(null);
  const insertAtFnRef = useRef<((pos: number, html: string) => void) | null>(null);
  const focusFnRef = useRef<(() => void) | null>(null);
  const pendingInsertPosRef = useRef<number | null>(null);
  // Holds a section HTML that was chosen before the visible editor mounted
  const pendingSectionRef = useRef<string | null>(null);
  const sectionsPanelRef = useRef<HTMLDivElement>(null);
  const sectionsButtonRef = useRef<HTMLButtonElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── On mount: check for a saved draft (only once userId is available) ─────
  useEffect(() => {
    if (!userId) return; // wait until auth is resolved
    const draft = readDraft(userId, initialData?.id);
    if (!draft) return;

    // Only surface the banner if the draft differs from the current saved state
    const isSameAsServer =
      draft.title === (initialData?.title || '') &&
      draft.content === (initialData?.content || '') &&
      draft.excerpt === (initialData?.excerpt || '');

    if (!isSameAsServer) setPendingDraft(draft);
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-save to localStorage (debounced 1.5 s) ───────────────────────────
  useEffect(() => {
    if (!userId) return; // don't save until we know who the user is
    // Don't auto-save while a draft restore banner is visible — wait for user's decision
    if (pendingDraft) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      // Skip saving blank new blogs — nothing worth preserving
      if (!title.trim() && (!content || content === '<p></p>') && !excerpt.trim()) return;
      const now = Date.now();
      writeDraft(userId, initialData?.id, { title, content, excerpt, savedAt: now });
      setLastAutoSaved(now);
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [title, content, excerpt, pendingDraft, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Draft banner actions ──────────────────────────────────────────────────
  const restoreDraft = () => {
    if (!pendingDraft) return;
    // Update all three fields first, then bump editorKey to remount
    // RichTextEditor so it picks up the restored content prop
    setTitle(pendingDraft.title);
    setExcerpt(pendingDraft.excerpt);
    setContent(pendingDraft.content);
    setEditorKey(k => k + 1);
    setPendingDraft(null);
  };

  const discardDraft = () => {
    clearDraft(userId, initialData?.id);
    setPendingDraft(null);
  };

  // Listen for + button events from HtmlBlockView
  useEffect(() => {
    const handler = (e: Event) => {
      const { insertPos } = (e as CustomEvent).detail;
      pendingInsertPosRef.current = insertPos;
      setShowSections(true);
    };
    window.addEventListener('open-section-insert', handler);
    return () => window.removeEventListener('open-section-insert', handler);
  }, []);

  // Close sections panel when clicking outside it
  useEffect(() => {
    if (!showSections) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        sectionsPanelRef.current && !sectionsPanelRef.current.contains(target) &&
        sectionsButtonRef.current && !sectionsButtonRef.current.contains(target)
      ) {
        setShowSections(false);
        pendingInsertPosRef.current = null;
      }
    };
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler); };
  }, [showSections]);

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (savingAction) return; // prevent double-submit
    setError('');
    if (!title.trim()) { setError('Title is required'); return; }
    if (!content || content === '<p></p>') { setError('Content is required'); return; }

    setSavingAction(status);
    try {
      await onSave({ title: title.trim(), content, excerpt: excerpt.trim(), status });
      // Clear the draft only after a confirmed successful save
      clearDraft(userId, initialData?.id);
      setLastAutoSaved(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save blog');
    } finally {
      setSavingAction(null);
    }
  };

  const insertSection = (html: string) => {
    const pos = pendingInsertPosRef.current;
    pendingInsertPosRef.current = null;
    if (pos !== null && insertAtFnRef.current) {
      insertAtFnRef.current(pos, html);
    } else if (insertFnRef.current) {
      insertFnRef.current(html);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {initialData?.id ? 'Edit Blog' : 'New Blog'}
        </h1>

        <div className="flex items-center gap-3">
          <button
            ref={sectionsButtonRef}
            type="button"
            onClick={() => !previewMode && setShowSections(v => !v)}
            disabled={previewMode}
            className={`px-4 py-2 border rounded-lg text-sm transition
              ${previewMode
                ? 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed opacity-50'
                : showSections
                  ? 'border-primary-light bg-primary/10 text-primary-dark'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
          >
            ⊞ Sections
          </button>
          <button
            type="button"
            onClick={() => { setPreviewMode(v => { if (!v) setShowSections(false); return !v; }); }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            {previewMode ? '✏️ Edit' : '👁 Preview'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={!!savingAction}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50"
          >
            {savingAction === 'draft' ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('published')}
            disabled={!!savingAction}
            className="px-4 py-2 bg-primary-light text-white rounded-lg text-sm hover:bg-primary-dark transition disabled:opacity-50 font-medium"
          >
            {savingAction === 'published' ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>

      {/* ── Draft recovery banner ── */}
      {pendingDraft && (
        <div className="mb-5 flex items-center justify-between gap-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <span className="text-base">⚠️</span>
            <span>
              Unsaved changes found from{' '}
              <span className="font-semibold">
                {formatDistanceToNow(new Date(pendingDraft.savedAt), { addSuffix: true })}
              </span>
              . Restore them?
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={restoreDraft}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition"
            >
              Restore
            </button>
            <button
              type="button"
              onClick={discardDraft}
              className="px-3 py-1.5 border border-amber-300 text-amber-700 hover:bg-amber-100 text-xs font-medium rounded-lg transition"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {previewMode ? (
        /* Preview Mode */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-8 border-b border-gray-100">
            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
              {title || <span className="text-gray-300">Untitled</span>}
            </h2>
            {excerpt && <p className="text-gray-500 mt-3 text-lg">{excerpt}</p>}
          </div>
          <div
            className="prose prose-lg max-w-none p-8 text-gray-700"
            dangerouslySetInnerHTML={{ __html: cleanFigcaptions(decodeSentinels(content)) || '<p class="text-gray-300">No content yet…</p>' }}
          />
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-5">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Blog title..."
              className="w-full px-0 py-2 text-3xl font-bold border-0 border-b-2 border-gray-200 focus:border-primary focus:outline-none bg-transparent placeholder-gray-300"
            />
          </div>

          {/* Excerpt */}
          <div>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short description (excerpt) — optional"
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Section Templates Panel — shown above the canvas when picking */}
          {showSections && (
            <div ref={sectionsPanelRef}>
              <SectionTemplates
                onInsert={(html) => {
                  setShowSections(false);
                  if (started) {
                    // Editor already mounted — insert directly
                    insertSection(html);
                  } else {
                    // Editor not yet visible — stash and flush in onReady
                    pendingSectionRef.current = html;
                    setStarted(true);
                  }
                }}
                onClose={() => { setShowSections(false); pendingInsertPosRef.current = null; }}
                onBlankCanvas={() => {
                  setStarted(true);
                  setShowSections(false);
                  pendingInsertPosRef.current = null;
                  setTimeout(() => focusFnRef.current?.(), 50);
                }}
              />
            </div>
          )}

          {/* Canvas — big + when not started, editor once started */}
          {!started ? (
            <button
              type="button"
              onClick={() => setShowSections(true)}
              className="w-full min-h-[380px] flex flex-col items-center justify-center gap-4
                border-2 border-dashed border-gray-200 rounded-xl bg-white
                hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
            >
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 group-hover:border-primary/50 group-hover:bg-primary/10 flex items-center justify-center transition">
                <span className="text-4xl leading-none text-gray-300 group-hover:text-primary transition select-none">+</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-400 group-hover:text-primary-dark transition">Click to start your blog</p>
                <p className="text-xs text-gray-300 group-hover:text-primary/50 transition mt-1">Pick a section layout or write on a blank canvas</p>
              </div>
            </button>
          ) : (
            <RichTextEditor
              key={editorKey}
              content={content}
              onChange={setContent}
              placeholder="Start writing your blog..."
              onReady={(fn) => {
                insertFnRef.current = fn;
                // Flush any section chosen before this editor mounted
                if (pendingSectionRef.current) {
                  fn(pendingSectionRef.current);
                  pendingSectionRef.current = null;
                }
              }}
              onInsertAtReady={(fn) => { insertAtFnRef.current = fn; }}
              onFocusReady={(fn) => { focusFnRef.current = fn; }}
            />
          )}

          {/* TipTap must be mounted to wire up refs — keep hidden until started */}
          {!started && (
            <div className="hidden">
              <RichTextEditor
                key={editorKey}
                content={content}
                onChange={setContent}
                onReady={(fn) => { insertFnRef.current = fn; }}
                onInsertAtReady={(fn) => { insertAtFnRef.current = fn; }}
                onFocusReady={(fn) => { focusFnRef.current = fn; }}
              />
            </div>
          )}

          {/* Auto-save indicator */}
          {!pendingDraft && (title.trim() || (content && content !== '<p></p>')) && (
            <p className="text-xs text-gray-400 text-right">
              Draft auto-saved locally
            </p>
          )}
        </div>
      )}
    </div>
  );
}