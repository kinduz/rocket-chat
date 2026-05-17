'use client';

import type { Profile } from '@app/shared/api';
import { useAppStore } from '@app/shared/store';
import { useEffect } from 'react';

export function StoreHydrator({ profile }: { profile: Profile }) {
  useEffect(() => {
    if (!profile) return;
    useAppStore.setState({ profile });
  }, [profile]);

  return null;
}
