'use client';

import { ProfileAvatar } from '@app/entities/profile-avatar';
import { useChats } from '@app/shared';

export function HomePage() {
  const { data } = useChats();

  return (
    <>
      <ProfileAvatar />
    </>
  );
}
