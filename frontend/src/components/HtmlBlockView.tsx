'use client';

import { NodeViewWrapper } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';

export function HtmlBlockView({ node, updateAttributes }: { node: any; updateAttributes: any }) {
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const editRef = useRef<HTMLDivElement>(null);

  // When entering edit mode, set content and wire up image click handlers
  useEffect(() => {
    if (!editing || !editRef.current) return;
    editRef.current.innerHTML = node.attrs.html;
    wireImageClicks(editRef.current);
  }, [editing]);

  function wireImageClicks(container: HTMLDivElement) {
    container.querySelectorAll('img').forEach((img) => {
      img.style.cursor = 'pointer';
      img.title = 'Click to replace image';
      img.setAttribute('data-upload-target', 'true');
      img.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleImageClick(img);
      };
    });
  }

  function handleImageClick(img: HTMLImageElement) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) {
          img.src = data.url;
          img.removeAttribute('srcset');
        } else {
          alert('Upload failed — please try again.');
        }
      } catch {
        alert('Upload failed — please try again.');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

  function saveEdits() {
    if (!editRef.current) { setEditing(false); return; }
    // Strip temp attributes before saving
    editRef.current.querySelectorAll('img').forEach((img) => {
      img.removeAttribute('title');
      img.removeAttribute('data-upload-target');
      img.style.cursor = '';
      img.onclick = null;
    });
    updateAttributes({ html: editRef.current.innerHTML });
    setEditing(false);
  }

  function cancelEdits() {
    setEditing(false);
  }

  return (
    <NodeViewWrapper>
      <div className={`relative group my-3 rounded-xl border-2 transition-colors ${editing ? 'border-pink-400 shadow-md' : 'border-dashed border-pink-200 hover:border-pink-300'}`}>

        {editing ? (
          <>
            {/* Edit mode toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-pink-50 border-b border-pink-200 rounded-t-xl">
              <span className="text-xs text-pink-700 font-medium">
                ✏️ Click text to edit &nbsp;·&nbsp; Click any image to replace it
                {uploading && <span className="ml-2 text-pink-400">Uploading…</span>}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={cancelEdits}
                  className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdits}
                  className="px-3 py-1 text-xs bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition font-medium"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Editable content — images get click-to-upload, text is directly editable */}
            <div
              ref={editRef}
              contentEditable
              suppressContentEditableWarning
              className="outline-none px-4 py-3 [&_img]:transition-all [&_img]:hover:opacity-75 [&_img]:hover:ring-2 [&_img]:hover:ring-pink-400 [&_img]:hover:ring-offset-1 [&_img]:rounded"
            />
          </>
        ) : (
          <>
            {/* View mode */}
            <div
              dangerouslySetInnerHTML={{ __html: node.attrs.html }}
              className="pointer-events-none px-4 py-3"
            />

            {/* Hover actions */}
            <div className="absolute top-2 right-2 hidden group-hover:flex gap-1.5">
              <button
                onClick={() => setEditing(true)}
                className="px-2.5 py-1 bg-white border border-gray-200 shadow-sm text-xs rounded-lg hover:border-pink-300 hover:text-pink-600 transition font-medium"
              >
                ✏️ Edit
              </button>
            </div>

            <div className="absolute inset-x-0 bottom-0 hidden group-hover:flex items-center justify-center py-1 bg-black/60 text-white text-[11px] rounded-b-xl">
              Select &amp; press <kbd className="mx-1 px-1 py-0.5 bg-white/20 rounded text-[10px]">Delete</kbd> to remove this block
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}
