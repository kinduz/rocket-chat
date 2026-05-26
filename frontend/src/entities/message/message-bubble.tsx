'use client';

import type { ChatMessage } from '@app/shared/api';
import { cn } from '@app/shared/lib/utils';
import { formatMessageTime } from './lib/format-message-time';

type MessageBubbleProps = {
  message: ChatMessage;
};

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const { text, createdAt, fromMe } = message;

  return (
    <div
      className={cn(
        'flex w-full px-4',
        fromMe ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'flex max-w-[70%] flex-col rounded-2xl px-3 py-2 text-sm leading-snug',
          fromMe
            ? 'bg-[#2683ff] text-white rounded-br-md'
            : 'bg-[#2c2c30] text-[#fbfcfb] rounded-bl-md',
        )}
      >
        <span className="whitespace-pre-wrap break-words">{text}</span>
        <span
          suppressHydrationWarning
          className={cn(
            'mt-0.5 self-end text-[11px] leading-none',
            fromMe ? 'text-white/70' : 'text-[#adaeb1]',
          )}
        >
          {formatMessageTime(createdAt)}
        </span>
      </div>
    </div>
  );
};
