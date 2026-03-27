'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Blog, PaginatedResponse } from '@/types/index';
import { formatDistanceToNow } from 'date-fns';
import ImportBlogsModal from '@/components/ImportBlogsModal';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth/login');
  }, [isLoading, isAuthenticated, router]);

  const fetchMyBlogs = async () => {
    try {
      const res = await api.getMyBlogs();
      setBlogs((res.data.data as PaginatedResponse<Blog>).items);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchMyBlogs();
  }, [isAuthenticated, user]);

  const handleDelete = async (blogId: string) => {
    if (!confirm('Delete this blog?')) return;
    try {
      await api.deleteBlog(blogId);
      setBlogs((prev) => prev.filter((b) => b.id !== blogId));
    } catch {
      alert('Failed to delete blog');
    }
  };

  const handleTogglePublish = async (blog: Blog) => {
    const newStatus = blog.status === 'published' ? 'draft' : 'published';
    try {
      const res = await api.updateBlog(blog.id, { status: newStatus });
      setBlogs((prev) => prev.map((b) => (b.id === blog.id ? res.data.data.blog : b)));
    } catch {
      alert('Failed to update blog status');
    }
  };

  if (isLoading || !isAuthenticated) return null;

  const published = blogs.filter((b) => b.status === 'published');
  const drafts = blogs.filter((b) => b.status === 'draft');

  return (
    <main className="min-h-screen bg-gray-50">
      {showImport && (
        <ImportBlogsModal
          onClose={() => setShowImport(false)}
          onImported={() => { fetchMyBlogs(); }}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">Welcome back, {user?.displayName || user?.username}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowImport(true)}
              className="border border-gray-200 text-gray-600 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-50 hover:border-pink-300 hover:text-pink-500 transition text-xs sm:text-sm font-medium flex items-center gap-1.5"
            >
              <span>📥</span>
              <span className="hidden sm:inline">Import Excel</span>
              <span className="sm:hidden">Import</span>
            </button>
            <Link
              href="/blogs/new"
              className="bg-pink-400 text-white px-3 sm:px-5 py-2 rounded-lg hover:bg-pink-500 transition font-medium text-xs sm:text-sm whitespace-nowrap"
            >
              + New Blog
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-10">
          {[
            { label: 'Total', value: blogs.length },
            { label: 'Published', value: published.length },
            { label: 'Drafts', value: drafts.length },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-6 text-center shadow-sm">
              <p className="text-2xl sm:text-3xl font-bold text-pink-500">{stat.value}</p>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Blog List */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Your Blogs</h2>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading...</div>
          ) : blogs.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <p className="text-lg mb-2">No blogs yet</p>
              <Link href="/blogs/new" className="text-pink-500 hover:text-pink-600">
                Write your first blog →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {blogs.map((blog) => (
                <li key={blog.id} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{blog.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDistanceToNow(new Date(blog.updatedAt), { addSuffix: true })}
                      {' · '}
                      <span className={`font-medium ${blog.status === 'published' ? 'text-green-500' : 'text-yellow-500'}`}>
                        {blog.status}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {blog.status === 'published' && (
                      <Link
                        href={`/blogs/${blog.slug}`}
                        className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        View
                      </Link>
                    )}
                    <Link
                      href={`/blogs/${blog.slug}/edit`}
                      className="text-xs px-3 py-1.5 border border-pink-200 text-pink-500 rounded-lg hover:bg-pink-50 transition"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleTogglePublish(blog)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition ${
                        blog.status === 'published'
                          ? 'border border-yellow-300 text-yellow-600 hover:bg-yellow-50'
                          : 'border border-green-300 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {blog.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDelete(blog.id)}
                      className="text-xs px-3 py-1.5 border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
