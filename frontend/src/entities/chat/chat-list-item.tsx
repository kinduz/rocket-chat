'use client';

import { MessageStatusIcon } from '@app/entities/message';
import { useMessageDeletion } from '@app/features/delete-messages';
import type { ChatListItem as ChatListItemType } from '@app/shared/api';
import { cn } from '@app/shared/lib/utils';
import { useTypingStore } from '@app/shared/realtime';
import { Avatar } from '@app/shared/ui';
import { useTranslation } from 'react-i18next';
import { ChatContextMenu } from './chat-context-menu';
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
  const typingExpiresAt = useTypingStore((s) =>
    chat.kind === 'chat' ? s.byChat[chat.id] : undefined,
  );
  const typing = !!typingExpiresAt && typingExpiresAt > Date.now();
  const { requestDelete } = useMessageDeletion();

  const handleDeleteChat =
    chat.kind === 'chat'
      ? () =>
          requestDelete({
            chatId: chat.id,
            kind: 'chat',
            canDeleteForEveryone: true,
          })
      : undefined;

  return (
    <ChatContextMenu onDelete={handleDeleteChat}>
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
          {chat.kind === 'chat' ? (
            <ChatRowContent
              displayName={displayName}
              lastMessage={chat.lastMessage}
              unreadCount={chat.unreadCount}
              typing={typing}
              emptyText={t('home.noMessages')}
            />
          ) : (
            <UserRowContent displayName={displayName} username={chat.name} />
          )}
        </div>
      </button>
    </ChatContextMenu>
  );
};

type ChatRowContentProps = {
  displayName: string;
  lastMessage: {
    text: string;
    at: string;
    fromMe: boolean;
    delivered: boolean;
    read: boolean;
  } | null;
  unreadCount: number;
  typing: boolean;
  emptyText: string;
};

const ChatRowContent = ({
  displayName,
  lastMessage,
  unreadCount,
  typing,
  emptyText,
}: ChatRowContentProps) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm text-[#fbfcfb] font-medium">
          {displayName}
        </span>
        {lastMessage && (
          <span
            suppressHydrationWarning
            className="shrink-0 text-xs text-[#adaeb1]"
          >
            {formatChatTime(lastMessage.at)}
          </span>
        )}
      </div>

      <div className="mt-0.5 flex items-center gap-1 text-sm font-medium text-muted-foreground">
        {lastMessage?.fromMe && <MessageStatusIcon message={lastMessage} />}
        <span className="min-w-0 flex-1 truncate">
          {typing ? t('chat.typing') : (lastMessage?.text ?? emptyText)}
        </span>
        {unreadCount > 0 && (
          <span className="ml-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#2683ff] px-1.5 text-xs font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
    </>
  );
};

type UserRowContentProps = {
  displayName: string;
  username: string | null;
};

const UserRowContent = ({ displayName, username }: UserRowContentProps) => {
  const trimmedUsername = username?.trim();
  const showUsername =
    !!trimmedUsername && trimmedUsername !== displayName.trim();

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm text-[#fbfcfb] font-medium">
          {displayName}
        </span>
      </div>
      {showUsername && (
        <div className="mt-0.5 text-sm font-medium text-muted-foreground truncate">
          @{trimmedUsername}
        </div>
      )}
    </>
  );
};
