'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BlogCard from '@/components/BlogCard';
import Pagination from '@/components/Pagination';
import { api } from '@/lib/api';
import { BlogWithAuthor, PaginatedResponse } from '@/types/index';

function BlogsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);

  const [blogs, setBlogs] = useState<BlogWithAuthor[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getBlogs(page, 9, search || undefined);
      const data: PaginatedResponse<BlogWithAuthor> = res.data.data;
      setBlogs(data.items);
      setTotalPages(data.totalPages);
    } catch {
      setError('Failed to load blogs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchInput) params.set('search', searchInput);
    params.set('page', '1');
    router.push(`/blogs?${params.toString()}`);
    setSearch(searchInput);
  };

  const handleClear = () => {
    setSearch('');
    setSearchInput('');
    router.push('/blogs');
  };

  const handlePageChange = (p: number) => {
    if (loading) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.replace(`/blogs?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">All Blogs</h1>
          <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">Discover stories and ideas from our community</p>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 sm:gap-3 max-w-xl">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search blogs..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition font-medium"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
        {/* Loading */}
        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={fetchBlogs} className="px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500">
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && blogs.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">No blogs found</p>
            {search && <p className="text-sm">Try a different search term</p>}
          </div>
        )}

        {/* Blog Grid */}
        {!loading && !error && blogs.length > 0 && (
          <>
            {search && (
              <p className="text-sm text-gray-500 mb-6">
                Showing results for <span className="font-medium text-gray-800">"{search}"</span>
              </p>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} disabled={loading} />
          </>
        )}
      </div>
    </main>
  );
}

export default function BlogsPage() {
  return (
    <Suspense>
      <BlogsContent />
    </Suspense>
  );
}
