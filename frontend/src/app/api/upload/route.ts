import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const useVercel = TOKEN && TOKEN !== 'your_token_here';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 10MB' }, { status: 400 });
  }

  if (useVercel) {
    // Production: upload to Vercel Blob CDN
    const { put } = await import('@vercel/blob');
    const blob = await put(`blog-images/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });
    return NextResponse.json({ url: blob.url });
  }

  // Local dev: save to public/uploads/
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split('.').pop() ?? 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const savePath = path.join(process.cwd(), 'public', 'uploads', filename);

  await writeFile(savePath, buffer);
  return NextResponse.json({ url: `/uploads/${filename}` });
}