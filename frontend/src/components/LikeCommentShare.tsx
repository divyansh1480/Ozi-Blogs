'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface Props {
  blogId: string;
  blogTitle: string;
  initialLikes?: number;
  commentCount?: number;
  onCommentClick?: () => void;
}

export default function LikeCommentShare({ blogId, blogTitle, initialLikes = 0, commentCount = 0, onCommentClick }: Props) {
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.getLikeStatus(blogId).then(res => {
      setLiked(res.data.data.liked);
      setLikeCount(res.data.data.count);
    }).catch(() => {});
  }, [blogId, isAuthenticated]);

  const toggleLike = async () => {
    if (!isAuthenticated) { alert('Please sign in to like posts'); return; }
    setLoading(true);
    try {
      const res = liked
        ? await api.unlikeBlog(blogId)
        : await api.likeBlog(blogId);
      setLiked(res.data.data.liked);
      setLikeCount(res.data.data.count);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: blogTitle, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-1 py-3 border-t border-b border-gray-100 my-6">

      {/* Like */}
      <button
        onClick={toggleLike}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
          liked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'
        } disabled:opacity-50`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span className="text-sm font-medium">{likeCount > 0 ? likeCount : ''}</span>
        <span className="hidden sm:inline text-sm">{liked ? 'Liked' : 'Like'}</span>
      </button>

      {/* Comment */}
      <button
        onClick={onCommentClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-blue-500 transition"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {commentCount > 0 && <span className="text-sm font-medium">{commentCount}</span>}
        <span className="hidden sm:inline text-sm">Comment</span>
      </button>

      {/* Share */}
      <button
        onClick={handleShare}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
          copied ? 'text-green-500' : 'text-gray-400 hover:text-green-500'
        }`}
      >
        {copied ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        )}
        <span className="hidden sm:inline text-sm">{copied ? 'Copied!' : 'Share'}</span>
      </button>

    </div>
  );
}
