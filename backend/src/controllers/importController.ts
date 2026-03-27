import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { createBlog } from '../services/blogService';
import { AppError } from '../middleware/errorHandler';

export async function importBlogsFromExcel(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  if (!req.file) throw new AppError(400, 'No file uploaded');

  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rows.length === 0) {
    throw new AppError(400, 'Excel file is empty or has no data rows');
  }

  const results: { row: number; title: string; status: 'created' | 'failed'; error?: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const title = String(row.title || row.Title || '').trim();
    const content = String(row.content || row.Content || '').trim();
    const excerpt = String(row.excerpt || row.Excerpt || '').trim();
    const status = String(row.status || row.Status || 'draft').toLowerCase();
    const blogStatus = status === 'published' ? 'published' : 'draft';

    if (!title) {
      results.push({ row: i + 2, title: '(empty)', status: 'failed', error: 'Title is required' });
      continue;
    }
    if (!content) {
      results.push({ row: i + 2, title, status: 'failed', error: 'Content is required' });
      continue;
    }

    try {
      await createBlog(req.user!.id, {
        title,
        content: content.replace(/\n/g, '<br>'),
        excerpt: excerpt || undefined,
        status: blogStatus,
      });
      results.push({ row: i + 2, title, status: 'created' });
    } catch (err: any) {
      results.push({ row: i + 2, title, status: 'failed', error: err.message });
    }
  }

  const created = results.filter((r) => r.status === 'created').length;
  const failed = results.filter((r) => r.status === 'failed').length;

  res.json({
    success: true,
    data: { created, failed, total: rows.length, results },
  });
}
