import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../config/database';

// ── LIKES ──────────────────────────────────────────────

export async function likeBlog(blogId: string, userId: string): Promise<void> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.execute(
      'INSERT IGNORE INTO blog_likes (blogId, userId) VALUES (?, ?)',
      [blogId, userId],
    );
  } finally { conn.release(); }
}

export async function unlikeBlog(blogId: string, userId: string): Promise<void> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.execute('DELETE FROM blog_likes WHERE blogId = ? AND userId = ?', [blogId, userId]);
  } finally { conn.release(); }
}

export async function getLikeStatus(blogId: string, userId: string): Promise<{ liked: boolean; count: number }> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute('SELECT COUNT(*) as count FROM blog_likes WHERE blogId = ?', [blogId]);
    const count = (rows as any[])[0].count;
    const [liked] = await conn.execute('SELECT 1 FROM blog_likes WHERE blogId = ? AND userId = ?', [blogId, userId]);
    return { liked: (liked as any[]).length > 0, count };
  } finally { conn.release(); }
}

export async function getLikeCount(blogId: string): Promise<number> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute('SELECT COUNT(*) as count FROM blog_likes WHERE blogId = ?', [blogId]);
    return (rows as any[])[0].count;
  } finally { conn.release(); }
}

// ── COMMENTS ──────────────────────────────────────────

export interface Comment {
  id: string;
  blogId: string;
  userId: string;
  content: string;
  parentId?: string | null;
  createdAt: string;
  author?: { username: string; displayName?: string };
  replies?: Comment[];
}

export async function addComment(blogId: string, userId: string, content: string, parentId?: string): Promise<Comment> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const id = uuidv4();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await conn.execute(
      'INSERT INTO blog_comments (id, blogId, userId, content, parentId, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, blogId, userId, content, parentId || null, now],
    );
    return { id, blogId, userId, content, parentId: parentId || null, createdAt: now };
  } finally { conn.release(); }
}

export async function getComments(blogId: string): Promise<Comment[]> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      `SELECT c.*, u.username, u.displayName
       FROM blog_comments c
       JOIN users u ON c.userId = u.id
       WHERE c.blogId = ?
       ORDER BY c.createdAt ASC`,
      [blogId],
    );
    const all: Comment[] = (rows as any[]).map(r => ({
      id: r.id, blogId: r.blogId, userId: r.userId, content: r.content,
      parentId: r.parentId ?? null,
      createdAt: r.createdAt?.toISOString ? r.createdAt.toISOString() : r.createdAt,
      author: { username: r.username, displayName: r.displayName },
      replies: [],
    }));
    const byId = new Map(all.map(c => [c.id, c]));
    const top: Comment[] = [];
    all.forEach(c => {
      if (c.parentId && byId.has(c.parentId)) {
        byId.get(c.parentId)!.replies!.push(c);
      } else {
        top.push(c);
      }
    });
    top.reverse(); // newest top-level first
    return top;
  } finally { conn.release(); }
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute('SELECT userId FROM blog_comments WHERE id = ?', [commentId]);
    const comment = (rows as any[])[0];
    if (!comment) throw new Error('Comment not found');
    if (comment.userId !== userId) throw new Error('Unauthorized');
    await conn.execute('DELETE FROM blog_comments WHERE id = ?', [commentId]);
  } finally { conn.release(); }
}

// ── FOLLOWS ──────────────────────────────────────────

export async function followUser(followerId: string, followingId: string): Promise<void> {
  if (followerId === followingId) throw new Error('Cannot follow yourself');
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.execute(
      'INSERT IGNORE INTO user_follows (followerId, followingId) VALUES (?, ?)',
      [followerId, followingId],
    );
  } finally { conn.release(); }
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.execute('DELETE FROM user_follows WHERE followerId = ? AND followingId = ?', [followerId, followingId]);
  } finally { conn.release(); }
}

export async function getFollowStatus(followerId: string, followingId: string): Promise<{ following: boolean; followers: number; following_count: number }> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const [isFollowing] = await conn.execute(
      'SELECT 1 FROM user_follows WHERE followerId = ? AND followingId = ?',
      [followerId, followingId],
    );
    const [followersRes] = await conn.execute(
      'SELECT COUNT(*) as count FROM user_follows WHERE followingId = ?',
      [followingId],
    );
    const [followingRes] = await conn.execute(
      'SELECT COUNT(*) as count FROM user_follows WHERE followerId = ?',
      [followingId],
    );
    return {
      following: (isFollowing as any[]).length > 0,
      followers: (followersRes as any[])[0].count,
      following_count: (followingRes as any[])[0].count,
    };
  } finally { conn.release(); }
}

export async function getFollowerCount(userId: string): Promise<number> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute('SELECT COUNT(*) as count FROM user_follows WHERE followingId = ?', [userId]);
    return (rows as any[])[0].count;
  } finally { conn.release(); }
}
