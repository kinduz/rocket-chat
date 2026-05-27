'use client';

import type { ChatMessage } from '@app/shared/api';
import { cn } from '@app/shared/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatMessageTime } from './lib/format-message-time';
import { MessageContextMenu } from './message-context-menu';
import { MessageStatusIcon } from './message-status-icon';

type MessageBubbleProps = {
  message: ChatMessage;
  selected?: boolean;
  selectionActive?: boolean;
  onEdit?: (message: ChatMessage) => void;
  onSelect?: (message: ChatMessage) => void;
  onRequestDelete?: (message: ChatMessage) => void;
  onToggleSelection?: (message: ChatMessage) => void;
};

export const MessageBubble = ({
  message,
  selected,
  selectionActive,
  onEdit,
  onSelect,
  onRequestDelete,
  onToggleSelection,
}: MessageBubbleProps) => {
  const { t } = useTranslation();
  const { text, createdAt, editedAt, fromMe } = message;

  return (
    <MessageContextMenu
      onSelect={onSelect ? () => onSelect(message) : undefined}
      onRequestDelete={
        onRequestDelete ? () => onRequestDelete(message) : undefined
      }
    >
      <div
        className={cn(
          'group relative flex w-full flex-col px-4',
          fromMe ? 'items-end' : 'items-start',
        )}
      >
        {selectionActive && (
          <button
            type="button"
            onClick={() => onToggleSelection?.(message)}
            aria-label={t('chat.message.select')}
            aria-pressed={selected}
            className="absolute inset-0 z-10 cursor-pointer bg-transparent"
          />
        )}
        <div
          className={cn(
            'flex max-w-[70%] flex-col rounded-2xl px-3 py-2 text-sm leading-snug transition-colors',
            fromMe
              ? 'bg-[#2683ff] text-white rounded-br-md'
              : 'bg-[#2c2c30] text-[#fbfcfb] rounded-bl-md',
            selected && 'outline-2 outline-white -outline-offset-2',
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
                {t('chat.message.edited')}
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
        {selected && fromMe && <div className="mt-2" />}
        {fromMe && !selectionActive && (onEdit || onRequestDelete) && (
          <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(message);
                }}
                aria-label={t('chat.message.edit')}
                className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground cursor-pointer"
              >
                <Pencil className="size-3.5" aria-hidden />
              </button>
            )}
            {onRequestDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestDelete(message);
                }}
                aria-label={t('chat.message.delete')}
                className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-500/15 hover:text-red-400 cursor-pointer"
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            )}
          </div>
        )}
      </div>
    </MessageContextMenu>
  );
};
