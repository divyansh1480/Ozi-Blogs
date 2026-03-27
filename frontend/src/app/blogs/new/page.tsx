'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import BlogEditor from '@/components/BlogEditor';
import { api } from '@/lib/api';

export default function NewBlogPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSave = async (data: {
    title: string;
    content: string;
    excerpt: string;
    status: 'draft' | 'published';
  }) => {
    setSaving(true);
    try {
      const res = await api.createBlog(data);
      const blog = res.data.data.blog;
      router.refresh();
      router.push(data.status === 'published' ? `/blogs/${blog.slug}` : '/dashboard');
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <BlogEditor onSave={handleSave} saving={saving} />
    </main>
  );
}
