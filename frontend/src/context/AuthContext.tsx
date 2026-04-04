'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User } from '@/types/index';
import axios from 'axios';

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
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable ref to logout so the inactivity handler never has a stale closure
  const logoutRef = useRef<() => Promise<void>>(async () => {});

  // ── Core logout (called both manually and by inactivity) ─────────────────
  const logout = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
        {},
        { withCredentials: true },
      );
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

  // ── Initial auth check on mount ──────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          withCredentials: true,
        });
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
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        { email, password },
        { withCredentials: true },
      );
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
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        { username, email, password, displayName },
        { withCredentials: true },
      );
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
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
