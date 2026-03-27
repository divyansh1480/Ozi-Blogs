'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { ResizableImage } from './ResizableImageExtension';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';

import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { useRef, useState, useEffect } from 'react';
import { HtmlBlock } from './HtmlBlockExtension';

// Extend TextStyle to support fontSize attribute
const CustomTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.fontSize || null,
        renderHTML: (attrs: Record<string, any>) => {
          if (!attrs.fontSize) return {};
          return { style: `font-size: ${attrs.fontSize}` };
        },
      },
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onReady?: (insertFn: (html: string) => void) => void;
}

const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Arial', value: 'Arial, sans-serif' },
];

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px'];

const TEXT_COLORS = [
  '#111827', '#374151', '#6B7280', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899',
];

const HIGHLIGHT_COLORS = [
  '#FEF08A', '#BBF7D0', '#BFDBFE', '#F5D0FE', '#FED7AA', '#FECACA',
];

export default function RichTextEditor({ content, onChange, placeholder, onReady }: RichTextEditorProps) {
  const imageFileRef = useRef<HTMLInputElement>(null);
  const [showImageUrl, setShowImageUrl] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      ResizableImage.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: placeholder || 'Write your blog content here...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      CustomTextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      HtmlBlock,
    ],
    content,
    onUpdate: ({ editor }) => {
      // Decode htmlBlock sentinels back to raw HTML before saving
      const raw = editor.getHTML();
      const clean = raw.replace(
        /<div data-html-block="([^"]*)"[^>]*><\/div>/g,
        (_, encoded) => decodeURIComponent(encoded)
      );
      onChange(clean);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none min-h-[500px] px-5 py-4 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && onReady) {
      onReady((html: string) => {
        editor.chain().focus().insertContent({
          type: 'htmlBlock',
          attrs: { html },
        }).run();
      });
    }
  }, [editor]);

  if (!editor) return null;

  const wordCount = editor.getText().trim().split(/\s+/).filter(Boolean).length;

  const Btn = ({
    onClick, active, children, title, disabled,
  }: {
    onClick: () => void; active?: boolean; children: React.ReactNode; title: string; disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`px-2 py-1 rounded text-sm font-medium transition select-none ${
        active ? 'bg-pink-100 text-pink-600' : 'hover:bg-gray-100 text-gray-700'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  const Sep = () => <div className="w-px h-5 bg-gray-200 mx-0.5 shrink-0" />;

  const insertImageFromUrl = () => {
    if (imageUrl.trim()) {
      editor.chain().focus().setImage({ src: imageUrl.trim() }).run();
      setImageUrl('');
      setShowImageUrl(false);
    }
  };

  const insertImageFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Upload failed');
        return;
      }
      const { url } = await res.json();
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      alert('Upload failed. Please try again.');
    }
  };

  const setLink = () => {
    if (linkUrl.trim()) {
      editor.chain().focus().setLink({ href: linkUrl.trim() }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setLinkUrl('');
    setShowLinkInput(false);
  };

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-pink-400 bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50">

        {/* Font Family */}
        <select
          title="Font family"
          onChange={(e) => {
            if (e.target.value) editor.chain().focus().setFontFamily(e.target.value).run();
            else editor.chain().focus().unsetFontFamily().run();
          }}
          className="text-xs text-gray-700 bg-white border border-gray-200 rounded px-1.5 py-1 hover:border-gray-300 focus:outline-none max-w-[110px]"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* Font Size (via mark-based workaround using inline style) */}
        <select
          title="Font size"
          onChange={(e) => {
            if (e.target.value) {
              editor.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run();
            }
          }}
          className="text-xs text-gray-700 bg-white border border-gray-200 rounded px-1.5 py-1 hover:border-gray-300 focus:outline-none w-[68px]"
        >
          <option value="">Size</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <Sep />

        {/* Text formatting */}
        <Btn title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
          <strong>B</strong>
        </Btn>
        <Btn title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
          <em>I</em>
        </Btn>
        <Btn title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}>
          <span className="underline">U</span>
        </Btn>
        <Btn title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
          <s>S</s>
        </Btn>

        <Sep />

        {/* Headings */}
        <Btn title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}>H1</Btn>
        <Btn title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>H2</Btn>
        <Btn title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>H3</Btn>

        <Sep />

        {/* Alignment */}
        <Btn title="Align left" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}>
          ≡
        </Btn>
        <Btn title="Align center" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}>
          ☰
        </Btn>
        <Btn title="Align right" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}>
          ≣
        </Btn>
        <Btn title="Justify" onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })}>
          ⊟
        </Btn>

        <Sep />

        {/* Lists */}
        <Btn title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
          • List
        </Btn>
        <Btn title="Ordered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
          1. List
        </Btn>

        <Sep />

        {/* Text color */}
        <div className="relative group">
          <button
            type="button"
            title="Text color"
            className="px-2 py-1 rounded hover:bg-gray-100 text-gray-700 text-sm font-medium"
          >
            A
          </button>
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20 hidden group-hover:flex flex-wrap gap-1 w-32">
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                onClick={() => editor.chain().focus().setColor(color).run()}
                className="w-5 h-5 rounded-full border border-gray-200 hover:scale-110 transition"
                style={{ backgroundColor: color }}
              />
            ))}
            <button
              type="button"
              title="Reset color"
              onClick={() => editor.chain().focus().unsetColor().run()}
              className="text-xs text-gray-500 hover:text-gray-700 mt-1 w-full text-left"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Highlight */}
        <div className="relative group">
          <button
            type="button"
            title="Highlight"
            className="px-2 py-1 rounded hover:bg-gray-100 text-gray-700 text-sm font-medium"
          >
            <span className="bg-yellow-200 px-0.5">H</span>
          </button>
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20 hidden group-hover:flex flex-wrap gap-1 w-28">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                onClick={() => editor.chain().focus().setHighlight({ color }).run()}
                className="w-5 h-5 rounded border border-gray-200 hover:scale-110 transition"
                style={{ backgroundColor: color }}
              />
            ))}
            <button
              type="button"
              title="Remove highlight"
              onClick={() => editor.chain().focus().unsetHighlight().run()}
              className="text-xs text-gray-500 hover:text-gray-700 mt-1 w-full text-left"
            >
              Remove
            </button>
          </div>
        </div>

        <Sep />

        {/* Blockquote / Code */}
        <Btn title="Block quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
          ❝
        </Btn>
        <Btn title="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')}>
          {'</>'}
        </Btn>
        <Btn title="Inline code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}>
          `‍`
        </Btn>

        <Sep />

        {/* Link */}
        <div className="relative">
          <Btn
            title="Add link"
            onClick={() => {
              const prev = editor.getAttributes('link').href || '';
              setLinkUrl(prev);
              setShowLinkInput((v) => !v);
              setShowImageUrl(false);
            }}
            active={editor.isActive('link')}
          >
            🔗
          </Btn>
          {showLinkInput && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20 flex gap-1" style={{ minWidth: 260 }}>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setLink()}
                placeholder="https://..."
                className="text-xs border border-gray-200 rounded px-2 py-1 flex-1 focus:outline-none focus:ring-1 focus:ring-pink-400"
                autoFocus
              />
              <button type="button" onClick={setLink} className="text-xs bg-pink-400 text-white px-2 py-1 rounded hover:bg-pink-500">OK</button>
              <button type="button" onClick={() => setShowLinkInput(false)} className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
            </div>
          )}
        </div>

        {/* Image from URL */}
        <div className="relative">
          <Btn
            title="Insert image from URL"
            onClick={() => {
              setShowImageUrl((v) => !v);
              setShowLinkInput(false);
            }}
          >
            🌐
          </Btn>
          {showImageUrl && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20 flex gap-1" style={{ minWidth: 280 }}>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && insertImageFromUrl()}
                placeholder="https://example.com/image.jpg"
                className="text-xs border border-gray-200 rounded px-2 py-1 flex-1 focus:outline-none focus:ring-1 focus:ring-pink-400"
                autoFocus
              />
              <button type="button" onClick={insertImageFromUrl} className="text-xs bg-pink-400 text-white px-2 py-1 rounded hover:bg-pink-500">Insert</button>
              <button type="button" onClick={() => setShowImageUrl(false)} className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
            </div>
          )}
        </div>

        {/* Image from PC */}
        <button
          type="button"
          title="Upload image from PC"
          onClick={() => imageFileRef.current?.click()}
          className="px-2 py-1 rounded text-sm hover:bg-gray-100 text-gray-700 transition"
        >
          📁
        </button>
        <input ref={imageFileRef} type="file" accept="image/*" onChange={insertImageFromFile} className="hidden" />

        {/* Horizontal rule */}
        <Btn title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          —
        </Btn>

        <Sep />

        {/* Undo / Redo */}
        <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()}>↺</Btn>
        <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()}>↻</Btn>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* Status bar */}
      <div className="flex items-center justify-end px-4 py-1.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
        {wordCount} words
      </div>
    </div>
  );
}
