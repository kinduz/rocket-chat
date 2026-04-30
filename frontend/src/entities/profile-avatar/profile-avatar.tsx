import { cn, useAppStore } from '@app/shared';
import Image from 'next/image';

export const ProfileAvatar = ({ className }: { className?: string }) => {
  const avatar = useAppStore((state) => state.profile?.avatarUrl);

  return avatar ? (
    <Image
      src={avatar}
      alt="avatar"
      className={cn('size-12 rounded-full object-cover', className)}
    />
  ) : (
    <div />
  );
};
