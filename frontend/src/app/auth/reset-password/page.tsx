'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-red-500">Invalid or missing reset token.</p>
        <Link href="/auth/forgot-password" className="text-pink-500 hover:text-pink-600 text-sm">
          Request a new link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired reset link');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-gray-700 font-medium">Password reset successfully!</p>
        <p className="text-gray-500 text-sm">Redirecting you to sign in...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
      )}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          New Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Min 8 characters"
          required
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium mb-2">
          Confirm Password
        </label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Repeat your password"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-pink-400 text-white py-2 rounded-lg hover:bg-pink-500 transition disabled:bg-gray-400"
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-300 to-pink-500 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-2 text-center">Reset Password</h2>
          <p className="text-sm text-gray-500 text-center mb-6">Enter your new password below.</p>
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
          <p className="text-center text-sm text-gray-500 mt-6">
            <Link href="/auth/login" className="text-pink-500 hover:text-pink-600">
              ← Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
