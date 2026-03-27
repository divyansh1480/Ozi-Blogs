'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { authorInitial } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  parentId?: string | null;
  createdAt: string;
  author?: { username: string; displayName?: string };
  replies?: Comment[];
}

interface Props {
  blogId: string;
  isOpen: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

function totalCount(comments: Comment[]): number {
  return comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0);
}

export default function CommentsSection({ blogId, isOpen, onClose, onCountChange }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getComments(blogId)
      .then(res => {
        const list: Comment[] = res.data.data.comments;
        setComments(list);
        onCountChange?.(totalCount(list));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [blogId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.addComment(blogId, text.trim());
      const newComment: Comment = {
        ...res.data.data.comment,
        author: { username: user!.username, displayName: user!.displayName },
        replies: [],
      };
      const updated = [newComment, ...comments];
      setComments(updated);
      onCountChange?.(totalCount(updated));
      setText('');
    } catch {
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !replyingTo) return;
    setSubmitting(true);
    try {
      const res = await api.addComment(blogId, replyText.trim(), replyingTo.id);
      const newReply: Comment = {
        ...res.data.data.comment,
        author: { username: user!.username, displayName: user!.displayName },
      };
      const updated = comments.map(c =>
        c.id === replyingTo.id
          ? { ...c, replies: [...(c.replies ?? []), newReply] }
          : c
      );
      setComments(updated);
      onCountChange?.(totalCount(updated));
      setReplyText('');
      setReplyingTo(null);
    } catch {
      alert('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string, parentId?: string | null) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await api.deleteComment(commentId);
      let updated: Comment[];
      if (parentId) {
        updated = comments.map(c =>
          c.id === parentId
            ? { ...c, replies: (c.replies ?? []).filter(r => r.id !== commentId) }
            : c
        );
      } else {
        updated = comments.filter(c => c.id !== commentId);
      }
      setComments(updated);
      onCountChange?.(totalCount(updated));
    } catch {
      alert('Failed to delete comment');
    }
  };

  const count = totalCount(comments);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      )}

      <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-bold text-gray-900">
            Comments
            {count > 0 && <span className="ml-2 text-sm font-normal text-gray-400">({count})</span>}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* New comment form */}
          {isAuthenticated ? (
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0 mt-1">
                  {authorInitial(user?.displayName, user?.username)}
                </div>
                <div className="flex-1">
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={submitting || !text.trim()}
                      className="bg-pink-400 hover:bg-pink-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      {submitting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-6 bg-pink-50 border border-pink-100 rounded-xl px-5 py-4 text-sm text-pink-600">
              <a href="/auth/login" className="font-semibold hover:underline">Sign in</a> to leave a comment.
            </div>
          )}

          {/* Comment list */}
          {loading ? (
            <p className="text-sm text-gray-400">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-400">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-5">
              {comments.map(c => (
                <div key={c.id}>
                  {/* Top-level comment */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5">
                      {authorInitial(c.author?.displayName, c.author?.username)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">
                          {c.author?.displayName || c.author?.username}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                        </span>
                        {user?.username === c.author?.username && (
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-xs text-gray-300 hover:text-red-400 transition"
                          >Delete</button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                      {isAuthenticated && (
                        <button
                          onClick={() => setReplyingTo(replyingTo?.id === c.id ? null : { id: c.id, name: c.author?.displayName || c.author?.username || '' })}
                          className="mt-1 text-xs text-gray-400 hover:text-pink-500 transition"
                        >
                          {replyingTo?.id === c.id ? 'Cancel' : 'Reply'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline reply form */}
                  {replyingTo?.id === c.id && (
                    <form onSubmit={handleReplySubmit} className="mt-3 ml-11">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder={`Reply to ${replyingTo.name}...`}
                        rows={2}
                        autoFocus
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="submit"
                          disabled={submitting || !replyText.trim()}
                          className="bg-pink-400 hover:bg-pink-500 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition disabled:opacity-50"
                        >
                          {submitting ? '...' : 'Reply'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Replies */}
                  {(c.replies ?? []).length > 0 && (
                    <div className="mt-3 ml-11 space-y-3 border-l-2 border-gray-100 pl-4">
                      {c.replies!.map(r => (
                        <div key={r.id} className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-300 to-purple-400 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5">
                            {authorInitial(r.author?.displayName, r.author?.username)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                              <span className="text-xs font-semibold text-gray-800">
                                {r.author?.displayName || r.author?.username}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                              </span>
                              {user?.username === r.author?.username && (
                                <button
                                  onClick={() => handleDelete(r.id, c.id)}
                                  className="text-xs text-gray-300 hover:text-red-400 transition"
                                >Delete</button>
                              )}
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed">{r.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
