'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import BlogEditor from '@/components/BlogEditor';
import { api } from '@/lib/api';
import { Blog } from '@/types/index';

interface EditBlogPageProps {
  params: { slug: string };
}

export default function EditBlogPage({ params }: EditBlogPageProps) {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/admin/login');
      return;
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchBlog = async () => {
      try {
        const res = await api.getBlogBySlug(params.slug);
        const fetchedBlog: Blog = res.data.data.blog;

        // Only author can edit
        if (fetchedBlog.userId !== user?.id) {
          router.push(`/blogs/${params.slug}`);
          return;
        }
        setBlog(fetchedBlog);
      } catch {
        setError('Blog not found');
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [isAuthenticated, params.slug, user, router]);

  const handleSave = async (data: {
    title: string;
    content: string;
    excerpt: string;
    status: 'draft' | 'published';
  }) => {
    if (!blog) return;
    try {
      const res = await api.updateBlog(blog.id, data);
      const updated: Blog = res.data.data.blog;
      router.refresh();
      router.push(data.status === 'published' ? `/blogs/${updated.slug}` : '/dashboard');
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to save blog');
    }
  };

  if (isLoading || !isAuthenticated || !isAdmin || loading) return null;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
  if (!blog) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <BlogEditor initialData={blog} onSave={handleSave} />
    </main>
  );
}