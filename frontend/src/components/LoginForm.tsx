'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginForm() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  // Client-side pre-validation for instant feedback
  const preValidate = (): string | null => {
    if (!emailOrUsername.trim()) return 'Please enter your email or username';
    // If it looks like an email, validate format immediately
    if (emailOrUsername.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrUsername)) {
      return 'Please enter a valid email address';
    }
    if (!password) return 'Please enter your password';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowResend(false);

    const clientError = preValidate();
    if (clientError) { setError(clientError); return; }

    setLoading(true);
    try {
      await login(emailOrUsername.trim(), password);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      setError(msg);
      if (msg.toLowerCase().includes('verify')) setShowResend(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.resendVerification(emailOrUsername.trim());
      setResendSent(true);
    } catch {
      // silently ignore
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <Image src="/uploads/cat.svg" alt="Cat" width={180} height={180}
        className="absolute -top-2 -left-16 z-0 hidden md:block rotate-[-10deg] drop-shadow-xl" />
      <Image src="/uploads/flower.svg" alt="Flower" width={180} height={180}
        className="absolute -bottom-12 -right-24 z-0 hidden md:block rotate-[10deg] drop-shadow-xl" />

      <div className="mt-20 relative z-10 bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
            {showResend && !resendSent && (
              <button
                type="button"
                onClick={handleResend}
                className="block mt-2 text-primary-dark underline text-xs font-medium"
              >
                Resend verification email
              </button>
            )}
            {resendSent && (
              <p className="mt-2 text-green-600 text-xs font-medium">Verification email resent — check your inbox.</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="emailOrUsername" className="block text-sm font-medium mb-2">
              Email or Username
            </label>
            <input
              id="emailOrUsername"
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="your@email.com or username"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium">Password</label>
              <Link href="/auth/forgot-password" className="text-xs text-primary hover:text-primary-dark">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-light text-white py-2 rounded-lg hover:bg-primary-dark transition disabled:bg-gray-400"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-primary hover:text-primary-dark font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
