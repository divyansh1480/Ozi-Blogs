'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import BlogCard from '@/components/BlogCard';
import { api } from '@/lib/api';
import { BlogWithAuthor } from '@/types/index';

const PAGE_SIZE = 9;

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
      <div className="h-36 bg-gray-100 rounded-lg mb-4" />
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-gray-200" />
        <div className="h-3 bg-gray-200 rounded w-24" />
      </div>
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-full mb-1" />
      <div className="h-3 bg-gray-200 rounded w-5/6" />
    </div>
  );
}

function BlogsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [blogs, setBlogs] = useState<BlogWithAuthor[]>([]);
  const [newFromIndex, setNewFromIndex] = useState<number | null>(null);
  const [nextPage, setNextPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialDone, setInitialDone] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(false);
  const nextPageRef = useRef(1);
  const searchRef = useRef(search);

  loadingRef.current = loading || loadingMore;
  hasMoreRef.current = hasMore;
  nextPageRef.current = nextPage;
  searchRef.current = search;

  const initialLoad = useCallback(async (searchTerm: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getBlogs(1, PAGE_SIZE, searchTerm || undefined);
      const data = res.data.data;
      setBlogs(data.items);
      setNextPage(2);
      nextPageRef.current = 2;
      const more = data.totalPages > 1;
      setHasMore(more);
      hasMoreRef.current = more;
    } catch {
      setError('Failed to load blogs.');
    } finally {
      setLoading(false);
      setInitialDone(true);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoadingMore(true);
    try {
      const res = await api.getBlogs(nextPageRef.current, PAGE_SIZE, searchRef.current || undefined);
      const data = res.data.data;
      setBlogs(prev => {
        setNewFromIndex(prev.length);
        return [...prev, ...data.items];
      });
      const fetched = nextPageRef.current;
      setNextPage(fetched + 1);
      nextPageRef.current = fetched + 1;
      const more = fetched < data.totalPages;
      setHasMore(more);
      hasMoreRef.current = more;
    } catch {
      loadingRef.current = false;
      setError('Failed to load more blogs.');
    } finally {
      setLoadingMore(false);
    }
  }, []);

  // Reset on search change
  useEffect(() => {
    setBlogs([]);
    setNewFromIndex(null);
    setNextPage(1);
    nextPageRef.current = 1;
    setHasMore(false);
    hasMoreRef.current = false;
    setInitialDone(false);
    setError('');
    initialLoad(search);
  }, [search, initialLoad]);

  // Connect observer after initial load — fires 500px BEFORE sentinel is visible
  useEffect(() => {
    if (!initialDone) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingRef.current && hasMoreRef.current) {
          loadMore();
        }
      },
      { rootMargin: '0px 0px 200px 0px', threshold: 0 }
    );

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [initialDone, loadMore]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    setSearch(q);
    if (q) router.replace(`/blogs?search=${encodeURIComponent(q)}`);
    else router.replace('/blogs');
  };

  const handleClear = () => {
    setSearchInput('');
    setSearch('');
    router.replace('/blogs');
  };

  return (
    <main className="min-h-screen bg-gray-50 relative">
      {/* Slim top loading bar for initial load */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-pink-100">
          <div className="load-bar h-full bg-pink-400" />
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">All Blogs</h1>
          <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">
            Discover stories and ideas from our community
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 sm:gap-3 max-w-xl">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search blogs..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button type="submit" className="px-5 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition font-medium">
              Search
            </button>
            {search && (
              <button type="button" onClick={handleClear} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
        {search && (
          <p className="text-sm text-gray-500 mb-6">
            Results for <span className="font-medium text-gray-800">"{search}"</span>
          </p>
        )}

        {/* Initial skeleton */}
        {!initialDone && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {initialDone && error && blogs.length === 0 && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={() => initialLoad(search)} className="px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500">
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {initialDone && !error && blogs.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">No blogs found</p>
            {search && <p className="text-sm">Try a different search term</p>}
          </div>
        )}

        {/* Blog grid */}
        {blogs.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog, i) => (
              <div
                key={blog.id}
                className={`h-full${newFromIndex !== null && i >= newFromIndex ? ' blog-card-enter' : ''}`}
                style={newFromIndex !== null && i >= newFromIndex
                  ? { animationDelay: `${(i - newFromIndex) * 60}ms` }
                  : undefined}
              >
                <BlogCard blog={blog} />
              </div>
            ))}

            {/* Inline skeleton cards while loading next batch */}
            {loadingMore && Array.from({ length: 3 }).map((_, i) => (
              <div key={`skel-${i}`} className="blog-card-enter" style={{ animationDelay: `${i * 60}ms` }}>
                <SkeletonCard />
              </div>
            ))}
          </div>
        )}

        {/* Sentinel — 500px rootMargin triggers load before user reaches it */}
        <div ref={sentinelRef} className="mt-6 h-1" />
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
