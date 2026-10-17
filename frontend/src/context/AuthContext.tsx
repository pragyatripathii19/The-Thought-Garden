import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch, ApiError, SESSION_EXPIRED_EVENT } from '../lib/api';
import { ORGANIZER_STORAGE_KEYS } from '../lib/organize/settings';
import { getEmbeddingRepository } from '../storage';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  reasons: string[];
  /** Smart organising (AI) on or off; on unless the user turned it off. */
  smartOrganizing: boolean;
  createdAt: string;
  isAdmin: boolean;
}

type AuthStatus = 'loading' | 'signed-out' | 'signed-in' | 'unreachable';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  signup: (input: {
    email: string;
    password: string;
    name: string;
    reasons: string[];
    /** Icon key for the collection started from a free-text reason. */
    customReasonIcon?: string;
    smartOrganizing: boolean;
  }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: { name?: string; reasons?: string[]; smartOrganizing?: boolean }) => Promise<void>;
  /** Permanently deletes the account and everything in it. Needs the password. */
  deleteAccount: (password: string) => Promise<void>;
  /** Re-checks the session, e.g. after the server was unreachable. */
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Which account the per-device data below belongs to.
const DEVICE_USER_KEY = 'thought_garden_device_user';

// Set once anyone has signed in on this browser, and kept after log out, so the
// next visit opens on Log in rather than Sign up.
const RETURNING_KEY = 'thought_garden_has_account';

/** Whether someone has signed in on this browser before. */
export function hasSignedInHereBefore(): boolean {
  try {
    return localStorage.getItem(RETURNING_KEY) === '1';
  } catch {
    return false;
  }
}

// Per-device data that belongs to whoever is signed in; cleared when they leave.
const DEVICE_KEYS = [
  DEVICE_USER_KEY,
  'thought_garden_pilot_feedback',
  'thought_garden_active_collection',
  ...ORGANIZER_STORAGE_KEYS,
];

async function clearDeviceData() {
  try {
    DEVICE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage unavailable: nothing to clear.
  }
  try {
    await getEmbeddingRepository().clear();
  } catch {
    // The embedding cache rebuilds itself; failing to clear it is harmless.
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ user: AuthUser }>('/auth/me', { signalExpiry: false })
      .then(({ user }) => {
        if (cancelled) return;
        setUser(user);
        setStatus('signed-in');
      })
      .catch((err) => {
        if (cancelled) return;
        setUser(null);
        setStatus(err instanceof ApiError && err.status === 401 ? 'signed-out' : 'unreachable');
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setStatus('signed-out');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const signIn = useCallback(async (nextUser: AuthUser) => {
    // A different person on this device starts without the last person's local data.
    let previousUserId: string | null = null;
    try {
      previousUserId = localStorage.getItem(DEVICE_USER_KEY);
    } catch {
      // Storage unavailable.
    }
    if (previousUserId !== nextUser.id) await clearDeviceData();
    try {
      localStorage.setItem(DEVICE_USER_KEY, nextUser.id);
      localStorage.setItem(RETURNING_KEY, '1');
    } catch {
      // Storage unavailable.
    }
    setUser(nextUser);
    setStatus('signed-in');
  }, []);

  const signup: AuthContextValue['signup'] = useCallback(
    async (input) => {
      const { user: created } = await apiFetch<{ user: AuthUser }>('/auth/signup', {
        method: 'POST',
        body: input,
        signalExpiry: false,
      });
      await signIn(created);
    },
    [signIn]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const { user: loggedIn } = await apiFetch<{ user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: { email, password },
        signalExpiry: false,
      });
      await signIn(loggedIn);
    },
    [signIn]
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST', signalExpiry: false });
    } finally {
      await clearDeviceData();
      setUser(null);
      setStatus('signed-out');
    }
  }, []);

  const updateProfile = useCallback(async (updates: { name?: string; reasons?: string[]; smartOrganizing?: boolean }) => {
    const { user: updated } = await apiFetch<{ user: AuthUser }>('/auth/me', { method: 'PATCH', body: updates });
    setUser(updated);
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    await apiFetch('/auth/account', { method: 'DELETE', body: { password }, signalExpiry: false });
    await clearDeviceData();
    setUser(null);
    setStatus('signed-out');
  }, []);

  const retry = useCallback(() => {
    setStatus('loading');
    setAttempt((n) => n + 1);
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, signup, login, logout, updateProfile, deleteAccount, retry }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/** For components that also render outside the signed-in app (e.g. in tests). */
export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext) ?? null;
}
