'use client';

import { useState } from 'react';

interface Section {
  id: string;
  label: string;
  description: string;
  preview: React.ReactNode;
  html: string;
}

const PLACEHOLDER_IMG = 'https://placehold.co/800x400/fce7f3/f472b6?text=Image';
const PLACEHOLDER_IMG_WIDE = 'https://placehold.co/1200x500/fce7f3/f472b6?text=Banner+Image';
const PLACEHOLDER_IMG_SQ = 'https://placehold.co/400x400/fce7f3/f472b6?text=Image';

// ── Preview building blocks ────────────────────────────────────────────────
const ImgBox = ({ w = '100%', h = '100%', radius = 4 }: { w?: string; h?: string; radius?: number }) => (
  <div style={{ width: w, height: h, background: 'linear-gradient(135deg,#fce7f3,#fbcfe8)', borderRadius: radius, flexShrink: 0 }} />
);
const TextLines = ({ lines = [70, 100, 80] }: { lines?: number[] }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
    {lines.map((w, i) => (
      <div key={i} style={{ height: i === 0 ? 7 : 5, background: i === 0 ? '#d1d5db' : '#e5e7eb', borderRadius: 3, width: `${w}%` }} />
    ))}
  </div>
);

const CATEGORIES = ['Image + Text', 'Layouts', 'Content Blocks'] as const;
type Category = typeof CATEGORIES[number];

