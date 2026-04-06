'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { register } = useAuth();

  const preValidate = (): string | null => {
    if (!username.trim()) return 'Username is required';
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) return 'Username must be 3–30 characters (letters, numbers, underscore)';
    if (!email.trim()) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address (e.g. user@example.com)';
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const clientError = preValidate();
    if (clientError) { setError(clientError); return; }

    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password, displayName.trim() || undefined);
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="relative w-full max-w-md mx-auto">
        <div className="mt-20 relative z-10 bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm mb-6">
            We sent a verification link to <span className="font-medium text-gray-800">{email}</span>.
            Click the link to activate your account before logging in.
          </p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition font-medium"
          >
            Go to Login
          </Link>
          <p className="text-xs text-gray-400 mt-4">Didn't receive it? Check spam or wait a minute.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      <Image src="/uploads/cat.svg" alt="Cat" width={180} height={180}
        className="absolute -top-2 -left-16 z-0 hidden md:block rotate-[-10deg] drop-shadow-xl" />
      <Image src="/uploads/flower.svg" alt="Flower" width={180} height={180}
        className="absolute -bottom-10 -right-24 z-0 hidden md:block rotate-[10deg] drop-shadow-xl" />

      <div className="mt-20 relative z-10 bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">Username</label>
            <input id="username" type="text" value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="username" autoComplete="username" required />
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-2">Display Name <span className="text-gray-400 font-normal">(optional)</span></label>
            <input id="displayName" type="text" value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Your Name" />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
            <input id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => {
                if (email && !emailRegex.test(email)) setError('Please enter a valid email address');
                else if (error.includes('email')) setError('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="email" autoComplete="email" required />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
            <input id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Min. 8 characters" autoComplete="new-password" required />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Confirm Password</label>
            <input id="confirmPassword" type="password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••" autoComplete="new-password" required />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-primary-light text-white py-2 rounded-lg hover:bg-primary-dark transition disabled:bg-gray-400">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:text-primary-dark font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
