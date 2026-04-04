'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface Props {
  userId: string;
  initialFollowers?: number;
  showFollowers?: boolean;
  compact?: boolean;
}

export default function FollowButton({ userId, initialFollowers = 0, showFollowers = true, compact = false }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(initialFollowers);
  const [loading, setLoading] = useState(false);

  const isOwnProfile = isAuthenticated && user?.id === userId;

  useEffect(() => {
    if (!isAuthenticated || isOwnProfile) return;
    api.getFollowStatus(userId).then(res => {
      setFollowing(res.data.data.following);
      setFollowers(res.data.data.followers);
    }).catch(() => {});
  }, [userId, isAuthenticated, isOwnProfile]);

  if (isOwnProfile) return null;

  const toggle = async () => {
    if (!isAuthenticated) { window.location.href = '/auth/login'; return; }
    setLoading(true);
    try {
      const res = following
        ? await api.unfollowUser(userId)
        : await api.followUser(userId);
      setFollowing(res.data.data.following);
      setFollowers(res.data.data.followers);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className={`text-xs font-medium px-3 py-1 rounded-full transition border ${
          following
            ? 'border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-500'
            : 'border-primary-light text-primary hover:bg-primary-light hover:text-white'
        } disabled:opacity-60`}
      >
        {loading ? '...' : following ? 'Following' : '+ Follow'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 mt-3">
      <button
        onClick={toggle}
        disabled={loading}
        className={`text-sm font-medium px-5 py-2 rounded-full transition border ${
          following
            ? 'border-gray-300 text-gray-600 hover:border-red-300 hover:text-red-500 hover:bg-red-50'
            : 'border-primary-light bg-primary-light text-white hover:bg-primary-dark'
        } disabled:opacity-60`}
      >
        {loading ? '...' : following ? 'Following' : '+ Follow'}
      </button>
      {showFollowers && (
        <span className="text-sm text-gray-500">{followers} follower{followers !== 1 ? 's' : ''}</span>
      )}
    </div>
  );
}