const SECTIONS: (Section & { category: Category })[] = [
  // ── Image + Text ──────────────────────────────────────────────────────────
  {
    id: 'img-left-text-right',
    category: 'Image + Text',
    label: 'Image Left',
    description: 'Image on left, text on right',
    preview: (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', height: 56 }}>
        <ImgBox w="42%" h="100%" />
        <TextLines lines={[65, 100, 85, 60]} />
      </div>
    ),
    html: `<div style="display:flex;gap:28px;align-items:flex-start;margin:32px 0;flex-wrap:wrap">
  <div style="flex-shrink:0;width:42%;min-width:220px">
    <img src="${PLACEHOLDER_IMG_SQ}" style="width:100%;border-radius:10px;object-fit:cover" alt="Section image" />
  </div>
  <div style="flex:1;min-width:220px;padding-top:8px">
    <h3 style="margin:0 0 12px 0;font-size:1.4rem;font-weight:700;color:#111827">Section Heading</h3>
    <p style="color:#374151;line-height:1.8;margin:0 0 12px 0">Replace this with your content. You can write multiple paragraphs, add formatting, or include links to other resources.</p>
    <p style="color:#374151;line-height:1.8;margin:0">Add more detail here to give your readers a deeper understanding of the topic.</p>
  </div>
</div>`,
  },
  {
    id: 'text-left-img-right',
    category: 'Image + Text',
    label: 'Image Right',
    description: 'Text on left, image on right',
    preview: (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', height: 56 }}>
        <TextLines lines={[65, 100, 85, 60]} />
        <ImgBox w="42%" h="100%" />
      </div>
    ),
    html: `<div style="display:flex;gap:28px;align-items:flex-start;margin:32px 0;flex-wrap:wrap">
  <div style="flex:1;min-width:220px;padding-top:8px">
    <h3 style="margin:0 0 12px 0;font-size:1.4rem;font-weight:700;color:#111827">Section Heading</h3>
    <p style="color:#374151;line-height:1.8;margin:0 0 12px 0">Replace this with your content. You can write multiple paragraphs, add formatting, or include links to other resources.</p>
    <p style="color:#374151;line-height:1.8;margin:0">Add more detail here to give your readers a deeper understanding of the topic.</p>
  </div>
  <div style="flex-shrink:0;width:42%;min-width:220px">
    <img src="${PLACEHOLDER_IMG_SQ}" style="width:100%;border-radius:10px;object-fit:cover" alt="Section image" />
  </div>
</div>`,
  },
  {
    id: 'img-top-text-below',
    category: 'Image + Text',
    label: 'Image Top',
    description: 'Image on top, text content below',
    preview: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: 56 }}>
        <ImgBox h="55%" radius={4} />
        <TextLines lines={[60, 100, 80]} />
      </div>
    ),
    html: `<div style="margin:32px 0">
  <img src="${PLACEHOLDER_IMG}" style="width:100%;border-radius:12px;object-fit:cover;max-height:420px;display:block" alt="Section image" />
  <div style="margin-top:20px">
    <h3 style="margin:0 0 12px 0;font-size:1.4rem;font-weight:700;color:#111827">Section Heading</h3>
    <p style="color:#374151;line-height:1.8;margin:0 0 12px 0">Replace this with your content. This layout is great for showcasing a visual first, then explaining it in detail below.</p>
    <p style="color:#374151;line-height:1.8;margin:0">Add more context, tips, or takeaways below the image.</p>
  </div>
</div>`,
  },
  {
    id: 'text-top-img-below',
    category: 'Image + Text',
    label: 'Image Bottom',
    description: 'Text heading and body, image below',
    preview: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: 56 }}>
        <TextLines lines={[60, 100, 80]} />
        <ImgBox h="45%" radius={4} />
      </div>
    ),
    html: `<div style="margin:32px 0">
  <h3 style="margin:0 0 12px 0;font-size:1.4rem;font-weight:700;color:#111827">Section Heading</h3>
  <p style="color:#374151;line-height:1.8;margin:0 0 20px 0">Introduce the topic in this text block. This layout works well when you want readers to understand the context before seeing the visual.</p>
  <img src="${PLACEHOLDER_IMG}" style="width:100%;border-radius:12px;object-fit:cover;max-height:420px;display:block" alt="Section image" />
</div>`,
  },
  {
    id: 'img-img-side',
    category: 'Image + Text',
    label: 'Two Images',
    description: 'Two images side by side',
    preview: (
      <div style={{ display: 'flex', gap: 6, height: 56 }}>
        {[0, 1].map(i => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <ImgBox h="75%" radius={4} />
            <div style={{ height: 4, background: '#e5e7eb', borderRadius: 3, width: '65%', margin: '0 auto' }} />
          </div>
        ))}
      </div>
    ),
    html: `<div style="display:flex;gap:16px;margin:32px 0;flex-wrap:wrap">
  <figure style="flex:1;min-width:200px;margin:0;text-align:center">
    <img src="${PLACEHOLDER_IMG_SQ}" style="width:100%;border-radius:10px;object-fit:cover" alt="Image 1" />
    <figcaption style="margin-top:8px;font-size:0.8rem;color:#6B7280;font-style:italic">Caption for image one</figcaption>
  </figure>
  <figure style="flex:1;min-width:200px;margin:0;text-align:center">
    <img src="${PLACEHOLDER_IMG_SQ}" style="width:100%;border-radius:10px;object-fit:cover" alt="Image 2" />
    <figcaption style="margin-top:8px;font-size:0.8rem;color:#6B7280;font-style:italic">Caption for image two</figcaption>
  </figure>
</div>`,
  },
  {
    id: 'img-img-img',
    category: 'Image + Text',
    label: 'Three Images',
    description: 'Three images in a row',
    preview: (
      <div style={{ display: 'flex', gap: 5, height: 56 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <ImgBox h="75%" radius={4} />
            <div style={{ height: 4, background: '#e5e7eb', borderRadius: 3, width: '65%', margin: '0 auto' }} />
          </div>
        ))}
      </div>
    ),
    html: `<div style="display:flex;gap:14px;margin:32px 0;flex-wrap:wrap">
  <figure style="flex:1;min-width:140px;margin:0;text-align:center">
    <img src="${PLACEHOLDER_IMG_SQ}" style="width:100%;border-radius:10px;object-fit:cover;aspect-ratio:1" alt="Image 1" />
    <figcaption style="margin-top:8px;font-size:0.8rem;color:#6B7280;font-style:italic">Caption one</figcaption>
  </figure>
  <figure style="flex:1;min-width:140px;margin:0;text-align:center">
    <img src="${PLACEHOLDER_IMG_SQ}" style="width:100%;border-radius:10px;object-fit:cover;aspect-ratio:1" alt="Image 2" />
    <figcaption style="margin-top:8px;font-size:0.8rem;color:#6B7280;font-style:italic">Caption two</figcaption>
  </figure>
  <figure style="flex:1;min-width:140px;margin:0;text-align:center">
    <img src="${PLACEHOLDER_IMG_SQ}" style="width:100%;border-radius:10px;object-fit:cover;aspect-ratio:1" alt="Image 3" />
    <figcaption style="margin-top:8px;font-size:0.8rem;color:#6B7280;font-style:italic">Caption three</figcaption>
  </figure>
</div>`,
  },
  {
    id: 'full-image',
    category: 'Image + Text',
    label: 'Full-width Image',
    description: 'Wide image with caption',
    preview: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, height: 56 }}>
        <ImgBox h="80%" radius={4} />
        <div style={{ height: 4, background: '#e5e7eb', borderRadius: 3, width: '35%', margin: '0 auto' }} />
      </div>
    ),
    html: `<figure style="margin:32px 0;text-align:center">
  <img src="${PLACEHOLDER_IMG_WIDE}" style="width:100%;border-radius:12px;object-fit:cover;max-height:500px" alt="Image" />
  <figcaption style="margin-top:12px;font-size:0.875rem;color:#6B7280;font-style:italic">Add a caption describing this image</figcaption>
</figure>`,
  },

  // ── Layouts ────────────────────────────────────────────────────────────────
  {
    id: 'hero-banner',
    category: 'Layouts',
    label: 'Hero Banner',
    description: 'Full-width gradient banner',
    preview: (
      <div style={{ height: 56, background: 'linear-gradient(135deg,#fce7f3,#ede9fe)', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0 16px' }}>
        <div style={{ height: 9, width: '55%', background: '#f472b6', borderRadius: 3 }} />
        <div style={{ height: 5, width: '75%', background: '#e9d5ff', borderRadius: 3 }} />
        <div style={{ height: 5, width: '60%', background: '#e9d5ff', borderRadius: 3 }} />
      </div>
    ),
    html: `<div style="background:linear-gradient(135deg,#fdf2f8 0%,#ede9fe 100%);border-radius:16px;padding:48px 40px;margin:32px 0;text-align:center">
  <h2 style="font-size:2rem;font-weight:800;color:#111827;margin:0 0 16px 0;line-height:1.3">Your Blog Section Title</h2>
  <p style="font-size:1.1rem;color:#6B7280;max-width:560px;margin:0 auto;line-height:1.8">Write an engaging subtitle or intro paragraph here. This banner is great for opening a new chapter or highlighting a key topic.</p>
</div>`,
  },
  {
    id: 'two-columns',
    category: 'Layouts',
    label: 'Two Columns',
    description: 'Two equal text columns',
    preview: (
      <div style={{ display: 'flex', gap: 8, height: 56 }}>
        {[0, 1].map(i => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ height: 7, background: '#d1d5db', borderRadius: 3, width: '60%' }} />
            <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3 }} />
            <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3, width: '85%' }} />
            <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3, width: '70%' }} />
          </div>
        ))}
      </div>
    ),
    html: `<div style="display:flex;gap:32px;margin:32px 0;flex-wrap:wrap">
  <div style="flex:1;min-width:200px">
    <h3 style="margin:0 0 10px 0;font-size:1.1rem;font-weight:700;color:#111827">Column One</h3>
    <p style="color:#374151;line-height:1.8;margin:0">Content for the first column goes here. Add your text, lists, or other content.</p>
  </div>
  <div style="flex:1;min-width:200px">
    <h3 style="margin:0 0 10px 0;font-size:1.1rem;font-weight:700;color:#111827">Column Two</h3>
    <p style="color:#374151;line-height:1.8;margin:0">Content for the second column goes here. Add your text, lists, or other content.</p>
  </div>
</div>`,
  },
  {
    id: 'three-columns',
    category: 'Layouts',
    label: 'Three Columns',
    description: 'Three feature cards with icon',
    preview: (
      <div style={{ display: 'flex', gap: 5, height: 56 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ flex: 1, background: '#fdf2f8', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '4px' }}>
            <div style={{ fontSize: 11 }}>✦</div>
            <div style={{ height: 6, width: '70%', background: '#fbcfe8', borderRadius: 3 }} />
            <div style={{ height: 4, width: '90%', background: '#e5e7eb', borderRadius: 3 }} />
          </div>
        ))}
      </div>
    ),
    html: `<div style="display:flex;gap:16px;margin:32px 0;flex-wrap:wrap">
  <div style="flex:1;min-width:160px;background:#fdf2f8;border-radius:12px;padding:24px;text-align:center">
    <div style="font-size:2rem;margin-bottom:12px">🌸</div>
    <h4 style="margin:0 0 8px 0;color:#111827;font-size:1rem;font-weight:700">Point One</h4>
    <p style="color:#6B7280;margin:0;font-size:0.875rem;line-height:1.6">Short description for this point or feature.</p>
  </div>
  <div style="flex:1;min-width:160px;background:#fdf2f8;border-radius:12px;padding:24px;text-align:center">
    <div style="font-size:2rem;margin-bottom:12px">💡</div>
    <h4 style="margin:0 0 8px 0;color:#111827;font-size:1rem;font-weight:700">Point Two</h4>
    <p style="color:#6B7280;margin:0;font-size:0.875rem;line-height:1.6">Short description for this point or feature.</p>
  </div>
  <div style="flex:1;min-width:160px;background:#fdf2f8;border-radius:12px;padding:24px;text-align:center">
    <div style="font-size:2rem;margin-bottom:12px">🎯</div>
    <h4 style="margin:0 0 8px 0;color:#111827;font-size:1rem;font-weight:700">Point Three</h4>
    <p style="color:#6B7280;margin:0;font-size:0.875rem;line-height:1.6">Short description for this point or feature.</p>
  </div>
</div>`,
  },
  {
    id: 'feature-cards',
    category: 'Layouts',
    label: 'Feature Cards',
    description: '2 feature cards with icon & text',
    preview: (
      <div style={{ display: 'flex', gap: 6, height: 56 }}>
        {[0, 1].map(i => (
          <div key={i} style={{ flex: 1, background: '#fdf2f8', borderRadius: 6, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 12 }}>⭐</div>
            <div style={{ height: 6, background: '#fbcfe8', borderRadius: 3, width: '70%' }} />
            <div style={{ height: 4, background: '#e5e7eb', borderRadius: 3 }} />
            <div style={{ height: 4, background: '#e5e7eb', borderRadius: 3, width: '80%' }} />
          </div>
        ))}
      </div>
    ),
    html: `<div style="display:flex;gap:16px;margin:32px 0;flex-wrap:wrap">
  <div style="flex:1;min-width:200px;background:#fdf2f8;border-radius:14px;padding:28px">
    <div style="font-size:2rem;margin-bottom:14px">⭐</div>
    <h4 style="margin:0 0 8px 0;color:#111827;font-size:1.05rem;font-weight:700">Feature Title</h4>
    <p style="color:#6B7280;margin:0;font-size:0.875rem;line-height:1.7">Describe this feature or benefit in a short sentence or two.</p>
  </div>
  <div style="flex:1;min-width:200px;background:#fdf2f8;border-radius:14px;padding:28px">
    <div style="font-size:2rem;margin-bottom:14px">🎯</div>
    <h4 style="margin:0 0 8px 0;color:#111827;font-size:1.05rem;font-weight:700">Feature Title</h4>
    <p style="color:#6B7280;margin:0;font-size:0.875rem;line-height:1.7">Describe this feature or benefit in a short sentence or two.</p>
  </div>
</div>`,
  },

  // ── Content Blocks ─────────────────────────────────────────────────────────
  {
    id: 'pros-cons',
    category: 'Content Blocks',
    label: 'Pros & Cons',
    description: 'Side-by-side pros and cons list',
    preview: (
      <div style={{ display: 'flex', gap: 6, height: 56 }}>
        <div style={{ flex: 1, background: '#f0fdf4', borderRadius: 5, padding: '5px 7px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 6, background: '#86efac', borderRadius: 3, width: '55%' }} />
          <div style={{ height: 4, background: '#d1fae5', borderRadius: 3 }} />
          <div style={{ height: 4, background: '#d1fae5', borderRadius: 3, width: '80%' }} />
          <div style={{ height: 4, background: '#d1fae5', borderRadius: 3, width: '70%' }} />
        </div>
        <div style={{ flex: 1, background: '#fff1f2', borderRadius: 5, padding: '5px 7px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 6, background: '#fca5a5', borderRadius: 3, width: '55%' }} />
          <div style={{ height: 4, background: '#fee2e2', borderRadius: 3 }} />
          <div style={{ height: 4, background: '#fee2e2', borderRadius: 3, width: '80%' }} />
          <div style={{ height: 4, background: '#fee2e2', borderRadius: 3, width: '70%' }} />
        </div>
      </div>
    ),
    html: `<div style="display:flex;gap:16px;margin:32px 0;flex-wrap:wrap">
  <div style="flex:1;min-width:200px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px">
    <p style="font-weight:700;color:#16a34a;margin:0 0 12px 0;font-size:1rem">✅ Pros</p>
    <ul style="margin:0;padding-left:20px;color:#374151;line-height:2;font-size:0.9rem">
      <li>Add your first benefit here</li>
      <li>Another positive point</li>
      <li>One more advantage</li>
    </ul>
  </div>
  <div style="flex:1;min-width:200px;background:#fff1f2;border:1px solid #fecaca;border-radius:12px;padding:20px 24px">
    <p style="font-weight:700;color:#dc2626;margin:0 0 12px 0;font-size:1rem">❌ Cons</p>
    <ul style="margin:0;padding-left:20px;color:#374151;line-height:2;font-size:0.9rem">
      <li>Add a drawback or limitation</li>
      <li>Another consideration</li>
      <li>One more downside</li>
    </ul>
  </div>
</div>`,
  },
  {
    id: 'pull-quote',
    category: 'Content Blocks',
    label: 'Pull Quote',
    description: 'Highlighted quote block',
    preview: (
      <div style={{ borderLeft: '3px solid #f472b6', paddingLeft: 10, height: 56, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5, background: '#fdf2f8', borderRadius: '0 6px 6px 0' }}>
        <div style={{ height: 6, background: '#fbcfe8', borderRadius: 3 }} />
        <div style={{ height: 6, background: '#fbcfe8', borderRadius: 3, width: '80%' }} />
        <div style={{ height: 4, background: '#e5e7eb', borderRadius: 3, width: '40%' }} />
      </div>
    ),
    html: `<blockquote style="border-left:4px solid #f472b6;padding:20px 28px;margin:32px 0;background:#fdf2f8;border-radius:0 12px 12px 0">
  <p style="font-size:1.25rem;font-style:italic;color:#374151;margin:0 0 12px 0;line-height:1.7">"Write an inspiring or key quote from your blog here. Make it stand out from the rest of the content."</p>
  <cite style="display:block;font-size:0.875rem;color:#9CA3AF;font-style:normal">— Author or Source</cite>
</blockquote>`,
  },
  {
    id: 'callout',
    category: 'Content Blocks',
    label: 'Info Callout',
    description: 'Tip or important info box',
    preview: (
      <div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: 6, padding: '6px 8px', height: 56, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 7, background: '#fbcfe8', borderRadius: 3, width: '55%' }} />
          <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3 }} />
          <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3, width: '75%' }} />
        </div>
      </div>
    ),
    html: `<div style="background:#fdf2f8;border:1px solid #fbcfe8;border-radius:14px;padding:20px 24px;margin:32px 0;display:flex;gap:14px;align-items:flex-start">
  <span style="font-size:1.5rem;flex-shrink:0;margin-top:2px">💡</span>
  <div>
    <p style="font-weight:700;color:#be185d;margin:0 0 6px 0">Pro Tip</p>
    <p style="color:#374151;margin:0;line-height:1.7">Replace this with a helpful tip, important note, or key takeaway for your readers.</p>
  </div>
</div>`,
  },
  {
    id: 'warning-callout',
    category: 'Content Blocks',
    label: 'Warning Box',
    description: 'Warning or caution callout',
    preview: (
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '6px 8px', height: 56, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 7, background: '#fde68a', borderRadius: 3, width: '55%' }} />
          <div style={{ height: 5, background: '#fef3c7', borderRadius: 3 }} />
          <div style={{ height: 5, background: '#fef3c7', borderRadius: 3, width: '75%' }} />
        </div>
      </div>
    ),
    html: `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:20px 24px;margin:32px 0;display:flex;gap:14px;align-items:flex-start">
  <span style="font-size:1.5rem;flex-shrink:0;margin-top:2px">⚠️</span>
  <div>
    <p style="font-weight:700;color:#b45309;margin:0 0 6px 0">Important Note</p>
    <p style="color:#374151;margin:0;line-height:1.7">Add a warning, caution, or important note for your readers here.</p>
  </div>
</div>`,
  },
  {
    id: 'step-list',
    category: 'Content Blocks',
    label: 'Step List',
    description: 'Numbered steps with description',
    preview: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: 56, justifyContent: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
            <div style={{ width: 14, height: 14, background: '#f472b6', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 5, height: 5, background: 'white', borderRadius: '50%' }} />
            </div>
            <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3, flex: 1 }} />
          </div>
        ))}
      </div>
    ),
    html: `<div style="margin:32px 0">
  <div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:20px">
    <div style="width:36px;height:36px;background:#f472b6;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.875rem;flex-shrink:0">1</div>
    <div style="padding-top:6px"><strong style="color:#111827">Step One</strong><p style="margin:6px 0 0 0;color:#6B7280;font-size:0.9rem;line-height:1.7">Describe what the reader should do in this step. Be clear and actionable.</p></div>
  </div>
  <div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:20px">
    <div style="width:36px;height:36px;background:#f472b6;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.875rem;flex-shrink:0">2</div>
    <div style="padding-top:6px"><strong style="color:#111827">Step Two</strong><p style="margin:6px 0 0 0;color:#6B7280;font-size:0.9rem;line-height:1.7">Describe what the reader should do in this step. Be clear and actionable.</p></div>
  </div>
  <div style="display:flex;gap:16px;align-items:flex-start">
    <div style="width:36px;height:36px;background:#f472b6;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.875rem;flex-shrink:0">3</div>
    <div style="padding-top:6px"><strong style="color:#111827">Step Three</strong><p style="margin:6px 0 0 0;color:#6B7280;font-size:0.9rem;line-height:1.7">Describe what the reader should do in this step. Be clear and actionable.</p></div>
  </div>
</div>`,
  },
  {
    id: 'stats',
    category: 'Content Blocks',
    label: 'Stats Row',
    description: '3 statistics highlight cards',
    preview: (
      <div style={{ display: 'flex', gap: 5, height: 56 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ flex: 1, background: '#fdf2f8', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <div style={{ height: 11, width: '55%', background: '#f472b6', borderRadius: 3 }} />
            <div style={{ height: 5, width: '70%', background: '#e5e7eb', borderRadius: 3 }} />
          </div>
        ))}
      </div>
    ),
    html: `<div style="display:flex;gap:16px;margin:32px 0;flex-wrap:wrap">
  <div style="flex:1;min-width:120px;background:#fdf2f8;border-radius:14px;padding:24px;text-align:center">
    <p style="font-size:2.2rem;font-weight:800;color:#ec4899;margin:0">85%</p>
    <p style="font-size:0.875rem;color:#6B7280;margin:8px 0 0 0">Stat Label</p>
  </div>
  <div style="flex:1;min-width:120px;background:#fdf2f8;border-radius:14px;padding:24px;text-align:center">
    <p style="font-size:2.2rem;font-weight:800;color:#ec4899;margin:0">2x</p>
    <p style="font-size:0.875rem;color:#6B7280;margin:8px 0 0 0">Stat Label</p>
  </div>
  <div style="flex:1;min-width:120px;background:#fdf2f8;border-radius:14px;padding:24px;text-align:center">
    <p style="font-size:2.2rem;font-weight:800;color:#ec4899;margin:0">10k+</p>
    <p style="font-size:0.875rem;color:#6B7280;margin:8px 0 0 0">Stat Label</p>
  </div>
</div>`,
  },
];

