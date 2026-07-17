'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

export function useRequireJefa() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.role !== 'JEFA') {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  return { user, loading, isJefa: user?.role === 'JEFA' };
}
