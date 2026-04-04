import { getPool } from '../config/database';
import { User } from '../types/index';

export async function getUserByUsername(username: string): Promise<User | null> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = (rows as any[])[0];
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } finally {
    conn.release();
  }
}

export async function updateUserProfile(
  userId: string,
  data: { displayName?: string; bio?: string; avatar?: string },
): Promise<User> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.displayName !== undefined) { updates.push('displayName = ?'); values.push(data.displayName); }
    if (data.bio !== undefined) { updates.push('bio = ?'); values.push(data.bio); }
    if (data.avatar !== undefined) { updates.push('avatar = ?'); values.push(data.avatar); }

    if (updates.length > 0) {
      values.push(userId);
      await conn.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const [rows] = await conn.execute('SELECT * FROM users WHERE id = ?', [userId]);
    const user = (rows as any[])[0];
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } finally {
    conn.release();
  }
}
