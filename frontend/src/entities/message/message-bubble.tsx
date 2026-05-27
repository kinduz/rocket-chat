'use client';

import type { ChatMessage } from '@app/shared/api';
import { cn } from '@app/shared/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';
import { formatMessageTime } from './lib/format-message-time';
import { MessageStatusIcon } from './message-status-icon';

type MessageBubbleProps = {
  message: ChatMessage;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
};

export const MessageBubble = ({
  message,
  onEdit,
  onDelete,
}: MessageBubbleProps) => {
  const { text, createdAt, editedAt, fromMe } = message;
  const canModify = fromMe && (onEdit || onDelete);

  return (
    <div
      className={cn(
        'group flex w-full flex-col px-4',
        fromMe ? 'items-end' : 'items-start',
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
        <span className="whitespace-pre-wrap wrap-break-word">{text}</span>
        <span
          className={cn(
            'mt-0.5 flex items-center gap-1 self-end',
            fromMe ? 'text-white/70' : 'text-[#adaeb1]',
          )}
        >
          {editedAt && (
            <span className="text-[11px] italic leading-none opacity-70">
              edited
            </span>
          )}
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

      {canModify && (
        <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(message)}
              aria-label="Edit message"
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground cursor-pointer"
            >
              <Pencil className="size-3.5" aria-hidden />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(message)}
              aria-label="Delete message"
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-500/15 hover:text-red-400 cursor-pointer"
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
