import { Request, Response } from 'express';
import {
  createBlog,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  getPublishedBlogs,
  getUserBlogs,
} from '../services/blogService';
import { AppError } from '../middleware/errorHandler';

export async function listBlogs(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || undefined;

  const result = await getPublishedBlogs(page, limit, search);

  res.json({ success: true, data: result });
}

export async function getBlog(req: Request, res: Response) {
  const blog = await getBlogById(req.params.id);
  if (!blog) throw new AppError(404, 'Blog not found');
  res.json({ success: true, data: { blog } });
}

export async function getBlogSlug(req: Request, res: Response) {
  const blog = await getBlogBySlug(req.params.slug);
  if (!blog) throw new AppError(404, 'Blog not found');
  res.json({ success: true, data: { blog } });
}

export async function create(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const blog = await createBlog(req.user.id, req.body);
  res.status(201).json({ success: true, data: { blog } });
}

export async function update(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const blog = await updateBlog(req.params.id, req.user.id, req.body);
  res.json({ success: true, data: { blog } });
}

export async function remove(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  await deleteBlog(req.params.id, req.user.id);
  res.json({ success: true, message: 'Blog deleted' });
}

export async function getUserBlogList(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await getUserBlogs(req.user.id, page, limit);
  res.json({ success: true, data: result });
}
