'use client';

import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { User, Blog } from '@/types/index';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import BlogCard from '@/components/BlogCard';
import FollowButton from '@/components/FollowButton';
import { authorInitial } from '@/lib/utils';

interface Props {
  user: User & { followers?: number };
  blogs: Blog[];
}

export default function ProfileClient({ user: initialUser, blogs }: Props) {
  const { user: authUser, updateUser } = useAuth();
  const [user, setLocalUser] = useState(initialUser);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isOwner = authUser?.username === user.username;
  const initial = authorInitial(user.displayName, user.username);
  const joinDate = format(new Date(user.createdAt), 'MMMM yyyy');

  // Construct BlogWithAuthor from Blog for BlogCard
  const blogsWithAuthor = blogs.map((b) => ({ ...b, author: user }));

  async function handleAvatarDelete() {
    try {
      await api.updateProfile({ avatar: '' });
      setLocalUser((u) => ({ ...u, avatar: undefined }));
      updateUser({ avatar: undefined });
    } catch {
      setError('Failed to remove avatar');
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.url) throw new Error('Upload failed');
      const updated = await api.updateProfile({ avatar: data.url });
      const newUser = updated.data.data.user;
      setLocalUser((u) => ({ ...u, avatar: newUser.avatar }));
      updateUser({ avatar: newUser.avatar });
    } catch {
      setError('Avatar upload failed');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await api.updateProfile({ displayName: displayName.trim(), bio: bio.trim() });
      const newUser = res.data.data.user;
      setLocalUser((u) => ({ ...u, displayName: newUser.displayName, bio: newUser.bio }));
      updateUser({ displayName: newUser.displayName, bio: newUser.bio });
      setEditing(false);
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        {/* Cover strip */}
        <div className="h-28 bg-gradient-to-r from-primary-light via-purple-400 to-indigo-400" />

        <div className="px-8 pb-8">
          {/* Avatar row */}
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <div className="relative group/av">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.displayName || user.username}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-light to-purple-500 flex items-center justify-center text-white font-bold text-3xl border-4 border-white shadow-md">
                  {initial}
                </div>
              )}
              {isOwner && (
                <>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/av:opacity-100 transition flex items-center justify-center text-white text-xs font-medium"
                  >
                    {avatarUploading ? '…' : '📷'}
                  </button>
                  {user.avatar && (
                    <button
                      onClick={handleAvatarDelete}
                      title="Remove avatar"
                      className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-[10px] border-2 border-white shadow transition"
                    >✕</button>
                  )}
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </>
              )}
            </div>

            {isOwner && !editing && (
              <button
                onClick={() => { setEditing(true); setDisplayName(user.displayName || ''); setBio(user.bio || ''); setError(''); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                ✏️ Edit Profile
              </button>
            )}
            {!isOwner && (
              <FollowButton userId={user.id} initialFollowers={user.followers ?? 0} />
            )}
          </div>

          {editing ? (
            /* Edit form */
            <div className="space-y-3 max-w-md">
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Display Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people a little about yourself…"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 bg-primary-light hover:bg-primary-dark text-white text-sm rounded-lg transition disabled:opacity-50 font-medium">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => { setEditing(false); setError(''); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Display */
            <>
              <h1 className="text-2xl font-bold text-gray-900">{user.displayName || user.username}</h1>
              <p className="text-sm text-gray-400 mt-0.5">@{user.username}</p>
              {user.bio && <p className="mt-3 text-gray-600 text-sm leading-relaxed max-w-xl">{user.bio}</p>}
            </>
          )}

          {/* Stats */}
          <div className="mt-5 flex items-center gap-6 text-sm flex-wrap">
            <div>
              <span className="font-semibold text-gray-900">{blogs.length}</span>
              <span className="text-gray-400 ml-1">blog{blogs.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div>
              <span className="font-semibold text-gray-900">{user.followers ?? 0}</span>
              <span className="text-gray-400 ml-1">followers</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="text-gray-400">Since {joinDate}</div>
          </div>
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
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Published blogs</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogsWithAuthor.map((blog) => (
              <div key={blog.id} className="h-full">
                <BlogCard blog={blog} />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
