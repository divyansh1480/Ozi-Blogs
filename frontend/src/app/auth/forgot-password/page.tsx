'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotFound(false);
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setSubmitted(true);
      if (res.data.resetUrl) setResetUrl(res.data.resetUrl);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Something went wrong';
      setError(msg);
      if (err.response?.status === 404) setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-primary flex items-center justify-center">
      <div className="w-full max-w-md mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-2 text-center">Forgot Password</h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Enter your email and we'll generate a reset link.
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
              {notFound && (
                <p className="mt-2">
                  Don't have an account?{' '}
                  <a href="/auth/register" className="underline font-medium">Sign up here →</a>
                </p>
              )}
            </div>
          )}

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="email"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-light text-white py-2 rounded-lg hover:bg-primary-dark transition disabled:bg-gray-400"
              >
                {loading ? 'Generating link...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-700 text-sm">
                A password reset link has been generated for <span className="font-medium">{email}</span>.
              </p>

              {resetUrl && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-left">
                  <p className="text-xs text-primary-dark font-medium mb-2">
                    Dev mode — link (would be emailed in production):
                  </p>
                  <Link
                    href={resetUrl}
                    className="text-xs text-primary break-all underline"
                  >
                    {resetUrl}
                  </Link>
                </div>
              )}
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link href="/auth/login" className="text-primary hover:text-primary-dark">
              ← Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
