'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated, isAdmin, isLoading, sessionExpiredMsg, clearSessionExpiredMsg } = useAuth();
  const router = useRouter();

  // Already logged in as admin → go to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(isAdmin ? '/dashboard' : '/blogs');
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailOrUsername.trim()) { setError('Please enter your email or username'); return; }
    if (!password) { setError('Please enter your password'); return; }

    setLoading(true);
    try {
      await login(emailOrUsername.trim(), password);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      setError(msg.toLowerCase().includes('admin') ? msg : msg);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-gray-400 text-sm mt-1">Authorized personnel only</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sessionExpiredMsg && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm flex items-start gap-2">
              <span>⚠️</span>
              <span>
                {sessionExpiredMsg}
                <button type="button" onClick={clearSessionExpiredMsg} className="ml-2 text-amber-600 underline text-xs">Dismiss</button>
              </span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="emailOrUsername" className="block text-sm font-medium mb-1.5 text-gray-700">
                Email or Username
              </label>
              <input
                id="emailOrUsername"
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="admin@example.com"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-primary hover:text-primary-dark">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-light text-white py-2.5 rounded-lg hover:bg-primary-dark transition disabled:opacity-50 font-medium text-sm mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          <Link href="/blogs" className="hover:text-gray-300 transition">← Back to blogs</Link>
        </p>
      </div>
    </div>
  );
}
