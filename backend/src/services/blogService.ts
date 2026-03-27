import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { getPool } from '../config/database';
import { Blog, CreateBlogRequestBody, UpdateBlogRequestBody, PaginatedResponse } from '../types/index';

export async function createBlog(
  userId: string,
  data: CreateBlogRequestBody,
): Promise<Blog> {
  const { title, content, excerpt, status = 'draft' } = data;

  // Validate
  if (!title || !content) {
    throw new Error('Title and content are required');
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    const blogId = uuidv4();
    const slug = generateUniqueSlug(title);
    const now = mysqlNow();
    const publishedAt = status === 'published' ? now : null;

    await connection.execute(
      `INSERT INTO blogs (id, userId, title, slug, content, excerpt, status, publishedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [blogId, userId, title, slug, content, excerpt || null, status, publishedAt, now, now],
    );

    return {
      id: blogId,
      userId,
      title,
      slug,
      content,
      excerpt: excerpt || undefined,
      status,
      viewCount: 0,
      publishedAt: publishedAt || undefined,
      createdAt: now,
      updatedAt: now,
    };
  } finally {
    connection.release();
  }
}

export async function getBlogById(id: string): Promise<Blog | null> {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    const [blogs] = await connection.execute('SELECT * FROM blogs WHERE id = ?', [id]);

    const blog = (blogs as any[])[0];
    if (!blog) return null;

    return formatBlog(blog);
  } finally {
    connection.release();
  }
}

export async function getBlogBySlug(slug: string): Promise<Blog | null> {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    const [blogs] = await connection.execute(
      `SELECT b.*, u.username, u.displayName, u.bio
       FROM blogs b LEFT JOIN users u ON b.userId = u.id
       WHERE b.slug = ?`,
      [slug],
    );

    const blog = (blogs as any[])[0];
    if (!blog) return null;

    await connection.execute('UPDATE blogs SET viewCount = viewCount + 1 WHERE id = ?', [blog.id]);

    return formatBlogWithAuthor(blog);
  } finally {
    connection.release();
  }
}

export async function updateBlog(
  blogId: string,
  userId: string,
  data: UpdateBlogRequestBody,
): Promise<Blog> {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    // Check ownership
    const [blogs] = await connection.execute('SELECT userId FROM blogs WHERE id = ?', [blogId]);
    const blog = (blogs as any[])[0];

    if (!blog) {
      throw new Error('Blog not found');
    }

    if (blog.userId !== userId) {
      throw new Error('Unauthorized - You can only edit your own blogs');
    }

    // Update blog
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.content) {
      updates.push('content = ?');
      values.push(data.content);
    }
    if (data.excerpt !== undefined) {
      updates.push('excerpt = ?');
      values.push(data.excerpt || null);
    }
    if (data.status) {
      updates.push('status = ?');
      values.push(data.status);
      if (data.status === 'published') {
        updates.push('publishedAt = ?');
        values.push(mysqlNow());
      }
    }

    updates.push('updatedAt = ?');
    values.push(mysqlNow());
    values.push(blogId);

    const query = `UPDATE blogs SET ${updates.join(', ')} WHERE id = ?`;
    await connection.execute(query, values);

    const updated = await getBlogById(blogId);
    if (!updated) throw new Error('Failed to retrieve updated blog');

    return updated;
  } finally {
    connection.release();
  }
}

export async function deleteBlog(blogId: string, userId: string): Promise<void> {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    // Check ownership
    const [blogs] = await connection.execute('SELECT userId FROM blogs WHERE id = ?', [blogId]);
    const blog = (blogs as any[])[0];

    if (!blog) {
      throw new Error('Blog not found');
    }

    if (blog.userId !== userId) {
      throw new Error('Unauthorized - You can only delete your own blogs');
    }

    await connection.execute('DELETE FROM blogs WHERE id = ?', [blogId]);
  } finally {
    connection.release();
  }
}

export async function getPublishedBlogs(
  page: number = 1,
  limit: number = 10,
  search?: string,
): Promise<PaginatedResponse<Blog>> {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    const offset = (page - 1) * limit;
    let query = `
      SELECT b.*, u.username, u.displayName, u.bio
      FROM blogs b
      LEFT JOIN users u ON b.userId = u.id
      WHERE b.status = "published"
    `;
    let countQuery = 'SELECT COUNT(*) as count FROM blogs WHERE status = "published"';
    const params: any[] = [];

    if (search) {
      const searchTerm = `%${search}%`;
      query += ' AND (b.title LIKE ? OR b.content LIKE ? OR b.excerpt LIKE ?)';
      countQuery += ' AND (title LIKE ? OR content LIKE ? OR excerpt LIKE ?)';
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY b.publishedAt DESC LIMIT ${limit} OFFSET ${offset}`;

    const [blogs] = await connection.execute(query, params);
    const [countResult] = await connection.execute(
      countQuery,
      search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [],
    );

    const total = (countResult as any[])[0].count;
    const totalPages = Math.ceil(total / limit);

    return {
      items: (blogs as any[]).map(formatBlogWithAuthor),
      total,
      page,
      limit,
      totalPages,
    };
  } finally {
    connection.release();
  }
}

export async function getUserBlogs(userId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Blog>> {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    const offset = (page - 1) * limit;

    const [blogs] = await connection.execute(
      `SELECT * FROM blogs WHERE userId = ? ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${offset}`,
      [userId],
    );

    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM blogs WHERE userId = ?', [
      userId,
    ]);

    const total = (countResult as any[])[0].count;
    const totalPages = Math.ceil(total / limit);

    return {
      items: (blogs as any[]).map(formatBlog),
      total,
      page,
      limit,
      totalPages,
    };
  } finally {
    connection.release();
  }
}

export async function getUserPublishedBlogs(userId: string): Promise<Blog[]> {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    const [blogs] = await connection.execute(
      `SELECT b.*, u.username, u.displayName, u.bio
       FROM blogs b LEFT JOIN users u ON b.userId = u.id
       WHERE b.userId = ? AND b.status = "published"
       ORDER BY b.publishedAt DESC LIMIT 10`,
      [userId],
    );

    return (blogs as any[]).map(formatBlogWithAuthor);
  } finally {
    connection.release();
  }
}

// Helper functions
function mysqlNow(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function generateUniqueSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true });
  return `${base}-${uuidv4().slice(0, 6)}`;
}

function toIso(val: any): string {
  return val?.toISOString ? val.toISOString() : val;
}

function formatBlog(blog: any): Blog {
  return {
    id: blog.id,
    userId: blog.userId,
    title: blog.title,
    slug: blog.slug,
    content: blog.content,
    excerpt: blog.excerpt,
    status: blog.status,
    viewCount: blog.viewCount,
    createdAt: toIso(blog.createdAt),
    updatedAt: toIso(blog.updatedAt),
    publishedAt: blog.publishedAt ? toIso(blog.publishedAt) : undefined,
  };
}

function formatBlogWithAuthor(blog: any): Blog & { author?: any } {
  return {
    ...formatBlog(blog),
    author: blog.username
      ? { id: blog.userId, username: blog.username, displayName: blog.displayName, bio: blog.bio }
      : undefined,
  };
}
