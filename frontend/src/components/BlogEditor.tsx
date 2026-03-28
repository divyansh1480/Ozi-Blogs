'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Blog } from '@/types/index';
import SectionTemplates from './SectionTemplates';

// Dynamically import to avoid SSR issues with TipTap
const RichTextEditor = dynamic(() => import('./RichTextEditor'), { ssr: false });

interface BlogEditorProps {
  initialData?: Partial<Blog>;
  onSave: (data: { title: string; content: string; excerpt: string; status: 'draft' | 'published' }) => Promise<void>;
  saving?: boolean;
}

export default function BlogEditor({ initialData, onSave, saving }: BlogEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [previewMode, setPreviewMode] = useState(false);
  const [showSections, setShowSections] = useState(false);
  const [error, setError] = useState('');
  const insertFnRef = useRef<((html: string) => void) | null>(null);

  const handleSubmit = async (status: 'draft' | 'published') => {
    setError('');
    if (!title.trim()) { setError('Title is required'); return; }
    if (!content || content === '<p></p>') { setError('Content is required'); return; }

    try {
      await onSave({ title: title.trim(), content, excerpt: excerpt.trim(), status });
    } catch (err: any) {
      setError(err.message || 'Failed to save blog');
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
            type="button"
            onClick={() => !previewMode && setShowSections(v => !v)}
            disabled={previewMode}
            className={`px-4 py-2 border rounded-lg text-sm transition
              ${previewMode
                ? 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed opacity-50'
                : showSections
                  ? 'border-pink-400 bg-pink-50 text-pink-600'
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
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('published')}
            disabled={saving}
            className="px-4 py-2 bg-pink-400 text-white rounded-lg text-sm hover:bg-pink-500 transition disabled:opacity-50 font-medium"
          >
            {saving ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

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
            dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-300">No content yet…</p>' }}
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
              className="w-full px-0 py-2 text-3xl font-bold border-0 border-b-2 border-gray-200 focus:border-pink-500 focus:outline-none bg-transparent placeholder-gray-300"
            />
          </div>

          {/* Excerpt */}
          <div>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short description (excerpt) — optional"
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
            />
          </div>

          {/* Section Templates Panel */}
          {showSections && (
            <SectionTemplates
              onInsert={(html) => {
                if (insertFnRef.current) {
                  insertFnRef.current(html);
                } else {
                  alert('Editor not ready yet — please wait a moment and try again.');
                }
              }}
              onClose={() => setShowSections(false)}
            />
          )}

          {/* Editor */}
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your blog..."
            onReady={(fn) => { insertFnRef.current = fn; }}
          />
        </div>
      )}
    </div>
  );
}
