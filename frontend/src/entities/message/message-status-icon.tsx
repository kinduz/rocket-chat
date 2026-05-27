'use client';

import type { ChatMessage, LastMessagePreview } from '@app/shared/api';
import { cn } from '@app/shared/lib/utils';
import { Check, CheckCheck } from 'lucide-react';

type MessageStatusIconProps = {
  message: Pick<ChatMessage | LastMessagePreview, 'delivered' | 'read'>;
  className?: string;
};

export const MessageStatusIcon = ({
  message,
  className,
}: MessageStatusIconProps) => {
  if (message.read) {
    return (
      <CheckCheck
        className={cn('size-3.5 shrink-0 text-[#58a7f7]', className)}
        aria-label="Read"
      />
    );
  }

  if (message.delivered) {
    return (
      <CheckCheck
        className={cn('size-3.5 shrink-0 text-current', className)}
        aria-label="Delivered"
      />
    );
  }

  return (
    <Check
      className={cn('size-3.5 shrink-0 text-current', className)}
      aria-label="Sent"
    />
  );
};
