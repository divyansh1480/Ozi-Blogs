import { Metadata } from 'next';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import axios from 'axios';
import { User, Blog } from '@/types/index';
import ProfileClient from '@/components/ProfileClient';

interface ProfilePageProps {
  params: { username: string };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function getProfile(username: string): Promise<{ user: User & { followers?: number }; blogs: Blog[] } | null> {
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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <span>/</span>
          <Link href="/blogs" className="hover:text-primary transition">Blogs</Link>
          <span>/</span>
          <span className="text-gray-600">{data.user.displayName || data.user.username}</span>
        </nav>

        <ProfileClient user={data.user} blogs={data.blogs} />
      </div>
    </main>
  );
}
