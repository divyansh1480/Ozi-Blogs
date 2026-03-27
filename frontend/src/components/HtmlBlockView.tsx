'use client';

import { NodeViewWrapper } from '@tiptap/react';

export function HtmlBlockView({ node }: { node: any }) {
  return (
    <NodeViewWrapper>
      <div
        contentEditable={false}
        className="relative group my-3 rounded-xl border-2 border-dashed border-pink-200 hover:border-pink-400 transition-colors"
      >
        {/* Rendered section preview */}
        <div
          dangerouslySetInnerHTML={{ __html: node.attrs.html }}
          className="pointer-events-none"
        />
        {/* Hover label */}
        <div className="absolute inset-x-0 bottom-0 hidden group-hover:flex items-center justify-center py-1 bg-pink-400/90 text-white text-xs rounded-b-xl">
          📐 Section block — select &amp; press Delete to remove
        </div>
      </div>
    </NodeViewWrapper>
  );
}
