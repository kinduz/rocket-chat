'use client';

import type { ChatListItem as ChatListItemType } from '@app/shared/api';
import { cn } from '@app/shared/lib/utils';
import { Avatar } from '@app/shared/ui';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatChatTime } from './lib/format-chat-time';
import { getChatDisplayName } from './lib/get-chat-display-name';

type ChatListItemProps = {
  chat: ChatListItemType;
  index: number;
  selected?: boolean;
  onSelect?: (chat: ChatListItemType) => void;
};

export const ChatListItem = ({
  chat,
  index,
  selected,
  onSelect,
}: ChatListItemProps) => {
  const { t } = useTranslation();
  const displayName = getChatDisplayName(chat, index, t);
  const lastMessage = chat.lastMessage;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(chat)}
      aria-pressed={selected}
      className={cn(
        'group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors',
        'sidebar-compact:justify-center',
        'hover:bg-selected',
        selected && 'bg-selected text-primary-foreground',
      )}
    >
      <Avatar
        src={chat.avatarUrl}
        name={chat.name}
        fallback={displayName}
        sizePx={44}
        className="shrink-0"
      />

      <div className="sidebar-compact:hidden min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm text-[#fbfcfb] font-medium">
            {displayName}
          </span>
          {lastMessage && (
            <span
              suppressHydrationWarning
              className={cn('shrink-0 text-xs text-[#adaeb1]')}
            >
              {formatChatTime(lastMessage.at)}
            </span>
          )}
        </div>

        <div
          className={cn(
            'mt-0.5 flex items-center gap-1 text-sm font-medium text-muted-foreground',
            // selected ? 'text-[#6d6d72]' : 'text-muted-foreground',
          )}
        >
          {lastMessage?.fromMe && (
            <Check className="size-3.5 shrink-0" aria-hidden />
          )}
          <span className="truncate">
            {lastMessage?.text ?? t('home.noMessages')}
          </span>
        </div>
      </div>
    </button>
  );
};
