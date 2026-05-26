'use client';

import type { ChatMessage } from '@app/shared/api';
import { cn } from '@app/shared/lib/utils';
import { useEffect, useRef } from 'react';
import { formatMessageTime } from './lib/format-message-time';
import { MessageStatusIcon } from './message-status-icon';

type MessageBubbleProps = {
  message: ChatMessage;
  onVisible?: (message: ChatMessage) => void;
};

export const MessageBubble = ({ message, onVisible }: MessageBubbleProps) => {
  const { text, createdAt, fromMe } = message;
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fromMe || !onVisible) return;
    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onVisible(message);
          observer.disconnect();
        }
      },
      { threshold: 0.85 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fromMe, message, onVisible]);

  return (
    <div
      ref={rootRef}
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
          className={cn(
            'mt-0.5 flex items-center gap-1 self-end',
            fromMe ? 'text-white/70' : 'text-[#adaeb1]',
          )}
        >
          <span
            suppressHydrationWarning
            className={cn(
              'text-[11px] leading-none',
              fromMe ? 'text-white/70' : 'text-[#adaeb1]',
            )}
          >
            {formatMessageTime(createdAt)}
          </span>
          {fromMe && <MessageStatusIcon message={message} />}
        </span>
      </div>
    </div>
  );
};
