import { Metadata } from 'next';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import axios from 'axios';
import { User, Blog } from '@/types/index';
import { format } from 'date-fns';
import FollowButton from '@/components/FollowButton';
import { authorInitial, blogDate, readTime } from '@/lib/utils';

interface ProfilePageProps {
  params: { username: string };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function getProfile(username: string): Promise<{ user: User; blogs: Blog[] } | null> {
  try {
    const res = await axios.get(`${API_BASE}/users/${username}`);
    return res.data.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const data = await getProfile(params.username);
  if (!data) return { title: 'User not found' };
  return {
    title: `${data.user.displayName || data.user.username} - BlogHub`,
    description: data.user.bio || `Read blogs by ${data.user.displayName || data.user.username} on BlogHub.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const data = await getProfile(params.username);
  if (!data) notFound();

  const { user, blogs } = data;
  const initial = authorInitial(user.displayName, user.username);
  const joinDate = format(new Date(user.createdAt), 'MMMM yyyy');

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/" className="hover:text-pink-500 transition">Home</Link>
          <span>/</span>
          <Link href="/blogs" className="hover:text-pink-500 transition">Blogs</Link>
          <span>/</span>
          <span className="text-gray-600">{user.displayName || user.username}</span>
        </nav>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          {/* Cover strip */}
          <div className="h-28 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400" />

          <div className="px-8 pb-8">
            {/* Avatar overlapping cover */}
            <div className="-mt-10 mb-4 flex items-end justify-between">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-3xl border-4 border-white shadow-md shrink-0">
                {initial}
              </div>
            </div>

            {/* Info */}
            <h1 className="text-2xl font-bold text-gray-900">
              {user.displayName || user.username}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">@{user.username}</p>

            {user.bio && (
              <p className="mt-3 text-gray-600 text-sm leading-relaxed max-w-xl">{user.bio}</p>
            )}

            {/* Stats row */}
            <div className="mt-5 flex items-center gap-6 text-sm flex-wrap">
              <div>
                <span className="font-semibold text-gray-900">{blogs.length}</span>
                <span className="text-gray-400 ml-1">blog{blogs.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="w-px h-4 bg-gray-200" />
              <div>
                <span className="font-semibold text-gray-900">{(user as any).followers ?? 0}</span>
                <span className="text-gray-400 ml-1">followers</span>
              </div>
              <div className="w-px h-4 bg-gray-200" />
              <div className="text-gray-400">Since {joinDate}</div>
            </div>

            {/* Follow button */}
            <FollowButton userId={user.id} initialFollowers={(user as any).followers ?? 0} />
          </div>
        </div>

        {/* Blog grid */}
        {blogs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
            <p className="text-lg mb-1">No published blogs yet</p>
            <p className="text-sm">Check back later.</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Published blogs
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {blogs.map((blog) => {
                const blogReadTime = readTime(blog.content);
                const date = format(blogDate(blog.publishedAt, blog.createdAt), 'MMM d, yyyy');
                return (
                  <Link
                    key={blog.id}
                    href={`/blogs/${blog.slug}`}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-pink-200 transition group"
                  >
                    <h3 className="font-semibold text-gray-900 group-hover:text-pink-500 transition leading-snug mb-2 line-clamp-2">
                      {blog.title}
                    </h3>
                    {blog.excerpt && (
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">{blog.excerpt}</p>
                    )}
                    <p className="text-xs text-gray-400">{date} · {blogReadTime} min read</p>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
