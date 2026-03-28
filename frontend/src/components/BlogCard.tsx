import Link from 'next/link';
import { BlogWithAuthor } from '@/types/index';
import { formatDistanceToNow } from 'date-fns';
import { authorInitial, blogDate, extractFirstImage, stripHtml } from '@/lib/utils';

interface BlogCardProps {
  blog: BlogWithAuthor;
}

export default function BlogCard({ blog }: BlogCardProps) {
  const timeAgo = formatDistanceToNow(blogDate(blog.publishedAt, blog.createdAt), { addSuffix: true });
  const plainExcerpt = blog.excerpt ? stripHtml(blog.excerpt) : stripHtml(blog.content).slice(0, 160) + '...';
  const coverImage = extractFirstImage(blog.content);

  return (
    <Link href={`/blogs/${blog.slug}`} className="block group">
      <article className="bg-white rounded-xl shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow overflow-hidden h-full flex flex-col">
        {/* Cover image — fixed height, always present as a placeholder if missing */}
        <div className="w-full h-48 overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50 flex-shrink-0">
          {coverImage ? (
            <img
              src={coverImage}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-pink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {authorInitial(blog.author?.displayName, blog.author?.username, 'A')}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {blog.author?.displayName || blog.author?.username || 'Anonymous'}
              </p>
              <p className="text-xs text-gray-400">{timeAgo}</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-pink-500 transition-colors line-clamp-2">
            {blog.title}
          </h2>

          <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-1">{plainExcerpt}</p>

          <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-3 border-t border-gray-50">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {blog.viewCount} views
            </span>
            <span className="text-pink-500 font-medium">Read more →</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
