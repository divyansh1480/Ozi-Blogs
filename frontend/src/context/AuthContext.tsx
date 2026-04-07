'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/index';
import apiClient from '@/lib/api';

// ── Inactivity timeout ───────────────────────────────────────────────────────
// User is logged out after this many ms of no interaction.
// Change this one constant to adjust the timeout for the whole app.
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Events that count as user activity
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;

// localStorage key — shared across tabs so activity in any tab resets the timer
const LAST_ACTIVITY_KEY = 'lastActivityAt';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  sessionExpiredMsg: string;
  clearSessionExpiredMsg: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState('');
  const router = useRouter();
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef<User | null>(null);
  // Stable ref to logout so the inactivity handler never has a stale closure
  const logoutRef = useRef<() => Promise<void>>(async () => {});

  // ── Core logout (called both manually and by inactivity) ─────────────────
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Even if the request fails, clear client state
    }
    setUser(null);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  };
  logoutRef.current = logout;

  // ── Inactivity detection ─────────────────────────────────────────────────
  const resetInactivityTimer = () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  };

  const scheduleInactivityCheck = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      const last = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
      const idle = Date.now() - last;
      if (idle >= INACTIVITY_TIMEOUT_MS) {
        logoutRef.current();
      } else {
        // Not idle yet — reschedule for the remaining time
        inactivityTimerRef.current = setTimeout(() => {
          logoutRef.current();
        }, INACTIVITY_TIMEOUT_MS - idle);
      }
    }, INACTIVITY_TIMEOUT_MS);
  };

  // Wire up activity listeners when the user is logged in
  useEffect(() => {
    if (!user) {
      // Tear down when logged out
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, resetInactivityTimer));
      return;
    }

    // Stamp activity on login / page load
    resetInactivityTimer();
    scheduleInactivityCheck();

    ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, resetInactivityTimer, { passive: true }));

    // Cross-tab sync: if another tab updates lastActivityAt, reschedule our timer
    const onStorage = (e: StorageEvent) => {
      if (e.key === LAST_ACTIVITY_KEY) scheduleInactivityCheck();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, resetInactivityTimer));
      window.removeEventListener('storage', onStorage);
    };
  }, [!!user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep userRef in sync so session-expired handler can read it without stale closure
  useEffect(() => { userRef.current = user; }, [user]);

  // ── Session-expired event from api.ts interceptor ────────────────────────
  useEffect(() => {
    const handler = () => {
      // Only treat as session expiry if the user was actually logged in.
      // Unauthenticated 401s (e.g. /auth/me on page load) must not trigger a redirect.
      if (!userRef.current) return;
      setUser(null);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      setSessionExpiredMsg('Session expired. Please log in again.');
      router.push('/admin/login');
    };
    window.addEventListener('auth:session-expired', handler);
    return () => window.removeEventListener('auth:session-expired', handler);
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Initial auth check on mount ──────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.get('/auth/me');
        if (response.data.success && response.data.data?.user) {
          setUser(response.data.data.user);
        }
      } catch {
        // Not authenticated
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (emailOrUsername: string, password: string) => {
    try {
      // Send both fields for compatibility with old and new backend versions
      const response = await apiClient.post('/auth/login', { emailOrUsername, email: emailOrUsername, password });
      if (response.data.success && response.data.data?.user) {
        setUser(response.data.data.user);
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Login failed');
    }
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const register = async (username: string, email: string, password: string, displayName?: string) => {
    try {
      const response = await apiClient.post('/auth/register', { username, email, password, displayName });
      if (response.data.success && response.data.data?.user) {
        setUser(response.data.data.user);
      } else {
        throw new Error(response.data.error || 'Registration failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Registration failed');
    }
  };

  const updateUser = (patch: Partial<User>) => {
    setUser((u) => (u ? { ...u, ...patch } : u));
  };

  const clearSessionExpiredMsg = () => setSessionExpiredMsg('');

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        sessionExpiredMsg,
        clearSessionExpiredMsg,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}