'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  clearAuth,
  getProfile,
  getToken,
  setStoredUser,
  type AuthUser,
} from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = getToken();
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const profile = await getProfile(token);
        if (cancelled) return;
        setStoredUser(profile);
        setUser(profile);
      } catch {
        if (cancelled) return;
        clearAuth();
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const logout = () => {
    clearAuth();
    setUser(null);
    router.push('/login');
  };

  return { user, loading, logout, isAuthenticated: !!user };
}
