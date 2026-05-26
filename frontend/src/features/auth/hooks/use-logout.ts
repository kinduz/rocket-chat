'use client';

import { ACCESS_TOKEN_KEY } from '@app/shared/api';
import { useAppStore } from '@app/shared/store';
import { useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const reset = useAppStore((s) => s.reset);

  return useCallback(() => {
    Cookies.remove(ACCESS_TOKEN_KEY, { path: '/' });
    reset();
    queryClient.clear();
    router.replace('/auth/signin');
    router.refresh();
  }, [router, queryClient, reset]);
}
