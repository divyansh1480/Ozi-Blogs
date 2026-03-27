'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';

interface ImportResult {
  row: number;
  title: string;
  status: 'created' | 'failed';
  error?: string;
}

interface ImportBlogsModalProps {
  onClose: () => void;
  onImported: () => void;
}

export default function ImportBlogsModal({ onClose, onImported }: ImportBlogsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number; total: number; results: ImportResult[] } | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setError(''); setResult(null); }
  };

  const handleImport = async () => {
    if (!file) { setError('Please select an Excel file first'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.importBlogs(file);
      setResult(res.data.data);
      if (res.data.data.created > 0) onImported();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    import('xlsx').then((XLSX) => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['title', 'content', 'excerpt', 'status'],
        ['My First Blog', 'This is the full content of the blog post.', 'A short description', 'draft'],
        ['Another Blog', 'More content here for the second blog.', '', 'published'],
      ]);
      ws['!cols'] = [{ wch: 30 }, { wch: 50 }, { wch: 30 }, { wch: 12 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Blogs');
      XLSX.writeFile(wb, 'bloghub_import_template.xlsx');
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Import Blogs from Excel</h2>
            <p className="text-sm text-gray-500 mt-0.5">Upload an .xlsx file to create multiple blogs at once</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition text-xl leading-none">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Template download */}
          <div className="bg-pink-50 border border-pink-100 rounded-xl p-4">
            <p className="text-sm font-medium text-pink-700 mb-1">Expected columns</p>
            <p className="text-xs text-pink-600 font-mono mb-3">title · content · excerpt · status</p>
            <p className="text-xs text-gray-500 mb-3">
              <strong>title</strong> and <strong>content</strong> are required. <strong>status</strong> can be <code className="bg-white px-1 rounded">draft</code> or <code className="bg-white px-1 rounded">published</code> (defaults to draft).
            </p>
            <button
              onClick={downloadTemplate}
              className="text-xs text-pink-500 font-medium hover:text-pink-600 underline underline-offset-2"
            >
              Download template →
            </button>
          </div>

          {/* File picker */}
          {!result && (
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-pink-300 hover:bg-pink-50 transition"
            >
              <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
              {file ? (
                <div>
                  <p className="text-sm font-medium text-gray-800">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl mb-2">📂</p>
                  <p className="text-sm text-gray-500">Click to select an Excel file</p>
                  <p className="text-xs text-gray-400 mt-1">.xlsx or .xls, max 5 MB</p>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{result.created}</p>
                  <p className="text-xs text-green-500 mt-0.5">Created</p>
                </div>
                <div className="flex-1 bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-red-500">{result.failed}</p>
                  <p className="text-xs text-red-400 mt-0.5">Failed</p>
                </div>
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gray-700">{result.total}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Total rows</p>
                </div>
              </div>

              {result.failed > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.results.filter((r) => r.status === 'failed').map((r) => (
                    <div key={r.row} className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                      Row {r.row}: <span className="font-medium">{r.title}</span> — {r.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={loading || !file}
              className="px-5 py-2 text-sm bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Importing...' : 'Import Blogs'}
            </button>
          )}
          {result && (
            <button
              onClick={() => { setResult(null); setFile(null); }}
              className="px-5 py-2 text-sm bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition font-medium"
            >
              Import More
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
