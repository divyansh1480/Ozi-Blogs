import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../config/database';
import { hashPassword, comparePasswords } from '../utils/password';
import { generateTokens } from '../utils/jwt';
import { validateEmail, validatePassword, validateUsername } from '../utils/validation';
import { User, RegisterRequestBody, LoginRequestBody } from '../types/index';

export async function registerUser(data: RegisterRequestBody): Promise<{ user: User; tokens: any }> {
  // Validate input
  if (!validateEmail(data.email)) {
    throw new Error('Invalid email format');
  }
  if (!validatePassword(data.password)) {
    throw new Error('Password must be at least 8 characters');
  }
  if (!validateUsername(data.username)) {
    throw new Error('Username must be 3-30 alphanumeric characters or underscore');
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    // Check if user already exists
    const [existingUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [data.email, data.username],
    );

    if ((existingUser as any[]).length > 0) {
      throw new Error('Email or username already in use');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const userId = uuidv4();
    await connection.execute(
      'INSERT INTO users (id, username, email, passwordHash, displayName) VALUES (?, ?, ?, ?, ?)',
      [userId, data.username, data.email, passwordHash, data.displayName || data.username],
    );

    // Generate tokens
    const tokens = generateTokens({
      id: userId,
      email: data.email,
      username: data.username,
    });

    const user: User = {
      id: userId,
      username: data.username,
      email: data.email,
      displayName: data.displayName || data.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { user, tokens };
  } finally {
    connection.release();
  }
}

export async function loginUser(data: LoginRequestBody): Promise<{ user: User; tokens: any }> {
  // Validate input
  if (!validateEmail(data.email)) {
    throw new Error('Invalid email format');
  }
  if (!data.password) {
    throw new Error('Password is required');
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    // Find user
    const [users] = await connection.execute('SELECT * FROM users WHERE email = ?', [data.email]);

    const userRecord = (users as any[])[0];
    if (!userRecord) {
      throw new Error('Invalid email or password');
    }

    // Compare password
    const isPasswordValid = await comparePasswords(data.password, userRecord.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = generateTokens({
      id: userRecord.id,
      email: userRecord.email,
      username: userRecord.username,
    });

    const user: User = {
      id: userRecord.id,
      username: userRecord.username,
      email: userRecord.email,
      displayName: userRecord.displayName,
      bio: userRecord.bio,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
    };

    return { user, tokens };
  } finally {
    connection.release();
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    const [users] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);

    const user = (users as any[])[0];
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } finally {
    connection.release();
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    const [users] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);

    const user = (users as any[])[0];
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } finally {
    connection.release();
  }
}

export async function createPasswordResetToken(email: string): Promise<{ resetToken: string } | null> {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    const [users] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
    const user = (users as any[])[0];
    if (!user) return null;

    const resetToken = uuidv4().replace(/-/g, '');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const expiryStr = expiry.toISOString().slice(0, 19).replace('T', ' ');

    await connection.execute(
      'UPDATE users SET passwordResetToken = ?, passwordResetExpiry = ? WHERE id = ?',
      [resetToken, expiryStr, user.id],
    );
    return { resetToken };
  } finally {
    connection.release();
  }
}

export async function resetUserPassword(token: string, newPassword: string): Promise<boolean> {
  if (!token || !newPassword || newPassword.length < 8) return false;

  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const [users] = await connection.execute(
      'SELECT id FROM users WHERE passwordResetToken = ? AND passwordResetExpiry > ?',
      [token, now],
    );
    const user = (users as any[])[0];
    if (!user) return false;

    const { hashPassword } = await import('../utils/password');
    const passwordHash = await hashPassword(newPassword);

    await connection.execute(
      'UPDATE users SET passwordHash = ?, passwordResetToken = NULL, passwordResetExpiry = NULL WHERE id = ?',
      [passwordHash, user.id],
    );
    return true;
  } finally {
    connection.release();
  }
}
