import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import axios from 'axios';
import { BlogWithAuthor, Blog } from '@/types/index';
import { format } from 'date-fns';
import BlogInteractions from '@/components/BlogInteractions';
import FollowButton from '@/components/FollowButton';
import ZoomableContent from '@/components/ZoomableContent';
import { authorInitial, blogDate, readTime } from '@/lib/utils';

interface BlogPageProps {
  params: { slug: string };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://ozi-blogs-7.onrender.com/api';

async function getBlog(slug: string): Promise<BlogWithAuthor | null> {
  try {
    const res = await axios.get(`${API_BASE}/blogs/slug/${slug}`);
    return res.data.data?.blog ?? null;
  } catch {
    return null;
  }
}

async function getRecentBlogs(excludeSlug: string): Promise<Blog[]> {
  try {
    const res = await axios.get(`${API_BASE}/blogs?limit=5`);
    const items: Blog[] = res.data.data?.items ?? [];
    return items.filter((b) => b.slug !== excludeSlug).slice(0, 4);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const blog = await getBlog(params.slug);
  if (!blog) return { title: 'Blog not found' };
  return {
    title: `${blog.title} - BlogHub`,
    description: blog.excerpt || blog.content.replace(/<[^>]*>/g, '').slice(0, 160),
  };
}

// Strip figcaptions that are empty or contain only template placeholder text
const PLACEHOLDER_CAPTION_RE = /^(caption|caption for image|caption one|caption two|caption three|add a caption)/i;
function cleanFigcaptions(html: string): string {
  return html.replace(/<figcaption([^>]*)>([\s\S]*?)<\/figcaption>/gi, (match, attrs, inner) => {
    const text = inner.replace(/<[^>]*>/g, '').trim();
    if (!text || PLACEHOLDER_CAPTION_RE.test(text)) return `<figcaption${attrs}></figcaption>`;
    return match;
  });
}

// Inject ids into headings for anchor links
function injectHeadingIds(html: string): string {
  let count: Record<string, number> = {};
  return html.replace(/<h([1-3])([^>]*)>(.*?)<\/h[1-3]>/gi, (_, level, attrs, inner) => {
    const text = inner.replace(/<[^>]*>/g, '').trim();
    const baseId = text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    count[baseId] = (count[baseId] || 0) + 1;
    const id = count[baseId] > 1 ? `${baseId}-${count[baseId]}` : baseId;
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const [blog, related] = await Promise.all([
    getBlog(params.slug),
    getRecentBlogs(params.slug),
  ]);

  if (!blog) notFound();

  // Decode TipTap section sentinels stored in DB back to raw HTML for display
  const decodedContent = blog.content.replace(
    /<div data-html-block="([^"]*)"[^>]*><\/div>/g,
    (_, encoded) => decodeURIComponent(encoded)
  );

  const publishedDate = format(blogDate(blog.publishedAt, blog.createdAt), 'MMMM d, yyyy');
  const blogReadTime = readTime(decodedContent);
  const contentWithIds = injectHeadingIds(cleanFigcaptions(decodedContent));
  const initial = authorInitial(blog.author?.displayName, blog.author?.username, 'A');

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm">
          <Link href="/" className="text-gray-400 hover:text-primary transition">Home</Link>
          <span className="text-gray-300">/</span>
          <Link href="/blogs" className="text-gray-400 hover:text-primary transition">Blogs</Link>
          <span className="text-gray-300">/</span>
          {blog.author?.username && (
            <>
              <Link href={`/users/${blog.author.username}`} className="text-gray-400 hover:text-primary transition">
                {blog.author.displayName || blog.author.username}
              </Link>
              <span className="text-gray-300">/</span>
            </>
          )}
          <span className="text-gray-700 font-medium truncate max-w-xs">{blog.title}</span>
        </nav>

        <div className="flex gap-8 items-start">

          {/* CENTER — Blog content */}
          <article className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 pt-10 pb-8">
                {/* Title */}
                <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-5">{blog.title}</h1>

                {/* Author row */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-purple-500 flex items-center justify-center text-white font-bold text-base shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link
                        href={`/users/${blog.author?.username || ''}`}
                        className="font-semibold text-gray-800 hover:text-primary transition"
                      >
                        {blog.author?.displayName || blog.author?.username || 'Anonymous'}
                      </Link>
                      {blog.author?.id && (
                        <FollowButton userId={blog.author.id} compact showFollowers={false} />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {publishedDate} · {blogReadTime} min read · {blog.viewCount} views
                    </p>
                  </div>
                </div>

                {/* Like / Comment / Share + Comments drawer */}
                <BlogInteractions blogId={blog.id} blogTitle={blog.title} />

                {/* Blog body — images are zoomable */}
                <ZoomableContent
                  html={contentWithIds}
                  className="prose prose-lg max-w-none text-gray-700 leading-relaxed
                    prose-headings:text-gray-900 prose-headings:font-bold
                    prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-blockquote:border-l-primary-light prose-blockquote:text-gray-500
                    prose-code:text-primary-dark prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded
                    prose-pre:bg-gray-900 prose-pre:text-gray-100
                    prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto
                    prose-hr:border-gray-200"
                />

                {/* Footer of article */}
                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                  <Link href="/blogs" className="text-sm text-primary hover:text-primary-dark font-medium">
                    ← Back to all blogs
                  </Link>
                  <div className="text-sm text-gray-400">{blogReadTime} min read</div>
                </div>

              </div>
            </div>

          </article>

          {/* RIGHT SIDEBAR — Breadcrumb trail + Author + Related blogs */}
          <aside className="hidden xl:block w-64 shrink-0">
            <div className="sticky top-24 space-y-5">

              {/* Hot Topics — Baby Care */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">🔥 Hot Topics</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Newborn Care', 'Breastfeeding', 'Baby Sleep', 'Weaning Foods',
                    'Diaper Rash', 'Baby Milestones', 'Tummy Time', 'Teething Tips',
                    'Baby Vaccines', 'Postpartum', 'Colic Relief', 'Baby Skin Care',
                  ].map(topic => (
                    <Link
                      key={topic}
                      href={`/blogs?topic=${encodeURIComponent(topic)}`}
                      className="text-xs bg-primary/10 text-primary-dark hover:bg-primary/20 px-2.5 py-1 rounded-full transition font-medium"
                    >
                      {topic}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Related blogs */}
              {related.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">More Reads</p>
                  <div className="space-y-3">
                    {related.map((b) => (
                      <Link key={b.id} href={`/blogs/${b.slug}`} className="block group">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-primary transition leading-snug line-clamp-2">
                          {b.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {readTime(b.content)} min read
                        </p>
                      </Link>
                    ))}
                  </div>
                  <Link href="/blogs" className="mt-4 block text-xs text-center text-primary hover:text-primary-dark font-medium">
                    View all blogs →
                  </Link>
                </div>
              )}
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}