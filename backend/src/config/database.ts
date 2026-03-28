import mysql from 'mysql2/promise';
import { Pool } from 'mysql2/promise';

let pool: Pool | null = null;

export async function initializeDatabase() {
  try {
    // Create connection pool
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'blog_db',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: '+00:00',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log('✓ Connected to MySQL database');
    connection.release();

    // Create tables
    await createTables();

    return pool;
  } catch (error) {
    console.error('✗ Failed to connect to MySQL:', error);
    process.exit(1);
  }
}

export async function createTables() {
  const connection = await pool!.getConnection();

  try {
    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        passwordHash VARCHAR(255) NOT NULL,
        displayName VARCHAR(255),
        bio TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Blogs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS blogs (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content LONGTEXT NOT NULL,
        excerpt TEXT,
        status VARCHAR(20) DEFAULT 'draft',
        viewCount INT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        publishedAt DATETIME,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userId (userId),
        INDEX idx_slug (slug),
        INDEX idx_status (status)
      )
    `);

    // Tags table (optional)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tags (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Blog-Tags junction table (optional)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS blog_tags (
        blogId VARCHAR(36) NOT NULL,
        tagId VARCHAR(36) NOT NULL,
        PRIMARY KEY (blogId, tagId),
        FOREIGN KEY (blogId) REFERENCES blogs(id) ON DELETE CASCADE,
        FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);

    // Migration: add password reset columns if they don't exist
    const [cols] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
       AND COLUMN_NAME IN ('passwordResetToken', 'passwordResetExpiry')`,
    );
    if ((cols as any[]).length < 2) {
      await connection.execute(`
        ALTER TABLE users
        ADD COLUMN passwordResetToken VARCHAR(255) DEFAULT NULL,
        ADD COLUMN passwordResetExpiry DATETIME DEFAULT NULL
      `);
    }

    // blog_likes table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS blog_likes (
        blogId VARCHAR(36) NOT NULL,
        userId VARCHAR(36) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (blogId, userId),
        FOREIGN KEY (blogId) REFERENCES blogs(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // blog_comments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS blog_comments (
        id VARCHAR(36) PRIMARY KEY,
        blogId VARCHAR(36) NOT NULL,
        userId VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (blogId) REFERENCES blogs(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_comment_blogId (blogId)
      )
    `);

    // user_follows table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_follows (
        followerId VARCHAR(36) NOT NULL,
        followingId VARCHAR(36) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (followerId, followingId),
        FOREIGN KEY (followerId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (followingId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Migration: add parentId to blog_comments if not exists
    const [commentCols] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blog_comments'
       AND COLUMN_NAME = 'parentId'`,
    );
    if ((commentCols as any[]).length === 0) {
      await connection.execute(
        `ALTER TABLE blog_comments ADD COLUMN parentId VARCHAR(36) DEFAULT NULL`,
      );
    }

    console.log('✓ Database tables created/verified');
  } catch (error) {
    console.error('✗ Error creating tables:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    console.log('✓ Database connection closed');
  }
}
