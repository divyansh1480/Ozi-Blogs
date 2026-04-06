import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../config/database';
import { hashPassword, comparePasswords } from '../utils/password';
import { generateTokens } from '../utils/jwt';
import { validateEmail, validatePassword, validateUsername } from '../utils/validation';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { User, RegisterRequestBody, LoginRequestBody } from '../types/index';

export async function registerUser(data: RegisterRequestBody): Promise<{ user: User; tokens: any }> {
  if (!validateEmail(data.email)) throw new Error('Invalid email format');
  if (!validatePassword(data.password)) throw new Error('Password must be at least 8 characters');
  if (!validateUsername(data.username)) throw new Error('Username must be 3-30 alphanumeric characters or underscore');

  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    const [existingUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [data.email, data.username],
    );
    if ((existingUser as any[]).length > 0) throw new Error('Email or username already in use');

    const passwordHash = await hashPassword(data.password);
    const userId = uuidv4();
    const verificationToken = uuidv4().replace(/-/g, '');

    await connection.execute(
      `INSERT INTO users (id, username, email, passwordHash, displayName, emailVerified, emailVerificationToken)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [userId, data.username, data.email, passwordHash, data.displayName || data.username, verificationToken],
    );

    // Send verification email (non-blocking — don't fail registration if email fails)
    sendVerificationEmail(data.email, verificationToken).catch((err) => {
      console.error('[EMAIL] Failed to send verification email:', err.message);
    });

    const tokens = generateTokens({ id: userId, email: data.email, username: data.username });

    const user: User = {
      id: userId,
      username: data.username,
      email: data.email,
      displayName: data.displayName || data.username,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { user, tokens };
  } finally {
    connection.release();
  }
}

export async function loginUser(data: LoginRequestBody): Promise<{ user: User; tokens: any }> {
  const { emailOrUsername, password } = data;
  if (!emailOrUsername?.trim()) throw new Error('Email or username is required');
  if (!password) throw new Error('Password is required');

  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    // Detect if input looks like an email or a username
    const isEmail = emailOrUsername.includes('@');

    const [users] = await connection.execute(
      isEmail
        ? 'SELECT * FROM users WHERE email = ?'
        : 'SELECT * FROM users WHERE username = ?',
      [emailOrUsername.trim()],
    );

    const userRecord = (users as any[])[0];
    if (!userRecord) {
      throw new Error(isEmail ? 'No account found with that email' : 'No account found with that username');
    }

    const isPasswordValid = await comparePasswords(password, userRecord.passwordHash);
    if (!isPasswordValid) throw new Error('Incorrect password');

    // Block login if email not verified
    if (!userRecord.emailVerified) {
      throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
    }

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
      avatar: userRecord.avatar,
      emailVerified: !!userRecord.emailVerified,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
    };

    return { user, tokens };
  } finally {
    connection.release();
  }
}

export async function verifyUserEmail(token: string): Promise<boolean> {
  if (!token) return false;
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    const [users] = await connection.execute(
      'SELECT id FROM users WHERE emailVerificationToken = ?',
      [token],
    );
    const user = (users as any[])[0];
    if (!user) return false;

    await connection.execute(
      'UPDATE users SET emailVerified = 1, emailVerificationToken = NULL WHERE id = ?',
      [user.id],
    );
    return true;
  } finally {
    connection.release();
  }
}

export async function resendVerificationEmail(emailOrUsername: string): Promise<void> {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    const isEmail = emailOrUsername.includes('@');
    const [users] = await connection.execute(
      isEmail ? 'SELECT * FROM users WHERE email = ?' : 'SELECT * FROM users WHERE username = ?',
      [emailOrUsername.trim()],
    );
    const user = (users as any[])[0];
    if (!user || user.emailVerified) return; // silently skip

    let token = user.emailVerificationToken;
    if (!token) {
      token = uuidv4().replace(/-/g, '');
      await connection.execute('UPDATE users SET emailVerificationToken = ? WHERE id = ?', [token, user.id]);
    }
    await sendVerificationEmail(user.email, token);
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
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      avatar: user.avatar,
      emailVerified: !!user.emailVerified,
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
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    const expiryStr = expiry.toISOString().slice(0, 19).replace('T', ' ');

    await connection.execute(
      'UPDATE users SET passwordResetToken = ?, passwordResetExpiry = ? WHERE id = ?',
      [resetToken, expiryStr, user.id],
    );

    // Send reset email
    const [emailRows] = await connection.execute('SELECT email FROM users WHERE id = ?', [user.id]);
    const userEmail = (emailRows as any[])[0]?.email;
    if (userEmail) {
      sendPasswordResetEmail(userEmail, resetToken).catch((err) => {
        console.error('[EMAIL] Failed to send reset email:', err.message);
      });
    }

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
