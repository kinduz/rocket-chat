'use client';

import { cn } from '@app/shared/lib/utils';
import Image from 'next/image';

type AvatarProps = {
  src?: string | null;
  name?: string | null;
  fallback?: string;
  className?: string;
  sizePx?: number;
};

const getInitial = (name?: string | null, fallback?: string) => {
  const trimmed = name?.trim();
  if (trimmed) return trimmed.charAt(0).toUpperCase();
  return fallback?.charAt(0).toUpperCase() ?? '?';
};

export const Avatar = ({
  src,
  name,
  fallback,
  className,
  sizePx = 48,
}: AvatarProps) => {
  return (
    <div
      className={cn(
        'bg-muted text-muted-foreground relative flex items-center justify-center overflow-hidden rounded-full select-none',
        className,
      )}
      style={{ width: sizePx, height: sizePx }}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? 'avatar'}
          fill
          sizes={`${sizePx}px`}
          className="object-cover"
        />
      ) : (
        <span className="text-sm font-medium">{getInitial(name, fallback)}</span>
      )}
    </div>
  );
};
