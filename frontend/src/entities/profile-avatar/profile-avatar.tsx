'use client';

import { cn, useAppStore } from '@app/shared';
import Image from 'next/image';

export const ProfileAvatar = ({ className }: { className?: string }) => {
  const avatar = useAppStore((state) => state.profile?.avatarUrl);

  if (!avatar) return <div />;

  return (
    <div
      className={cn('relative size-12 overflow-hidden rounded-full', className)}
    >
      <Image
        src={avatar}
        alt="avatar"
        fill
        sizes="48px"
        className="object-cover"
      />
    </div>
  );
};