interface Props {
  onInsert: (html: string) => void;
  onClose: () => void;
}

export default function SectionTemplates({ onInsert, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>('Image + Text');

  const filtered = SECTIONS.filter(s => s.category === activeCategory);

  return (
    <div className="border border-gray-200 rounded-2xl bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="text-sm font-semibold text-gray-900">Insert Section Layout</p>
          <p className="text-xs text-gray-400 mt-0.5">Choose a layout and click to insert at cursor</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition text-sm"
        >
          ✕
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 px-5 pt-3 pb-0 border-b border-gray-100">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg border-b-2 transition whitespace-nowrap ${
              activeCategory === cat
                ? 'border-pink-400 text-pink-600 bg-pink-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto">
        {filtered.map((section) => (
          <button
            key={section.id}
            onClick={() => { onInsert(section.html); onClose(); }}
            className="group text-left border border-gray-200 rounded-xl p-3 hover:border-pink-300 hover:shadow-sm transition-all duration-150 hover:bg-pink-50/40 active:scale-[0.98]"
          >
            {/* Visual preview */}
            <div className="mb-2.5 p-2 bg-gray-50 rounded-lg group-hover:bg-white transition overflow-hidden">
              {section.preview}
            </div>
            <p className="text-xs font-semibold text-gray-800 group-hover:text-pink-600 transition leading-tight">
              {section.label}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{section.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
