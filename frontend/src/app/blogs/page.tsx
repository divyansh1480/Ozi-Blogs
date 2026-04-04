'use client';

import { useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
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

  const [searchInput, setSearchInput] = useState(searchParams.get('topic') ? '' : searchParams.get('search') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeTopic, setActiveTopic] = useState<string | null>(searchParams.get('topic') || null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['blogs', search],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.getBlogs(pageParam as number, PAGE_SIZE, search || undefined);
      return res.data.data as { items: BlogWithAuthor[]; totalPages: number; page: number };
    },
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 60 * 1000,
  });

  const blogs = data?.pages.flatMap((p) => p.items) ?? [];
  const initialDone = !isFetching || blogs.length > 0;

  // Wire up infinite scroll sentinel once data is loaded
  const attachObserver = useCallback(
    (node: HTMLDivElement | null) => {
      (sentinelRef as any).current = node;
      observerRef.current?.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { rootMargin: '0px 0px 200px 0px', threshold: 0 },
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    setActiveTopic(null);
    setSearch(q);
    if (q) router.replace(`/blogs?search=${encodeURIComponent(q)}`);
    else router.replace('/blogs');
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    router.replace('/blogs');
  };

  const handleTopicClick = (topic: string) => {
    setSearchInput('');
    setActiveTopic(topic);
    setSearch(topic);
    router.replace(`/blogs?topic=${encodeURIComponent(topic)}`);
  };

  const handleClearTopic = () => {
    setActiveTopic(null);
    setSearch('');
    router.replace('/blogs');
  };

  return (
    <main className="min-h-screen bg-gray-50 relative">
      {/* Slim top loading bar for initial load */}
      {isFetching && !isFetchingNextPage && (
        <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-primary/20">
          <div className="load-bar h-full bg-primary-light" />
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
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search blogs..."
                className="w-full px-4 py-2 pr-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition text-lg leading-none"
                  aria-label="Clear search"
                >×</button>
              )}
            </div>
            <button type="submit" className="px-5 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition font-medium">
              Search
            </button>
          </form>

          {search && !activeTopic && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-500">Results for <span className="font-medium text-gray-800">"{search}"</span></span>
              <button type="button" onClick={handleClearSearch} className="text-xs text-primary-dark hover:underline font-medium">← All blogs</button>
            </div>
          )}

          {/* Hot Topics */}
          <div className="mt-4 sm:mt-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">🔥 Hot Topics</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Newborn Care', 'Breastfeeding', 'Baby Sleep', 'Weaning Foods',
                'Diaper Rash', 'Baby Milestones', 'Tummy Time', 'Teething Tips',
                'Baby Vaccines', 'Postpartum', 'Colic Relief', 'Baby Skin Care',
              ].map(topic => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => activeTopic === topic ? handleClearTopic() : handleTopicClick(topic)}
                  className={`text-xs px-2.5 py-1 rounded-full transition font-medium flex items-center gap-1
                    ${activeTopic === topic
                      ? 'bg-primary-light text-white shadow-sm'
                      : 'bg-primary/10 text-primary-dark hover:bg-primary/20'}`}
                >
                  {topic}
                  {activeTopic === topic && <span className="ml-0.5 opacity-80">×</span>}
                </button>
              ))}
            </div>
            {activeTopic && (
              <button type="button" onClick={handleClearTopic} className="mt-2 text-xs text-primary-dark hover:underline font-medium">← All blogs</button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
        {activeTopic && (
          <p className="text-sm text-gray-500 mb-6">
            Showing posts tagged <span className="font-medium text-gray-800">"{activeTopic}"</span>
          </p>
        )}

        {/* Initial skeleton */}
        {!initialDone && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {isError && blogs.length === 0 && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">Failed to load blogs.</p>
            <button onClick={() => refetch()} className="px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark">
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {initialDone && !isError && blogs.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">No blogs found</p>
            {search && <p className="text-sm">Try a different search term</p>}
          </div>
        )}

        {/* Blog grid */}
        {blogs.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <div key={blog.id} className="h-full">
                <BlogCard blog={blog} />
              </div>
            ))}

            {/* Inline skeleton cards while loading next batch */}
            {isFetchingNextPage && Array.from({ length: 3 }).map((_, i) => (
              <div key={`skel-${i}`} className="blog-card-enter" style={{ animationDelay: `${i * 60}ms` }}>
                <SkeletonCard />
              </div>
            ))}
          </div>
        )}

        {/* Sentinel — 200px rootMargin triggers load before user reaches it */}
        <div ref={attachObserver} className="mt-6 h-1" />

        {/* All blogs loaded — back to top */}
        {initialDone && !hasNextPage && blogs.length > 0 && !isFetchingNextPage && (
          <div className="flex justify-center py-10">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 px-5 py-2 bg-primary-light hover:bg-primary-dark text-white text-sm font-medium rounded-full shadow transition"
            >
              ↑ Back to Top
            </button>
          </div>
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
